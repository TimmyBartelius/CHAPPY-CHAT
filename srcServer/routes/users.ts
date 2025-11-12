import express from 'express';
import type { Request, Response, Router } from 'express';
import { GetCommand, ScanCommand, PutCommand, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { User, Guest } from "../shared/types.js";
import { db } from "../data/dynamoDb.js";
import { v4 as uuid } from 'uuid';
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in .env");
} else {
  console.log("JWT_SECRET loaded successfully!");
}
const JWT_SECRET = process.env.JWT_SECRET!;
const router: Router = express.Router();

// ----- DynamoDB tabell -----
const myTable: string = 'CHAPPY';

// ----- GET alla Admin-users -----
router.get('/users/admin', async (req: Request, res: Response) => {
  try {
    const result = await db.send(new QueryCommand({
      TableName: myTable,
      IndexName: "accessLevel-index",
      KeyConditionExpression: "#access = :Admin",
      ExpressionAttributeNames: { "#access": "accessLevel" },
      ExpressionAttributeValues: { ":Admin": "Admin" }
    }));

    const users = (result.Items || []).map(item => ({
      PK: item.PK, SK: item.SK, accessLevel: item.accessLevel, passwordHash: item.passwordHash || "", username: item.username, id: item.PK
    }))
  } catch (err) {
    console.error("Error scanning admin users:", err);
    res.sendStatus(500);
  }
});

// ----- GET alla Users -----
router.get('/users', async (_req: Request, res: Response) => {
  try {
    const result = await db.send(new ScanCommand({
      TableName: myTable,
      FilterExpression: "begins_with(PK, :user) AND SK = :meta",
      ExpressionAttributeValues: { ":user": "USER#", ":meta": "METADATA" }
    }));

    const users = (result.Items || [])
      .filter(item => item && item.PK && item.username)
      .map(item => ({ id: item.PK, username: item.username }));

    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.sendStatus(500);
  }
});


// ----- GET alla Guests -----
router.get('/users/guests', async (req: Request, res: Response) => {
  try {
    const result = await db.send(new QueryCommand({
      TableName: myTable,
      IndexName: "accessLevel-index",
      KeyConditionExpression: "#access = :Guest",
      ExpressionAttributeNames: { "#access": "accessLevel" },
      ExpressionAttributeValues: { ":Guest":"Guest" }
    }));

    const guests = (result.Items || []).map(item => item as Guest);
    res.send(guests);
  } catch (err) {
    console.error("Error scanning guests:", err);
    res.sendStatus(500);
  }
});

// ----- GET alla Users/Admin/Guests -----
router.get('/users/all', async (req: Request, res: Response) => {
  try {
    const result = await db.send(new ScanCommand({
      TableName: myTable,
      FilterExpression: "accessLevel IN (:User, :Admin, :Guest)",
      ExpressionAttributeValues: {
        ":User": "User",
        ":Admin": "Admin",
        ":Guest": "Guest"
      }
    }));

    const users = (result.Items || []).map(item => item as User | Guest);
    res.status(200).json(users);

  } catch (err) {
    console.error("Error fetching all users:", err);
    res.sendStatus(500);
  }
});


// ----- POST skapa Guest -----
router.post('/users/guest', async (req: Request, res: Response) => {
  const userId = `USER#${uuid()}`;
  const guest: Guest = {
    PK: userId,
    SK: "METADATA",
    username: `Guest-${Math.floor(Math.random() * 1234)}`,
    accessLevel: "Guest",
    passwordHash: "",
    id: userId // Guest har inget lösenord
  };

  await db.send(new PutCommand({ TableName: myTable, Item: guest }));

  const token = jwt.sign(
    { userId, accessLevel: guest.accessLevel },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.send({ userId, username: guest.username, token });
});


// ----- DELETE user / Admin-delete -----
router.delete('/users/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("Auth header:", authHeader);

    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || !parts[1]) return res.status(401).json({ error: "Malformed token" });

    const token = parts[1];
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string, accessLevel: string };

    const { userId: requesterId, accessLevel } = payload;
    const targetUserId = req.query.userId as string || requesterId;

    if (accessLevel !== "Admin" && targetUserId !== requesterId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const targetUser = await db.send(new GetCommand({
      TableName: myTable,
      Key: { PK: targetUserId, SK: "METADATA" }
    }));

    if (!targetUser.Item) return res.status(404).json({ error: "User not found" });

    await db.send(new DeleteCommand({ TableName: myTable, Key: { PK: targetUserId, SK: "METADATA" } }));

    res.status(200).json({ message: `User ${targetUserId} deleted successfully` });

  } catch(err) {
    console.error("Error deleting user:", err);
    res.sendStatus(500);
  }
});

export default router;

