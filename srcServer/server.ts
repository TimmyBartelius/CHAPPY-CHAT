import express from "express"
import cors from "cors"
import type { Express, Request, Response, RequestHandler } from 'express'
import usersRouter from './routes/users.js'
import channelRouter from './routes/channels.js'
import guestRouter from './routes/guest.js'
import registerRoute from './auth/register.js'
import loginRoute from './auth/login.js'
import messagesRouter from './routes/messages.js'


const logger: RequestHandler = (req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
}

const port: number = Number(process.env.PORT)
const app = express()

app.use("/", logger)
app.use('/', cors())
app.use('/', express.json())

app.use("/api", registerRoute)
app.use("/api/auth", loginRoute)

app.use( "/api", usersRouter)
app.use("/api", channelRouter)
app.use("/api", guestRouter)
app.use("/api/messages", messagesRouter)
app.use(express.static('./dist/'))


// GET /api/hello - Säg hej
app.get("/api/hello", (req: Request, res: Response) => {
  res.json({ message: "Servern säger hej!" });
});
// Se vilken port som används
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
