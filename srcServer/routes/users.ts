import express from 'express';
import type { Request, Response, Router } from 'express';
import { GetCommand, ScanCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import type {GetCommandOutput, ScanCommandOutput} from "@aws-sdk/lib-dynamodb"
import type { Users, Guest } from "../data/types.js";
import { db } from "../data/dynamoDb.js";
import {v4 as uuid} from 'uuid';
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const router: Router = express.Router();

// ----- Typning -----
export interface GetResult<T> {
  Item?: T;
}

interface ScanResult<T> {
  Items?: T[];
  Count?: number;
}

// ----- DynamoDB tabell -----
const myTable: string = 'CHAPPY';

// ----- GET alla Admin-users -----
router.get('/admin', async (req: Request, res: Response) => {
  try {
    const result = await db.send(new ScanCommand({
      TableName: myTable,
      FilterExpression: "begins_with(#pk, :prefix) AND accessLevel = :Admin",
      ExpressionAttributeNames: {
        "#pk": "PK"
      },
      ExpressionAttributeValues: {
        ":prefix": "USER#",
        ":Admin": "Admin"
      }
    }));

    const users = (result.Items || []).map(item => item as Users);
    res.send(users);

  } catch (err) {
    console.error("Error scanning users:", err);
    res.sendStatus(500);
  }
});

// ----- GET alla Users -----
router.get('/users', async (req: Request, res: Response) => {
  try {
    const result = await db.send(new ScanCommand({
      TableName: myTable,
      FilterExpression: "begins_with(#pk, :prefix) AND accessLevel = :User",
      ExpressionAttributeNames: {
        "#pk": "PK"
      },
      ExpressionAttributeValues: {
        ":prefix": "USER#",
        ":User": "User"
      }
    }));

    const users = (result.Items || []).map(item => item as Users);
    res.send(users);

  } catch (err) {
    console.error("Error scanning users:", err);
    res.sendStatus(500);
  }
});

// ----- GET hämta alla Gäster -----
router.get('/guests', async (req: Request, res: Response) => {
  try {
    const result = await db.send(new ScanCommand({
      TableName: myTable,
      FilterExpression: "begins_with(#pk, :prefix) AND accessLevel = :Guest",
      ExpressionAttributeNames: {
        "#pk": "PK"
      },
      ExpressionAttributeValues: {
        ":prefix": "USER#",
        ":Guest": "Guest"
      }
    }));

    const guests = (result.Items || []).map(item => item as Guest);
    res.send(guests);

  } catch (err) {
    console.error("Error scanning guests:", err);
    res.sendStatus(500);
  }
});

// ----- POST skapa Gäst -----
router.post('/users/guest', async (req, res) => {
  const userId = `USER#${uuid()}`;
  const guest: Guest = {
    PK: userId,
    SK: "METADATA",
    username: `Guest-${Math.floor(Math.random() * 1234)}`,
    accessLevel: "Guest",
    passwordHash: "", // Gäster har inget lösenord
  };

  await db.send(new PutCommand({
    TableName: myTable,
    Item: guest
  }));

  const token = jwt.sign(
    { userId, accessLevel: guest.accessLevel },
    JWT_SECRET,
    { expiresIn: "7d"}
);

  res.send({ userId, username: guest.username, token });
});

// ----- POST skapa User -----
router.post('/users/register', async (req: Request, res: Response) => {
    try{
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({error: "Username and password required!"});
        }
        const userId = `USER#${uuid()}`;
        const passwordHash = await bcrypt.hash(password, 10);

        const newUser: Users = {
            PK: userId,
            SK: "METADATA",
            username,
            passwordHash,
            accessLevel: "User",
        };

        await db.send(
            new PutCommand({
                TableName: myTable,
                Item: newUser,
            })
        );
        const token = jwt.sign(
            { userId, accessLevel: newUser.accessLevel },
            JWT_SECRET,
            { expiresIn: "7d"}
        );
        res.status(201).json({ userId, username, token});
    }   catch(err) {
        console.error("Error creating user:", err);
        res.sendStatus(500);
    }
});


export default router;
