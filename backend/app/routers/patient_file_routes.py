from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Cookie,
    UploadFile,
    File,
    Form,
)
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Set
from db import get_session
from db.crud import auth_crud, patient_file_crud, appointment_crud, appointment_request_crud
from db.models.patient_file_model import FileBatchCategory
from schemas import (
    FileBatchRead,
    FileBatchCreate,
    PatientFileRead,
    FileBatchWithFiles,
    ShareableDoctor,
    ShareBatchRequest,
    FileBatchShareRead,
)
from services import verify_access_token, get_storage_service
from datetime import datetime
import uuid
import os

router = APIRouter()


async def get_current_patient(
    access_token: str = Cookie(None), session: AsyncSession = Depends(get_session)
):
    """Get current authenticated patient user"""
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    payload = await verify_access_token(access_token)
    user_id = int(payload.get("sub"))

    user = await auth_crud.get_user_by_id(user_id, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    
    # Verify user is a patient
    if not user.is_patient:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only accessible to patients"
        )

    return user


@router.get("/shareable-doctors", response_model=List[ShareableDoctor])
async def get_shareable_doctors(
    current_user=Depends(get_current_patient),
    session: AsyncSession = Depends(get_session)
):
    """Return doctors the patient currently has confirmed appointments or pending requests with."""
    doctors = await patient_file_crud.list_shareable_doctors(
        patient_user_id=current_user.id,
        session=session,
    )
    return doctors


