#!/usr/bin/env bash
# =============================================================================
# The Sauce - PostgreSQL Production Backup Script
# =============================================================================
#
# Creates a pg_dump backup of the production PostgreSQL database (RDS),
# compresses it with gzip, uploads it to S3, and retains the last 7 local
# copies for fast restore.
#
# This is a SECONDARY backup for extra safety. The primary backup is provided
# by AWS RDS automated backups with 7-day retention and point-in-time recovery.
#
# Prerequisites:
#   - pg_dump    (apt install postgresql-client or amazon-linux-extras install postgresql*)
#   - aws cli v2 (https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
#   - gzip
#   - BACKUP_S3_BUCKET environment variable set (e.g., "the-sauce-backups")
#   - DATABASE_URL environment variable set (PostgreSQL connection string)
#     OR individual PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE env vars
#   - AWS credentials configured (instance profile, env vars, or ~/.aws/credentials)
#
# Cron setup (daily at 2 AM UTC):
#   0 2 * * * /opt/the-sauce/docker/backup.sh >> /var/log/the-sauce-backup.log 2>&1
#
# Restore from local backup:
#   gunzip -k /opt/the-sauce/backups/YYYYMMDD_HHMMSS.sql.gz
#   psql "$DATABASE_URL" < /opt/the-sauce/backups/YYYYMMDD_HHMMSS.sql
#
# Restore from S3:
#   aws s3 cp s3://<bucket>/postgres/YYYYMMDD_HHMMSS.sql.gz /tmp/restore.sql.gz
#   gunzip /tmp/restore.sql.gz
#   psql "$DATABASE_URL" < /tmp/restore.sql
#
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
LOCAL_BACKUP_DIR="/opt/the-sauce/backups"
LOCAL_RETENTION=7
TIMESTAMP="$(date -u +%Y%m%d_%H%M%S)"
BACKUP_FILENAME="${TIMESTAMP}.sql"
COMPRESSED_FILENAME="${BACKUP_FILENAME}.gz"
S3_PREFIX="postgres"

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
log() {
    echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] $*"
}

log_error() {
    echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] ERROR: $*" >&2
}

# ---------------------------------------------------------------------------
# Cleanup trap
# Removes temporary files on exit (success or failure).
# ---------------------------------------------------------------------------
cleanup() {
    if [[ -n "${TMP_BACKUP:-}" && -f "${TMP_BACKUP:-}" ]]; then
        rm -f "${TMP_BACKUP}"
        log "Cleaned up temporary file: ${TMP_BACKUP}"
    fi
}
trap cleanup EXIT

# ---------------------------------------------------------------------------
# Parse DATABASE_URL into pg_dump-compatible environment variables
# Format: postgresql://user:password@host:port/database
# ---------------------------------------------------------------------------
parse_database_url() {
    if [[ -n "${DATABASE_URL:-}" ]]; then
        # Extract components from the connection string
        local url="${DATABASE_URL}"
        # Remove the protocol prefix
        url="${url#postgresql://}"
        url="${url#postgres://}"

        # Extract user:password
        local userpass="${url%%@*}"
        PGUSER="${userpass%%:*}"
        PGPASSWORD="${userpass#*:}"

        # Extract host:port/database
        local hostpart="${url#*@}"
        local hostport="${hostpart%%/*}"
        PGDATABASE="${hostpart#*/}"
        # Remove any query parameters from database name
        PGDATABASE="${PGDATABASE%%\?*}"

        PGHOST="${hostport%%:*}"
        PGPORT="${hostport#*:}"
        # Default port if not specified
        if [[ "${PGPORT}" == "${PGHOST}" ]]; then
            PGPORT="5432"
        fi

        export PGUSER PGPASSWORD PGHOST PGPORT PGDATABASE
    fi
}

# ---------------------------------------------------------------------------
# Preflight checks
# ---------------------------------------------------------------------------
preflight() {
    local failed=0

    if ! command -v pg_dump &>/dev/null; then
        log_error "pg_dump is not installed or not in PATH."
        failed=1
    fi

    if ! command -v aws &>/dev/null; then
        log_error "AWS CLI is not installed or not in PATH."
        failed=1
    fi

    if ! command -v gzip &>/dev/null; then
        log_error "gzip is not installed or not in PATH."
        failed=1
    fi

    if [[ -z "${BACKUP_S3_BUCKET:-}" ]]; then
        log_error "BACKUP_S3_BUCKET environment variable is not set."
        failed=1
    fi

    if [[ -z "${DATABASE_URL:-}" && -z "${PGHOST:-}" ]]; then
        log_error "Neither DATABASE_URL nor PGHOST is set. Cannot connect to database."
        failed=1
    fi

    if [[ "${failed}" -ne 0 ]]; then
        log_error "Preflight checks failed. Aborting backup."
        exit 1
    fi

    log "Preflight checks passed."
}

