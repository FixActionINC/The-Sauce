# -----------------------------------------------------------------------------
# security.tf - Security groups
#
# Defines three security groups:
#   1. web_sg  - HTTP/HTTPS from anywhere (public-facing web traffic)
#   2. ssh_sg  - SSH restricted to a single CIDR (admin access only)
#   3. rds_sg  - PostgreSQL port 5432 from the web_sg only (database access)
#
# Security groups are kept separate so each layer of access can be
# independently managed and audited.
# -----------------------------------------------------------------------------

# --- Web Security Group ---
# Allows inbound HTTP (80) and HTTPS (443) from anywhere.
# HTTP is kept open for redirect-to-HTTPS and Let's Encrypt ACME challenges.
resource "aws_security_group" "web_sg" {
  name        = "${var.project_name}-web-sg"
  description = "Allow HTTP and HTTPS inbound traffic"
  vpc_id      = aws_vpc.main.id

  # HTTP - needed for Let's Encrypt certificate renewal and HTTPS redirects
  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS - primary application traffic
  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound (package updates, ECR pulls, Square API calls, etc.)
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-web-sg"
  }
}

# --- SSH Security Group ---
# Restricted to a specific CIDR block to prevent brute-force attacks.
# Combined with fail2ban on the instance for defense in depth.
resource "aws_security_group" "ssh_sg" {
  name        = "${var.project_name}-ssh-sg"
  description = "Allow SSH from specific CIDR only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH from allowed CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-ssh-sg"
  }
}

# --- RDS Security Group ---
# Only allows inbound PostgreSQL connections from the EC2 web security group.
# This ensures the database is unreachable from the internet and only the
# application server can establish connections.
resource "aws_security_group" "rds_sg" {
  name        = "${var.project_name}-rds-sg"
  description = "Allow PostgreSQL access from the web application server only"
  vpc_id      = aws_vpc.main.id

  # PostgreSQL port - restricted to traffic from the web security group
  ingress {
    description     = "PostgreSQL from web app server"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web_sg.id]
  }

  # Allow all outbound (needed for RDS internal operations)
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-rds-sg"
  }
}
