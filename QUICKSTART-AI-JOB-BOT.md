# Quick Start: Integrating with AI Job Bot

This guide will get you up and running with resume generation in AI Job Bot in 10 minutes.

## Prerequisites

✅ Node.js installed (already available)
✅ Python 3.x installed (already available)
✅ Theme built and tested (already done - all tests passing!)

## Step 1: Copy the Resume Service (30 seconds)

```bash
# Create the service directory if it doesn't exist
mkdir -p /home/shadeform/ai-job-bot/backend/app/services

# Copy the example integration
cp /home/shadeform/jsonresume-theme-caffine/example-python-integration.py \
   /home/shadeform/ai-job-bot/backend/app/services/resume_service.py
```

## Step 2: Add API Endpoint (2 minutes)

Create or update `/home/shadeform/ai-job-bot/backend/app/api/resume.py`:

```python
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import json

from app.auth import get_current_user
from app.db import get_db
from app.models.user import User
from app.models.job import Job
from app.services.resume_service import ResumeGenerator

router = APIRouter(prefix="/api/resume", tags=["resume"])
resume_generator = ResumeGenerator()

@router.post("/generate/{job_id}")
async def generate_tailored_resume(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a tailored resume PDF for a specific job."""
    
    # Check if user has a resume
    if not current_user.resume_json:
        raise HTTPException(
            status_code=400,
            detail="No resume found. Please upload your resume first."
        )
    
    # Get job details
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    try:
        # Parse base resume
        base_resume = json.loads(current_user.resume_json)
        
        # Tailor resume for this job
        # TODO: Add your AI logic here to intelligently tailor the resume
        tailored_resume = resume_generator.tailor_resume_for_job(
            base_resume=base_resume,
            job_description=job.description or "",
            job_title=job.title,
            job_keywords=[]  # Extract from job.description if available
        )
        
        # Generate PDF
        output_path = f"/tmp/resumes/resume_job_{job_id}_user_{current_user.id}.pdf"
        resume_generator.generate_pdf(
            resume_data=tailored_resume,
            output_path=output_path
        )
        
        # Return PDF
        return FileResponse(
            output_path,
            media_type="application/pdf",
            filename=f"resume_{job.title.replace(' ', '_')}_{job_id}.pdf"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate resume: {str(e)}"
        )
```

## Step 3: Register the Router (30 seconds)

In `/home/shadeform/ai-job-bot/backend/app/main.py`, add:

```python
from app.api import resume  # Add this import

# Then in your app setup, add:
app.include_router(resume.router)
```

## Step 4: Add Frontend Button (2 minutes)

In your job detail component (e.g., `/home/shadeform/ai-job-bot/frontend/app/jobs/[id]/page.tsx`):

### Add API function to `/home/shadeform/ai-job-bot/frontend/lib/api.ts`:

```typescript
export async function generateTailoredResume(jobId: number): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/resume/generate/${jobId}`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      detail: "Failed to generate resume" 
    }));
    throw new ApiError(
      error.detail || "Failed to generate resume",
      response.status,
      response
    );
  }

  return await response.blob();
}
```

### Add button to job component:

```typescript
import { generateTailoredResume } from "@/lib/api";

// In your component:
const [isGenerating, setIsGenerating] = useState(false);

