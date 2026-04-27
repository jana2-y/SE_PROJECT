import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import authRoutes from './routes/authRoutes.js'
import fmRoutes from './routes/fmRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import rewardsRoutes from './routes/rewardRoutes.js'

const app = express()

// Middleware first
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/fm', fmRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/rewards', rewardsRoutes)

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode
  res.status(statusCode).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on port ${PORT} ⋆.ೃ࿔🌸*:･`))