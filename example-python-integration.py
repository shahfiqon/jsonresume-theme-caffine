#!/usr/bin/env python3
"""
Example Python integration for AI Job Bot

This script demonstrates how to use the jsonresume-theme-caffine
from Python to generate tailored resumes.
"""

import json
import subprocess
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional


class ResumeGenerator:
    """Resume generation service for AI Job Bot integration."""
    
    def __init__(self, theme_path: str = "/home/shadeform/jsonresume-theme-caffine"):
        """
        Initialize the resume generator.
        
        Args:
            theme_path: Path to the jsonresume-theme-caffine directory
        """
        self.theme_path = Path(theme_path)
        self.cli_script = self.theme_path / "cli.js"
        
        if not self.cli_script.exists():
            raise FileNotFoundError(f"CLI script not found at: {self.cli_script}")
    
    def generate_pdf(
        self,
        resume_data: Dict[str, Any],
        output_path: str,
        tmp_dir: str = "/tmp"
    ) -> str:
        """
        Generate a PDF resume from resume data.
        
        Args:
            resume_data: Resume data as a dictionary (JSON Resume format)
            output_path: Path where the PDF should be saved
            tmp_dir: Temporary directory for intermediate files
        
        Returns:
            Path to the generated PDF
        
        Raises:
            subprocess.CalledProcessError: If PDF generation fails
        """
        # Create temp file for resume JSON
        with tempfile.NamedTemporaryFile(
            mode='w',
            suffix='.json',
            dir=tmp_dir,
            delete=False
        ) as tmp_file:
            json.dump(resume_data, tmp_file, indent=2)
            tmp_resume_path = tmp_file.name
        
        try:
            # Call Node.js CLI to generate PDF
            result = subprocess.run(
                [
                    'node',
                    str(self.cli_script),
                    '-i', tmp_resume_path,
                    '-o', output_path,
                    '--tmp-dir', tmp_dir
                ],
                capture_output=True,
                text=True,
                check=True
            )
            
            print(f"✅ PDF generated: {output_path}")
            return output_path
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to generate PDF:")
            print(f"   stdout: {e.stdout}")
            print(f"   stderr: {e.stderr}")
            raise
        finally:
            # Clean up temporary file
            Path(tmp_resume_path).unlink(missing_ok=True)
    
    def tailor_resume_for_job(
        self,
        base_resume: Dict[str, Any],
        job_description: str,
        job_title: str,
        job_keywords: list[str]
    ) -> Dict[str, Any]:
        """
        Tailor a resume for a specific job.
        
        This is a simple example. In production, you'd use AI/LLM
        to intelligently modify the resume.
        
        Args:
            base_resume: Original resume data
            job_description: Job description text
            job_title: Job title
            job_keywords: Keywords to emphasize
        
        Returns:
            Modified resume data
        """
        tailored = base_resume.copy()
        
        # Update summary to mention the job
        if 'basics' in tailored:
            original_summary = tailored['basics'].get('summary', '')
            tailored['basics']['summary'] = (
                f"Professional seeking {job_title} position. {original_summary}"
            )
        
        # Add keywords to highlight (if your theme supports it)
        if 'meta' not in tailored:
            tailored['meta'] = {}
        tailored['meta']['keywords'] = job_keywords
        tailored['meta']['targetJob'] = job_title
        
        # In production, you might:
        # - Reorder work experience by relevance
        # - Highlight matching skills
        # - Adjust accomplishments to emphasize relevant ones
        # - Use LLM to rewrite descriptions to match job requirements
        
        return tailored


def example_usage():
    """Demonstrate how to use the ResumeGenerator."""
    
    # Initialize generator
    generator = ResumeGenerator()
    
    # Load base resume (in production, this would come from your database)
    base_resume_path = Path(__file__).parent / "resume-sample.json"
    with open(base_resume_path) as f:
        base_resume = json.load(f)
    
    # Simulate a job from the database
    job = {
        'id': 12345,
        'title': 'Senior Software Engineer',
        'description': 'Looking for an experienced engineer with Python, Docker, and API development skills.',
        'keywords': ['Python', 'Docker', 'API', 'Microservices', 'JavaScript']
    }
    
    # Tailor the resume
    print(f"📝 Tailoring resume for job: {job['title']} (ID: {job['id']})")
    tailored_resume = generator.tailor_resume_for_job(
        base_resume=base_resume,
        job_description=job['description'],
        job_title=job['title'],
        job_keywords=job['keywords']
    )
    
    # Generate PDF
    output_dir = Path("/tmp/ai-job-bot-resumes")
    output_dir.mkdir(exist_ok=True, parents=True)
    
    output_path = output_dir / f"resume_job_{job['id']}.pdf"
    
    print(f"🔄 Generating PDF...")
    generator.generate_pdf(
        resume_data=tailored_resume,
        output_path=str(output_path),
        tmp_dir="/tmp"
    )
    
    print(f"\n✅ Success!")
    print(f"   Tailored resume saved to: {output_path}")
    print(f"   You can now serve this file to the user or store it for later use.")


if __name__ == "__main__":
    try:
        example_usage()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)