const handleDownloadResume = async (jobId: number) => {
  setIsGenerating(true);
  try {
    const pdfBlob = await generateTailoredResume(jobId);
    
    // Download the PDF
    const url = window.URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tailored_resume_job_${jobId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    // Show success message
    alert('Resume generated successfully!');
  } catch (error) {
    console.error('Failed to generate resume:', error);
    alert('Failed to generate resume. Please try again.');
  } finally {
    setIsGenerating(false);
  }
};

// In your JSX:
<button
  onClick={() => handleDownloadResume(job.id)}
  disabled={isGenerating}
  className="btn btn-primary"
>
  {isGenerating ? 'Generating...' : 'Download Tailored Resume'}
</button>
```

## Step 5: Test It! (1 minute)

```bash
# 1. Start your backend (if not already running)
cd /home/shadeform/ai-job-bot/backend
python -m app.main  # or however you start your backend

# 2. Start your frontend (if not already running)
cd /home/shadeform/ai-job-bot/frontend
npm run dev

# 3. Navigate to a job detail page
# 4. Click "Download Tailored Resume"
# 5. PDF should download automatically!
```

## Verification Checklist

✅ Resume service copied and available
✅ API endpoint created
✅ Router registered in main.py
✅ Frontend API function added
✅ Button added to job component
✅ Backend server running
✅ Frontend server running
✅ Test download works

## What's Working Now

After completing these steps, users will be able to:

1. **View any job** in the AI Job Bot
2. **Click "Download Tailored Resume"** button
3. **Automatically receive a PDF** tailored for that specific job
4. The resume will be **professionally formatted** using the Caffeine theme
5. The resume can be **customized** based on job requirements (with your AI logic)

## Directory Structure

```
/home/shadeform/
├── ai-job-bot/
│   ├── backend/
│   │   └── app/
│   │       ├── api/
│   │       │   └── resume.py          # New API endpoint
│   │       ├── services/
│   │       │   └── resume_service.py  # New service
│   │       └── main.py                # Updated to include router
│   └── frontend/
│       ├── lib/
│       │   └── api.ts                 # Updated with new function
│       └── app/
│           └── jobs/[id]/
│               └── page.tsx           # Updated with button
│
└── jsonresume-theme-caffine/          # Theme (ready to use!)
    ├── generate-resume.js
    ├── cli.js
    ├── export-pdf.js
    └── ...
```

## Generated Files Location

PDFs will be saved to:
```
/tmp/resumes/resume_job_{job_id}_user_{user_id}.pdf
```

You can:
- Serve them directly (current approach)
- Store them in a database
- Upload to S3/cloud storage
- Keep in tmp and clean up periodically

## Next Steps (Optional Enhancements)

### 1. Add AI-Powered Resume Tailoring

Replace the simple `tailor_resume_for_job()` with AI logic:

```python
def tailor_resume_for_job(self, base_resume, job_description, job_title, job_keywords):
    # Use your existing Ollama integration!
    from app.utils.ollama_utils import call_ollama
    
    prompt = f"""
    Given this resume: {json.dumps(base_resume)}
    
    And this job description: {job_description}
    
    Reorder and modify the resume to best match this job.
    Focus on relevant experience and skills.
    Return the modified resume in the same JSON format.
    """
    
    response = call_ollama(prompt)
    return json.loads(response)
```

### 2. Add Caching

```python
import hashlib
from pathlib import Path

def get_cached_resume(user_id, job_id, resume_hash):
    cache_path = Path(f"/tmp/resumes/cache/{user_id}_{job_id}_{resume_hash}.pdf")
    if cache_path.exists():
        return str(cache_path)
    return None
```

### 3. Add Background Processing

```python
# Use Celery or similar for async generation
@celery.task
def generate_resume_async(user_id, job_id):
    # Generate resume in background
    # Notify user when ready (email, notification, etc.)
    pass
```

### 4. Add Analytics

```python
# Track resume generations
from app.models.resume_generation import ResumeGeneration

generation = ResumeGeneration(
    user_id=current_user.id,
    job_id=job_id,
    generated_at=datetime.now()
)
db.add(generation)
db.commit()
```

## Troubleshooting

### "Module not found" error
```bash
# Make sure Node.js dependencies are installed
cd /home/shadeform/jsonresume-theme-caffine
npm install
```

### "Command not found: node"
```bash
# Install Node.js if needed
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### "Puppeteer failed to launch"
```bash
# Install Puppeteer dependencies
sudo apt-get install -y ca-certificates fonts-liberation libasound2 \
  libatk-bridge2.0-0 libatk1.0-0 libgbm1 libgtk-3-0 libnss3 libxss1 xdg-utils
```

### "Permission denied" on /tmp/resumes
```bash
# Create directory with proper permissions
sudo mkdir -p /tmp/resumes
sudo chmod 755 /tmp/resumes
sudo chown $USER:$USER /tmp/resumes
```

## Support

- **Full documentation**: See `INTEGRATION.md`
- **Test the theme**: Run `node test-generation.js` in theme directory
- **Python example**: Run `python3 example-python-integration.py`
- **Summary**: See `SUMMARY.md` for complete overview

---

## You're All Set! 🎉

The theme is production-ready and fully tested. Start integrating and generating beautiful tailored resumes for your users!

Questions? Check the full `INTEGRATION.md` guide or review the working examples.

