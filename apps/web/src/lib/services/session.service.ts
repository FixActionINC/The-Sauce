import {
  PutCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { getDynamoClient, getSessionsTable } from "@/lib/dynamodb";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionRecord {
  sessionId: string;
  userId: string; // Stored as string for DynamoDB GSI compatibility
  expiresAt: number; // Unix timestamp in seconds (DynamoDB TTL)
  createdAt: string; // ISO 8601
}

// ---------------------------------------------------------------------------
// Commands (writes)
// ---------------------------------------------------------------------------

/**
 * Store a new session in DynamoDB.
 * Uses PutItem — O(1), no scan.
 */
export async function storeSession(session: SessionRecord): Promise<void> {
  const client = getDynamoClient();
  const table = getSessionsTable();

  await client.send(
    new PutCommand({
      TableName: table,
      Item: session,
    }),
  );
}

/**
 * Delete a session by its sessionId.
 * Uses DeleteItem — O(1), no scan.
 */
export async function deleteSessionById(sessionId: string): Promise<void> {
  const client = getDynamoClient();
  const table = getSessionsTable();

  await client.send(
    new DeleteCommand({
      TableName: table,
      Key: { sessionId },
    }),
  );
}

/**
 * Delete all sessions for a given user.
 * Uses Query on the UserIdIndex GSI to find sessions, then deletes each one.
 * No table scan — the GSI provides direct access by userId.
 */
export async function deleteSessionsByUserId(userId: string): Promise<void> {
  const client = getDynamoClient();
  const table = getSessionsTable();

  // Query the GSI to find all sessions for this user
  const result = await client.send(
    new QueryCommand({
      TableName: table,
      IndexName: "UserIdIndex",
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ":uid": userId },
      ProjectionExpression: "sessionId",
    }),
  );

  if (!result.Items || result.Items.length === 0) return;

  // Delete each session individually (typically 1-3 sessions per user)
  await Promise.all(
    result.Items.map((item) =>
      client.send(
        new DeleteCommand({
          TableName: table,
          Key: { sessionId: item.sessionId },
        }),
      ),
    ),
  );
}

// ---------------------------------------------------------------------------
// Queries (reads)
// ---------------------------------------------------------------------------

/**
 * Look up a session by sessionId.
 * Uses GetItem — O(1), no scan.
 * Returns null if the session doesn't exist or has expired.
 * (DynamoDB TTL may leave expired items for up to 48h, so we check manually.)
 */
export async function findSessionById(
  sessionId: string,
): Promise<SessionRecord | null> {
  const client = getDynamoClient();
  const table = getSessionsTable();

  const result = await client.send(
    new GetCommand({
      TableName: table,
      Key: { sessionId },
    }),
  );

  if (!result.Item) return null;

  const session = result.Item as SessionRecord;

  // Double-check TTL — DynamoDB may not have cleaned up yet
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (session.expiresAt <= nowSeconds) return null;

  return session;
}
