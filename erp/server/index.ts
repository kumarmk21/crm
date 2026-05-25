import fs from 'node:fs'
import path from 'node:path'

import express from 'express'

import { createApp } from './app.js'

const port = Number(process.env.PORT ?? 3001)
const app = createApp()

const distDirectory = path.resolve(process.cwd(), 'dist')
const indexFile = path.join(distDirectory, 'index.html')

if (fs.existsSync(indexFile)) {
  app.use(express.static(distDirectory))
  app.get(/^(?!\/api).*/, (_request, response) => {
    response.sendFile(indexFile)
  })
}

app.listen(port, () => {
  console.log(`ERP server listening on http://localhost:${port}`)
})
