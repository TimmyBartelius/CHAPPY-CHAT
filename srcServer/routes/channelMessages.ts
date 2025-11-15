import express, { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { v4 as uuid } from "uuid";
import { PutCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../data/dynamoDb.js";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
  user?: { userId: string; username: string };
}

const router: Router = express.Router();
const myTable = "CHAPPY";

// --- Middleware: kontrollera JWT och sätt user ---
function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "Server misconfiguration" });

  try {
    const decoded = jwt.verify(token, secret) as any;
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
    };
    next();
  } catch (err) {
    console.error("JWT Error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ----- POST nytt meddelande i en kanal -----
router.post("/:channelId", authenticate, async (req: AuthRequest, res: Response) => {
  const { channelId } = req.params;
  const { text } = req.body;

  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  try {
    // Hämta kanalens metadata för att kolla låst-status
    const channelResult = await db.send(new GetCommand({
      TableName: myTable,
      Key: { PK: `CHANNEL#${channelId}`, SK: "METADATA" },
    }));

    if (!channelResult.Item) return res.status(404).json({ error: "Channel not found" });

    // Blockera gäster från att posta i privata kanaler
    if (channelResult.Item.isLocked && req.user.userId === "guest") {
      return res.status(403).json({ error: "Guests cannot post in private channels" });
    }

    const ttl = Math.floor(Date.now() / 1000) + 60 * 15;
    const timestamp = Date.now().toString().padStart(13, "0");

    const newMessage = {
      PK: `CHANNEL#${channelId}`,
      SK: `MSG#${timestamp}#${uuid()}`,
      text,
      sender: { userId: req.user.userId, username: req.user.username },
      createdAt: Date.now(),
      ttl,
    };

    await db.send(new PutCommand({
      TableName: myTable,
      Item: newMessage
    }));

    res.status(201).json(newMessage);

  } catch (err) {
    console.error("Error posting channel message:", err);
    res.sendStatus(500);
  }
});

// ----- GET alla meddelanden för en kanal -----
router.get("/:channelId", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { channelId } = req.params;

    const result = await db.send(new QueryCommand({
      TableName: myTable,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :msg)",
      ExpressionAttributeValues: {
        ":pk": `CHANNEL#${channelId}`,
        ":msg": "MSG#",
      },
      ScanIndexForward: true,
    }));

    const messages = result.Items || [];
    res.status(200).json(messages);
  } catch (err) {
    console.error("Error fetching channel messages:", err);
    res.sendStatus(500);
  }
});

export default router;
