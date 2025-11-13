import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";



const accessKey: string = process.env.AWS_ACCESS_KEY!
const secret: string = process.env.AWS_SECRET_ACCESS_KEY!

const client: DynamoDBClient = new DynamoDBClient({
	region: "eu-north-1",
	credentials: {
		accessKeyId: accessKey,
		secretAccessKey: secret,
	},
});
const db: DynamoDBDocumentClient = DynamoDBDocumentClient.from(client);


export { db }