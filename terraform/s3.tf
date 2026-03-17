# -----------------------------------------------------------------------------
# s3.tf - S3 bucket for database backups
#
# Stores periodic pg_dump exports for disaster recovery beyond RDS automated
# snapshots. Lifecycle rules transition old backups to Glacier after 30 days
# and expire them after 1 year to control costs.
#
# Cost note: S3 Standard is ~$0.023/GB/month. Glacier is ~$0.004/GB/month.
# For a small PostgreSQL database, this will be negligible.
# -----------------------------------------------------------------------------

# --- Caller Identity ---
# Used to create a globally unique bucket name using the AWS account ID
data "aws_caller_identity" "current" {}

# --- Backup Bucket ---
resource "aws_s3_bucket" "backups" {
  bucket = "${var.project_name}-backups-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "${var.project_name}-backups"
  }
}

# --- Block All Public Access ---
# Database backups must never be publicly accessible
resource "aws_s3_bucket_public_access_block" "backups" {
  bucket = aws_s3_bucket.backups.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# --- Server-Side Encryption ---
# AES256 (SSE-S3) encryption at rest — no additional cost
resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# --- Versioning ---
# Enables object versioning for accidental overwrite/delete protection
resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id

  versioning_configuration {
    status = "Enabled"
  }
}

# --- Lifecycle Rules ---
# Moves database backups to Glacier after 30 days, deletes after 365 days.
resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  # Versioning must be configured before lifecycle rules
  depends_on = [aws_s3_bucket_versioning.backups]

  rule {
    id     = "db-backup-lifecycle"
    status = "Enabled"

    filter {
      prefix = "db/"
    }

    # Move to Glacier after 30 days (~85% cost reduction)
    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    # Delete after 1 year — older backups are unlikely to be needed
    expiration {
      days = 365
    }
  }
}
