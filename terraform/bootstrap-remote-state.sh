#!/bin/bash
# -----------------------------------------------------------------------------
# Bootstrap script for Terraform remote state
#
# Creates the S3 bucket and DynamoDB table needed for the S3 backend.
# Run this ONCE before configuring the backend in remotestate.tf.
#
# Usage:
#   ./bootstrap-remote-state.sh
# -----------------------------------------------------------------------------
set -euo pipefail

PROFILE="the-sauce"
REGION="us-west-2"
BUCKET="the-sauce-terraform-state"
TABLE="the-sauce-terraform-locks"

echo "==> Creating S3 bucket for Terraform state: ${BUCKET}"
aws s3api create-bucket \
  --bucket "$BUCKET" \
  --region "$REGION" \
  --profile "$PROFILE" \
  --create-bucket-configuration LocationConstraint="$REGION"

# Enable versioning (protects against state corruption)
aws s3api put-bucket-versioning \
  --bucket "$BUCKET" \
  --profile "$PROFILE" \
  --versioning-configuration Status=Enabled

# Enable server-side encryption
aws s3api put-bucket-encryption \
  --bucket "$BUCKET" \
  --profile "$PROFILE" \
  --server-side-encryption-configuration '{
    "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]
  }'

# Block all public access
aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --profile "$PROFILE" \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo "==> Creating DynamoDB table for state locking: ${TABLE}"
aws dynamodb create-table \
  --table-name "$TABLE" \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION" \
  --profile "$PROFILE"

echo "==> Waiting for DynamoDB table to become active..."
aws dynamodb wait table-exists --table-name "$TABLE" --region "$REGION" --profile "$PROFILE"

echo "==> Bootstrap complete!"
echo ""
echo "Next steps:"
echo "  1. Uncomment the backend block in remotestate.tf"
echo "  2. Run: terraform init -migrate-state"
