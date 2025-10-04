# Content Extraction Improvements

## Problem Statement
The web search MCP server was returning entire HTML content from web pages, including non-essential elements, resulting in very large responses that included navigation menus, sidebars, footers, and other boilerplate content.

## Solution
Enhanced the content extraction logic in both `ContentExtractor` and `EnhancedContentExtractor` to be more selective about what content is extracted, focusing only on the main contextual text from pages.

## Changes Made

### 1. Enhanced Content Candidate Collection
**Before:** The extractor would stop at the first matching selector and use that content.

**After:** The extractor now:
- Collects ALL matching elements for each content selector
- Evaluates each candidate based on content length
- Selects the longest/most substantial content from the highest priority selector
- This ensures we get the main article content, not just the first matching element

### 2. Increased Content Threshold
**Before:** Minimum content length was 100 characters

**After:** Minimum content length is 200 characters
- This prevents extraction of tiny snippets or navigation elements that might match content selectors
- Ensures we only extract meaningful, substantial content

### 3. Improved Paragraph Extraction Fallback
**Before:** When no main content area was found, would extract all body text

**After:** When falling back to body content:
- Extracts only meaningful paragraphs (>50 characters)
- Filters out boilerplate text (copyright, privacy, terms, cookie notices, disclaimers)
- Combines paragraphs with proper spacing
- Only uses full body text as absolute last resort

### 4. Better Content Selectors Priority
Reordered content selectors for better specificity:
1. `article` - Semantic HTML5 article tag (highest priority)
2. `main` - Semantic HTML5 main content tag
3. `[role="main"]` - ARIA role for main content
4. `.post-content`, `.entry-content`, `.article-content` - Common blog/article classes
5. `.story-content`, `.news-content` - News site classes
6. `.main-content`, `.page-content`, `.content` - Generic content classes
7. `.text-content`, `.body-content`, `.copy`, `.text` - Additional fallbacks

## Benefits

1. **Reduced Response Size**: By focusing on main content, responses are significantly smaller
2. **Better Quality**: Users get the actual article/page content without navigation, ads, sidebars
3. **Improved Relevance**: Filters out boilerplate and non-essential text
4. **Better LLM Context**: Smaller, more focused content is easier for LLMs to process
5. **Maintained Compatibility**: Changes are backward compatible, no API changes required

## Example Results

### Before
A typical page extraction might include:
- Navigation menus
- Sidebar links
- Footer copyright notices
- Cookie banners
- Social sharing buttons
- Related articles
- Advertisement placeholders
- Site-wide headers

### After
Now extracts only:
- Main article/page title
- Article paragraphs
- Core content text
- Essential information

## Technical Details

### Files Modified
- `src/content-extractor.ts` - Updated `parseContent()` method
- `src/enhanced-content-extractor.ts` - Updated `parseContent()` method

### Key Algorithm Changes

1. **Content Candidate Collection**
   ```typescript
   // Collect all candidates
   for (const selector of contentSelectors) {
     const $content = $(selector);
     if ($content.length > 0) {
       $content.each(function() {
         const text = $(this).text().trim();
         if (text.length > 200) {
           contentCandidates.push({ selector, text, length: text.length });
         }
       });
     }
   }
   
   // Select best candidate (longest)
   contentCandidates.sort((a, b) => b.length - a.length);
   mainContent = contentCandidates[0].text;
   ```

2. **Selective Paragraph Extraction**
   ```typescript
   $('body p').each(function() {
     const text = $(this).text().trim();
     if (text.length > 50 && 
         !text.match(/^(copyright|©|privacy|terms|cookie|disclaimer)/i)) {
       paragraphs.push(text);
     }
   });
   ```

## Testing

Manual testing confirms:
- ✅ Proper extraction from semantic HTML5 tags (article, main)
- ✅ Exclusion of navigation, headers, footers, sidebars
- ✅ Filtering of boilerplate text
- ✅ Fallback mechanisms work correctly
- ✅ No breaking changes to existing functionality
- ✅ Successful compilation with TypeScript

## Future Enhancements

Potential future improvements:
1. Add support for more content selectors based on real-world usage
2. Implement content quality scoring to better select between multiple candidates
3. Add support for extracting structured data (headings, lists, etc.)
4. Implement smart content truncation that preserves complete sentences
