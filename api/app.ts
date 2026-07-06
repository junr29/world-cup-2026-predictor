/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import matchesRoutes from './routes/matches.js'
import predictionsRoutes from './routes/predictions.js'
import analysisRoutes from './routes/analysis.js'
import schedulerRoutes from './routes/scheduler.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/matches', matchesRoutes)
app.use('/api/predictions', predictionsRoutes)
app.use('/api/analysis', analysisRoutes)
app.use('/api/scheduler', schedulerRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * Serve frontend static files (production build)
 */
const distPath = path.resolve(__dirname, '..', 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  // SPA fallback: all non-API routes serve index.html
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

export default app
