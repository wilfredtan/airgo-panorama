export interface PanoramaImage {
  id: string;
  name: string;
  url: string;
  size: number; // in bytes
  uploadDate: Date;
  bookmarked: boolean;
  width?: number;
  height?: number;
  fileType: string;
  thumbnailUrl?: string;
  previewUrl?: string;
}

export interface StoredPanoramaImage {
  id: string;
  name: string;
  url: string;
  size: number;
  uploadDate: string;
  bookmarked: boolean;
  width?: number;
  height?: number;
  fileType: string;
}

export type BookmarkFilter = 'all' | 'bookmarked' | 'unbookmarked';

export interface AnalyticsData {
  totalImages: number;
  bookmarkedCount: number;
  unbookmarkedCount: number;
  totalSizeBookmarked: number;
  totalSizeUnbookmarked: number;
}
