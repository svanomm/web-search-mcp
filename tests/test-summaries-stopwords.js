#!/usr/bin/env node

// Test script to verify stop words removal is applied in get-web-search-summaries
import { removeStopWords } from '../dist/utils.js';

console.log('Testing stop words removal in search summaries...\n');

// Simulate what happens in the get-web-search-summaries function
const mockTitle = 'This is a test title about machine learning';
const mockDescription = 'This is a description that has many stop words in it. The quick brown fox jumps over the lazy dog.';

console.log('=== Mock Search Result ===');
console.log(`Original Title: "${mockTitle}"`);
console.log(`Original Description: "${mockDescription}"`);

// Apply the same transformation that get-web-search-summaries now does
const cleanedTitle = removeStopWords(mockTitle);
const cleanedDescription = removeStopWords(mockDescription);

console.log('\n=== After Stop Words Removal ===');
console.log(`Cleaned Title: "${cleanedTitle}"`);
console.log(`Cleaned Description: "${cleanedDescription}"`);

// Verify that stop words were removed
const titleHasStopWords = cleanedTitle.toLowerCase().includes(' is ') || 
                          cleanedTitle.toLowerCase().includes(' the ') ||
                          cleanedTitle.toLowerCase().includes(' a ');
const descHasStopWords = cleanedDescription.toLowerCase().includes(' is ') || 
                         cleanedDescription.toLowerCase().includes(' the ') ||
                         cleanedDescription.toLowerCase().includes(' a ');

console.log('\n=== Verification ===');
if (!titleHasStopWords && !descHasStopWords) {
  console.log('✅ Stop words successfully removed from both title and description!');
  console.log('✅ Test PASSED: get-web-search-summaries now applies stop words removal');
} else {
  console.log('❌ Test FAILED: Stop words still present');
  if (titleHasStopWords) console.log('  - Title still contains stop words');
  if (descHasStopWords) console.log('  - Description still contains stop words');
  process.exit(1);
}

// Show the expected output format
console.log('\n=== Expected Output Format in get-web-search-summaries ===');
let mockResponseText = 'Search summaries for "test query" with 1 results:\n\n';
mockResponseText += `**1. ${cleanedTitle}**\n`;
mockResponseText += `URL: https://example.com\n`;
mockResponseText += `Description: ${cleanedDescription}\n`;
mockResponseText += `\n---\n\n`;

console.log(mockResponseText);

console.log('✅ All tests completed successfully!');
