import express from "express"
import cors from "cors"
import type { Request, Response, RequestHandler } from 'express'

import usersRouter from './routes/users.js'
import channelRouter from './routes/channels.js'
import guestRouter from './routes/guest.js'
import registerRoute from './auth/register.js'
import loginRoute from './auth/login.js'
import messagesRouter from './routes/messages.js'
import directMessagesRouter from './routes/directMessages.js'
import channelMessagesRouter from './routes/channelMessages.js'

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
app.use("/api/guest", guestRouter)

app.use( "/api", usersRouter)

app.use("/api", channelRouter)

app.use("/api/messages", messagesRouter)
app.use("/api/dms", directMessagesRouter)
app.use("/api/channelMessages", channelMessagesRouter)

app.use(express.static('./dist/'))

app.listen(port, ()=> {
  console.log(`Server is currently running on http://localhost:${port}`);
});
