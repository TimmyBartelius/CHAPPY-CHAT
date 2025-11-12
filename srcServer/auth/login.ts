import express, { Router } from "express";
import type {Request, Response} from "express";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../data/dynamoDb.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import type { Users } from "../data/types.js";

const router: Router = express.Router();
const myTable = "CHAPPY";
const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not set in .env");

// ----- POST login (User/Admin) -----
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Username and password required" });

    const result = await db.send(
      new QueryCommand({
        TableName: myTable,
        IndexName: "username-index",
        KeyConditionExpression: "#username = :username",
        ExpressionAttributeNames: { "#username": "username" },
        ExpressionAttributeValues: { ":username": username },
      })
    );

    const user = result.Items?.[0] as Users | undefined;
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.accessLevel !== "Guest" && !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { userId: user.PK, accessLevel: user.accessLevel },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({ userId: user.PK, username: user.username, token });
  } catch (err) {
    console.error("Error logging in:", err);
    res.sendStatus(500);
  }
});

export default router;
