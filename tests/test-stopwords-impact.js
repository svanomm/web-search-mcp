#!/usr/bin/env node

// Test to demonstrate the impact of stop words removal on realistic web content
import { removeStopWords, cleanText, getWordCount } from '../dist/utils.js';

console.log('Testing stop words removal impact on realistic web content...\n');

// Simulate a typical paragraph from a web article
const webContent = `
The modern web search engine is a complex system that processes billions of queries every day.
It uses advanced algorithms to understand what the user is searching for and returns the most
relevant results. The system has to be very fast and efficient because users expect instant
results when they type in their search query. This is why optimization and performance are
critical factors in the design of search engines.
`;

console.log('=== Original Content ===');
console.log(webContent.trim());
console.log(`\nOriginal character count: ${webContent.length}`);
console.log(`Original word count: ${getWordCount(webContent)}`);

const filtered = cleanText(webContent);

console.log('\n=== After Stop Words Removal ===');
console.log(filtered);
console.log(`\nFiltered character count: ${filtered.length}`);
console.log(`Filtered word count: ${getWordCount(filtered)}`);

const charReduction = Math.round((1 - filtered.length / webContent.length) * 100);
const wordReduction = Math.round((1 - getWordCount(filtered) / getWordCount(webContent)) * 100);

console.log(`\n=== Impact Summary ===`);
console.log(`Character reduction: ${charReduction}%`);
console.log(`Word count reduction: ${wordReduction}%`);
console.log(`\nThis reduction helps LLMs process the content faster while preserving the key information.`);
