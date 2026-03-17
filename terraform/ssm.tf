# -----------------------------------------------------------------------------
# ssm.tf - AWS Systems Manager VPC endpoints and Parameter Store entries
#
# VPC Interface Endpoints allow the EC2 instance to communicate with SSM
# without needing a NAT gateway or public internet access to SSM APIs.
#
# Parameter Store holds application secrets (DB password, Square keys, etc.)
# rather than storing them in .env files on disk.
# -----------------------------------------------------------------------------

# --- Security Group for VPC Endpoints ---
# SSM endpoints need HTTPS (443) access from the EC2 instance
resource "aws_security_group" "vpc_endpoints" {
  name        = "${var.project_name}-vpc-endpoints-sg"
  description = "Allow HTTPS traffic to VPC endpoints from the app server"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTPS from app server"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.web_sg.id]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-vpc-endpoints-sg"
  }
}

# --- SSM VPC Endpoints ---
# Three endpoints are required for full SSM functionality:
#   1. ssm           - SSM API calls (parameter store, run command)
#   2. ssmmessages   - Session Manager shell connections
#   3. ec2messages   - SSM Agent <-> SSM service communication

resource "aws_vpc_endpoint" "ssm" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ssm"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.public.id]
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "${var.project_name}-ssm-endpoint"
  }
}

resource "aws_vpc_endpoint" "ssm_messages" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ssmmessages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.public.id]
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "${var.project_name}-ssm-messages-endpoint"
  }
}

resource "aws_vpc_endpoint" "ec2_messages" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.ec2messages"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.public.id]
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = {
    Name = "${var.project_name}-ec2-messages-endpoint"
  }
}

# --- Parameter Store Entries ---
# Application secrets stored in SSM Parameter Store (SecureString)
# These are read by the app at startup or by the deploy script to build .env

resource "aws_ssm_parameter" "database_url" {
  name  = "/${var.project_name}/DATABASE_URL"
  type  = "SecureString"
  value = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"

  tags = {
    Name = "${var.project_name}-database-url"
  }
}

# --- Square Payment Parameters ---
# Square credentials are stored per-environment (sandbox/production).
# The deploy script reads SQUARE_ENVIRONMENT and resolves the correct set
# into the generic SQUARE_ACCESS_TOKEN, SQUARE_APPLICATION_ID, etc. that
# the app expects at runtime.
#
# Access tokens and webhook keys are SecureString (encrypted at rest with AWS KMS).
# Application IDs, location IDs, and environment are plain String (non-sensitive).

resource "aws_ssm_parameter" "square_environment" {
  name  = "/${var.project_name}/SQUARE_ENVIRONMENT"
  type  = "String"
  value = "sandbox"

  # Valid values: "sandbox" or "production"
  lifecycle {
    ignore_changes = [value]
  }

  tags = {
    Name = "${var.project_name}-square-environment"
  }
}

# --- Sandbox Square Credentials ---

resource "aws_ssm_parameter" "square_sandbox_access_token" {
  name  = "/${var.project_name}/SQUARE_SANDBOX_ACCESS_TOKEN"
  type  = "SecureString"
  value = "CHANGE_ME"

  lifecycle {
    ignore_changes = [value]
  }

  tags = {
    Name = "${var.project_name}-square-sandbox-access-token"
  }
}

resource "aws_ssm_parameter" "square_sandbox_application_id" {
  name  = "/${var.project_name}/SQUARE_SANDBOX_APPLICATION_ID"
  type  = "String"
  value = "CHANGE_ME"

  lifecycle {
    ignore_changes = [value]
  }

  tags = {
    Name = "${var.project_name}-square-sandbox-application-id"
  }
}

resource "aws_ssm_parameter" "square_sandbox_location_id" {
  name  = "/${var.project_name}/SQUARE_SANDBOX_LOCATION_ID"
  type  = "String"
  value = "CHANGE_ME"

  lifecycle {
    ignore_changes = [value]
  }

  tags = {
    Name = "${var.project_name}-square-sandbox-location-id"
  }
}

resource "aws_ssm_parameter" "square_sandbox_webhook_signature_key" {
  name  = "/${var.project_name}/SQUARE_SANDBOX_WEBHOOK_SIGNATURE_KEY"
  type  = "SecureString"
  value = "CHANGE_ME"

  lifecycle {
    ignore_changes = [value]
  }

  tags = {
    Name = "${var.project_name}-square-sandbox-webhook-signature-key"
  }
}

