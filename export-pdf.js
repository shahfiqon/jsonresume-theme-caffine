const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const theme = require('./index.js');

async function exportPDF() {
  try {
    // Read resume.json
    const resumeData = JSON.parse(fs.readFileSync('./resume.json', 'utf-8'));
    
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
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF with repeatable header and footer
    await page.pdf({
      path: 'resume.pdf',
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #666;">
          <span>${resumeData.basics.name} - Resume</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; padding: 10px 0; border-top: 1px solid #e0e0e0; color: #666;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
      margin: {
        top: '80px',    // Space for header
        right: '40px',
        bottom: '80px', // Space for footer
        left: '40px'
      }
    });
    
    await browser.close();
    
    console.log('✅ PDF exported successfully to resume.pdf');
  } catch (error) {
    console.error('❌ Error exporting PDF:', error.message);
    process.exit(1);
  }
}

exportPDF();

