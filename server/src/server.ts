import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import { assistantRouter } from './assistant.js'

const app = express()
const port = Number(process.env.PORT ?? 3000)

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }))
app.use(express.json({ limit: '32kb' }))

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'ai-study-planner-api' })
})

app.use('/api/assistant', assistantRouter)

app.listen(port, () => {
  console.log(`Study Planner API listening on http://localhost:${port}`)
})
