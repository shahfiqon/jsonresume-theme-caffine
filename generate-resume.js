const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const theme = require('./index.js');

/**
 * Generate a resume PDF from a resume JSON object or file
 * @param {Object} options - Generation options
 * @param {Object|string} options.resume - Resume data object or path to JSON file
 * @param {string} options.outputPath - Path where the PDF should be saved
 * @param {string} [options.tmpDir] - Optional tmp directory for intermediate files
 * @returns {Promise<string>} Path to the generated PDF
 */
async function generateResumePDF(options) {
  const { resume, outputPath, tmpDir = '/tmp' } = options;
  
  try {
    let resumeData;
    let resumePath;
    
    // Handle resume input - can be object or file path
    if (typeof resume === 'string') {
      // It's a file path
      resumePath = resume;
      if (!fs.existsSync(resumePath)) {
        throw new Error(`Resume file not found at: ${resumePath}`);
      }
      resumeData = JSON.parse(fs.readFileSync(resumePath, 'utf-8'));
    } else if (typeof resume === 'object') {
      // It's a resume object - write to tmp file
      const timestamp = Date.now();
      resumePath = path.join(tmpDir, `resume_${timestamp}.json`);
      
      // Ensure tmp directory exists
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      
      fs.writeFileSync(resumePath, JSON.stringify(resume, null, 2));
      resumeData = resume;
    } else {
      throw new Error('Resume must be either a JSON object or a file path string');
    }
    
    // Render HTML using the theme
    const html = theme.render(resumeData);
    
    // Launch puppeteer with WSL2-friendly options
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Hide the header in the main HTML since it will be in the PDF header template
    const htmlWithHiddenHeader = html.replace(
      '<style>',
      '<style>\n    .resume-header { display: none !important; }\n'
    );
    
    await page.setContent(htmlWithHiddenHeader, { waitUntil: 'networkidle0' });
    
    // Build header template from resume data
    const basics = resumeData.basics || {};
    let contactInfo = '';
    
    // LinkedIn
    if (basics.profiles) {
      const linkedin = basics.profiles.find(p => p.network && p.network.toLowerCase() === 'linkedin');
      if (linkedin) {
        contactInfo += `<span style="display: inline;">🔗 <a href="${linkedin.url}" target="_blank" style="color: #0066cc; text-decoration: none;">LinkedIn</a></span><span style="margin: 0 8px; color: #999;">|</span>`;
      }
    }
    
    // Phone
    if (basics.phone) {
      contactInfo += `<span style="display: inline;">📞 ${basics.phone}</span><span style="margin: 0 8px; color: #999;">|</span>`;
    }
    
    // Email
    if (basics.email) {
      contactInfo += `<span style="display: inline;">✉ <a href="mailto:${basics.email}" style="color: #0066cc; text-decoration: none;">${basics.email}</a></span>`;
    }
    
    // GitHub
    if (basics.profiles) {
      const github = basics.profiles.find(p => p.network && p.network.toLowerCase() === 'github');
      if (github) {
        contactInfo += `<span style="margin: 0 8px; color: #999;">|</span><span style="display: inline;">💻 <a href="${github.url}" target="_blank" style="color: #0066cc; text-decoration: none;">GitHub</a></span>`;
      }
    }
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate PDF with repeatable header and footer
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #666;">
          <h1 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 500; color: #333;">${basics.name || ''}</h1>
          <div style="font-size: 10px; color: #666;">
            ${contactInfo}
          </div>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; padding: 10px 0; border-top: 1px solid #e0e0e0; color: #666;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
      margin: {
        top: '80px',    // Space for header
        bottom: '30px', // Space for footer
      }
    });
    
    await browser.close();
    
    // Clean up tmp file if we created one
    if (typeof resume === 'object' && fs.existsSync(resumePath)) {
      fs.unlinkSync(resumePath);
    }
    
    console.log(`✅ PDF generated successfully: ${outputPath}`);
    return outputPath;
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error.message);
    throw error;
  }
}

/**
 * Generate a resume HTML from a resume JSON object or file
 * @param {Object|string} resume - Resume data object or path to JSON file
 * @returns {string} Rendered HTML string
 */
function generateResumeHTML(resume) {
  try {
    let resumeData;
    
    if (typeof resume === 'string') {
      // It's a file path
      if (!fs.existsSync(resume)) {
        throw new Error(`Resume file not found at: ${resume}`);
      }
      resumeData = JSON.parse(fs.readFileSync(resume, 'utf-8'));
    } else if (typeof resume === 'object') {
      // It's already a resume object
      resumeData = resume;
    } else {
      throw new Error('Resume must be either a JSON object or a file path string');
    }
    
    return theme.render(resumeData);
  } catch (error) {
    console.error('❌ Error generating HTML:', error.message);
    throw error;
  }
}

module.exports = {
  generateResumePDF,
  generateResumeHTML
};


