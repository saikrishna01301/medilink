"""
GCP Cloud Storage service for file upload/download operations
"""
import os
from typing import Optional, BinaryIO
from google.cloud import storage
from google.cloud.exceptions import NotFound
from core import config
import asyncio
from fastapi import UploadFile, HTTPException, status


class StorageService:
    """Service for interacting with GCP Cloud Storage"""
    
    def __init__(self):
        self.bucket_name = config.GCP_BUCKET_NAME
        self.project_id = config.GCP_PROJECT_ID
        
        # Initialize storage client
        if config.USE_DEFAULT_CREDENTIALS:
            # Use default credentials (for GCP environments)
            self.client = storage.Client(project=self.project_id)
        elif config.GCP_STORAGE_KEY_FILE and os.path.exists(config.GCP_STORAGE_KEY_FILE):
            # Use service account key file
            self.client = storage.Client.from_service_account_json(
                config.GCP_STORAGE_KEY_FILE,
                project=self.project_id
            )
        else:
            # Try default credentials as fallback
            self.client = storage.Client(project=self.project_id)
        
        self.bucket = None
        self._ensure_bucket()
    
    def _ensure_bucket(self):
        """Ensure bucket exists, create if it doesn't"""
        try:
            self.bucket = self.client.bucket(self.bucket_name)
            # Try to get bucket metadata to verify it exists
            self.bucket.reload()
        except NotFound:
            # Bucket doesn't exist, create it
            if self.project_id:
                self.bucket = self.client.create_bucket(self.bucket_name, project=self.project_id)
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Bucket {self.bucket_name} not found and project_id not configured"
                )
    
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
        _storage_service = StorageService()
    return _storage_service

