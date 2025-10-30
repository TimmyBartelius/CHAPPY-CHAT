import express from "express"
import cors from "cors"
import type { Express, Request, Response, RequestHandler } from 'express'
import usersRouter from './routes/users.js'


const logger: RequestHandler = (req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
}

const port: number = Number(process.env.PORT)
const app = express()

app.use("/", logger)
app.use('/', cors())
app.use('/', express.json())
app.use( "/api", usersRouter)
app.use(express.static('./dist/'))


// GET /api/hello - Säg hej
app.get("/api/hello", (req: Request, res: Response) => {
  res.json({ message: "Servern säger hej!" });
});
// Se vilken port som används
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
