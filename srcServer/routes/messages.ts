import express, { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { v4 as uuid } from "uuid";
import { PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../data/dynamoDb.js";
import jwt from "jsonwebtoken";
import type { AuthRequest } from "../auth/authMiddleware.js";


const router: Router = express.Router();
const myTable = "CHAPPY";

// MIDDLEWARE
function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  if(!token) return res.status(401).json({error: "No token provided"});

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "Server misconfiguration" });

  try {
    const decoded = jwt.verify(token, secret) as any;
    req.user = decoded; // här matchar vi resten av koden
    next();
  } catch (err) {
    console.error("JWT Error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ----- POST nytt meddelande -----
router.post("/:channelId", authenticate, async (req: AuthRequest, res: Response) => {
  const {channelId} = req.params;
  const {text} = req.body;
  if (!req.user) return res.status(401).json({error: "Unauthorized"});

  const ttl = Math.floor(Date.now() / 1000) + 60 * 15;

  const newMessage = {
    PK: `CHANNEL#${channelId}`,
    SK: `MSG#${Date.now()}#${uuid()}`,
    text,
    sender: {
      userId: req.user.userId,
      username: req.user.username,
    },
    createdAt: Date.now(),
    ttl,
  };
  try {
    await db.send(new PutCommand({
      TableName: myTable, Item: newMessage
    }));
    res.status(201).json(newMessage);
  } catch (err){
    console.error("Error posting channel message:", err);
    res.sendStatus(500);
  }
});

// ----- GET alla meddelanden för en kanal -----
router.get("/:channelId", async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    const messagesResult = await db.send(
      new QueryCommand({
      TableName: myTable,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :msg)",
      ExpressionAttributeValues: {
        ":pk": `CHANNEL#${channelId}`,
        ":msg": "MSG#",
      },
      ScanIndexForward: true,
    })
  );

    const messages = messagesResult.Items || [];

    res.status(200).json(messages);
} catch(err){
  console.error("Error fetching messages:", err);
  res.sendStatus(500);
}
});


export default router;
