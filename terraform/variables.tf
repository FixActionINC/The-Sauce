# -----------------------------------------------------------------------------
# variables.tf - Input variable declarations
#
# All configurable values for The Sauce infrastructure. No defaults are
# provided for security-sensitive variables (ssh_allowed_cidr, key_name)
# to force explicit configuration.
# -----------------------------------------------------------------------------

variable "aws_region" {
  description = "AWS region to deploy all resources into"
  type        = string
  default     = "us-west-2"
}

variable "instance_type" {
  description = "EC2 instance type for the application server"
  type        = string
  default     = "t3.small"
}

variable "domain" {
  description = "Primary domain name for the e-commerce site"
  type        = string
  default     = "jonesingforsauce.com"
}

variable "ssh_allowed_cidr" {
  description = "CIDR block allowed for SSH access (e.g. YOUR_IP/32)"
  type        = string
  # No default — must be explicitly provided to prevent accidental open SSH
}

variable "key_name" {
  description = "Name of EC2 key pair for SSH access"
  type        = string
  # No default — must match an existing key pair in the target AWS account
}

variable "project_name" {
  description = "Project identifier used in resource naming and tagging"
  type        = string
  default     = "the-sauce"
}

# --- RDS Database Credentials ---
# These are used to configure the PostgreSQL admin account.
# db_password has no default and must be provided at plan/apply time
# (e.g., via terraform.tfvars, TF_VAR_db_password, or -var flag).

variable "db_username" {
  description = "Master username for the RDS PostgreSQL instance"
  type        = string
  default     = "thesauce_admin"
}

variable "db_password" {
  description = "Master password for the RDS PostgreSQL instance (must be provided, never committed to source control)"
  type        = string
  sensitive   = true
  # No default — must be explicitly provided to prevent accidental weak passwords
}
