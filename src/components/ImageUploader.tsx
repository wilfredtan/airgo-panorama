import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { API_BASE_URL } from '../config';
import { queuedFetch } from '../utils/apiQueue';

/* global FormData, File, fetch */

const UploadContainer = styled.div`
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  margin-bottom: 20px;
  cursor: pointer;
  transition: border-color 0.3s;

  &:hover {
    border-color: #007bff;
  }
`;

const UploadButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background: #0056b3;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 400px;
  text-align: center;
`;

const ModalButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 15px;

  &:hover {
    background: #0056b3;
  }
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  margin-top: 10px;
  color: #666;
`;

interface ImageUploaderProps {
  onImageUpload: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get presigned URL from backend
  const getPresignedUrl = async (fileName: string, fileType: string, fileSize: number) => {
    const response = await queuedFetch(`${API_BASE_URL}/api/images/presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName,
        fileType,
        fileSize,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get upload URL');
    }

    return response.json();
  };

  // Upload file - either to S3 via presigned URL or to local API
  const uploadFile = async (presignedUrl: string, file: File, isLocal: boolean) => {
    if (isLocal) {
      // For local development, upload to the local API endpoint
      const formData = new FormData();
      formData.append('file', file);
      formData.append('originalName', file.name);
      formData.append('size', file.size.toString());
      formData.append('type', file.type);

      const response = await fetch(`${API_BASE_URL}${presignedUrl}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload to local API');
      }

      return await response.json();
    } else {
      // For cloud deployment, upload directly to S3 using presigned URL
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to upload to S3');
      }

      return { success: true };
    }
  };

  // Notify backend that upload is complete (for cloud deployments)
  const completeUpload = async (key: string, bucket: string, originalFile: File) => {
    const response = await queuedFetch(`${API_BASE_URL}/api/images/complete-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key,
        bucket,
        originalName: originalFile.name,
        size: originalFile.size,
        type: originalFile.type,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to complete upload');
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    let processedCount = 0;
    const totalFiles = files.length;

    const checkComplete = () => {
      processedCount++;
      if (processedCount === totalFiles) {
        setIsLoading(false);
      }
    };

    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        try {
          // Use presigned URL upload for all files
          const { presignedUrl, key, bucket, isLocal } = await getPresignedUrl(file.name, file.type, file.size);

          if (isLocal) {
            // For local uploads, the uploadFile function handles everything including database storage
            await uploadFile(presignedUrl, file, true);
          } else {
            // For cloud uploads, upload to S3 first, then complete the upload
            await uploadFile(presignedUrl, file, false);
            await completeUpload(key, bucket, file);
          }

          onImageUpload();
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Upload failed';
          setErrorMessage(`Upload failed for "${file.name}": ${errorMsg}`);
        }
      }
      checkComplete();
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const closeModal = () => {
    setErrorMessage(null);
  };

  return (
    <>
      <UploadContainer
        onClick={isLoading ? undefined : handleFileSelect}
        style={{ opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
      >
        {isLoading ? (
          <>
            <LoadingSpinner />
            <LoadingText>Processing images...</LoadingText>
          </>
        ) : (
          <>
            <p>Click to upload panorama images</p>
            <UploadButton type="button">Choose Files</UploadButton>
          </>
        )}
        <HiddenInput
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          disabled={isLoading}
        />
      </UploadContainer>

      {errorMessage && (
        <Modal onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h3>Invalid Image</h3>
            <p>{errorMessage}</p>
            <ModalButton onClick={closeModal}>OK</ModalButton>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

export default ImageUploader;