# ---------------------------------------------------------------------------
# Create a pg_dump backup
# ---------------------------------------------------------------------------
create_backup() {
    mkdir -p "${LOCAL_BACKUP_DIR}"

    TMP_BACKUP="${LOCAL_BACKUP_DIR}/${BACKUP_FILENAME}"

    log "Starting PostgreSQL backup -> ${TMP_BACKUP}"

    # --no-owner: Omit ownership commands (RDS uses a managed role)
    # --no-privileges: Omit GRANT/REVOKE (managed by RDS)
    # --clean: Include DROP statements for idempotent restore
    # --if-exists: Prevent errors if objects don't exist during restore
    pg_dump \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        --file="${TMP_BACKUP}" \
        2>&1

    if [[ ! -f "${TMP_BACKUP}" || ! -s "${TMP_BACKUP}" ]]; then
        log_error "Backup file is missing or empty: ${TMP_BACKUP}"
        exit 1
    fi

    local size_bytes
    size_bytes="$(stat -c%s "${TMP_BACKUP}" 2>/dev/null || stat -f%z "${TMP_BACKUP}" 2>/dev/null)"
    log "Backup created successfully (${size_bytes} bytes)."
}

# ---------------------------------------------------------------------------
# Compress the backup
# ---------------------------------------------------------------------------
compress_backup() {
    log "Compressing backup with gzip..."

    gzip -f "${TMP_BACKUP}"

    # After gzip, the original file is replaced with .gz.
    # Clear TMP_BACKUP so cleanup trap does not try to remove it.
    TMP_BACKUP=""

    if [[ ! -f "${LOCAL_BACKUP_DIR}/${COMPRESSED_FILENAME}" ]]; then
        log_error "Compressed file not found: ${LOCAL_BACKUP_DIR}/${COMPRESSED_FILENAME}"
        exit 1
    fi

    local size_bytes
    size_bytes="$(stat -c%s "${LOCAL_BACKUP_DIR}/${COMPRESSED_FILENAME}" 2>/dev/null || stat -f%z "${LOCAL_BACKUP_DIR}/${COMPRESSED_FILENAME}" 2>/dev/null)"
    log "Compression complete (${size_bytes} bytes)."
}

# ---------------------------------------------------------------------------
# Upload to S3
# ---------------------------------------------------------------------------
upload_to_s3() {
    local s3_dest="s3://${BACKUP_S3_BUCKET}/${S3_PREFIX}/${COMPRESSED_FILENAME}"

    log "Uploading to ${s3_dest}..."

    aws s3 cp \
        "${LOCAL_BACKUP_DIR}/${COMPRESSED_FILENAME}" \
        "${s3_dest}" \
        --only-show-errors

    log "Upload to S3 complete: ${s3_dest}"
}

# ---------------------------------------------------------------------------
# Prune old local backups, keeping the most recent LOCAL_RETENTION files
# ---------------------------------------------------------------------------
prune_local_backups() {
    local count
    count="$(find "${LOCAL_BACKUP_DIR}" -maxdepth 1 -name '*.sql.gz' -type f | wc -l)"

    if [[ "${count}" -le "${LOCAL_RETENTION}" ]]; then
        log "Local backup count (${count}) is within retention limit (${LOCAL_RETENTION}). No pruning needed."
        return
    fi

    local to_remove
    to_remove=$((count - LOCAL_RETENTION))

    log "Pruning ${to_remove} old local backup(s) (keeping ${LOCAL_RETENTION})..."

    # Sort by filename (which embeds the timestamp) and remove the oldest.
    find "${LOCAL_BACKUP_DIR}" -maxdepth 1 -name '*.sql.gz' -type f -print0 \
        | sort -z \
        | head -z -n "${to_remove}" \
        | xargs -0 rm -f

    log "Local pruning complete."
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
    log "=========================================="
    log "Starting backup for The Sauce (PostgreSQL)"
    log "=========================================="

    parse_database_url
    preflight
    create_backup
    compress_backup
    upload_to_s3
    prune_local_backups

    log "=========================================="
    log "Backup completed successfully: ${COMPRESSED_FILENAME}"
    log "=========================================="
}

main "$@"
