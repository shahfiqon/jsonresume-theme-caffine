#!/usr/bin/env node

const { generateResumePDF } = require('./generate-resume.js');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);

function showHelp() {
  console.log(`
Usage: node cli.js [options]

Options:
  --input, -i <path>     Path to resume.json file (required)
  --output, -o <path>    Path for output PDF (default: ./resume.pdf)
  --tmp-dir <path>       Temporary directory for intermediate files (default: /tmp)
  --help, -h             Show this help message

Examples:
  # Generate PDF from resume.json in current directory
  node cli.js -i ./resume.json -o ./output.pdf

  # Generate PDF from resume in tmp directory
  node cli.js -i /tmp/tailored-resume.json -o /tmp/resume-output.pdf

  # Use custom tmp directory
  node cli.js -i ./resume.json -o ./output.pdf --tmp-dir ./tmp
  `);
}

// Parse arguments
const options = {
  input: null,
  output: './resume.pdf',
  tmpDir: '/tmp'
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--help':
    case '-h':
      showHelp();
      process.exit(0);
      break;
    case '--input':
    case '-i':
      options.input = args[++i];
      break;
    case '--output':
    case '-o':
      options.output = args[++i];
      break;
    case '--tmp-dir':
      options.tmpDir = args[++i];
      break;
    default:
      console.error(`Unknown option: ${args[i]}`);
      showHelp();
      process.exit(1);
  }
}

// Validate input
if (!options.input) {
  console.error('Error: --input is required');
  showHelp();
  process.exit(1);
}

if (!fs.existsSync(options.input)) {
  console.error(`Error: Input file not found: ${options.input}`);
  process.exit(1);
}

// Run the generation
(async () => {
  try {
    console.log(`📄 Generating PDF from: ${options.input}`);
    console.log(`📁 Output path: ${options.output}`);
    
    const result = await generateResumePDF({
      resume: options.input,
      outputPath: options.output,
      tmpDir: options.tmpDir
    });
    
    console.log(`✅ Success! PDF generated at: ${result}`);
  } catch (error) {
    console.error('❌ Failed to generate PDF:', error.message);
    process.exit(1);
  }
})();


