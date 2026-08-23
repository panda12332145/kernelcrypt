export interface TerminalCard {
  name: string;
  alias?: string;
  role: string;
  education?: {
    undergraduate?: { degree: string; institution: string };
    postgraduate?: { degree: string; institution: string };
  };
  stack: Record<string, string[]> | string;
  focus: string[];
  languages: string[];
  specialties?: string[];
  fun_fact?: string;
  scale?: string;
}

export interface HeroData {
  highlight: string;
  subtitle: string;
  tags: string[];
  terminalCard: TerminalCard;
  socialLinks: SocialLink[];
}

export interface SocialLink {
  platform: string;
  url: string;
  label: string;
  icon: string;
}

export interface GitHubStats {
  repositories: number;
  stars: number;
  followers: number;
  contributions: number;
  downloads: string;
  forks: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  stars: number;
  forks: number;
  commits?: number;
  downloads?: string;
  languages: string[];
  topics: string[];
  website?: string;
  github: string;
  emoji: string;
  cveBadge?: string;
  featured: boolean;
  customTags?: string[];

  // DB-specific fields
  aviso?: string;
  avisoCor?: string;
  frameworks?: string[];
  teamType?: string;
  tipo?: string;
  icone?: string;
  colors?: Record<string, string>;
}

export interface Skill {
  name: string;
  icon?: string;
  category?: string;
  iconType: 'url' | 'emoji' | 'devicon';
}

export interface ContactLink {
  platform: string;
  value: string;
  url: string;
  icon: string;
}

export interface PortfolioData {
  hero: HeroData;
  stats: GitHubStats;
  projects: Project[];
  skills: Skill[];
  contacts: ContactLink[];
  sectionDesc: string;
}

// Wiki Types
export interface WikiCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  chapters: WikiChapter[];
  slug: string;
}

export interface WikiChapter {
  id: string;
  title: string;
  slug: string;
  description?: string;
  pages: WikiPage[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  icon?: string;
}

export interface WikiPage {
  id: string;
  title: string;
  slug: string;
  description?: string;
  content: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  icon?: string;
  youtube?: string;
  pdfs?: WikiPDF[];
  readingTime?: number;
  featured?: boolean;
  starred?: boolean;
  starCount?: number;
  updatedAt?: string;
}

export interface WikiPDF {
  name: string;
  url: string;
  size?: string;
}

export interface WikiVideo {
  id: number | string;
  title: string;
  videoUrl: string;
  coverUrl: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  contentType: 'Video' | 'Playlist';
  customBadgeLabel: string[];
  customBadgeColor: string;
  category?: string;
  chapter?: string;
  youtube?: string;
  thumbnail?: string;
}

export interface WikiBook {
  id: number | string;
  title: string;
  author: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  fileName: string;
  fileFormat: 'pdf' | 'epub' | 'md' | 'html' | 'htm' | 'docx' | string;
  sizeBytes: number;
  sizeLabel: string;
  customBadgeLabel: string[];
  customBadgeColor: string;
  downloadUrl: string;
  fileUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WikiBookChapter {
  title: string;
  offset?: number;
  pageNumber?: number;
}

export interface WikiBookContent {
  book: WikiBook;
  renderType: 'text' | 'html' | 'pdf' | 'missing' | 'unsupported';
  content: string;
  plainText: string;
  fileUrl?: string;
  chapters: WikiBookChapter[];
}

export interface WikiBookAnnotation {
  id: number;
  bookId: number;
  userId: string;
  userLabel: string;
  annotationType: 'bookmark' | 'comment' | 'highlight' | 'underline';
  pageNumber: number;
  selectedText: string;
  note: string;
  color: string;
  createdAt: string;
  mine: boolean;
}

export interface WikiSearchResult {
  page: WikiPage;
  category: WikiCategory;
  chapter: WikiChapter;
  score: number;
}

export type WikiDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface WikiMediaAsset {
  id: string;
  type: 'image' | 'video' | 'pdf' | 'gif' | 'audio';
  url: string;
  title?: string;
  description?: string;
  width?: number;
  height?: number;
  altText?: string;
  duration?: number;
  thumbnail?: string;
  githubPath?: string;
  githubUrl?: string;
  sha?: string;
  sizeBytes?: number;
}

export interface WikiTocItem {
  level: number;
  title: string;
  anchor: string;
}

export interface WikiArticle {
  id: string;
  slug: string;
  title: string;
  seoTitle?: string;
  description?: string;
  excerpt?: string;
  content?: string;
  renderedHtml?: string;
  difficulty: WikiDifficulty;
  featured: boolean;
  starred?: boolean;
  starCount?: number;
  starredAt?: string;
  coverImage?: string;
  canonicalUrl?: string;
  readingTimeMinutes: number;
  readingTimeSeconds?: number;
  totalWords: number;
  estimatedWords?: number;
  mediaCount: number;
  extraSeconds?: number;
  githubPath?: string;
  githubLastCommit?: string;
  githubLastCommitDate?: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
  category?: WikiApiCategory;
  subcategory?: WikiApiSubcategory;
  tags: string[];
  toc?: WikiTocItem[];
  mediaAssets?: WikiMediaAsset[];
  highlight?: string;
  score?: number;
}

export interface WikiApiSubcategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  order?: number;
  articleCount?: number;
  articles: WikiArticle[];
}

export interface WikiApiCategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  order?: number;
  articleCount?: number;
  subcategoryCount?: number;
  subcategories: WikiApiSubcategory[];
}

export interface WikiArticleListResponse {
  items: WikiArticle[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
