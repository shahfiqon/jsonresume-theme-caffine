const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const theme = require('./index.js');

async function exportPDF(resumePath = './resume.json', outputPath = './resume.pdf') {
  try {
    // Read resume.json from provided path or default location
    if (!fs.existsSync(resumePath)) {
      throw new Error(`Resume file not found at: ${resumePath}`);
    }
    const resumeData = JSON.parse(fs.readFileSync(resumePath, 'utf-8'));
    
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
        contactInfo += `<span style="display: inline;"><svg height="12" width="12" viewBox="0 0 24 24" fill="#0A66C2" style="vertical-align: middle; margin-right: 4px;"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path></svg> <a href="${linkedin.url}" target="_blank" style="color: #0066cc; text-decoration: none;">LinkedIn</a></span><span style="margin: 0 8px; color: #999;">|</span>`;
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
        contactInfo += `<span style="margin: 0 8px; color: #999;">|</span><span style="display: inline;"><svg height="12" width="12" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: middle; margin-right: 4px;"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path></svg> <a href="${github.url}" target="_blank" style="color: #0066cc; text-decoration: none;">GitHub</a></span>`;
      }
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
    
    console.log(`✅ PDF exported successfully to ${outputPath}`);
  } catch (error) {
    console.error('❌ Error exporting PDF:', error.message);
    process.exit(1);
  }
}

// Support command-line usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const resumePath = args[0] || './resume.json';
  const outputPath = args[1] || './resume.pdf';
  
  exportPDF(resumePath, outputPath);
}

// Export for programmatic usage
module.exports = { exportPDF };

