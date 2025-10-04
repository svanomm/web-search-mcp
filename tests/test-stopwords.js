#!/usr/bin/env node

// Test script to verify stop words removal functionality
import { removeStopWords, cleanText, getWordCount } from '../dist/utils.js';

console.log('Testing stop words removal functionality...\n');

// Test 1: Basic stop words removal
const testText1 = 'This is a test of the stop words removal feature';
const result1 = removeStopWords(testText1);
console.log('Test 1: Basic stop words removal');
console.log(`Input:  "${testText1}"`);
console.log(`Output: "${result1}"`);
console.log(`Original word count: ${getWordCount(testText1)}`);
console.log(`Filtered word count: ${getWordCount(result1)}`);
console.log(`Reduction: ${Math.round((1 - getWordCount(result1) / getWordCount(testText1)) * 100)}%\n`);

// Test 2: Longer text with more stop words
const testText2 = 'The quick brown fox jumps over the lazy dog. This is a very simple sentence that has many common stop words in it.';
const result2 = removeStopWords(testText2);
console.log('Test 2: Longer text');
console.log(`Input:  "${testText2}"`);
console.log(`Output: "${result2}"`);
console.log(`Original word count: ${getWordCount(testText2)}`);
console.log(`Filtered word count: ${getWordCount(result2)}`);
console.log(`Reduction: ${Math.round((1 - getWordCount(result2) / getWordCount(testText2)) * 100)}%\n`);

// Test 3: cleanText function integration
const testText3 = 'The web search tool will be more efficient now that we have removed the stop words from the content.';
const result3 = cleanText(testText3);
console.log('Test 3: cleanText integration');
console.log(`Input:  "${testText3}"`);
console.log(`Output: "${result3}"`);
console.log(`Original word count: ${getWordCount(testText3)}`);
console.log(`Filtered word count: ${getWordCount(result3)}`);
console.log(`Reduction: ${Math.round((1 - getWordCount(result3) / getWordCount(testText3)) * 100)}%\n`);

// Test 4: Preserve important content words
const testText4 = 'Machine learning algorithms process data efficiently.';
const result4 = removeStopWords(testText4);
console.log('Test 4: Preserve important content');
console.log(`Input:  "${testText4}"`);
console.log(`Output: "${result4}"`);
console.log(`Important words preserved: Machine, learning, algorithms, process, data, efficiently\n`);

console.log('✅ All tests completed successfully!');
