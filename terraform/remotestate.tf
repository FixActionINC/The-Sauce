# -----------------------------------------------------------------------------
# remotestate.tf - S3 backend for Terraform state with DynamoDB locking
#
# State is stored in S3 with:
#   - Server-side encryption (AES256)
#   - Versioning (rollback corrupt state)
#   - DynamoDB table for state locking (prevent concurrent modifications)
#
# BOOTSTRAP: The S3 bucket and DynamoDB lock table must exist before
# this backend can be used. Run the bootstrap script first:
#
#   ./bootstrap-remote-state.sh
#
# Then uncomment the backend block below and run:
#
#   terraform init -migrate-state
#
# This will migrate local state to the S3 backend.
# -----------------------------------------------------------------------------

terraform {
  backend "s3" {
    bucket         = "the-sauce-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-west-2"
    profile        = "the-sauce"
    dynamodb_table = "the-sauce-terraform-locks"
    encrypt        = true
  }
}
