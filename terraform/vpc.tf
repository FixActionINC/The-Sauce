# -----------------------------------------------------------------------------
# vpc.tf - VPC, subnets, internet gateway, and routing
#
# Network layout:
#   - 1 public subnet  (10.0.1.0/24)  in AZ[0] for the EC2 app server
#   - 2 private subnets (10.0.10.0/24, 10.0.11.0/24) in AZ[0] and AZ[1]
#     for RDS PostgreSQL (DB subnet group requires >= 2 AZs)
#
# No NAT gateway is provisioned — the private subnets are isolated by design.
# RDS does not need outbound internet access.
# -----------------------------------------------------------------------------

# Look up available AZs in the configured region
data "aws_availability_zones" "available" {
  state = "available"
}

# --- VPC ---
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# --- Public Subnet ---
# Placed in the first available AZ for simplicity
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet"
  }
}

# --- Internet Gateway ---
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# --- Route Table ---
# Routes all non-local traffic to the internet gateway
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

# --- Route Table Association ---
resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# --- Private Subnet A ---
# Used by RDS. Placed in AZ[0] alongside the public subnet.
# No route to the internet gateway — fully isolated.
resource "aws_subnet" "private_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.10.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = false

  tags = {
    Name = "${var.project_name}-private-subnet-a"
  }
}

# --- Private Subnet B ---
# Used by RDS. Placed in AZ[1] to satisfy the DB subnet group
# requirement of subnets in at least 2 different availability zones.
resource "aws_subnet" "private_b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.11.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = false

  tags = {
    Name = "${var.project_name}-private-subnet-b"
  }
}

# --- DB Subnet Group ---
# Groups the two private subnets for RDS placement.
# RDS requires subnets in at least 2 AZs even for single-AZ deployments.
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}
