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
    
    // Generate PDF with repeatable header and footer
    await page.pdf({
      path: 'resume.pdf',
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
    
    console.log('✅ PDF exported successfully to resume.pdf');
  } catch (error) {
    console.error('❌ Error exporting PDF:', error.message);
    process.exit(1);
  }
}

exportPDF();

