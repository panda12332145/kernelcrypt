/**
 * Utilitários diversos
 */
import { Difficulty } from '../types/index.js';
/**
 * Converte códigos Unicode (ex: U+1F6E1 ou (U+1F6E1)) para os respectivos Emojis.
 */
export declare function parseUnicodeEmojis(text: string): string;
/**
 * Formata o nome cru da pasta do repositório
 */
export declare function formatNameFromFolder(folder: string): string;
/**
 * Cria slug a partir de um texto
 */
export declare function createSlug(text: string): string;
/**
 * Extrai título do markdown (procura por # titulo)
 */
export declare function extractTitleFromMarkdown(content: string): string | null;
/**
 * Conta palavras em um texto
 */
export declare function countWords(text: string): number;
export declare function stripMarkdown(text: string): string;
export declare function createExcerpt(markdown: string, length?: number): string;
export declare function titleCaseFromSlug(slug: string): string;
export declare function normalizeDifficulty(value: unknown): Difficulty;
export declare function safeJsonParse<T>(value: string | null | undefined, fallback: T): T;
export declare function escapeHtml(value: string): string;
export declare function normalizeRepoPath(path: string): string;
export declare function joinRepoPath(...parts: string[]): string;
export declare function dirname(path: string): string;
export declare function basename(path: string): string;
export declare function withoutExtension(filename: string): string;
/**
 * Calcula tempo de leitura em minutos
 */
export declare function calculateReadingTime(wordCount: number, difficulty?: Difficulty, extraSeconds?: number): {
    minutes: number;
    seconds: number;
};
/**
 * Calcula tempo extra baseado em mídia
 */
export declare function calculateMediaExtraSeconds(mediaMetadata: {
    images?: number;
    largeImages?: number;
    gifs?: number;
    videoEmbeds?: number;
    pdfEmbeds?: number;
    youtubeEmbeds?: number;
}): number;
/**
 * Validar se URL é do GitHub
 */
export declare function isGitHubUrl(url: string): boolean;
/**
 * Extrair owner/repo de uma URL GitHub
 */
export declare function extractGitHubOwnerRepo(url: string): {
    owner: string;
    repo: string;
} | null;
/**
 * Retry com backoff exponencial
 */
export declare function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries?: number, baseDelayMs?: number): Promise<T>;
/**
 * Debounce function
 */
export declare function debounce<T extends (...args: any[]) => any>(fn: T, delayMs: number): T;
/**
 * Valida se é um email válido
 */
export declare function isValidEmail(email: string): boolean;
//# sourceMappingURL=index.d.ts.map