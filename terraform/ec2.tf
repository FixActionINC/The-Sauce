# -----------------------------------------------------------------------------
# ec2.tf - EC2 instance, Elastic IP, and user data provisioning
#
# Deploys a single EC2 instance running Amazon Linux 2023 with Docker,
# docker-compose, and supporting tools pre-installed via user data.
# An Elastic IP provides a stable public address for DNS.
#
# Cost note: t3.small (~$15/mo) is right-sized for a small e-commerce site.
# The Elastic IP is free while associated with a running instance.
# -----------------------------------------------------------------------------

# --- AMI Data Source ---
# Fetches the latest Amazon Linux 2023 x86_64 AMI owned by Amazon
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

# --- EC2 Instance ---
resource "aws_instance" "app" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.web_sg.id, aws_security_group.ssh_sg.id]
  key_name               = var.key_name
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  # Associate a public IP for initial connectivity before EIP attachment
  associate_public_ip_address = true

  # 20GB gp3 root volume - sufficient for Docker images and application data
  # gp3 is cheaper than gp2 with better baseline performance (3000 IOPS)
  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true

    tags = {
      Name = "${var.project_name}-root-volume"
    }
  }

  # User data script runs on first boot to provision the instance
  user_data = <<-EOF
    #!/bin/bash
    set -euo pipefail

    # --- System Updates ---
    dnf update -y

    # --- Docker Installation ---
    dnf install -y docker
    systemctl start docker
    systemctl enable docker

    # Install docker-compose plugin
    mkdir -p /usr/local/lib/docker/cli-plugins
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name"' | cut -d'"' -f4)
    curl -SL "https://github.com/docker/compose/releases/download/$${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
      -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

    # --- Deploy User Setup ---
    # Create a dedicated deploy user to avoid running containers as root
    useradd -m -s /bin/bash deploy
    usermod -aG docker deploy

    # --- Application Directory ---
    mkdir -p /opt/the-sauce
    chown deploy:deploy /opt/the-sauce

    # --- AWS CLI v2 ---
    # Needed for ECR login and S3 backup uploads
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
    cd /tmp && unzip -q awscliv2.zip
    /tmp/aws/install
    rm -rf /tmp/aws /tmp/awscliv2.zip

    # --- PostgreSQL 16 Client ---
    # Required for debugging database connections and running ad-hoc queries
    # against the RDS instance from the EC2 server (psql command)
    dnf install -y postgresql16

    # --- SSH Hardening ---
    # Disable password authentication - key-only access
    sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
    # Disable root login - force use of ec2-user or deploy user
    sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
    systemctl restart sshd

    # --- Fail2ban ---
    # Protects against SSH brute-force attacks
    dnf install -y fail2ban
    systemctl enable fail2ban
    systemctl start fail2ban
  EOF

  tags = {
    Name = "${var.project_name}-app-server"
  }

  # Prevent accidental destruction of the production server
  lifecycle {
    ignore_changes = [ami]
  }
}

# --- Elastic IP ---
# Provides a stable IP address that persists across instance stop/start cycles.
# Required for DNS A-record pointing.
resource "aws_eip" "app" {
  domain = "vpc"

  tags = {
    Name = "${var.project_name}-eip"
  }
}

# --- EIP Association ---
resource "aws_eip_association" "app" {
  instance_id   = aws_instance.app.id
  allocation_id = aws_eip.app.id
}
