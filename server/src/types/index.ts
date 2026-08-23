// Tipos para categorias
export interface CategoryDTO {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  order: number;
  articlesCount?: number;
}

// Tipos para artigos
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ArticleMetadata {
  title: string;
  description?: string;
  difficulty?: Difficulty;
  featured?: boolean;
  starred?: boolean;
  starCount?: number;
  tags?: string[];
  coverImage?: string;
  estimatedReadingTime?: number;
}

export interface ArticleDTO {
  id: string;
  slug: string;
  title: string;
  description?: string;
  content: string; // markdown
  renderedHtml: string;
  difficulty: Difficulty;
  featured: boolean;
  starred: boolean;
  starCount: number;
  starredAt?: Date;
  coverImage?: string;
  categoryId: string;
  category?: CategoryDTO;
  subcategoryId?: string;
  tags: string[];
  readingTimeMinutes: number;
  readingTimeSeconds?: number;
  totalWords: number;
  mediaCount: number;
  createdAt: Date;
  updatedAt: Date;
  githubPath?: string;
  githubLastCommitDate?: Date;
  lastSyncedAt?: Date;
}

// Tipos para sincronização
export type SyncType = 'full' | 'incremental' | 'deleted';
export type SyncStatus = 'success' | 'failed' | 'partial' | 'pending';

export interface SyncLogDTO {
  id: string;
  syncType: SyncType;
  status: SyncStatus;
  filesProcessed: number;
  filesAdded: number;
  filesModified: number;
  filesDeleted: number;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  message?: string;
}

// Tipos para GitHub
export interface GitHubFileInfo {
  path: string;
  sha: string;
  url: string;
  size: number;
  type: 'file' | 'dir';
}

export interface GitHubCommitInfo {
  sha: string;
  message: string;
  author: string;
  date: Date;
  filesChanged: number;
}

// Tipos para media/assets
export type MediaType = 'image' | 'video' | 'pdf' | 'gif' | 'audio';

export interface MediaAssetDTO {
  id: string;
  type: MediaType;
  url: string;
  title?: string;
  description?: string;
  width?: number;
  height?: number;
  altText?: string;
  duration?: number;
  thumbnail?: string;
}

// Tipos para respostas de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// Tipos para requisições
export interface GetArticlesQuery {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  subcategoryId?: string;
  difficulty?: Difficulty;
  featured?: boolean;
  search?: string;
  tags?: string[];
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'readingTime';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchQuery {
  q: string;
  type?: 'title' | 'content' | 'tags' | 'all';
  limit?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  difficulty: Difficulty;
  relevanceScore: number;
}
