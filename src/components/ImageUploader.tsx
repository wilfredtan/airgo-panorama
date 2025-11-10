import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { API_BASE_URL } from '../config';

/* global FormData, fetch */

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
        const formData = new FormData();
        formData.append('image', file);

        try {
          const response = await fetch(`${API_BASE_URL}/api/images/upload`, {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            onImageUpload();
          } else {
            const errorData = await response.json();
            setErrorMessage(`Upload failed for "${file.name}": ${errorData.error}`);
          }
        } catch {
          setErrorMessage(`Upload failed for "${file.name}": Network error`);
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
