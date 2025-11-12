import express, { Router } from "express";
import type { Request, Response } from "express";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../data/dynamoDb.js";
import { v4 as uuid } from "uuid";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import type { User } from "../shared/types.js";

const router: Router = express.Router();
const myTable = "CHAPPY";
const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not set in .env");

// ----- POST skapa User -----
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Username and password required!" });

    const userId = `USER#${uuid()}`;
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser: User = {
      PK: userId,
      SK: "METADATA",
      username,
      passwordHash,
      accessLevel: "User",
      id: userId
    };

    await db.send(new PutCommand({ TableName: myTable, Item: newUser }));

    const token = jwt.sign(
      { userId, accessLevel: newUser.accessLevel },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ userId, username, token });
  } catch (err) {
    console.error("Error creating user:", err);
    res.sendStatus(500);
  }
});

export default router;
