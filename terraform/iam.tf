# -----------------------------------------------------------------------------
# iam.tf - IAM role, instance profile, and policies for the EC2 instance
#
# Follows least-privilege: the EC2 instance can only:
#   1. Pull images from ECR (deploy new versions)
#   2. Read/write to the S3 backup bucket (database backups)
#   3. Write to CloudWatch Logs (application and system logs)
#   4. Read/write to the S3 images bucket (admin product image uploads)
#   5. Read/write to the DynamoDB sessions table (session management)
#
# Each capability is defined as a separate inline policy for clarity
# and independent auditability.
# -----------------------------------------------------------------------------

# --- IAM Role ---
# Trust policy allows only the EC2 service to assume this role
resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-ec2-role"
  }
}

# --- Instance Profile ---
# Attaches the IAM role to the EC2 instance
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# --- ECR Read Access ---
# Allows the instance to authenticate with ECR and pull Docker images.
# GetAuthorizationToken is account-wide (cannot be resource-scoped).
# Image pull actions are scoped to the specific repository.
resource "aws_iam_role_policy" "ecr_access" {
  name = "${var.project_name}-ecr-access"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ECRAuthToken"
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        # GetAuthorizationToken must be granted on all resources
        Resource = "*"
      },
      {
        Sid    = "ECRPushPullImages"
        Effect = "Allow"
        Action = [
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchCheckLayerAvailability",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage"
        ]
        Resource = aws_ecr_repository.web.arn
      }
    ]
  })
}

# --- S3 Backup Access ---
# Allows the instance to upload and retrieve database backups (pg_dump).
# ListBucket is needed to enumerate existing backups for restore operations.
# PutObject/GetObject are scoped to the backup bucket only.
resource "aws_iam_role_policy" "s3_backup" {
  name = "${var.project_name}-s3-backup"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3ListBackups"
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.backups.arn
      },
      {
        Sid    = "S3ReadWriteBackups"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.backups.arn}/*"
      }
    ]
  })
}

# --- CloudWatch Logs Access ---
# Allows the instance to stream application and system logs to CloudWatch.
# Scoped to log groups prefixed with the project name.
resource "aws_iam_role_policy" "cloudwatch_logs" {
  name = "${var.project_name}-cloudwatch-logs"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        # Scoped to log groups for this project only
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/the-sauce/*"
      }
    ]
  })
}

# --- S3 Images Bucket Access ---
# Allows the instance to upload, retrieve, and delete product images.
# Used by the admin panel for product image management.
# ListBucket is needed to enumerate images for display/management.
# DeleteObject is needed to remove old images when products are updated.
resource "aws_iam_role_policy" "s3_images" {
  name = "${var.project_name}-s3-images"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3ListImages"
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.images.arn
      },
      {
        Sid    = "S3ReadWriteImages"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.images.arn}/*"
      }
    ]
  })
}

# --- SSM Access ---
# AmazonSSMManagedInstanceCore is the AWS-managed policy for Systems Manager.
# It allows the SSM Agent to communicate with SSM endpoints for:
#   - Session Manager (shell access without SSH)
#   - Run Command (remote script execution)
#   - Patch Manager, Inventory, etc.
resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# --- SSM Parameter Store Access ---
# Allows the instance to read application secrets from Parameter Store.
# Scoped to parameters prefixed with the project name.
resource "aws_iam_role_policy" "ssm_parameters" {
  name = "${var.project_name}-ssm-parameters"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SSMGetParameters"
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/*"
      }
    ]
  })
}

# --- DynamoDB Sessions Access ---
# Allows the instance to read, write, and delete session records.
# Scoped to the sessions table and its GSIs only.
#
# IMPORTANT: Scan is intentionally NOT granted. All access patterns use
# direct key lookups (GetItem) or Query on the UserIdIndex GSI.
# This enforces the "query, don't scan" design at the IAM level.
resource "aws_iam_role_policy" "dynamodb_sessions" {
  name = "${var.project_name}-dynamodb-sessions"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DynamoDBSessionsCRUD"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query"
        ]
        # Grants access to both the base table and all its indexes (GSIs).
        # The /index/* suffix covers the UserIdIndex GSI for Query operations.
        Resource = [
          aws_dynamodb_table.sessions.arn,
          "${aws_dynamodb_table.sessions.arn}/index/*"
        ]
      }
    ]
  })
}

# --- CI/CD IAM User ---
# Dedicated IAM user for GitHub Actions with minimal permissions:
#   - Push Docker images to ECR (build & deploy pipeline)
#   - Sync deploy config files to S3 (replaces SCP over SSH)
#   - Run deploy script on EC2 via SSM Run Command (replaces SSH)
# Access keys are created here; the secret key is output for one-time retrieval.
resource "aws_iam_user" "cicd" {
  name = "${var.project_name}-cicd"

  tags = {
    Name = "${var.project_name}-cicd"
  }
}

resource "aws_iam_access_key" "cicd" {
  user = aws_iam_user.cicd.name
}

resource "aws_iam_user_policy" "cicd_ecr" {
  name = "${var.project_name}-cicd-ecr"
  user = aws_iam_user.cicd.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ECRAuthToken"
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      },
      {
        Sid    = "ECRPushImages"
        Effect = "Allow"
        Action = [
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchCheckLayerAvailability",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage"
        ]
        Resource = aws_ecr_repository.web.arn
      }
    ]
  })
}

# --- CI/CD Deploy Policy ---
# Allows the CI/CD user to:
#   1. Sync config files (docker-compose, nginx) to S3 for EC2 to pull
#   2. Trigger deploy.sh on EC2 via SSM Run Command (no SSH required)
#   3. Poll for command completion status
resource "aws_iam_user_policy" "cicd_deploy" {
  name = "${var.project_name}-cicd-deploy"
  user = aws_iam_user.cicd.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3SyncDeployConfig"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.backups.arn}/deploy-config/*"
      },
      {
        Sid    = "S3ListDeployConfig"
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.backups.arn
        Condition = {
          StringLike = {
            "s3:prefix" = ["deploy-config/*"]
          }
        }
      },
      {
        Sid    = "SSMSendCommand"
        Effect = "Allow"
        Action = [
          "ssm:SendCommand"
        ]
        Resource = "*"
      },
      {
        Sid    = "SSMGetCommandStatus"
        Effect = "Allow"
        Action = [
          "ssm:GetCommandInvocation"
        ]
        Resource = "*"
      }
    ]
  })
}
