#!/bin/bash
set -e

PROJECT_NAME="${PROJECT_NAME:-the-sauce}"
AWS_REGION="${AWS_REGION:-us-west-2}"
DEPLOY_DIR="/opt/the-sauce"

echo "==> Starting deployment..."

# --- Pull all config from SSM Parameter Store into .env ---
# Fetches ALL parameters under /${PROJECT_NAME}/ prefix and writes them to .env.
# Then resolves environment-specific Square credentials (sandbox/production)
# into the generic names the app expects.
echo "==> Fetching config from SSM Parameter Store..."
aws ssm get-parameters-by-path \
  --path "/${PROJECT_NAME}/" \
  --with-decryption \
  --region "$AWS_REGION" \
  --query "Parameters[*].[Name,Value]" \
  --output text | while IFS=$'\t' read -r name value; do
    # Strip the prefix: /the-sauce/SQUARE_SANDBOX_ACCESS_TOKEN -> SQUARE_SANDBOX_ACCESS_TOKEN
    key="${name##*/}"
    echo "${key}=${value}"
  done > "${DEPLOY_DIR}/.env"

# Add NODE_ENV (not stored in SSM — always production on this host)
echo "NODE_ENV=production" >> "${DEPLOY_DIR}/.env"

# --- Resolve Square environment-specific credentials ---
# Reads SQUARE_ENVIRONMENT (sandbox|production) and maps the prefixed params
# (e.g. SQUARE_SANDBOX_ACCESS_TOKEN) into the generic names the app uses
# (e.g. SQUARE_ACCESS_TOKEN).
SQUARE_ENV=$(grep "^SQUARE_ENVIRONMENT=" "${DEPLOY_DIR}/.env" | cut -d= -f2)
if [ "$SQUARE_ENV" = "production" ]; then
  PREFIX="SQUARE_PRODUCTION"
else
  PREFIX="SQUARE_SANDBOX"
fi

echo "==> Resolving Square credentials for environment: ${SQUARE_ENV:-sandbox}"
for KEY in ACCESS_TOKEN APPLICATION_ID LOCATION_ID WEBHOOK_SIGNATURE_KEY; do
  VALUE=$(grep "^${PREFIX}_${KEY}=" "${DEPLOY_DIR}/.env" | cut -d= -f2)
  if [ -n "$VALUE" ] && [ "$VALUE" != "CHANGE_ME" ]; then
    # Remove any existing generic line, then append the resolved value
    sed -i "/^SQUARE_${KEY}=/d" "${DEPLOY_DIR}/.env"
    echo "SQUARE_${KEY}=${VALUE}" >> "${DEPLOY_DIR}/.env"
  fi
done

chmod 600 "${DEPLOY_DIR}/.env"
echo "==> .env written from SSM"

# --- Login to ECR ---
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "${ECR_REPOSITORY%/*}"

# --- Pull and restart ---
# ECR_REPOSITORY is exported by the caller (GitHub Actions deploy step).
# docker-compose.yml uses ${ECR_REPOSITORY} in the image field.
cd "$DEPLOY_DIR"
export ECR_REPOSITORY
docker compose pull app
docker compose up -d --remove-orphans

# --- Clean up ---
docker image prune -f

echo "==> Deployment complete!"
