# -----------------------------------------------------------------------------
# dynamodb.tf - DynamoDB sessions table
#
# Stores user sessions with automatic TTL-based expiration.
# Key design prioritizes QUERY operations over SCAN:
#   - Primary key (sessionId) enables direct GetItem for session lookups
#   - GSI (UserIdIndex) enables Query by userId without scanning the table
#   - TTL handles expired session cleanup automatically (no scan needed)
#
# Access patterns:
#   1. Get/Put/Delete session by sessionId  -> GetItem / PutItem / DeleteItem (O(1))
#   2. List sessions for a specific user    -> Query on UserIdIndex (no scan)
#   3. Delete expired sessions              -> TTL handles automatically (free)
#
# Cost note: PAY_PER_REQUEST (on-demand) billing means zero cost when idle
# and ~$1.25 per million write requests / $0.25 per million read requests.
# GSI storage adds ~$0.25/GB/month. For a small e-commerce site this will
# be a few cents per month at most.
# Point-in-time recovery adds ~$0.20/GB/month of table storage.
# -----------------------------------------------------------------------------

resource "aws_dynamodb_table" "sessions" {
  name         = "${var.project_name}-sessions"
  billing_mode = "PAY_PER_REQUEST"

  # --- Primary Key ---
  # sessionId as the partition key enables direct GetItem lookups (O(1)).
  # No sort key needed — each session is a unique, self-contained record.
  # This avoids full-table scans: the app calls GetItem(sessionId) directly.
  hash_key = "sessionId"

  attribute {
    name = "sessionId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  # --- Global Secondary Index: UserIdIndex ---
  # Enables querying all sessions for a given user (admin/debugging use case)
  # WITHOUT scanning the entire table. The app calls Query(UserIdIndex, userId).
  # Projection type ALL means the full item is available from the GSI,
  # avoiding a second read from the base table.
  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  # --- TTL ---
  # Automatically deletes expired sessions based on the expiresAt attribute.
  # DynamoDB TTL is eventually consistent — items may persist up to 48 hours
  # past expiration, but they are filtered from query results immediately.
  # This eliminates the need for any scan-based cleanup job.
  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  # --- Point-in-Time Recovery ---
  # Enables continuous backups with 35-day recovery window.
  # Protects against accidental deletes or application bugs.
  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "${var.project_name}-sessions"
  }
}
