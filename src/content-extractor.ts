import axios from 'axios';
import * as cheerio from 'cheerio';
import { ContentExtractionOptions, SearchResult } from './types.js';
import { cleanText, getWordCount, getContentPreview, generateTimestamp, isPdfUrl } from './utils.js';

export class ContentExtractor {
  private readonly defaultTimeout: number;
  private readonly maxContentLength: number;

  constructor() {
    this.defaultTimeout = 10000;
    // Read MAX_CONTENT_LENGTH from environment variable, fallback to 500KB
    const envMaxLength = process.env.MAX_CONTENT_LENGTH;
    this.maxContentLength = envMaxLength ? parseInt(envMaxLength, 10) : 500000;
    
    // Validate the parsed value
    if (isNaN(this.maxContentLength) || this.maxContentLength < 0) {
      console.warn(`[ContentExtractor] Invalid MAX_CONTENT_LENGTH value: ${envMaxLength}, using default 500000`);
      this.maxContentLength = 500000;
    }
  }

  async extractContent(options: ContentExtractionOptions): Promise<string> {
    const { url, timeout = this.defaultTimeout, maxContentLength = this.maxContentLength } = options;
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0',
          'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
        },
        timeout,
        maxContentLength,
        validateStatus: (status: number) => status < 400,
      });

      return this.parseContent(response.data);
    } catch (error) {
      console.error(`Content extraction error for ${url}:`, error);
      
      // If it's a 403 error, try with different headers
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        console.log(`[ContentExtractor] Trying alternative headers for ${url}`);
        try {
          const response = await axios.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Accept-Encoding': 'gzip, deflate',
              'DNT': '1',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
            },
            timeout,
            maxContentLength,
            validateStatus: (status: number) => status < 400,
          });
          
          console.log(`[ContentExtractor] Alternative headers worked for ${url}`);
          return this.parseContent(response.data);
        } catch (retryError) {
          console.error(`[ContentExtractor] Alternative headers also failed for ${url}:`, retryError);
        }
      }
      
      throw new Error(`Failed to extract content from ${url}: ${this.getSpecificErrorMessage(error)}`);
    }
  }

  async extractContentForResults(results: SearchResult[], targetCount: number = results.length): Promise<SearchResult[]> {
    const enhancedResults: SearchResult[] = [];
    let processedCount = 0;
    
    console.log(`[ContentExtractor] Processing up to ${results.length} results to get ${targetCount} non-PDF results`);
    
    for (const result of results) {
      if (enhancedResults.length >= targetCount) {
        console.log(`[ContentExtractor] Reached target count of ${targetCount} results`);
        break;
      }
      
      processedCount++;
      
      // Skip PDF files
      if (isPdfUrl(result.url)) {
        console.log(`[ContentExtractor] Skipping PDF file: ${result.url}`);
        continue;
      }
      
      try {
        console.log(`[ContentExtractor] Extracting content from: ${result.url}`);
        const content = await this.extractContent({ url: result.url });
        const cleanedContent = cleanText(content, this.maxContentLength);
        
        enhancedResults.push({
          ...result,
          fullContent: cleanedContent,
          contentPreview: getContentPreview(cleanedContent),
          wordCount: getWordCount(cleanedContent),
          timestamp: generateTimestamp(),
          fetchStatus: 'success' as const,
        });
        
        console.log(`[ContentExtractor] Successfully extracted content (${enhancedResults.length}/${targetCount})`);
      } catch (error) {
        console.log(`[ContentExtractor] Failed to extract content from ${result.url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        enhancedResults.push({
          ...result,
          fullContent: '',
          contentPreview: '',
          wordCount: 0,
          timestamp: generateTimestamp(),
          fetchStatus: 'error' as const,
          error: this.getSpecificErrorMessage(error),
        });
      }
    }
    
    console.log(`[ContentExtractor] Processed ${processedCount} results, extracted ${enhancedResults.length} non-PDF results`);
    return enhancedResults;
  }

  private parseContent(html: string): string {
    const $ = cheerio.load(html);
    
    // Remove all script, style, and other non-content elements
    $('script, style, noscript, iframe, img, video, audio, canvas, svg, object, embed, applet, form, input, textarea, select, button, label, fieldset, legend, optgroup, option').remove();
    
    // Remove navigation, header, footer, and other non-content elements
    $('nav, header, footer, .nav, .header, .footer, .sidebar, .menu, .breadcrumb, aside, .ad, .advertisement, .ads, .advertisement-container, .social-share, .share-buttons, .comments, .comment-section, .related-posts, .recommendations, .newsletter-signup, .cookie-notice, .privacy-notice, .terms-notice, .disclaimer, .legal, .copyright, .meta, .metadata, .author-info, .publish-date, .tags, .categories, .navigation, .pagination, .search-box, .search-form, .login-form, .signup-form, .newsletter, .popup, .modal, .overlay, .tooltip, .toolbar, .ribbon, .banner, .promo, .sponsored, .affiliate, .tracking, .analytics, .pixel, .beacon').remove();
    
    // Remove elements with common ad/tracking classes
    $('[class*="ad"], [class*="ads"], [class*="advertisement"], [class*="tracking"], [class*="analytics"], [class*="pixel"], [class*="beacon"], [class*="sponsored"], [class*="affiliate"], [class*="promo"], [class*="banner"], [class*="popup"], [class*="modal"], [class*="overlay"], [class*="tooltip"], [class*="toolbar"], [class*="ribbon"]').remove();
    
    // Remove elements with common non-content IDs
    $('[id*="ad"], [id*="ads"], [id*="advertisement"], [id*="tracking"], [id*="analytics"], [id*="pixel"], [id*="beacon"], [id*="sponsored"], [id*="affiliate"], [id*="promo"], [id*="banner"], [id*="popup"], [id*="modal"], [id*="overlay"], [id*="tooltip"], [id*="toolbar"], [id*="ribbon"], [id*="sidebar"], [id*="navigation"], [id*="menu"], [id*="footer"], [id*="header"]').remove();
    
    // Remove image-related elements and attributes
    $('picture, source, figure, figcaption, .image, .img, .photo, .picture, .media, .gallery, .slideshow, .carousel').remove();
    $('[data-src*="image"], [data-src*="img"], [data-src*="photo"], [data-src*="picture"]').remove();
    $('[style*="background-image"]').remove();
    
    // Remove empty elements and whitespace-only elements
    $('*').each(function() {
      const $this = $(this);
      if ($this.children().length === 0 && $this.text().trim() === '') {
        $this.remove();
      }
    });
    
    // Try to find the main content area - be more aggressive about selecting specific content
    let mainContent = '';
    
    // Priority selectors for main content (ordered by specificity)
    const contentSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.story-content',
      '.news-content',
      '.main-content',
      '.page-content',
      '.content',
      '.text-content',
      '.body-content',
      '.copy',
      '.text',
    ];
    
    // Try each selector and collect content
    const contentCandidates: Array<{ selector: string; text: string; length: number }> = [];
    
    for (const selector of contentSelectors) {
      const $content = $(selector);
      if ($content.length > 0) {
        // Try each matching element and collect all candidates
        $content.each(function() {
          const text = $(this).text().trim();
          if (text.length > 200) { // Higher threshold to ensure meaningful content
            contentCandidates.push({
              selector,
              text,
              length: text.length
            });
          }
        });
      }
    }
    
    // Select the best content candidate (longest one from the highest priority selector)
    if (contentCandidates.length > 0) {
      // Sort by length descending to get the most substantial content
      contentCandidates.sort((a, b) => b.length - a.length);
      mainContent = contentCandidates[0].text;
      console.log(`[ContentExtractor] Found content with selector: ${contentCandidates[0].selector} (${mainContent.length} chars)`);
    }
    
    // Only fall back to body if we found absolutely nothing
    if (!mainContent || mainContent.length < 200) {
      console.log(`[ContentExtractor] No main content found with specific selectors, extracting from body`);
      
      // Even for body, try to extract meaningful paragraphs only
      const paragraphs: string[] = [];
      $('body p').each(function() {
        const text = $(this).text().trim();
        // Only include paragraphs with substantial text (filter out boilerplate)
        if (text.length > 50 && !text.match(/^(copyright|©|privacy|terms|cookie|disclaimer)/i)) {
          paragraphs.push(text);
        }
      });
      
      if (paragraphs.length > 0) {
        mainContent = paragraphs.join('\n\n');
        console.log(`[ContentExtractor] Extracted ${paragraphs.length} paragraphs from body (${mainContent.length} chars)`);
      } else {
        // Last resort: get all body text
        mainContent = $('body').text().trim();
        console.log(`[ContentExtractor] Using full body text as last resort (${mainContent.length} chars)`);
      }
    }
    
    // Clean up the text
    const cleanedContent = this.cleanTextContent(mainContent);
    
    return cleanText(cleanedContent, this.maxContentLength);
  }
  
  private cleanTextContent(text: string): string {
    // Remove excessive whitespace
    text = text.replace(/\s+/g, ' ');
    
    // Remove image-related text and data URLs
    text = text.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g, ''); // Remove base64 image data
    text = text.replace(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg|ico|bmp|tiff)(\?[^\s]*)?/gi, ''); // Remove image URLs
    text = text.replace(/\.(jpg|jpeg|png|gif|webp|svg|ico|bmp|tiff)/gi, ''); // Remove image file extensions
    text = text.replace(/image|img|photo|picture|gallery|slideshow|carousel/gi, ''); // Remove image-related words
    text = text.replace(/click to enlarge|click for full size|view larger|download image/gi, ''); // Remove image action text
    
    // Remove common non-content patterns
    text = text.replace(/cookie|privacy|terms|conditions|disclaimer|legal|copyright|all rights reserved/gi, '');
    
    // Remove excessive line breaks and spacing
    text = text.replace(/\n\s*\n/g, '\n');
    text = text.replace(/\r\n/g, '\n');
    text = text.replace(/\r/g, '\n');
    
    // Remove leading/trailing whitespace
    text = text.trim();
    
    return text;
  }

  private getSpecificErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return 'Request timeout';
      }
      if (error.response?.status === 403) {
        return '403 Forbidden - Access denied';
      }
      if (error.response?.status === 404) {
        return '404 Not found';
      }
      if (error.message.includes('maxContentLength')) {
        return 'Content too long';
      }
      if (error.response?.status) {
        return `HTTP ${error.response.status}: ${error.message}`;
      }
      return `Network error: ${error.message}`;
    }
    
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
