import express from 'express';
import type { Request, Response, Router } from 'express';
import { GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import type {GetCommandOutput, ScanCommandOutput} from "@aws-sdk/lib-dynamodb"
import type { Users } from "../data/types.js";
import { db } from "../data/dynamoDb.js";

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

// ----- GET alla users -----
router.get('/api/users', async (req:Request, res: Response) => {
    const scanCommand = new ScanCommand({
        TableName: myTable,
        FilterExpression: "begins_with(#pk, :prefix)",
        ExpressionAttributeNames:{
            "#pk":"PK"
        },
        ExpressionAttributeValues:{
            ":prefix": "USER#"
        }
    });
    try {
        const result = await db.send(scanCommand);
        const users = (result.Items || []).filter(item => item.SK === "METADATA");
        res.send(users);
    } catch (err){
        console.error("Error scanning for users:", err)
        res.sendStatus(500);
    }
});



export default router;
