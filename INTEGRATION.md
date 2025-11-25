# Integration Guide for AI Job Bot

This guide explains how to integrate the `jsonresume-theme-caffine` with the `ai-job-bot` to generate tailored resumes dynamically.

## Overview

The theme has been enhanced to support:
- Dynamic resume.json file loading from any directory (including tmp)
- Programmatic API for generating PDFs from resume objects or files
- Command-line interface for batch processing
- Flexible output path configuration

## Installation

From the ai-job-bot project, you can use the theme as a Node.js module:

```bash
# If running from ai-job-bot backend
cd /path/to/ai-job-bot/backend
npm install /home/shadeform/jsonresume-theme-caffine
```

Or reference it directly without installing:

```javascript
const { generateResumePDF } = require('/home/shadeform/jsonresume-theme-caffine/generate-resume.js');
```

## Usage Methods

### Method 1: Programmatic API (Recommended for AI Job Bot)

```javascript
const { generateResumePDF, generateResumeHTML } = require('jsonresume-theme-caffine/generate-resume');
const fs = require('fs');
const path = require('path');

// Example: Generate a tailored resume for a specific job
async function generateTailoredResume(userResumeJson, jobId) {
  // 1. Create tmp directory if it doesn't exist
  const tmpDir = '/tmp/resumes';
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  // 2. Modify resume based on job (your AI logic here)
  const tailoredResume = {
    ...userResumeJson,
    // Add job-specific modifications
    // e.g., highlight relevant skills, reorder experience, etc.
  };

  // 3. Generate PDF
  const outputPath = path.join(tmpDir, `resume_job_${jobId}.pdf`);
  
  await generateResumePDF({
    resume: tailoredResume,  // Can be object or file path
    outputPath: outputPath,
    tmpDir: tmpDir
  });

  return outputPath;
}

// Example usage
const userResume = JSON.parse(fs.readFileSync('/path/to/user/resume.json'));
generateTailoredResume(userResume, 12345)
  .then(pdfPath => console.log(`Generated: ${pdfPath}`))
  .catch(err => console.error('Error:', err));
```

### Method 2: Command Line Interface

```bash
# Generate from a specific resume file
cd /home/shadeform/jsonresume-theme-caffine
node cli.js -i /tmp/tailored-resume.json -o /tmp/output.pdf

# Or use the export script directly
node export-pdf.js /tmp/resume.json /tmp/output.pdf
```

### Method 3: NPM Scripts

```bash
# Export with default paths
npm run export

# Or use the generate script
npm run generate
```

## Integration with AI Job Bot Backend

Here's a complete example of how to integrate this with your FastAPI backend:

### 1. Create a Resume Service (Python)

```python
# backend/app/services/resume_service.py
import json
import subprocess
import tempfile
from pathlib import Path
from typing import Dict, Any

class ResumeService:
    def __init__(self, theme_path: str = "/home/shadeform/jsonresume-theme-caffine"):
        self.theme_path = Path(theme_path)
        self.generator_script = self.theme_path / "generate-resume.js"
    
    async def generate_tailored_resume(
        self,
        resume_json: Dict[str, Any],
        job_id: int,
        output_dir: str = "/tmp/resumes"
    ) -> str:
        """
        Generate a tailored resume PDF for a specific job.
        
        Args:
            resume_json: The user's resume as a JSON object
            job_id: The job ID to tailor the resume for
            output_dir: Directory to store generated PDFs
        
        Returns:
            Path to the generated PDF
        """
        # Ensure output directory exists
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        # Create temporary resume file
        with tempfile.NamedTemporaryFile(
            mode='w',
            suffix='.json',
            dir=output_dir,
            delete=False
        ) as tmp_resume:
            json.dump(resume_json, tmp_resume, indent=2)
            tmp_resume_path = tmp_resume.name
        
        try:
            # Define output path
            output_pdf = Path(output_dir) / f"resume_job_{job_id}.pdf"
            
            # Call Node.js script to generate PDF
            result = subprocess.run(
                [
                    'node',
                    str(self.generator_script / '../cli.js'),
                    '-i', tmp_resume_path,
                    '-o', str(output_pdf),
                    '--tmp-dir', output_dir
                ],
                capture_output=True,
                text=True,
                check=True
            )
            
            return str(output_pdf)
            
        finally:
            # Clean up temporary resume file
            Path(tmp_resume_path).unlink(missing_ok=True)
    
    def tailor_resume_for_job(
        self,
        resume_json: Dict[str, Any],
        job_description: str,
        job_requirements: list
    ) -> Dict[str, Any]:
        """
        Modify resume to highlight relevant experience for a specific job.
        This is where you'd implement your AI logic to tailor the resume.
        
        Args:
            resume_json: Original resume
            job_description: Job description text
            job_requirements: List of job requirements/skills
        
        Returns:
            Modified resume JSON
        """
        tailored = resume_json.copy()
        
        # TODO: Implement AI-based tailoring logic
        # Examples:
        # - Reorder work experience to prioritize relevant roles
        # - Highlight skills that match job requirements
        # - Adjust summary to align with job description
        # - Add keywords from job description
        
        return tailored
```

