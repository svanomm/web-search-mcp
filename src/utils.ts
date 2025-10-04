/**
 * Utility functions for the web search MCP server
 */

// Common English stop words to remove for better LLM processing efficiency. Uses NLTK list. https://gist.github.com/sebleier/554280
const STOP_WORDS = new Set([
  "i", "me", "my", "myself", "we", "our", "ours", "ourselves", 
  "you", "your", "yours", "yourself", "yourselves", "he", "him", 
  "his", "himself", "she", "her", "hers", "herself", "it", "its", 
  "itself", "they", "them", "their", "theirs", "themselves", "what", 
  "which", "who", "whom", "this", "that", "these", "those", "am", "is", 
  "are", "was", "were", "be", "been", "being", "have", "has", "had", 
  "having", "do", "does", "did", "doing", "a", "an", "the", "and", 
  "but", "if", "or", "because", "as", "until", "while", "of", "at", 
  "by", "for", "with", "about", "against", "between", "into", "through", 
  "during", "before", "after", "above", "below", "to", "from", "up", "down", 
  "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", 
  "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", 
  "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", 
  "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"
]);

/**
 * Remove common English stop words from text to reduce word count
 * while preserving the important content
 */
export function removeStopWords(text: string): string {
  // Split text into words while preserving punctuation context
  const words = text.split(/\s+/);
  
  // Filter out stop words (case-insensitive)
  const filteredWords = words.filter(word => {
    // Extract the actual word from potential punctuation
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
    // Keep the word if it's not a stop word or if it's empty (punctuation)
    return !STOP_WORDS.has(cleanWord) || cleanWord === '';
  });
  
  return filteredWords.join(' ');
}

export function cleanText(text: string, maxLength: number = 10000): string {
  // First apply stop words removal, then clean whitespace
  const cleaned = removeStopWords(text);
  
  return cleaned
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
    .trim()
    .substring(0, maxLength);
}

export function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

export function getContentPreview(text: string, maxLength: number = 500): string {
  const cleaned = cleanText(text, maxLength);
  return cleaned.length === maxLength ? cleaned + '...' : cleaned;
}

export function generateTimestamp(): string {
  return new Date().toISOString();
}

export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function sanitizeQuery(query: string): string {
  return query.trim().substring(0, 1000); // Limit query length
}

export function getRandomUserAgent(): string {
  const userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isPdfUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.pathname.toLowerCase().endsWith('.pdf');
  } catch {
    // If URL parsing fails, check the raw string as fallback
    return url.toLowerCase().endsWith('.pdf');
  }
} 
