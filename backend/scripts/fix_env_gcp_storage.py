"""
Add GCP_STORAGE_KEY_FILE to .env file if it's missing
"""
from pathlib import Path
import sys

backend_dir = Path(__file__).parent.parent
env_file = backend_dir / ".env"
root_dir = backend_dir.parent

# Check if key files exist
bucket_key = root_dir / "gcp-bucket-key.json"
gcp_key = root_dir / "gcp-key.json"

key_file_to_use = None
if bucket_key.exists():
    key_file_to_use = str(bucket_key.absolute())
    print(f"[OK] Found gcp-bucket-key.json at: {key_file_to_use}")
elif gcp_key.exists():
    key_file_to_use = str(gcp_key.absolute())
    print(f"[OK] Found gcp-key.json at: {key_file_to_use}")
else:
    print("[ERROR] No GCP key files found in project root!")
    print("  Expected: gcp-bucket-key.json or gcp-key.json")
    sys.exit(1)

# Read .env file
if not env_file.exists():
    print(f"[ERROR] .env file not found at: {env_file}")
    sys.exit(1)

try:
    content = env_file.read_text(encoding='utf-8-sig')
except Exception as e:
    print(f"[ERROR] Failed to read .env file: {e}")
    sys.exit(1)

# Check if GCP_STORAGE_KEY_FILE already exists
lines = content.splitlines()
has_gcp_storage_key = any('GCP_STORAGE_KEY_FILE' in line for line in lines)

if has_gcp_storage_key:
    print("[INFO] GCP_STORAGE_KEY_FILE already exists in .env file")
    # Update it if it's commented out or has wrong path
    updated_lines = []
    for line in lines:
        if 'GCP_STORAGE_KEY_FILE' in line and not line.strip().startswith('#'):
            # Update existing line
            updated_lines.append(f'GCP_STORAGE_KEY_FILE="{key_file_to_use}"')
            print(f"[INFO] Updated existing GCP_STORAGE_KEY_FILE line")
        else:
            updated_lines.append(line)
    content = '\n'.join(updated_lines)
else:
    # Find where to add it (after other GCP Storage config)
    insert_index = -1
    for i, line in enumerate(lines):
        if 'GCP_PROJECT_ID' in line:
            insert_index = i + 1
            break
    
    if insert_index == -1:
        # Add at the end of GCP Storage Configuration section
        for i, line in enumerate(lines):
            if '# GCP Storage Configuration' in line:
                insert_index = i + 1
                # Find the next section or end
                for j in range(i + 1, len(lines)):
                    if lines[j].strip().startswith('#') and 'Configuration' in lines[j]:
                        insert_index = j
                        break
                break
    
    if insert_index == -1:
        insert_index = len(lines)
    
    # Add the new line
    lines.insert(insert_index, f'GCP_STORAGE_KEY_FILE="{key_file_to_use}"')
    content = '\n'.join(lines)
    print(f"[OK] Added GCP_STORAGE_KEY_FILE to .env file")

# Write back to file
try:
    # Preserve original encoding (with BOM if it had one)
    env_file.write_text(content, encoding='utf-8-sig')
    print(f"[OK] Successfully updated .env file: {env_file}")
    print(f"\nGCP_STORAGE_KEY_FILE is now set to: {key_file_to_use}")
except Exception as e:
    print(f"[ERROR] Failed to write .env file: {e}")
    sys.exit(1)

