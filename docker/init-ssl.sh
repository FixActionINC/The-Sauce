#!/bin/bash
# SSL Bootstrap Script for jonesingforsauce.com
#
# This script provisions the initial Let's Encrypt SSL certificate using
# the certbot webroot method. It temporarily reconfigures Nginx to serve
# HTTP-only so certbot can complete the ACME challenge, then restores
# the full SSL config and reloads Nginx.
#
# Usage: Run from the project root directory:
#   chmod +x docker/init-ssl.sh
#   ./docker/init-ssl.sh
#
# Prerequisites:
#   - docker compose must be available
#   - DNS for the domain must point to this server
#   - Port 80 must be reachable from the internet

set -e

DOMAIN="jonesingforsauce.com"
EMAIL="admin@jonesingforsauce.com"

echo "==> Starting SSL certificate provisioning for $DOMAIN"

# Create a minimal HTTP-only nginx config for the certbot challenge
cat > docker/nginx/conf.d/default.conf.tmp << 'TMPEOF'
server {
    listen 80;
    server_name jonesingforsauce.com www.jonesingforsauce.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'Setting up SSL...';
        add_header Content-Type text/plain;
    }
}
TMPEOF

# Backup the real config and swap in the temp one
cp docker/nginx/conf.d/default.conf docker/nginx/conf.d/default.conf.bak
cp docker/nginx/conf.d/default.conf.tmp docker/nginx/conf.d/default.conf

# Start/restart nginx with temp config
docker compose up -d nginx

echo "==> Waiting for nginx to start..."
sleep 5

# Request the certificate
docker compose run --rm certbot certonly \
  --webroot \
  -w /var/www/certbot \
  -d "$DOMAIN" \
  -d "www.$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos \
  --non-interactive

# Restore the real config with SSL
cp docker/nginx/conf.d/default.conf.bak docker/nginx/conf.d/default.conf
rm docker/nginx/conf.d/default.conf.tmp docker/nginx/conf.d/default.conf.bak

# Reload nginx with SSL config
docker compose exec nginx nginx -s reload

echo "==> SSL setup complete!"
