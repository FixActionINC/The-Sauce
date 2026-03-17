# -----------------------------------------------------------------------------
# provider.tf - AWS provider configuration
# -----------------------------------------------------------------------------

provider "aws" {
  region  = var.aws_region
  profile = "the-sauce"

  default_tags {
    tags = {
      Project     = var.project_name
      ManagedBy   = "terraform"
      Environment = "production"
    }
  }
}
