# -----------------------------------------------------------------------------
# route53.tf - DNS hosted zone and records for jonesingforsauce.com
#
# Creates a public hosted zone and points the domain to the EC2 Elastic IP.
# After applying, update the domain registrar's nameservers to the NS records
# output by `terraform output route53_name_servers`.
# -----------------------------------------------------------------------------

resource "aws_route53_zone" "main" {
  name = var.domain

  tags = {
    Name = "${var.project_name}-zone"
  }
}

# Root domain → EC2 Elastic IP
resource "aws_route53_record" "root" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain
  type    = "A"
  ttl     = 300
  records = [aws_eip.app.public_ip]
}

# www subdomain → root domain
resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.${var.domain}"
  type    = "CNAME"
  ttl     = 300
  records = [var.domain]
}
