#!/usr/bin/env node

/**
 * Test script to verify dynamic resume generation functionality
 */

const { generateResumePDF, generateResumeHTML } = require('./generate-resume.js');
const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('🧪 Starting resume generation tests...\n');
  
  const testTmpDir = '/tmp/resume-test';
  const testResults = [];
  
  // Create test tmp directory
  if (!fs.existsSync(testTmpDir)) {
    fs.mkdirSync(testTmpDir, { recursive: true });
    console.log(`✅ Created test directory: ${testTmpDir}`);
  }
  
  try {
    // Test 1: Generate PDF from existing file
    console.log('\n📝 Test 1: Generate PDF from existing resume.json file');
    try {
      const resumePath = './resume-sample.json';
      if (!fs.existsSync(resumePath)) {
        throw new Error('resume-sample.json not found');
      }
      
      const outputPath1 = path.join(testTmpDir, 'test1-from-file.pdf');
      const result1 = await generateResumePDF({
        resume: resumePath,
        outputPath: outputPath1,
        tmpDir: testTmpDir
      });
      
      if (fs.existsSync(result1)) {
        const stats = fs.statSync(result1);
        console.log(`✅ Test 1 PASSED: PDF generated (${stats.size} bytes)`);
        testResults.push({ test: 'Test 1', status: 'PASSED', size: stats.size });
      } else {
        throw new Error('PDF file not found');
      }
    } catch (error) {
      console.error(`❌ Test 1 FAILED: ${error.message}`);
      testResults.push({ test: 'Test 1', status: 'FAILED', error: error.message });
    }
    
    // Test 2: Generate PDF from JSON object
    console.log('\n📝 Test 2: Generate PDF from resume JSON object');
    try {
      const resumeData = JSON.parse(fs.readFileSync('./resume-sample.json', 'utf-8'));
      
      // Modify the resume to test dynamic generation
      resumeData.basics.name = 'Test User (Dynamically Generated)';
      resumeData.basics.email = 'test@example.com';
      
      const outputPath2 = path.join(testTmpDir, 'test2-from-object.pdf');
      const result2 = await generateResumePDF({
        resume: resumeData,
        outputPath: outputPath2,
        tmpDir: testTmpDir
      });
      
      if (fs.existsSync(result2)) {
        const stats = fs.statSync(result2);
        console.log(`✅ Test 2 PASSED: PDF generated from object (${stats.size} bytes)`);
        testResults.push({ test: 'Test 2', status: 'PASSED', size: stats.size });
      } else {
        throw new Error('PDF file not found');
      }
    } catch (error) {
      console.error(`❌ Test 2 FAILED: ${error.message}`);
      testResults.push({ test: 'Test 2', status: 'FAILED', error: error.message });
    }
    
    // Test 3: Generate HTML from resume
    console.log('\n📝 Test 3: Generate HTML from resume');
    try {
      const resumeData = JSON.parse(fs.readFileSync('./resume-sample.json', 'utf-8'));
      const html = generateResumeHTML(resumeData);
      
      if (html && html.toLowerCase().includes('<!doctype html>')) {
        const htmlPath = path.join(testTmpDir, 'test3-output.html');
        fs.writeFileSync(htmlPath, html);
        const stats = fs.statSync(htmlPath);
        console.log(`✅ Test 3 PASSED: HTML generated (${stats.size} bytes)`);
        testResults.push({ test: 'Test 3', status: 'PASSED', size: stats.size });
      } else {
        throw new Error('Invalid HTML output');
      }
    } catch (error) {
      console.error(`❌ Test 3 FAILED: ${error.message}`);
      testResults.push({ test: 'Test 3', status: 'FAILED', error: error.message });
    }
    
    // Test 4: Generate with custom tmp directory
    console.log('\n📝 Test 4: Generate with custom tmp location');
    try {
      const customTmpDir = '/tmp/custom-resume-tmp';
      if (!fs.existsSync(customTmpDir)) {
        fs.mkdirSync(customTmpDir, { recursive: true });
      }
      
      const resumeData = JSON.parse(fs.readFileSync('./resume-sample.json', 'utf-8'));
      const outputPath4 = path.join(customTmpDir, 'test4-custom-tmp.pdf');
      
      const result4 = await generateResumePDF({
        resume: resumeData,
        outputPath: outputPath4,
        tmpDir: customTmpDir
      });
      
      if (fs.existsSync(result4)) {
        const stats = fs.statSync(result4);
        console.log(`✅ Test 4 PASSED: PDF generated in custom tmp (${stats.size} bytes)`);
        testResults.push({ test: 'Test 4', status: 'PASSED', size: stats.size });
      } else {
        throw new Error('PDF file not found');
      }
    } catch (error) {
      console.error(`❌ Test 4 FAILED: ${error.message}`);
      testResults.push({ test: 'Test 4', status: 'FAILED', error: error.message });
    }
    
    // Test 5: Test AI Job Bot scenario - tailored resume
    console.log('\n📝 Test 5: Simulate AI Job Bot tailored resume generation');
    try {
      const baseResume = JSON.parse(fs.readFileSync('./resume-sample.json', 'utf-8'));
      
      // Simulate tailoring for a specific job
      const jobId = 12345;
      const jobKeywords = ['Python', 'JavaScript', 'Docker', 'API'];
      
      const tailoredResume = {
        ...baseResume,
        basics: {
          ...baseResume.basics,
          summary: `[TAILORED FOR JOB ${jobId}] ${baseResume.basics.summary}`,
        },
        // Add job keywords to highlight
        meta: {
          jobId: jobId,
          keywords: jobKeywords
        }
      };
      
      const outputPath5 = path.join(testTmpDir, `tailored-resume-job-${jobId}.pdf`);
      const result5 = await generateResumePDF({
        resume: tailoredResume,
        outputPath: outputPath5,
        tmpDir: testTmpDir
      });
      
      if (fs.existsSync(result5)) {
        const stats = fs.statSync(result5);
        console.log(`✅ Test 5 PASSED: Tailored resume generated (${stats.size} bytes)`);
        testResults.push({ test: 'Test 5', status: 'PASSED', size: stats.size });
      } else {
        throw new Error('PDF file not found');
      }
    } catch (error) {
      console.error(`❌ Test 5 FAILED: ${error.message}`);
      testResults.push({ test: 'Test 5', status: 'FAILED', error: error.message });
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    testResults.forEach(result => {
      const status = result.status === 'PASSED' ? '✅' : '❌';
      const detail = result.status === 'PASSED' 
        ? `(${result.size} bytes)` 
        : `(${result.error})`;
      console.log(`${status} ${result.test}: ${result.status} ${detail}`);
    });
    
    const passedCount = testResults.filter(r => r.status === 'PASSED').length;
    const totalCount = testResults.length;
    
    console.log('\n' + '='.repeat(60));
    console.log(`Results: ${passedCount}/${totalCount} tests passed`);
    console.log('='.repeat(60));
    
    console.log(`\n📁 Test outputs saved to: ${testTmpDir}`);
    console.log('   You can review the generated PDFs and HTML files there.\n');
    
    if (passedCount === totalCount) {
      console.log('🎉 All tests passed! The theme is ready for integration.\n');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed. Please review the errors above.\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
console.log('Starting test suite for jsonresume-theme-caffine dynamic generation...');
console.log('This will test PDF and HTML generation from various sources.\n');

runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});

