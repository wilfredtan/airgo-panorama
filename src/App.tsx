import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { PanoramaImage, StoredPanoramaImage, BookmarkFilter, AnalyticsData } from './types';
import ImageUploader from './components/ImageUploader';
import ImageTable from './components/ImageTable';
import SearchBar from './components/SearchBar';
import FilterBar from './components/FilterBar';
import AnalyticsCharts from './components/AnalyticsCharts';
import PanoramaViewer from './components/PanoramaViewer';
import { API_BASE_URL } from './config';
import { queuedFetch } from './utils/apiQueue';

const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
`;

const ModalButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin: 5px;

  &:hover {
    background: #0056b3;
  }
`;

const DeleteModal = styled.div`
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

const DeleteModalContent = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 400px;
  text-align: center;
`;

const Header = styled.h1`
  color: #333;
  text-align: center;
  margin-bottom: 30px;
`;

const NavBar = styled.nav`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #ddd;
`;

const NavButton = styled.button<{ $active: boolean }>`
  background: none;
  color: ${props => props.$active ? '#007bff' : '#666'};
  border: none;
  border-bottom: ${props => props.$active ? '2px solid #007bff' : '2px solid transparent'};
  padding: 10px 20px;
  margin: 0 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: ${props => props.$active ? 'bold' : 'normal'};

  &:hover {
    color: #007bff;
  }
`;