### 2. Add API Endpoint

```python
# backend/app/api/resume.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.models.user import User
from app.models.job import Job
from app.services.resume_service import ResumeService

router = APIRouter(prefix="/api/resume", tags=["resume"])
resume_service = ResumeService()

@router.post("/generate/{job_id}")
async def generate_tailored_resume(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a tailored resume PDF for a specific job."""
    
    # Get user's base resume
    if not current_user.resume_json:
        raise HTTPException(
            status_code=400,
            detail="No resume found. Please upload your resume first."
        )
    
    # Get job details
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Tailor resume for this job
    base_resume = json.loads(current_user.resume_json)
    tailored_resume = resume_service.tailor_resume_for_job(
        base_resume,
        job.description or "",
        job.requirements or []
    )
    
    # Generate PDF
    try:
        pdf_path = await resume_service.generate_tailored_resume(
            tailored_resume,
            job_id
        )
        
        # Return the PDF file
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=f"resume_job_{job_id}.pdf"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate resume: {str(e)}"
        )
```

### 3. Frontend Integration

```typescript
// frontend/lib/api.ts
export async function generateTailoredResume(jobId: number): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/resume/generate/${jobId}`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to generate tailored resume");
  }

  return await response.blob();
}

// Usage in a component
const handleDownloadResume = async (jobId: number) => {
  try {
    const pdfBlob = await generateTailoredResume(jobId);
    const url = window.URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume_job_${jobId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Failed to download resume:', error);
  }
};
```

## API Reference

### generateResumePDF(options)

Generate a PDF from a resume.

**Parameters:**
- `options.resume` (Object|string): Resume data object or path to JSON file
- `options.outputPath` (string): Path where the PDF should be saved
- `options.tmpDir` (string, optional): Temporary directory for intermediate files (default: '/tmp')

**Returns:** Promise<string> - Path to the generated PDF

**Example:**

```javascript
await generateResumePDF({
  resume: resumeObject,
  outputPath: '/tmp/resumes/output.pdf',
  tmpDir: '/tmp'
});
```

### generateResumeHTML(resume)

Generate HTML from a resume (without creating PDF).

**Parameters:**
- `resume` (Object|string): Resume data object or path to JSON file

**Returns:** string - Rendered HTML

**Example:**

```javascript
const html = generateResumeHTML(resumeObject);
```

## File Structure

```
jsonresume-theme-caffine/
├── generate-resume.js     # Main programmatic API
├── export-pdf.js          # Legacy export script (enhanced)
├── cli.js                 # Command-line interface
├── index.js               # Theme renderer
└── INTEGRATION.md         # This file
```

## Tips for AI Job Bot Integration

1. **Resume Tailoring Strategy:**
   - Extract keywords from job descriptions
   - Reorder work experience by relevance
   - Highlight matching skills
   - Customize summary/objective
   - Use the `boldKeywords` Handlebars helper to emphasize matching terms

2. **Performance Optimization:**
   - Cache generated PDFs by job_id + user_id + resume_version
   - Generate PDFs asynchronously using background tasks (Celery)
   - Clean up old PDFs periodically

3. **Error Handling:**
   - Validate resume JSON schema before generation
   - Handle missing Puppeteer dependencies
   - Provide fallback to HTML generation if PDF fails

4. **Testing:**
   - Test with various resume formats
   - Test with missing optional fields
   - Test concurrent PDF generation

## Troubleshooting

### Puppeteer Issues on Linux

If you encounter Puppeteer browser launch issues:

```bash
# Install required dependencies
sudo apt-get update
sudo apt-get install -y \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libgbm1 \
  libgtk-3-0 \
  libnss3 \
  libxss1 \
  xdg-utils
```

### Permission Issues

Ensure tmp directories have proper permissions:

```bash
mkdir -p /tmp/resumes
chmod 755 /tmp/resumes
```

## Support

For issues or questions:
- Theme: https://github.com/kelyvin/jsonresume-theme-caffeine
- JSON Resume Schema: https://jsonresume.org/schema/