@router.post("/", response_model=FileBatchWithFiles)
async def upload_files(
    category: str = Form(...),
    heading: Optional[str] = Form(None),
    files: List[UploadFile] = File(...),
    current_user=Depends(get_current_patient),
    session: AsyncSession = Depends(get_session)
):
    """
    Upload multiple files as a batch.
    
    Process:
    1. Validate all files (type, size)
    2. Create batch in database
    3. Upload files one by one to storage and get URLs
    4. Store file records in database with URLs
    """
    print(f"Upload request received - category: {category}, user_id: {current_user.id}, file_count: {len(files) if files else 0}")
    
    # Validate category
    if category not in ["insurance", "lab_report"]:
        print(f"Invalid category: {category}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category: '{category}'. Must be 'insurance' or 'lab_report'"
        )
    
    # Validate at least one file
    if not files or len(files) == 0:
        print("No files provided")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one file is required"
        )
    
    # Validate file types (images, PDFs)
    allowed_types = [
        "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
        "application/pdf"
    ]
    
    # Validate file sizes (max 10MB per file)
    max_file_size = 10 * 1024 * 1024  # 10MB
    
    # Store file contents after validation to avoid reading twice
    file_contents = []
    for file in files:
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type for {file.filename}. Allowed types: images (JPEG, PNG, WebP, GIF) and PDF"
            )
        
        # Read file content once and store it
        file_content = await file.read()
        
        if len(file_content) > max_file_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File {file.filename} exceeds 10MB limit"
            )
        
        # Store content and metadata for later use
        file_contents.append({
            "content": file_content,
            "filename": file.filename or "unknown",
            "content_type": file.content_type,
            "size": len(file_content)
        })
    
    try:
        print(f"Initializing storage service for category: {category}")
        try:
            storage_service = get_storage_service()
        except HTTPException as storage_init_error:
            # Re-raise HTTPException as-is
            raise storage_init_error
        except Exception as storage_init_error:
            # Wrap other exceptions in HTTPException
            error_message = str(storage_init_error)
            print(f"✗ Storage service initialization failed: {error_message}")
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Storage service initialization failed: {error_message}. Please check GCP configuration."
            ) from storage_init_error
        
        # STEP 1: Create batch in database first to get the batch ID
        # We'll use this ID in storage paths for organization
        print(f"Creating file batch in database for user {current_user.id}, category: {category}, heading: {heading}")
        try:
            batch = await patient_file_crud.create_file_batch(
                patient_user_id=current_user.id,
                category=category,
                heading=heading,
                session=session
            )
            print(f"✓ File batch created successfully with ID: {batch.id}")
        except Exception as db_error:
            import traceback
            error_trace = traceback.format_exc()
            print(f"✗ Error creating file batch in database: {error_trace}")
            error_message = str(db_error)
            
            # Check if it's a table/type missing error
            if "does not exist" in error_message.lower() or "relation" in error_message.lower():
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Database tables not found. Please run the migration: backend/migrations/create_file_batches_and_patient_files.sql. Error: {error_message}"
                )
            elif "enum" in error_message.lower() or "type" in error_message.lower():
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Database enum type 'file_batch_category' not found. Please run the migration: backend/migrations/create_file_batches_and_patient_files.sql. Error: {error_message}"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to create file batch in database: {error_message}"
                )
        
        # STEP 2: Upload all files to storage one by one and get URLs
        uploaded_file_urls = []
        uploaded_file_paths = []  # Store paths for cleanup if needed
        
        print(f"Starting file uploads to storage for batch {batch.id}")
        for idx, file_data in enumerate(file_contents):
            try:
                filename = file_data["filename"]
                file_content = file_data["content"]
                content_type = file_data["content_type"]
                file_size = file_data["size"]
                
                print(f"Uploading file {idx + 1}/{len(file_contents)} to storage: {filename} (type: {content_type}, size: {file_size} bytes)")
                
                # Generate unique file path with actual batch ID
                file_extension = os.path.splitext(filename)[1]
                unique_filename = f"{uuid.uuid4()}{file_extension}"
                destination_path = f"patient-files/{current_user.id}/{category}/{batch.id}/{unique_filename}"
                
                # Upload to GCP Storage
                file_url = await storage_service.upload_file(
                    file_content=file_content,
                    destination_path=destination_path,
                    content_type=content_type
                )
                print(f"✓ File {idx + 1} uploaded successfully to: {file_url}")
                
                # Store URL and metadata for database insertion
                uploaded_file_urls.append({
                    "filename": filename,
                    "file_url": file_url,
                    "content_type": content_type,
                    "size": file_size,
                    "storage_path": destination_path
                })
                uploaded_file_paths.append(destination_path)
                
            except Exception as file_error:
                import traceback
                error_trace = traceback.format_exc()
                print(f"✗ Error uploading file {file_data.get('filename', 'unknown')} to storage: {error_trace}")
                
                # Rollback the batch creation
                await session.rollback()
                try:
                    await patient_file_crud.delete_file_batch(batch.id, current_user.id, session)
                except:
                    pass
                
                # Clean up any successfully uploaded files
                print("Cleaning up partially uploaded files...")
                for path in uploaded_file_paths:
                    try:
                        await storage_service.delete_file(path)
                        print(f"Deleted file: {path}")
                    except Exception as cleanup_error:
                        print(f"Warning: Failed to cleanup file {path}: {cleanup_error}")
                
                error_message = str(file_error)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to upload file {file_data.get('filename', 'unknown')} to storage: {error_message}"
                )
        
        print(f"✓ All {len(uploaded_file_urls)} files uploaded successfully to storage")
        
        # STEP 3: Create database records for all files with their URLs
        uploaded_files = []
        for idx, file_info in enumerate(uploaded_file_urls):
            try:
                # Save file record to database
                patient_file = await patient_file_crud.create_patient_file(
                    file_batch_id=batch.id,
                    file_name=file_info["filename"],
                    file_url=file_info["file_url"],
                    file_type=file_info["content_type"],
                    file_size=file_info["size"],
                    session=session
                )
                print(f"✓ File record {idx + 1} saved to database with ID: {patient_file.id}")
                
                uploaded_files.append({
                    "id": patient_file.id,
                    "file_name": patient_file.file_name,
                    "file_url": patient_file.file_url,
                    "file_type": patient_file.file_type,
                    "file_size": patient_file.file_size,
                    "created_at": patient_file.created_at.isoformat(),
                })
                
            except Exception as db_error:
                import traceback
                error_trace = traceback.format_exc()
                print(f"✗ Error saving file {file_info.get('filename', 'unknown')} to database: {error_trace}")
                
                # Rollback database transaction
                await session.rollback()
                
                # Clean up all uploaded files from storage
                print("Cleaning up all uploaded files from storage...")
                for path in uploaded_file_paths:
                    try:
                        await storage_service.delete_file(path)
                        print(f"Deleted file: {path}")
                    except Exception as cleanup_error:
                        print(f"Warning: Failed to cleanup file {path}: {cleanup_error}")
                
                error_message = str(db_error)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to save file {file_info.get('filename', 'unknown')} to database: {error_message}"
                )
        
        print(f"✓ Successfully created batch {batch.id} with {len(uploaded_files)} files")
        
        # Return batch with files
        return {
            "id": batch.id,
            "patient_user_id": batch.patient_user_id,
            "category": batch.category,
            "heading": batch.heading,
            "created_at": batch.created_at.isoformat(),
            "updated_at": batch.updated_at.isoformat(),
            "files": uploaded_files,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Upload error: {error_trace}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload files: {str(e)}"
        )


@router.get("/", response_model=List[FileBatchWithFiles])
async def list_file_batches(
    category: Optional[str] = None,
    current_user=Depends(get_current_patient),
    session: AsyncSession = Depends(get_session)
):
    """List all file batches for the current patient, optionally filtered by category"""
    # Validate category if provided
    if category and category not in ["insurance", "lab_report"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid category. Must be 'insurance' or 'lab_report'"
        )
    
    batches = await patient_file_crud.list_file_batches(
        patient_user_id=current_user.id,
        category=category,
        session=session
    )
    
    # Convert to response format
    result = []
    for batch in batches:
        result.append({
            "id": batch.id,
            "patient_user_id": batch.patient_user_id,
            "category": batch.category,
            "heading": batch.heading,
            "created_at": batch.created_at.isoformat(),
            "updated_at": batch.updated_at.isoformat(),
            "files": [
                {
                    "id": file.id,
                    "file_name": file.file_name,
                    "file_url": file.file_url,
                    "file_type": file.file_type,
                    "file_size": file.file_size,
                    "created_at": file.created_at.isoformat(),
                }
                for file in sorted(batch.files, key=lambda f: f.created_at, reverse=True)
            ]
        })
    
    return result


