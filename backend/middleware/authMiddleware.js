const supabase = require('../supabase');

const protect = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token, authorization denied' });

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) return res.status(401).json({ error: 'Token is not valid' });

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Server error in auth middleware' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        const userRole = req.user.user_metadata?.role;
        if (!roles.includes(userRole)) {
            return res.status(403).json({ error: `User role ${userRole} is not authorized` });
        }
        next();
    };
};

module.exports = { protect, authorize };