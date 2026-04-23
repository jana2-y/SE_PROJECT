import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import authRoutes from './routes/authRoutes.js'
import { protect, authorize } from './middleware/authMiddleware.js'
import fmRoutes from './routes/fmRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/fm', fmRoutes);

// Routes
app.use('/api/auth', authRoutes);

// --- Role-Based Protected Routes ---

// Facility Manager Dashboard
app.get('/api/fm/dashboard', protect, authorize('facility_manager'), (req, res) => {
  res.json({ message: "Welcome Facility Manager. You can assign workers here." });
});

// Worker Task List
app.get('/api/worker/tasks', protect, authorize('worker'), (req, res) => {
  res.json({ message: "Welcome Worker. Here are your assigned tickets." });
});

// Community Member History
app.get('/api/cm/my-tickets', protect, authorize('community_member'), (req, res) => {
  res.json({ message: "Welcome. Here are the tickets you reported." });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
