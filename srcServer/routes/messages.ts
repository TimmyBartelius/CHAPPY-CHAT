import express, { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { v4 as uuid } from "uuid";
import { PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../data/dynamoDb.js";
import jwt from "jsonwebtoken";


const router: Router = express.Router();
const myTable = "CHAPPY";

// MIDDLEWARE
function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("JWT_SECRET is not set");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  try {
    const decoded = jwt.verify(token, secret) as any;
    (req as any).auth = decoded;
    next();
  } catch (err) {
    console.error("JWT Error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
}


// ----- POST nytt meddelande -----
router.post("/:channelId", authenticate, async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    const { content } = req.body;
    const user = (req as any).auth;

    if (!content) return res.status(400).json({ error: "Message content required" });

    const messageId = `MSG#${new Date().toISOString()}#${uuid()}`;
    const newMessage = {
      PK: `CHANNEL#${channelId}`,
      SK: messageId,
      content,
      senderId: user.userId,
      createdAt: new Date().toISOString(),
    };

    await db.send(new PutCommand({ TableName: myTable, Item: newMessage }));
    res.status(201).json(newMessage);
  } catch (err) {
    console.error("Error creating message", err);
    res.sendStatus(500);
  }
});

router.post("/messages", async (req: Request, res: Response) => {
  const {channelId, text, sender} = req.body;
  const ttl = Math.floor(Date.now() / 1000) + 60 * 15; //15 minuter sedan rensas meddelandet bort(raderas) 
  const message = {
    PK: `CHANNEL#${channelId}`,
    SK: `MSG#${uuid()}`,
    text,
    sender,
    createdAt: Date.now(),
    ttl,
  };

  await db.send(new PutCommand({
    TableName: myTable,
    Item: message
  }));
  res.status(201).json(message);
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

    const usersResult = await db.send(
      new ScanCommand({
      TableName: myTable,
      FilterExpression: "begins_with(PK, :user)",
      ExpressionAttributeValues: {
        ":user": "USER#",
      },
    })
  );

    const users = usersResult.Items || [];

    const enrichedMessages = messages.map((msg) => {
      const sender = users.find((u) => u.PK === msg.senderId);
      return {
        ...msg,
        senderName: sender?.username || msg.senderId,
      };
    });

    res.status(200).json(enrichedMessages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.sendStatus(500);
  }
});


export default router;
