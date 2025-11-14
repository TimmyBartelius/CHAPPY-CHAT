// routes/directMessages.ts
import express, { Router } from "express";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../data/dynamoDb.js";
import { v4 as uuid } from "uuid";
import jwt from "jsonwebtoken";

const router: Router = express.Router();
const myTable = "CHAPPY";

// Middleware för att hämta user från token
function authenticate(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    console.log("Decoded JWT:", decoded); 
    req.auth = decoded;
    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ---- POST: Skicka DM till en användare ----
router.post("/:dmPK", authenticate, async (req: any, res) => {
  try {
    const { dmPK } = req.params;
    const { content, senderName } = req.body;
    const sender = req.auth;

    if (!content) return res.status(400).json({ error: "Message content required" });

    const messageId = `DM#${new Date().toISOString()}#${uuid()}`;
    const newMessage = {
      PK: dmPK,
      SK: messageId,
      content,
      senderId: sender.userId,
      senderName: senderName || sender.username,
      createdAt: new Date().toISOString(),
    };

    await db.send(new PutCommand({ TableName: myTable, Item: newMessage }));

    res.status(201).json(newMessage);
  } catch (err) {
    console.error("Error creating DM:", err);
    res.sendStatus(500);
  }
});

// ---- GET: Hämta alla DMs mellan två användare ----
router.get("/:dmPK", authenticate, async (req: any, res) => {
  try {
    const {dmPK} = req.params;
    const result = await db.send(
      new QueryCommand({
        TableName: myTable,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :msg)",
        ExpressionAttributeValues: {
          ":pk":dmPK,
          ":msg":"DM#",
        },
        ScanIndexForward: true,
      })
    );

    res.status(200).json(
      result.Items?.map((item) => ({
        ...item,
        senderName: item.senderName || item.senderId,
      })) || []
    );
  } catch(err){
    console.error("Error fetching DMs:", err);
    res.sendStatus(500);
  }
});


export default router;