# --- Production Square Credentials ---

resource "aws_ssm_parameter" "square_production_access_token" {
  name  = "/${var.project_name}/SQUARE_PRODUCTION_ACCESS_TOKEN"
  type  = "SecureString"
  value = "CHANGE_ME"

  lifecycle {
    ignore_changes = [value]
  }

  tags = {
    Name = "${var.project_name}-square-production-access-token"
  }
}

resource "aws_ssm_parameter" "square_production_application_id" {
  name  = "/${var.project_name}/SQUARE_PRODUCTION_APPLICATION_ID"
  type  = "String"
  value = "CHANGE_ME"

  lifecycle {
    ignore_changes = [value]
  }

  tags = {
    Name = "${var.project_name}-square-production-application-id"
  }
}

resource "aws_ssm_parameter" "square_production_location_id" {
  name  = "/${var.project_name}/SQUARE_PRODUCTION_LOCATION_ID"
  type  = "String"
  value = "CHANGE_ME"

  lifecycle {
    ignore_changes = [value]
  }

  tags = {
    Name = "${var.project_name}-square-production-location-id"
  }
}

resource "aws_ssm_parameter" "square_production_webhook_signature_key" {
  name  = "/${var.project_name}/SQUARE_PRODUCTION_WEBHOOK_SIGNATURE_KEY"
  type  = "SecureString"
  value = "CHANGE_ME"

  lifecycle {
    ignore_changes = [value]
  }

  tags = {
    Name = "${var.project_name}-square-production-webhook-signature-key"
  }
}

resource "aws_ssm_parameter" "admin_secret" {
  name  = "/${var.project_name}/ADMIN_SECRET"
  type  = "SecureString"
  value = "CHANGE_ME"

  lifecycle {
    ignore_changes = [value]
  }

  tags = {
    Name = "${var.project_name}-admin-secret"
  }
}

resource "aws_ssm_parameter" "revalidation_secret" {
  name  = "/${var.project_name}/REVALIDATION_SECRET"
  type  = "SecureString"
  value = "CHANGE_ME"

  lifecycle {
    ignore_changes = [value]
  }

  tags = {
    Name = "${var.project_name}-revalidation-secret"
  }
}

# --- Square Webhook URL ---
resource "aws_ssm_parameter" "square_webhook_url" {
  name  = "/${var.project_name}/SQUARE_WEBHOOK_URL"
  type  = "String"
  value = "https://${var.domain}/api/webhooks/square"

  tags = {
    Name = "${var.project_name}-square-webhook-url"
  }
}

# --- S3 / CloudFront Image Parameters ---
# These are derived from Terraform outputs and stored in SSM so the app
# can read them at runtime without hardcoding infrastructure details.

resource "aws_ssm_parameter" "s3_images_bucket" {
  name  = "/${var.project_name}/S3_IMAGES_BUCKET"
  type  = "String"
  value = aws_s3_bucket.images.id

  tags = {
    Name = "${var.project_name}-s3-images-bucket"
  }
}

resource "aws_ssm_parameter" "cloudfront_domain" {
  name  = "/${var.project_name}/CLOUDFRONT_DOMAIN"
  type  = "String"
  value = aws_cloudfront_distribution.images.domain_name

  tags = {
    Name = "${var.project_name}-cloudfront-domain"
  }
}

resource "aws_ssm_parameter" "aws_region" {
  name  = "/${var.project_name}/AWS_REGION"
  type  = "String"
  value = var.aws_region

  tags = {
    Name = "${var.project_name}-aws-region"
  }
}

resource "aws_ssm_parameter" "dynamodb_sessions_table" {
  name  = "/${var.project_name}/DYNAMODB_SESSIONS_TABLE"
  type  = "String"
  value = aws_dynamodb_table.sessions.name

  tags = {
    Name = "${var.project_name}-dynamodb-sessions-table"
  }
}

resource "aws_ssm_parameter" "next_public_site_url" {
  name  = "/${var.project_name}/NEXT_PUBLIC_SITE_URL"
  type  = "String"
  value = "https://${var.domain}"

  tags = {
    Name = "${var.project_name}-site-url"
  }
}