const AppContent: React.FC = () => {
	const [images, setImages] = useState<PanoramaImage[]>([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [bookmarkFilter, setBookmarkFilter] = useState<BookmarkFilter>('all');
	const [viewingImage, setViewingImage] = useState<PanoramaImage | null>(null);
	const [deleteModal, setDeleteModal] = useState<string | null>(null);
	const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
	const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
	const [currentView, setCurrentView] = useState<'images' | 'analytics'>('images');
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);

	// Shared function to fetch images from GraphQL
	const fetchImages = async (search?: string, filter?: string, page: number = 1) => {
		try {
			const query = `
				query GetImages($search: String, $bookmarkFilter: String, $page: Int, $limit: Int) {
					images(search: $search, bookmarkFilter: $bookmarkFilter, page: $page, limit: $limit) {
						images {
							id
							name
							size
							width
							height
							fileType
							createdAt
							bookmarked
						}
						total
						page
						limit
						totalPages
					}
				}
			`;
			const response = await queuedFetch(`${API_BASE_URL}/graphql`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					query,
					variables: {
						search: search || searchTerm,
						bookmarkFilter: filter || (bookmarkFilter === 'all' ? undefined : bookmarkFilter),
						page,
						limit: 10,
					},
				}),
			});
			const result = await response.json();
			if (result.data && result.data.images) {
				const imageConnection = result.data.images;
				const parsedImages: PanoramaImage[] = imageConnection.images.map((img: {
					id: string;
					name: string;
					size: number;
					createdAt: string;
					width: number;
					height: number;
					fileType: string;
					bookmarked: boolean;
				}) => {
					const uploadDate = new Date(img.createdAt);
					return {
						id: img.id,
						name: img.name,
						url: `${API_BASE_URL}/api/images/${img.id}/download`,
						size: img.size,
						uploadDate: isNaN(uploadDate.getTime()) ? new Date(NaN) : uploadDate,
						bookmarked: img.bookmarked || false,
						width: img.width,
						height: img.height,
						fileType: img.fileType
					};
				});
				setImages(parsedImages);
				setTotalPages(imageConnection.totalPages);
			}
		} catch (error) {
			console.warn('Failed to load images from GraphQL:', error);
		}
	};

	// Shared function to fetch analytics from GraphQL
	const fetchAnalytics = async () => {
		try {
			const query = `
				query GetAnalytics {
					analytics {
						totalImages
						bookmarkedCount
						unbookmarkedCount
						totalSizeBookmarked
						totalSizeUnbookmarked
					}
				}
			`;
			const response = await queuedFetch(`${API_BASE_URL}/graphql`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					query,
				}),
			});
			const result = await response.json();
			if (result.data?.analytics) {
				setAnalytics(result.data.analytics);
			}
		} catch (error) {
			console.warn('Failed to fetch analytics:', error);
		}
	};

	// Load analytics on mount
	useEffect(() => {
		fetchAnalytics();
	}, []);

	// Load images from GraphQL on mount and when search/filter changes
	useEffect(() => {
		setCurrentPage(1);
		fetchImages(searchTerm, bookmarkFilter === 'all' ? undefined : bookmarkFilter, 1);
	}, [searchTerm, bookmarkFilter]);

	// Save images to localStorage whenever images change (only metadata for large images)
	useEffect(() => {
		try {
			const imagesToStore: StoredPanoramaImage[] = images.map(img => ({
				id: img.id,
				name: img.name,
				url: img.size > 1024 * 1024 ? '' : img.url, // Don't store large images (>1MB)
				size: img.size,
				uploadDate: img.uploadDate.toISOString(),
				bookmarked: img.bookmarked,
				width: img.width,
				height: img.height,
				fileType: img.fileType
			}));
			localStorage.setItem('panoramaImages', JSON.stringify(imagesToStore));
		} catch (error) {
			console.warn('Failed to save images to localStorage:', error);
		}
	}, [images]);

	// Load images from localStorage on mount
	useEffect(() => {
		try {
			const stored = localStorage.getItem('panoramaImages');
			if (stored) {
				const storedImages: StoredPanoramaImage[] = JSON.parse(stored);
				const loadedImages: PanoramaImage[] = storedImages.map(img => {
					const uploadDate = new Date(img.uploadDate);
					return {
						id: img.id,
						name: img.name,
						url: img.url,
						size: img.size,
						uploadDate: isNaN(uploadDate.getTime()) ? new Date(NaN) : uploadDate,
						bookmarked: img.bookmarked,
						width: img.width,
						height: img.height,
						fileType: img.fileType
					};
				});
				setImages(loadedImages);
			}
		} catch (error) {
			console.warn('Failed to load images from localStorage:', error);
		}
	}, []);

	const addImage = () => {
		fetchImages(searchTerm, bookmarkFilter === 'all' ? undefined : bookmarkFilter, currentPage);
		fetchAnalytics();
	};

	const toggleBookmark = async (id: string) => {
		const image = images.find(img => img.id === id);
		if (!image) return;

		const newBookmarkedState = !image.bookmarked;

		try {
			const mutation = `
				mutation BookmarkImage($id: ID!, $bookmarked: Boolean!) {
					bookmarkImage(id: $id, bookmarked: $bookmarked) {
						id
						bookmarked
					}
				}
			`;
			const response = await queuedFetch(`${API_BASE_URL}/graphql`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					query: mutation,
					variables: { id, bookmarked: newBookmarkedState },
				}),
			});

			if (response.ok) {
				const result = await response.json();
				if (result.data) {
					// Update local state
					setImages(prev => prev.map(img =>
						img.id === id ? { ...img, bookmarked: newBookmarkedState } : img
					));
				}
			} else {
				console.error('Failed to update bookmark status');
			}
		} catch (error) {
			console.error('Bookmark mutation error:', error);
		}
	};

	const deleteImage = (id: string) => {
		setDeleteModal(id);
	};

	const confirmDelete = async (id: string) => {
		setDeletingImageId(id);
		try {
			const mutation = `
				mutation DeleteImage($id: ID!) {
					deleteImage(id: $id) {
						success
						id
					}
				}
			`;
			const response = await queuedFetch(`${API_BASE_URL}/graphql`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					query: mutation,
					variables: { id },
				}),
			});

			if (response.ok) {
				const result = await response.json();
				if (result.data?.deleteImage?.success) {
					// Update local state
					setImages(prev => prev.filter(img => img.id !== id));
					fetchAnalytics();
				} else {
					console.error('Failed to delete image');
				}
			} else {
				console.error('Delete mutation error');
			}
		} catch (error) {
			console.error('Delete error:', error);
		} finally {
			setDeletingImageId(null);
		}
	};

	const downloadImage = (image: PanoramaImage) => {
		const link = document.createElement('a');
		link.href = image.url;
		link.download = image.name;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const viewPanorama = (image: PanoramaImage) => {
		setViewingImage(image);
	};

	const handleNext = () => {
		if (currentPage < totalPages) {
			const nextPage = currentPage + 1;
			setCurrentPage(nextPage);
			fetchImages(searchTerm, bookmarkFilter === 'all' ? undefined : bookmarkFilter, nextPage);
		}
	};

	const handleBack = () => {
		if (currentPage > 1) {
			const prevPage = currentPage - 1;
			setCurrentPage(prevPage);
			fetchImages(searchTerm, bookmarkFilter === 'all' ? undefined : bookmarkFilter, prevPage);
		}
	};

	const closePanoramaViewer = () => {
		setViewingImage(null);
	};

	return (
		<AppContainer>
			<Header>Panorama Image Manager</Header>

			<NavBar>
				<NavButton $active={currentView === 'images'} onClick={() => setCurrentView('images')}>
					Images
				</NavButton>
				<NavButton $active={currentView === 'analytics'} onClick={() => setCurrentView('analytics')}>
					Analytics
				</NavButton>
			</NavBar>

			{currentView === 'images' ? (
				<>
					<ImageUploader onImageUpload={addImage} />

					<SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

					<FilterBar
						bookmarkFilter={bookmarkFilter}
						onFilterChange={setBookmarkFilter}
					/>

					<ImageTable
						images={images}
						onToggleBookmark={toggleBookmark}
						onDelete={deleteImage}
						onDownload={downloadImage}
						onViewPanorama={viewPanorama}
						deletingImageId={deletingImageId}
						currentPage={currentPage}
						totalPages={totalPages}
						onNext={handleNext}
						onBack={handleBack}
					/>
				</>
			) : (
				<AnalyticsCharts analytics={analytics} />
			)}

			{viewingImage && (
				<PanoramaViewer
					imageUrl={viewingImage.url}
					imageName={viewingImage.name}
					onClose={closePanoramaViewer}
				/>
			)}

			{deleteModal && (
				<DeleteModal onClick={() => setDeleteModal(null)}>
					<DeleteModalContent onClick={(e) => e.stopPropagation()}>
						<h3>Delete Image</h3>
						<p>Are you sure you want to delete this image?</p>
						<ModalButton onClick={() => { confirmDelete(deleteModal); setDeleteModal(null); }}>Delete</ModalButton>
						<ModalButton onClick={() => setDeleteModal(null)}>Cancel</ModalButton>
					</DeleteModalContent>
				</DeleteModal>
			)}
		</AppContainer>
	);
};

const App: React.FC = () => (
		<AppContent />
);

export default App;
