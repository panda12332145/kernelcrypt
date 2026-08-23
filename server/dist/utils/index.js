/**
 * Utilitários diversos
 */
/**
 * Converte códigos Unicode (ex: U+1F6E1 ou (U+1F6E1)) para os respectivos Emojis.
 */
export function parseUnicodeEmojis(text) {
    if (!text)
        return text;
    return text.replace(/\(?U\+([0-9A-Fa-f]{4,6})\)?/ig, (match, hex) => {
        try {
            return String.fromCodePoint(parseInt(hex, 16));
        }
        catch {
            return match;
        }
    });
}
/**
 * Formata o nome cru da pasta do repositório
 */
export function formatNameFromFolder(folder) {
    if (!folder)
        return folder;
    const parsed = parseUnicodeEmojis(folder);
    return parsed
        .split(/[-_]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
/**
 * Cria slug a partir de um texto
 */
export function createSlug(text) {
    const parsedText = parseUnicodeEmojis(text);
    const slug = parsedText
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    return slug || 'untitled';
}
/**
 * Extrai título do markdown (procura por # titulo)
 */
export function extractTitleFromMarkdown(content) {
    const match = content.match(/^#\s+(.+?)$/m);
    return match ? match[1].trim() : null;
}
/**
 * Conta palavras em um texto
 */
export function countWords(text) {
    // Remove markdown syntax básico
    let cleaned = text
        .replace(/[#*`[\](){}!]/g, '')
        .replace(/\bhttps?:\/\/\S+/g, '')
        .trim();
    // Conta palavras
    const words = cleaned.split(/\s+/).filter((word) => word.length > 0);
    return words.length;
}
export function stripMarkdown(text) {
    return text
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/!\[(.*?)\]\((.*?)\)/g, '$1')
        .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
        .replace(/^---[\s\S]*?---/m, ' ')
        .replace(/^#+\s+/gm, '')
        .replace(/[*_~>|[\](){}:-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
export function createExcerpt(markdown, length = 180) {
    const text = stripMarkdown(markdown);
    return text.length > length ? `${text.slice(0, length).trim()}...` : text;
}
export function titleCaseFromSlug(slug) {
    return slug
        .split(/[-_/]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
export function normalizeDifficulty(value) {
    return value === 'intermediate' || value === 'advanced' ? value : 'beginner';
}
export function safeJsonParse(value, fallback) {
    if (!value)
        return fallback;
    try {
        return JSON.parse(value);
    }
    catch {
        return fallback;
    }
}
export function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
export function normalizeRepoPath(path) {
    const normalized = [];
    for (const part of path.replace(/\\/g, '/').split('/')) {
        if (!part || part === '.')
            continue;
        if (part === '..') {
            normalized.pop();
            continue;
        }
        normalized.push(part);
    }
    return normalized.join('/');
}
export function joinRepoPath(...parts) {
    return normalizeRepoPath(parts.join('/'));
}
export function dirname(path) {
    const normalized = normalizeRepoPath(path);
    const index = normalized.lastIndexOf('/');
    return index === -1 ? '' : normalized.slice(0, index);
}
export function basename(path) {
    const normalized = normalizeRepoPath(path);
    const index = normalized.lastIndexOf('/');
    return index === -1 ? normalized : normalized.slice(index + 1);
}
export function withoutExtension(filename) {
    return filename.replace(/\.[^.]+$/, '');
}
/**
 * Calcula tempo de leitura em minutos
 */
export function calculateReadingTime(wordCount, difficulty = 'beginner', extraSeconds = 0) {
    // Palavras por minuto baseado em dificuldade
    const wpmByDifficulty = {
        beginner: 220,
        intermediate: 250,
        advanced: 150,
    };
    const wpm = wpmByDifficulty[difficulty];
    const totalSeconds = Math.round((wordCount / wpm) * 60) + extraSeconds;
    return {
        minutes: Math.ceil(totalSeconds / 60),
        seconds: totalSeconds,
    };
}
/**
 * Calcula tempo extra baseado em mídia
 */
export function calculateMediaExtraSeconds(mediaMetadata) {
    let extra = 0;
    const gifs = mediaMetadata.gifs || 0;
    const images = Math.max(0, (mediaMetadata.images || 0) - gifs);
    extra += images * 3;
    extra += (mediaMetadata.largeImages || 0) * 6;
    extra += gifs * 5;
    extra += (mediaMetadata.videoEmbeds || 0) * 10;
    extra += (mediaMetadata.pdfEmbeds || 0) * 8;
    extra += (mediaMetadata.youtubeEmbeds || 0) * 12;
    return extra;
}
/**
 * Validar se URL é do GitHub
 */
export function isGitHubUrl(url) {
    return url.includes('github.com') || url.includes('raw.githubusercontent.com');
}
/**
 * Extrair owner/repo de uma URL GitHub
 */
export function extractGitHubOwnerRepo(url) {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    return match ? { owner: match[1], repo: match[2] } : null;
}
/**
 * Retry com backoff exponencial
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelayMs = 1000) {
    let lastError = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt < maxRetries - 1) {
                const delay = baseDelayMs * Math.pow(2, attempt);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError || new Error('Retry failed');
}
/**
 * Debounce function
 */
export function debounce(fn, delayMs) {
    let timeoutId;
    return ((...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delayMs);
    });
}
/**
 * Valida se é um email válido
 */
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}
//# sourceMappingURL=index.js.map