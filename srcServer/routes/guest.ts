import express, { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { v4 as uuid } from "uuid";
import jwt from "jsonwebtoken";
import { ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../data/dynamoDb.js";

// --- AuthRequest med valfri user ---
export interface AuthRequest extends Request {
  user?: { userId: string; username: string; accessLevel: string };
}

const router: Router = express.Router();

// --- Säkerställ att JWT_SECRET finns ---
const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in .env");
}

const myTable = "CHAPPY";

// --- Middleware: guest eller logged-in ---
function authenticateOrGuest(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Guest utan token
    req.user = { 
      userId: `GUEST#${uuid()}`, 
      username: `Guest-${Math.floor(Math.random() * 1000)}`,
      accessLevel: "Guest"
    };
    return next();
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({error: "Token missing"});
  }
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error("JWT Error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ----- POST skapa Guest-token och spara i DB -----
router.post('/guest', async (req: Request, res: Response) => {
  try {
    const userId = `GUEST#${uuid()}`;
    const username = `Guest-${Math.floor(Math.random() * 1000)}`;

    // Spara guest i DynamoDB
    await db.send(new PutCommand({
      TableName: myTable,
      Item: {
        PK: userId,
        SK: "METADATA",
        username,
        accessLevel: "Guest",
        passwordHash: "",
        id: userId
      }
    }));

   
    const token = jwt.sign({ userId, username, accessLevel: "Guest" }, JWT_SECRET, { expiresIn: "12h" });

    res.status(201).json({ userId, username, accessLevel: "Guest", token });
  } catch (err) {
    console.error("Error creating guest token:", err);
    res.sendStatus(500);
  }
});

// ----- GET öppna kanaler för guest -----
router.get('/:channelId', authenticateOrGuest, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    let filter = "begins_with(PK, :chan) AND SK = :meta";
    let values: any = { ":chan": "CHANNEL#", ":meta": "METADATA" };

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
router.get('/channels/:id', authenticateOrGuest, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const channelId = `CHANNEL#${req.params.id}`;
    const result = await db.send(new ScanCommand({
      TableName: myTable,
      FilterExpression: "PK = :pk AND SK = :meta",
      ExpressionAttributeValues: { ":pk": channelId, ":meta": "METADATA" }
    }));

    const channel = result.Items?.[0];
    if (!channel) return res.status(404).json({ error: "Channel not found" });

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
router.post('/dm/:toUserId', authenticateOrGuest, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  if (user.accessLevel === "Guest") {
    return res.status(403).json({ error: "Guests cannot send DMs" });
  }

  res.status(200).json({ message: "DM sent (example)" });
});

export default router;
