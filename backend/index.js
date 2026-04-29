import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import authRoutes from './routes/authRoutes.js'
import { protect, authorize } from './middleware/authMiddleware.js'
import fmRoutes from './routes/fmRoutes.js';
import workerRoutes from './routes/workerRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/fm', fmRoutes);
app.use('/api/worker', workerRoutes);

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
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  res.status(statusCode).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT} ⋆.ೃ࿔🌸*:･`));
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Kill the existing process and restart.`);
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});
