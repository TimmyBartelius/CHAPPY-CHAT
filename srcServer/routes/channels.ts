import express from 'express';
import type { Request, Response, Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../data/dynamoDb.js';
import { PutCommand, GetCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import jwt from 'jsonwebtoken';

const router: Router = express.Router();
const myTable = "CHAPPY";
const JWT_SECRET = process.env.JWT_SECRET!;

 
// --- Middleware: kontrollera token ---
interface AuthPayload {
  userId: string;
  accessLevel: string;
}

// middleware
function authenticate(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1] as string;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      "userId" in decoded &&
      "accessLevel" in decoded
    ) {
      (req as any).auth = decoded as AuthPayload;
      return next();
    }

    return res.status(401).json({ error: "Invalid token payload" });

  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}


// ----- GET alla channels -----
router.get('/channels', async (_req: Request, res: Response) => {
  try {
    const result = await db.send(new ScanCommand({ TableName: myTable }));

    const channels = (result.Items || [])
      .filter(item => item.SK === "METADATA" && item.name)
      .map(item => ({
        PK: item.PK,
        SK: item.SK,
        creatorId: item.creatorId || "unknown",
        isLocked: item.isLocked ?? false,
        name: item.name || item.channelName || "No name",
        id: item.PK
      }));

    res.status(200).json(channels);
  } catch (err) {
    console.error("Error fetching channels:", err);
    res.sendStatus(500);
  }
});



// ----- POST skapa channel (User/Admin) -----
router.post('/channels', authenticate, async (req: Request, res: Response) => {
  try {
    const { channelName, isLocked } = req.body;
    if (!channelName) return res.status(400).json({ error: "channelName required" });

    const { userId } = (req as any).auth;
    const channelId = `CHANNEL#${uuid()}`;

    const newChannel = {
      PK: channelId,
      SK: "METADATA",
      creatorId: userId,
      isLocked: isLocked ?? false,
      name: channelName,
      id: channelId
    };

    await db.send(new PutCommand({ TableName: myTable, Item: newChannel }));

    res.status(201).json(newChannel);
  } catch (err) {
    console.error("Error creating channel:", err);
    res.sendStatus(500);
  }
});

// ----- GET en specifik channel -----
router.get('/channels/:id', async (req: Request, res: Response) => {
  try {
    const channelId = `CHANNEL#${req.params.id}`;
    const result = await db.send(new GetCommand({
      TableName: myTable,
      Key: { PK: channelId, SK: "METADATA" }
    }));

    if (!result.Item) return res.status(404).json({ error: "Channel not found" });

    res.status(200).json(result.Item);
  } catch (err) {
    console.error("Error fetching channel:", err);
    res.sendStatus(500);
  }
});

// ----- DELETE channel (endast Admin eller skaparen) -----
router.delete('/channels/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId, accessLevel } = (req as any).auth;
    const channelId = `CHANNEL#${req.params.id}`;

    const result = await db.send(new GetCommand({
      TableName: myTable,
      Key: { PK: channelId, SK: "METADATA" }
    }));

    if (!result.Item) return res.status(404).json({ error: "Channel not found" });

    if (result.Item.creatorId !== userId && accessLevel !== "Admin") {
      return res.status(403).json({ error: "Not allowed to delete this channel" });
    }

    await db.send(new DeleteCommand({
      TableName: myTable,
      Key: { PK: channelId, SK: "METADATA" }
    }));

    res.status(200).json({ message: `Channel ${channelId} deleted` });

  } catch (err) {
    console.error("Error deleting channel:", err);
    res.sendStatus(500);
  }
});



export default router;
