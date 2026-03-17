# -----------------------------------------------------------------------------
# cdn.tf - S3 images bucket + CloudFront CDN
#
# Product images are stored in a private S3 bucket and served through
# CloudFront using Origin Access Control (OAC). This ensures:
#   1. Images are never directly accessible via S3 URLs
#   2. CloudFront caches images at edge locations for low latency
#   3. All viewer traffic is HTTPS-only
#
# Cost notes:
#   - S3 Standard: ~$0.023/GB/month storage + $0.09/GB transfer to CloudFront
#   - CloudFront PriceClass_100 (US/Canada/Europe): first 1TB/mo free tier,
#     then ~$0.085/GB. For a small product catalog this will be negligible.
#   - OAC is free (replaces the deprecated OAI approach).
# -----------------------------------------------------------------------------

# --- S3 Images Bucket ---
# Stores product images uploaded via the admin panel.
# All public access is blocked — CloudFront OAC is the only access path.
resource "aws_s3_bucket" "images" {
  bucket = "${var.project_name}-images-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "${var.project_name}-images"
  }
}

# --- Block All Public Access ---
# Images are served exclusively through CloudFront.
# No direct S3 access should ever be possible.
resource "aws_s3_bucket_public_access_block" "images" {
  bucket = aws_s3_bucket.images.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# --- Server-Side Encryption ---
# AES256 (SSE-S3) encryption at rest — no additional cost
resource "aws_s3_bucket_server_side_encryption_configuration" "images" {
  bucket = aws_s3_bucket.images.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# --- CORS Configuration ---
# Allow GET requests from the application domain so browsers can load images.
resource "aws_s3_bucket_cors_configuration" "images" {
  bucket = aws_s3_bucket.images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET"]
    allowed_origins = ["https://${var.domain}"]
    max_age_seconds = 3600
  }
}

# --- CloudFront Origin Access Control ---
# OAC signs requests from CloudFront to S3, replacing the deprecated OAI.
# This ensures only CloudFront can read from the S3 bucket.
resource "aws_cloudfront_origin_access_control" "images" {
  name                              = "${var.project_name}-images-oac"
  description                       = "OAC for ${var.project_name} images S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# --- S3 Bucket Policy ---
# Grants CloudFront OAC read-only access to the images bucket.
# This policy is required for OAC to work — without it, CloudFront
# receives 403 errors from S3.
resource "aws_s3_bucket_policy" "images_cdn" {
  bucket = aws_s3_bucket.images.id

  # Ensure public access block is in place before applying this policy
  depends_on = [aws_s3_bucket_public_access_block.images]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.images.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.images.arn
          }
        }
      }
    ]
  })
}

# --- CloudFront Distribution ---
# Serves product images from the S3 bucket via HTTPS.
# Uses the managed CachingOptimized policy for long-lived image caching.
resource "aws_cloudfront_distribution" "images" {
  comment             = "The Sauce - Product Images CDN"
  enabled             = true
  is_ipv6_enabled     = true
  http_version        = "http2and3"
  wait_for_deployment = false

  # --- Origin: S3 Images Bucket ---
  origin {
    domain_name              = aws_s3_bucket.images.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.images.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.images.id
  }

  # --- Default Cache Behavior ---
  # Only allow GET and HEAD (read-only image serving).
  # Uses the AWS-managed CachingOptimized policy (ID below) which sets
  # a default TTL of 86400s (24h) and honors Cache-Control headers.
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.images.id}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    # AWS Managed CachingOptimized policy
    # Optimized for high cache hit ratios with long TTLs
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  }

  # --- Price Class ---
  # PriceClass_100: US, Canada, and Europe edge locations only.
  # This is the cheapest tier. The Sauce's customers are primarily in the US,
  # so global edge locations would be unnecessary cost.
  price_class = "PriceClass_100"

  # --- Geo Restrictions ---
  # No geographic restrictions — allow access from all countries.
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # --- SSL Certificate ---
  # Uses the default *.cloudfront.net certificate.
  # A custom domain + ACM certificate can be added later if needed.
  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "${var.project_name}-images-cdn"
  }
}
