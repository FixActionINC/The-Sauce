# -----------------------------------------------------------------------------
# ecr.tf - Elastic Container Registry
#
# Private ECR repository for the Next.js Docker image.
# Image scanning is enabled to catch known vulnerabilities on push.
# A lifecycle policy keeps only the last 10 untagged images to control
# storage costs (~$0.10/GB/month).
# -----------------------------------------------------------------------------

resource "aws_ecr_repository" "web" {
  name = "${var.project_name}/web"

  # MUTABLE allows overwriting :latest tag on each deploy
  image_tag_mutability = "MUTABLE"

  # Scan images for CVEs on every push
  image_scanning_configuration {
    scan_on_push = true
  }

  # Encrypt images at rest with AWS-managed key (no additional cost)
  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "${var.project_name}-ecr-web"
  }
}

# --- Lifecycle Policy ---
# Automatically remove old untagged images to prevent unbounded storage growth.
# Keeps only the 10 most recent untagged images.
resource "aws_ecr_lifecycle_policy" "web" {
  repository = aws_ecr_repository.web.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep only the last 10 untagged images"
        selection = {
          tagStatus   = "untagged"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
