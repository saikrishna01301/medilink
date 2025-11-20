"""
GCP Cloud Storage service for file upload/download operations
"""
import asyncio
from typing import Optional

from fastapi import HTTPException, UploadFile, status
from google.cloud import storage
from google.cloud.exceptions import NotFound

from core import config
from core.gcp_credentials import (
    build_service_account_credentials,
    ensure_application_default_credentials,
)


class StorageService:
    """Service for interacting with GCP Cloud Storage"""
    
    def __init__(self):
        self.bucket_name = config.GCP_BUCKET_NAME
        self.project_id = config.GCP_PROJECT_ID
        
        # Validate required configuration
        if not self.bucket_name:
            raise ValueError(
                "GCP_BUCKET_NAME environment variable is not set. "
                "Please set it in your .env file or environment variables."
            )
        
        if not self.project_id:
            raise ValueError(
                "GCP_PROJECT_ID environment variable is not set. "
                "Please set it in your .env file or environment variables."
            )
        
        # Initialize storage client
        try:
            credentials = build_service_account_credentials(
                config.GCP_STORAGE_KEY_JSON,
                config.GCP_STORAGE_KEY_FILE,
            )

            if credentials:
                self.client = storage.Client(
                    project=self.project_id,
                    credentials=credentials,
                )
            elif config.USE_DEFAULT_CREDENTIALS or config.GOOGLE_APPLICATION_CREDENTIALS_JSON:
                ensure_application_default_credentials(
                    config.GOOGLE_APPLICATION_CREDENTIALS_JSON,
                    config.GCP_STORAGE_KEY_FILE,
                )
                self.client = storage.Client(project=self.project_id)
            else:
                raise ValueError(
                    "GCP storage credentials not configured. "
                    "Set GCP_STORAGE_KEY_JSON (preferred), provide GCP_STORAGE_KEY_FILE, "
                    "or enable USE_DEFAULT_CREDENTIALS along with GOOGLE_APPLICATION_CREDENTIALS_JSON."
                )
        except Exception as e:
            raise ValueError(
                f"Failed to initialize GCP Storage client: {str(e)}. "
                "Please ensure GCP credentials are properly configured. "
                "Provide GCP_STORAGE_KEY_JSON (recommended) or set USE_DEFAULT_CREDENTIALS=true."
            ) from e
        
        self.bucket = None
        self._ensure_bucket()
    
    def _ensure_bucket(self):
        """Ensure bucket exists, create if it doesn't"""
        try:
            self.bucket = self.client.bucket(self.bucket_name)
            # Try to get bucket metadata to verify it exists
            self.bucket.reload()
            print(f"✓ GCP Storage bucket '{self.bucket_name}' is accessible")
        except NotFound:
            # Bucket doesn't exist, try to create it
            if self.project_id:
                try:
                    print(f"Bucket '{self.bucket_name}' not found, attempting to create it...")
                    self.bucket = self.client.create_bucket(self.bucket_name, project=self.project_id)
                    print(f"✓ Created bucket '{self.bucket_name}'")
                except Exception as create_error:
                    raise ValueError(
                        f"Bucket '{self.bucket_name}' not found and failed to create it: {str(create_error)}. "
                        f"Please ensure the bucket exists in GCP Cloud Storage or you have permissions to create it."
                    ) from create_error
            else:
                raise ValueError(
                    f"Bucket '{self.bucket_name}' not found and GCP_PROJECT_ID is not configured. "
                    f"Cannot create bucket without project ID."
                )
        except Exception as e:
            raise ValueError(
                f"Failed to access GCP Storage bucket '{self.bucket_name}': {str(e)}. "
                f"Please verify the bucket name and your GCP credentials/permissions."
            ) from e
    
    async def upload_file(
        self,
        file_content: bytes,
        destination_path: str,
        content_type: Optional[str] = None
    ) -> str:
        """
        Upload a file to GCP Storage
        
        Args:
            file_content: File content as bytes
            destination_path: Path where file should be stored in bucket
            content_type: MIME type of the file (optional)
        
        Returns:
            Public URL of the uploaded file
        """
        try:
            blob = self.bucket.blob(destination_path)
            
            # Set content type if provided
            if content_type:
                blob.content_type = content_type
            
            # Upload file content
            await asyncio.to_thread(blob.upload_from_string, file_content, content_type=content_type)
            
            # For uniform bucket-level access, we don't use make_public()
            # Instead, we construct the public URL directly
            # The bucket should be configured for public access via IAM if needed
            # URL format: https://storage.googleapis.com/bucket-name/path/to/file
            # Note: GCP Storage URLs work with unencoded paths for most characters
            # Only encode spaces and special characters that need it
            public_url = f"https://storage.googleapis.com/{self.bucket_name}/{destination_path}"
            
            return public_url
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload file: {str(e)}"
            )
    
    async def download_file(self, file_path: str) -> bytes:
        """
        Download a file from GCP Storage
        
        Args:
            file_path: Path of the file in bucket
        
        Returns:
            File content as bytes
        """
        try:
            blob = self.bucket.blob(file_path)
            if not blob.exists():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"File not found: {file_path}"
                )
            
            content = await asyncio.to_thread(blob.download_as_bytes)
            return content
        except NotFound:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File not found: {file_path}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to download file: {str(e)}"
            )
    
    async def delete_file(self, file_path: str) -> bool:
        """
        Delete a file from GCP Storage
        
        Args:
            file_path: Path of the file in bucket
        
        Returns:
            True if deleted successfully
        """
        try:
            blob = self.bucket.blob(file_path)
            if blob.exists():
                await asyncio.to_thread(blob.delete)
                return True
            return False
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete file: {str(e)}"
            )
    
    async def file_exists(self, file_path: str) -> bool:
        """Check if a file exists in the bucket"""
        try:
            blob = self.bucket.blob(file_path)
            return await asyncio.to_thread(blob.exists)
        except Exception:
            return False
    
    def get_public_url(self, file_path: str) -> str:
        """Get public URL for a file in the bucket"""
        # For uniform bucket-level access, construct URL directly
        return f"https://storage.googleapis.com/{self.bucket_name}/{file_path}"
    
    async def delete_files_by_prefix(self, prefix: str) -> int:
        """
        Delete all files with a given prefix (e.g., all files in a directory)
        
        Args:
            prefix: Prefix/path prefix to match (e.g., "doctor-profiles/1/")
        
        Returns:
            Number of files deleted
        """
        try:
            # list_blobs is synchronous, so we run it in a thread
            blobs = await asyncio.to_thread(lambda: list(self.bucket.list_blobs(prefix=prefix)))
            deleted_count = 0
            for blob in blobs:
                try:
                    await asyncio.to_thread(blob.delete)
                    deleted_count += 1
                except Exception as e:
                    print(f"Warning: Failed to delete blob {blob.name}: {e}")
            return deleted_count
        except Exception as e:
            print(f"Warning: Failed to list/delete files with prefix {prefix}: {e}")
            return 0
    
    def extract_file_path_from_url(self, url: str) -> Optional[str]:
        """
        Extract file path from GCP Storage public URL
        
        Args:
            url: Public URL like https://storage.googleapis.com/bucket-name/path/to/file
        
        Returns:
            File path in bucket or None if URL format is invalid
        """
        if "storage.googleapis.com" not in url:
            return None
        
        try:
            # URL format: https://storage.googleapis.com/bucket-name/path/to/file
            parts = url.split("/")
            bucket_index = parts.index("storage.googleapis.com") + 1
            
            if bucket_index < len(parts):
                # Get everything after bucket name
                file_path = "/".join(parts[bucket_index + 1:])
                # URL decode the path in case it was encoded
                from urllib.parse import unquote
                decoded_path = unquote(file_path)
                return decoded_path
        except (ValueError, IndexError):
            pass
        
        return None


# Global storage service instance
_storage_service: Optional[StorageService] = None


def get_storage_service() -> StorageService:
    """Get or create storage service instance"""
    global _storage_service
    if _storage_service is None:
        try:
            _storage_service = StorageService()
        except (ValueError, Exception) as e:
            # Reset the global instance so it can be retried
            _storage_service = None
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Storage service initialization failed: {str(e)}"
            ) from e
    return _storage_service

