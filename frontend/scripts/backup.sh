#!/bin/bash

# Backup Script for Frontend Build
# Creates backups of builds and configuration files

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
BUILD_DIR="${BUILD_DIR:-.}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
GIT_COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BACKUP_NAME="frontend-backup-${TIMESTAMP}-${GIT_COMMIT_HASH}"

echo "📦 Creating frontend backup: ${BACKUP_NAME}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Create backup archive
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

# Files and directories to backup
BACKUP_ITEMS=(
    ".next"
    "package.json"
    "package-lock.json"
    "next.config.ts"
    "tsconfig.json"
    "public"
)

# Check if items exist before backing up
BACKUP_LIST=()
for item in "${BACKUP_ITEMS[@]}"; do
    if [ -e "${BUILD_DIR}/${item}" ]; then
        BACKUP_LIST+=("${item}")
    fi
done

if [ ${#BACKUP_LIST[@]} -eq 0 ]; then
    echo "⚠️  No items found to backup"
    exit 0
fi

# Create tar archive
cd "${BUILD_DIR}"
tar -czf "../${BACKUP_FILE}" "${BACKUP_LIST[@]}" 2>/dev/null || {
    echo "❌ Backup failed"
    exit 1
}

cd ..

# Get backup size
BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)

echo "✅ Backup created successfully"
echo "   File: ${BACKUP_FILE}"
echo "   Size: ${BACKUP_SIZE}"
echo "   Items: ${#BACKUP_LIST[@]}"

# Create backup metadata
cat > "${BACKUP_DIR}/${BACKUP_NAME}.info" <<EOF
Backup Information
==================
Timestamp: ${TIMESTAMP}
Commit Hash: ${GIT_COMMIT_HASH}
Build Number: ${BUILD_NUMBER:-N/A}
Size: ${BACKUP_SIZE}
Items Backed Up:
$(for item in "${BACKUP_LIST[@]}"; do echo "  - ${item}"; done)
EOF

echo "📄 Metadata saved to: ${BACKUP_DIR}/${BACKUP_NAME}.info"

# Cleanup old backups (keep last 10)
echo "🧹 Cleaning up old backups..."
cd "${BACKUP_DIR}"
BACKUP_COUNT=$(ls -1 *.tar.gz 2>/dev/null | wc -l)
if [ "${BACKUP_COUNT}" -gt 10 ]; then
    ls -t *.tar.gz | tail -n +11 | xargs rm -f
    ls -t *.info 2>/dev/null | tail -n +11 | xargs rm -f
    echo "   Removed old backups, keeping last 10"
else
    echo "   No cleanup needed (${BACKUP_COUNT} backups)"
fi

echo "✨ Backup process completed"