@router.get("/{batch_id}", response_model=FileBatchWithFiles)
async def get_file_batch(
    batch_id: int,
    current_user=Depends(get_current_patient),
    session: AsyncSession = Depends(get_session)
):
    """Get a specific file batch with its files"""
    batch_data = await patient_file_crud.get_file_batch_with_files(
        batch_id=batch_id,
        patient_user_id=current_user.id,
        session=session
    )
    
    if not batch_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File batch not found"
        )
    
    return batch_data


@router.post("/{batch_id}/share", response_model=List[FileBatchShareRead])
async def share_file_batch(
    batch_id: int,
    request: ShareBatchRequest,
    current_user=Depends(get_current_patient),
    session: AsyncSession = Depends(get_session)
):
    """Share a lab report batch with one or more doctors."""
    if not request.doctor_targets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please select at least one doctor to share with",
        )

    batch = await patient_file_crud.get_file_batch(
        batch_id=batch_id,
        patient_user_id=current_user.id,
        session=session,
    )
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File batch not found",
        )
    if batch.category != FileBatchCategory.lab_report:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only lab report batches can be shared with doctors",
        )

    created_shares = []
    processed_doctors: Set[int] = set()

    for target in request.doctor_targets:
        if target.doctor_user_id in processed_doctors:
            continue
        processed_doctors.add(target.doctor_user_id)

        doctor_user = await auth_crud.get_user_by_id(target.doctor_user_id, session)
        if not doctor_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Doctor {target.doctor_user_id} not found",
            )

        role_value = (
            doctor_user.role.value
            if hasattr(doctor_user.role, "value")
            else str(doctor_user.role) if doctor_user.role else None
        )
        if role_value != "doctor":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reports can only be shared with doctor accounts",
            )

        appointment = None
        appointment_request = None
        if target.appointment_id:
            appointment = await appointment_crud.get_appointment_by_id(
                session=session,
                appointment_id=target.appointment_id,
            )
            if (
                not appointment
                or appointment.patient_user_id != current_user.id
                or appointment.doctor_user_id != doctor_user.id
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid appointment reference supplied",
                )
        elif target.appointment_request_id:
            appointment_request = await appointment_request_crud.get_appointment_request_by_id(
                session=session,
                request_id=target.appointment_request_id,
            )
            if (
                not appointment_request
                or appointment_request.patient_user_id != current_user.id
                or appointment_request.doctor_user_id != doctor_user.id
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid appointment request reference supplied",
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing appointment or appointment request reference",
            )

        share = await patient_file_crud.upsert_file_batch_share(
            file_batch_id=batch.id,
            patient_user_id=current_user.id,
            doctor_user_id=doctor_user.id,
            appointment_id=appointment.appointment_id if appointment else None,
            appointment_request_id=appointment_request.request_id if appointment_request else None,
            session=session,
        )
        share_with_relations = await patient_file_crud.get_file_batch_share_by_id(
            share.id,
            session=session,
        )
        if share_with_relations:
            created_shares.append(patient_file_crud.serialize_file_batch_share(share_with_relations))

    if not created_shares:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No unique doctors selected to share with",
        )

    return created_shares


@router.delete("/{batch_id}")
async def delete_file_batch(
    batch_id: int,
    current_user=Depends(get_current_patient),
    session: AsyncSession = Depends(get_session)
):
    """Delete a file batch and all its files"""
    # Get batch to extract file paths for deletion from storage
    batch = await patient_file_crud.get_file_batch(
        batch_id=batch_id,
        patient_user_id=current_user.id,
        session=session
    )
    
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File batch not found"
        )
    
    try:
        storage_service = get_storage_service()
        
        # Delete files from storage
        for file in batch.files:
            file_path = storage_service.extract_file_path_from_url(file.file_url)
            if file_path:
                await storage_service.delete_file(file_path)
        
        # Delete batch from database (cascade will delete files)
        deleted = await patient_file_crud.delete_file_batch(
            batch_id=batch_id,
            patient_user_id=current_user.id,
            session=session
        )
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File batch not found"
            )
        
        return {"message": "File batch deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file batch: {str(e)}"
        )


@router.delete("/files/{file_id}")
async def delete_file(
    file_id: int,
    current_user=Depends(get_current_patient),
    session: AsyncSession = Depends(get_session)
):
    """Delete a single file"""
    # Get file to extract path for deletion from storage
    file = await patient_file_crud.get_patient_file(
        file_id=file_id,
        patient_user_id=current_user.id,
        session=session
    )
    
    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    try:
        storage_service = get_storage_service()
        
        # Delete file from storage
        file_path = storage_service.extract_file_path_from_url(file.file_url)
        if file_path:
            await storage_service.delete_file(file_path)
        
        # Delete file from database
        deleted = await patient_file_crud.delete_patient_file(
            file_id=file_id,
            patient_user_id=current_user.id,
            session=session
        )
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        return {"message": "File deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}"
        )

