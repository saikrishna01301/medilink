"""
Check environment configuration for GCP Storage
"""
import os
import sys
from pathlib import Path

# Add parent directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv

# Load .env file if it exists
env_path = backend_dir / ".env"
if env_path.exists():
    load_dotenv(env_path)
    print(f"[OK] Loaded .env file from: {env_path}")
else:
    print(f"[WARN] No .env file found at: {env_path}")
    print("  Loading environment variables from system...")

print("\n" + "=" * 60)
print("GCP Storage Configuration Check")
print("=" * 60)

# Check GCP configuration
gcp_bucket_name = os.getenv("GCP_BUCKET_NAME", "")
gcp_project_id = os.getenv("GCP_PROJECT_ID", "")
gcp_storage_key_file = os.getenv("GCP_STORAGE_KEY_FILE", "")
use_default_credentials = os.getenv("USE_DEFAULT_CREDENTIALS", "false").lower() == "true"

print(f"\n1. GCP_BUCKET_NAME: {gcp_bucket_name if gcp_bucket_name else '[X] NOT SET'}")
print(f"2. GCP_PROJECT_ID: {gcp_project_id if gcp_project_id else '[X] NOT SET'}")
print(f"3. USE_DEFAULT_CREDENTIALS: {use_default_credentials}")

if gcp_storage_key_file:
    print(f"4. GCP_STORAGE_KEY_FILE: {gcp_storage_key_file}")
    key_file_path = Path(gcp_storage_key_file)
    if key_file_path.exists():
        print(f"   [OK] Key file exists at: {key_file_path.absolute()}")
    else:
        # Try relative to backend directory
        relative_path = backend_dir / gcp_storage_key_file
        if relative_path.exists():
            print(f"   [WARN] Key file not found at absolute path, but found at: {relative_path.absolute()}")
            print(f"   [TIP] Consider updating GCP_STORAGE_KEY_FILE to: {relative_path.absolute()}")
        else:
            print(f"   [X] Key file NOT FOUND at: {key_file_path.absolute()}")
else:
    print(f"4. GCP_STORAGE_KEY_FILE: [X] NOT SET")

# Check for key files in root directory
root_dir = backend_dir.parent
print(f"\n5. Checking for key files in project root ({root_dir}):")
key_files = ["gcp-bucket-key.json", "gcp-key.json"]
for key_file in key_files:
    key_path = root_dir / key_file
    if key_path.exists():
        print(f"   [OK] Found: {key_file} at {key_path.absolute()}")
        if not gcp_storage_key_file:
            print(f"      [TIP] You can set GCP_STORAGE_KEY_FILE={key_path.absolute()} in .env")
    else:
        print(f"   - Not found: {key_file}")

print("\n" + "=" * 60)
print("Summary:")
print("=" * 60)

all_ok = True
if not gcp_bucket_name:
    print("[X] GCP_BUCKET_NAME is required")
    all_ok = False
if not gcp_project_id:
    print("[X] GCP_PROJECT_ID is required")
    all_ok = False

if not use_default_credentials:
    if not gcp_storage_key_file:
        print("[X] Either GCP_STORAGE_KEY_FILE must be set or USE_DEFAULT_CREDENTIALS=true")
        all_ok = False
    elif not Path(gcp_storage_key_file).exists() and not (backend_dir / gcp_storage_key_file).exists():
        print("[X] GCP_STORAGE_KEY_FILE points to a non-existent file")
        all_ok = False

if all_ok:
    print("[OK] All required configuration is set!")
    print("\nTo test the storage connection, run:")
    print("  python backend/test_gcp_storage.py")
else:
    print("\n[WARN] Some configuration is missing. Please check the errors above.")
    print("\nExample .env configuration:")
    print("  GCP_BUCKET_NAME=your-bucket-name")
    print("  GCP_PROJECT_ID=your-project-id")
    print("  GCP_STORAGE_KEY_FILE=../gcp-bucket-key.json")
    print("  USE_DEFAULT_CREDENTIALS=false")

sys.exit(0 if all_ok else 1)

