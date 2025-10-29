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

//Middleware
app.use("/", logger)
app.use('/', cors())
app.use('/', express.json())

//Resurser
app.use( usersRouter)


// GET /api/hello - Säg hej
app.get("/api/hello", (req: Request, res: Response) => {
  res.json({ message: "Servern säger hej!" });
});


app.use(express.static('./dist/'))

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
