import React from 'react';
import styled from 'styled-components';
import { PanoramaImage } from '../types';

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
`;

const TableWrapper = styled.div`
`;

const Th = styled.th`
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
  background-color: #f2f2f2;
`;

const Td = styled.td`
  border: 1px solid #ddd;
  padding: 12px;
`;

const ImagePreview = styled.img`
  width: 100px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'danger' }>`
  background: ${props => props.$variant === 'danger' ? '#dc3545' : '#28a745'};
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 5px;

  &:hover {
    background: ${props => props.$variant === 'danger' ? '#c82333' : '#218838'};
  }
`;

const BookmarkButton = styled.button<{ $bookmarked: boolean }>`
  background: ${props => props.$bookmarked ? '#ffc107' : '#6c757d'};
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 5px;

  &:hover {
    background: ${props => props.$bookmarked ? '#e0a800' : '#545b62'};
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  font-size: 16px;
  color: #666;

  &::before {
    content: '';
    width: 16px;
    height: 16px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 8px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

interface ImageTableProps {
  images: PanoramaImage[];
  onToggleBookmark: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (image: PanoramaImage) => void;
  onViewPanorama: (image: PanoramaImage) => void;
  deletingImageId: string | null;
  currentPage: number;
  totalPages: number;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
}

const ImageTable: React.FC<ImageTableProps> = ({
  images,
  onToggleBookmark,
  onDelete,
  onDownload,
  onViewPanorama,
  deletingImageId,
  currentPage,
  totalPages,
  onNext,
  onBack,
  loading
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <TableWrapper>
      <Table>
        <thead>
          <tr>
            <Th>Preview</Th>
            <Th>Name</Th>
            <Th>Size</Th>
            <Th>Dimensions</Th>
            <Th>Type</Th>
            <Th>Upload Date</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {images.map(image => (
            <tr key={image.id}>
              <Td>
                <ImagePreview
                  src={image.url}
                  alt={image.name}
                  onClick={() => onViewPanorama(image)}
                />
              </Td>
              <Td>{image.name}</Td>
              <Td>{formatFileSize(image.size)}</Td>
              <Td>
                {image.width && image.height ? `${image.width} x ${image.height}` : 'N/A'}
              </Td>
              <Td>{image.fileType}</Td>
              <Td>{formatDate(image.uploadDate)}</Td>
              <Td>
                <BookmarkButton
                  $bookmarked={image.bookmarked}
                  onClick={() => onToggleBookmark(image.id)}
                >
                  {image.bookmarked ? 'Bookmarked' : 'Bookmark'}
                </BookmarkButton>
                <ActionButton onClick={() => onDownload(image)}>
                  Download
                </ActionButton>
                <ActionButton $variant="danger" onClick={() => onDelete(image.id)} disabled={deletingImageId === image.id}>
                  {deletingImageId === image.id ? 'Deleting...' : 'Delete'}
                </ActionButton>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {loading && <LoadingSpinner>Loading images...</LoadingSpinner>}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
        {currentPage > 1 && (
          <ActionButton onClick={onBack}>
            Back
          </ActionButton>
        )}
        <span style={{ margin: '0 20px', alignSelf: 'center' }}>
          Page {currentPage} of {totalPages}
        </span>
        {currentPage < totalPages && (
          <ActionButton onClick={onNext}>
            Next
          </ActionButton>
        )}
      </div>
    </TableWrapper>
  );
};

export default ImageTable;
