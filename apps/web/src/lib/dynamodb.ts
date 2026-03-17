import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

let _client: DynamoDBDocumentClient | null = null;

/**
 * Lazy-initialized DynamoDB DocumentClient singleton.
 * Uses the same pattern as s3.ts — created on first call, reused after.
 * The DocumentClient automatically handles type marshalling/unmarshalling.
 */
export function getDynamoClient(): DynamoDBDocumentClient {
  if (!_client) {
    const baseClient = new DynamoDBClient({
      region: process.env.AWS_REGION || "us-west-2",
    });
    _client = DynamoDBDocumentClient.from(baseClient, {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    });
  }
  return _client;
}

/**
 * Get the DynamoDB sessions table name from environment.
 * Falls back to the convention used by Terraform: "${project_name}-sessions".
 */
export function getSessionsTable(): string {
  return process.env.DYNAMODB_SESSIONS_TABLE || "the-sauce-sessions";
}
