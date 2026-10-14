import express from 'express'
import chatsRoutes from './routes/chats.routes.js'

const app = express()

app.use((req, res, next) => {
  const origin = req.headers.origin

  if (
    origin === 'http://localhost:5173' ||
    origin === 'http://127.0.0.1:5173'
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  )

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  )

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }

  next()
})

app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'KimIA',
    model: process.env.OLLAMA_MODEL || 'qwen3:0.6b'
  })
})

app.use('/api/chats', chatsRoutes)

app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada'
  })
})

app.use((err, req, res, next) => {
  console.error(err)

  res.status(500).json({
    error: 'Error interno del servidor'
  })
})

export default app