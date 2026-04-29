import supabase from '../supabase.js';
import asyncHandler from 'express-async-handler';

// ─── GET ANALYTICS ────────────────────────────────────────────────────────────
// GET /api/fm/analytics?from=2026-01-01&to=2026-04-30

const getAnalytics = asyncHandler(async (req, res) => {
    const { from, to } = req.query;

    // default to last 30 days if no range provided
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const fromISO = fromDate.toISOString();
    const toISO = toDate.toISOString();

    // ── 1. all tickets in range ──────────────────────────────────────────────
    const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, status, category, area, created_at, completed_at')
        .gte('created_at', fromISO)
        .lte('created_at', toISO);

    if (ticketsError) { res.status(500); throw new Error(ticketsError.message); }

    // ── 2. worker performance ────────────────────────────────────────────────
    const { data: assignments, error: assignError } = await supabase
        .from('assignments')
        .select('worker_id, worker_name, status, attempt_number')
        .gte('created_at', fromISO)
        .lte('created_at', toISO);

    if (assignError) { res.status(500); throw new Error(assignError.message); }

    // ── 3. overdue tickets (not time-range bound) ────────────────────────────
    const { count: overdueCount } = await supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'overdue');

    // ── compute stat cards ───────────────────────────────────────────────────
    const total = tickets.length;
    const pending = tickets.filter(t => t.status === 'pending').length;
    const completed = tickets.filter(t => t.status === 'completed').length;
    const overdue = overdueCount || 0;

    // ── avg resolution time (days) ───────────────────────────────────────────
    const resolved = tickets.filter(t => t.completed_at && t.created_at);
    const avgResolutionDays = resolved.length
        ? (resolved.reduce((sum, t) => {
            const diff = new Date(t.completed_at) - new Date(t.created_at);
            return sum + diff / (1000 * 60 * 60 * 24);
        }, 0) / resolved.length).toFixed(1)
        : null;

    // ── tickets by status ────────────────────────────────────────────────────
    const statusCounts = {};
    tickets.forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });
    const byStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    // ── tickets by category ──────────────────────────────────────────────────
    const categoryCounts = {};
    tickets.forEach(t => { categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1; });
    const byCategory = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

    // ── tickets by area ──────────────────────────────────────────────────────
    const areaCounts = {};
    tickets.forEach(t => { areaCounts[t.area] = (areaCounts[t.area] || 0) + 1; });
    const byArea = Object.entries(areaCounts)
        .map(([area, count]) => ({ area, count }))
        .sort((a, b) => b.count - a.count);

    // ── monthly trend ────────────────────────────────────────────────────────
    const monthCounts = {};
    tickets.forEach(t => {
        const month = t.created_at.slice(0, 7); // "2026-04"
        monthCounts[month] = (monthCounts[month] || 0) + 1;
    });
    const trend = Object.entries(monthCounts)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month));

    // ── worker performance ───────────────────────────────────────────────────
    const workerMap = {};
    assignments.forEach(a => {
        if (!a.worker_id) return;
        if (!workerMap[a.worker_id]) {
            workerMap[a.worker_id] = {
                worker_id: a.worker_id,
                worker_name: a.worker_name || 'Unknown',
                assigned: 0,
                completed: 0,
                reassigned: 0,
            };
        }
        workerMap[a.worker_id].assigned++;
        if (a.status === 'completed') workerMap[a.worker_id].completed++;
        if (a.status === 'reassigned') workerMap[a.worker_id].reassigned++;
    });

    // Merge rows that share the same worker_name (same person, multiple accounts)
    const nameMap = {};
    Object.values(workerMap).forEach(w => {
        const key = (w.worker_name || '').trim().toLowerCase();
        if (!nameMap[key]) {
            nameMap[key] = { ...w };
        } else {
            nameMap[key].assigned   += w.assigned;
            nameMap[key].completed  += w.completed;
            nameMap[key].reassigned += w.reassigned;
        }
    });

    const workerPerformance = Object.values(nameMap)
        .sort((a, b) => b.completed - a.completed);

    res.status(200).json({
        range: { from: fromISO, to: toISO },
        stats: { total, pending, completed, overdue, avgResolutionDays },
        byStatus,
        byCategory,
        byArea,
        trend,
        workerPerformance,
        rawTickets: tickets, // for client-side cross-filtering
    });
});

export { getAnalytics };