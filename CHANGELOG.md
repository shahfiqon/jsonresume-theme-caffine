# Changelog

## [2.1.0] - 2025-11-25

### Added - Dynamic Resume Generation Support

This release adds comprehensive support for dynamic resume generation from any location, enabling integration with applications like the AI Job Bot.

#### New Features:

1. **Dynamic File Path Support**
   - `export-pdf.js` now accepts command-line arguments for input/output paths
   - Can load resume.json from any directory, including tmp directories
   - Supports custom output paths for generated PDFs

2. **Programmatic API**
   - New `generate-resume.js` module with clean API for programmatic use
   - `generateResumePDF()` - Generate PDF from object or file path
   - `generateResumeHTML()` - Generate HTML from object or file path
   - Automatic tmp file management
   - Configurable tmp directory support

3. **Command Line Interface**
   - New `cli.js` for easy command-line PDF generation
   - Supports `--input`, `--output`, and `--tmp-dir` flags
   - Helpful error messages and usage information

4. **Integration Support**
   - `INTEGRATION.md` - Comprehensive integration guide
   - `example-python-integration.py` - Python integration example for AI Job Bot
   - Example resume tailoring logic
   - Best practices for production use

5. **Testing**
   - `test-generation.js` - Comprehensive test suite
   - Tests for file-based and object-based generation
   - Tests for custom tmp directories
   - Tests for AI Job Bot integration scenario
   - All tests passing (5/5)

### Changed:

- `export-pdf.js` - Now supports command-line arguments while maintaining backward compatibility
- `package.json` - Added new scripts and binary entry point

### Usage:

#### Command Line:
```bash
# Generate from custom location
node export-pdf.js /tmp/resume.json /tmp/output.pdf

# Or use the CLI
node cli.js -i /tmp/resume.json -o /tmp/output.pdf
```

#### Programmatic (Node.js):
```javascript
const { generateResumePDF } = require('./generate-resume');

await generateResumePDF({
  resume: resumeObject,  // or file path
  outputPath: '/tmp/output.pdf',
  tmpDir: '/tmp'
});
```

#### Programmatic (Python):
```python
from resume_generator import ResumeGenerator

generator = ResumeGenerator()
generator.generate_pdf(
    resume_data=resume_dict,
    output_path='/tmp/output.pdf'
)
```

### Integration Notes:

This theme is now ready for integration with the AI Job Bot to:
- Generate tailored resumes for specific job applications
- Store generated PDFs in tmp directories
- Serve PDFs to users dynamically
- Support batch resume generation

See `INTEGRATION.md` for detailed integration instructions.

### Backward Compatibility:

All existing functionality remains unchanged. The default behavior of `npm run export` continues to work as before.

---

## [2.0.1] - Previous Release

Previous changelog entries...

