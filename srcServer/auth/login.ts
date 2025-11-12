import express, { Router } from "express";
import type { Request, Response } from "express";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../data/dynamoDb.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import type { User } from "../shared/types.js";

const router: Router = express.Router();
const myTable = "CHAPPY";
const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not set in .env");

// ----- POST login (User/Admin) -----
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Validera att båda fälten finns
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    // Hämta användare från DynamoDB
    const result = await db.send(
      new QueryCommand({
        TableName: myTable,
        IndexName: "username-index",
        KeyConditionExpression: "#username = :username",
        ExpressionAttributeNames: { "#username": "username" },
        ExpressionAttributeValues: { ":username": username },
      })
    );

    const user = result.Items?.[0] as User | undefined;

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Kontrollera lösenord endast om det inte är en gäst
    if (user.accessLevel !== "Guest") {
      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        return res.status(401).json({ error: "Invalid password" });
      }
    }

    // Skapa JWT-token
    const token = jwt.sign(
      { userId: user.PK, accessLevel: user.accessLevel },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Skicka tillbaka användarinfo + token
    res.status(200).json({
      userId: user.PK,
      username: user.username,
      accessLevel: user.accessLevel,
      token,
    });

  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
