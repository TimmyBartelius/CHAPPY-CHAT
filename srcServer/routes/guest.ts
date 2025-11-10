import express, {  Router } from "express";
import type { Request, Response } from "express"
import { v4 as uuid } from "uuid";
import jwt from "jsonwebtoken";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../data/dynamoDb.js";

interface GuestPayload {
  userId: string;
  accessLevel: "Guest";
}

const router: Router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET!;
const myTable = "CHAPPY";

// --- Middleware: guest eller logged-in ---
export function authenticateOrGuest(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    (req as any).auth = { userId: `GUEST#${uuid()}`, accessLevel: "Guest" };
    return next();
  }

  const token = authHeader.slice("Bearer ".length);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (
      typeof decoded === "object" &&
      decoded !== null &&
      "userId" in decoded &&
      "accessLevel" in decoded
    ) {
      (req as any).auth = decoded as GuestPayload;
      return next();
    }

    return res.status(401).json({ error: "Invalid token payload" });
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ----- POST skapa Guest-token -----
router.post('/guest', async (req: Request, res: Response) => {
  try {
    const userId = `GUEST#${uuid()}`;

    const token = jwt.sign(
      { userId, accessLevel: "Guest" },
      JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.status(201).json({ userId, username: `Guest-${Math.floor(Math.random() * 1000)}`, token });
  } catch (err) {
    console.error("Error creating guest token:", err);
    res.sendStatus(500);
  }
});

// ----- GET öppna kanaler -----
router.get('/channels', authenticateOrGuest, async (req: Request, res: Response) => {
  try {
    const user = (req as any).auth;
    let filter = "begins_with(PK, :chan) AND SK = :meta";
    let values: any = { ":chan": "CHANNEL#", ":meta": "METADATA" };

    // Guests ser endast öppna/public channels
    if (user.accessLevel === "Guest") {
      filter += " AND visibility = :public";
      values[":public"] = "public";
    }

    const result = await db.send(new ScanCommand({
      TableName: myTable,
      FilterExpression: filter,
      ExpressionAttributeValues: values
    }));

    res.status(200).json(result.Items || []);
  } catch (err) {
    console.error("Error fetching channels for guest:", err);
    res.sendStatus(500);
  }
});

// ----- GET specifik kanal -----
router.get('/channels/:id', authenticateOrGuest, async (req: Request, res: Response) => {
  try {
    const channelId = `CHANNEL#${req.params.id}`;
    const result = await db.send(new ScanCommand({
      TableName: myTable,
      FilterExpression: "PK = :pk AND SK = :meta",
      ExpressionAttributeValues: { ":pk": channelId, ":meta": "METADATA" }
    }));

    const channel = result.Items?.[0];
    if (!channel) return res.status(404).json({ error: "Channel not found" });

    const user = (req as any).auth;
    if (channel.visibility === "private" && user.accessLevel === "Guest") {
      return res.status(403).json({ error: "This channel is private" });
    }

    res.status(200).json(channel);
  } catch (err) {
    console.error("Error fetching channel:", err);
    res.sendStatus(500);
  }
});

// ----- Blockera DM för Guests -----
router.post('/dm/:toUserId', authenticateOrGuest, (req: Request, res: Response) => {
  const user = (req as any).auth;

  if (user.accessLevel === "Guest") {
    return res.status(403).json({ error: "Guests cannot send DMs" });
  }

  res.status(200).json({ message: "DM sent (example)" });
});

export default router;
