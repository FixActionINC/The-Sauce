# -----------------------------------------------------------------------------
# rds.tf - RDS PostgreSQL instance
#
# Managed PostgreSQL database for the application.
# Deployed into private subnets with no public access — only reachable
# from the EC2 application server via the web_sg security group.
#
# Cost note: db.t4g.micro (~$12/mo) is free-tier eligible for the first
# 12 months (750 hours/month). 20GB gp3 storage is included in free tier.
# Automated backups (7-day retention) use snapshot storage at ~$0.095/GB/mo.
# -----------------------------------------------------------------------------

resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-postgres"

  # --- Engine ---
  engine         = "postgres"
  engine_version = "16"

  # --- Instance Size ---
  # db.t4g.micro: 2 vCPU, 1GB RAM — suitable for a small e-commerce site.
  # Graviton-based (t4g) is ~20% cheaper than equivalent x86 (t3) instances.
  instance_class = "db.t4g.micro"

  # --- Storage ---
  # 20GB gp3 provides 3000 IOPS baseline and 125 MB/s throughput at no extra cost.
  # gp3 is cheaper than gp2 and decouples IOPS from storage size.
  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true # Encrypt data at rest with AWS-managed KMS key

  # --- Database ---
  db_name  = "thesauce"
  username = var.db_username
  password = var.db_password

  # --- Networking ---
  # Placed in private subnets — not reachable from the internet.
  # Only the EC2 app server can connect via the rds_sg security group.
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  publicly_accessible    = false

  # --- High Availability ---
  # Single-AZ is sufficient for a small site. Automated backups provide
  # durability. Multi-AZ can be enabled later if uptime SLA requires it
  # (~2x cost increase).
  multi_az = false

  # --- Backups ---
  # 7-day retention allows point-in-time recovery for the past week.
  # Backup window is set to 03:00-04:00 UTC (off-peak for US customers).
  backup_retention_period = 7
  backup_window           = "03:00-04:00"

  # --- Snapshots ---
  # Take a final snapshot before deletion to prevent accidental data loss.
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.project_name}-final-snapshot"

  # --- Protection ---
  # Prevent accidental deletion via Terraform or the AWS console.
  # Must be explicitly set to false before the instance can be destroyed.
  deletion_protection = true

  # --- Maintenance ---
  # Allow minor version upgrades to be applied automatically during
  # the maintenance window for security patches.
  auto_minor_version_upgrade = true

  tags = {
    Name = "${var.project_name}-postgres"
  }
}
