# -----------------------------------------------------------------------------
# outputs.tf - Output values
#
# Exposes key infrastructure details needed for deployment scripts,
# CI/CD pipelines, and manual administration.
# Sensitive values (database_url) are marked to prevent display in CLI output.
# -----------------------------------------------------------------------------

output "ec2_public_ip" {
  description = "Elastic IP address of the application server"
  value       = aws_eip.app.public_ip
}

output "ecr_repository_url" {
  description = "Full ECR repository URL for Docker push/pull"
  value       = aws_ecr_repository.web.repository_url
}

output "s3_backup_bucket" {
  description = "Name of the S3 bucket for database backups"
  value       = aws_s3_bucket.backups.id
}

output "ssh_command" {
  description = "SSH command to connect to the application server"
  value       = "ssh -i ${var.key_name}.pem ec2-user@${aws_eip.app.public_ip}"
}

output "ecr_login_command" {
  description = "Command to authenticate Docker with ECR"
  value       = "aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${aws_ecr_repository.web.repository_url}"
}

# --- RDS Outputs ---

output "rds_endpoint" {
  description = "RDS PostgreSQL instance endpoint (host:port)"
  value       = aws_db_instance.main.endpoint
}

output "rds_database_name" {
  description = "Name of the PostgreSQL database"
  value       = aws_db_instance.main.db_name
}

output "database_url" {
  description = "Full PostgreSQL connection string for the application (DATABASE_URL)"
  sensitive   = true
  value       = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
}

# --- CDN Outputs ---

output "cloudfront_domain" {
  description = "CloudFront distribution domain name for product images"
  value       = aws_cloudfront_distribution.images.domain_name
}

output "s3_images_bucket" {
  description = "Name of the S3 bucket for product images"
  value       = aws_s3_bucket.images.id
}

# --- DynamoDB Outputs ---

output "dynamodb_table_name" {
  description = "Name of the DynamoDB sessions table"
  value       = aws_dynamodb_table.sessions.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB sessions table"
  value       = aws_dynamodb_table.sessions.arn
}

output "dynamodb_user_id_index" {
  description = "Name of the GSI for querying sessions by userId (avoids table scans)"
  value       = "UserIdIndex"
}

# --- SSM Parameter ARNs ---
# Useful for CI/CD pipelines or other services that need to reference these parameters.

output "ssm_square_environment_name" {
  description = "SSM parameter name for Square environment (sandbox/production)"
  value       = aws_ssm_parameter.square_environment.name
}

# --- CI/CD Outputs ---

output "cicd_access_key_id" {
  description = "AWS Access Key ID for the CI/CD IAM user (GitHub Actions)"
  value       = aws_iam_access_key.cicd.id
}

output "cicd_secret_access_key" {
  description = "AWS Secret Access Key for the CI/CD IAM user (GitHub Actions)"
  sensitive   = true
  value       = aws_iam_access_key.cicd.secret
}
