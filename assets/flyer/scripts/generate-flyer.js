/**
 * Flyer Generator for Krienser Industrie Konzerte
 * Exports flyer-template.html to JPG and creates 2-page PDF
 */

const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');

// Paths
const TEMPLATE_PATH = path.join(__dirname, '../flyer-template.html');
const OUTPUT_DIR = path.join(__dirname, '../generated');
const FRONT_PAGE_PATH = path.join(OUTPUT_DIR, 'flyer-front.jpg');

// A5 dimensions at 300 DPI
const FLYER_WIDTH = 1754;
const FLYER_HEIGHT = 2480;

/**
 * Optimize image for PDF embedding
 */
async function optimizeImageForPDF(imagePath) {
  const optimizedPath = imagePath.replace('.jpg', '-optimized.jpg');
  
  await sharp(imagePath)
    .resize(FLYER_WIDTH, FLYER_HEIGHT, { 
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .jpeg({ 
      quality: 80,
      progressive: true,
      optimizeScans: true
    })
    .toFile(optimizedPath);
  
  return optimizedPath;
}

/**
 * Create 2-page PDF from front page and generated flyer
 */
async function createPDF(flyerJpgPath, outputPdfPath) {
  let tempFiles = [];
  
  try {
    // Check if front page exists
    let hasFrontPage = true;
    try {
      await fs.access(FRONT_PAGE_PATH);
    } catch (error) {
      hasFrontPage = false;
      console.warn('⚠️  flyer-front.jpg not found, creating PDF with only the flyer page');
    }
    
    // Create PDF
    const pdfDoc = await PDFDocument.create();
    
    if (hasFrontPage) {
      // Optimize front page
      const optimizedFront = await optimizeImageForPDF(FRONT_PAGE_PATH);
      tempFiles.push(optimizedFront);
      
      // Page 1: Front page
      const frontImageBytes = await fs.readFile(optimizedFront);
      const frontImage = await pdfDoc.embedJpg(frontImageBytes);
      
      const page1 = pdfDoc.addPage([FLYER_WIDTH, FLYER_HEIGHT]);
      page1.drawImage(frontImage, {
        x: 0,
        y: 0,
        width: FLYER_WIDTH,
        height: FLYER_HEIGHT,
      });
    }
    
    // Page 2: Generated flyer
    const flyerImageBytes = await fs.readFile(flyerJpgPath);
    const flyerImage = await pdfDoc.embedJpg(flyerImageBytes);
    
    const page2 = pdfDoc.addPage([FLYER_WIDTH, FLYER_HEIGHT]);
    page2.drawImage(flyerImage, {
      x: 0,
      y: 0,
      width: FLYER_WIDTH,
      height: FLYER_HEIGHT,
    });
    
    // Save PDF
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPdfPath, pdfBytes);
    
    // Cleanup temp files
    for (const tempFile of tempFiles) {
      try {
        await fs.unlink(tempFile);
      } catch (err) {
        // Ignore cleanup errors
      }
    }
    
  } catch (error) {
    // Cleanup temp files on error
    for (const tempFile of tempFiles) {
      try {
        await fs.unlink(tempFile);
      } catch (err) {
        // Ignore cleanup errors
      }
    }
    console.error('❌ Error creating PDF:', error);
    throw error;
  }
}

/**
 * Generate flyer using Puppeteer
 */
async function generateFlyer() {
  try {
    // Check if template exists
    try {
      await fs.access(TEMPLATE_PATH);
    } catch (error) {
      console.error('❌ flyer-template.html not found!');
      console.log('💡 Run "npm run build-flyer-html" first to generate the template.');
      process.exit(1);
    }
    
    console.log('📄 Loading flyer template...');
    
    // Create output directory if it doesn't exist
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    
    console.log('🚀 Launching browser...');
    
    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport to flyer dimensions
    await page.setViewport({
      width: FLYER_WIDTH,
      height: FLYER_HEIGHT,
      deviceScaleFactor: 2 // 2x for 600 DPI (high quality)
    });
    
    // Navigate to the HTML file with export mode
    await page.goto(`file://${TEMPLATE_PATH}?export=true`, {
      waitUntil: 'networkidle0'
    });
    
    // Generate timestamp for filenames
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Generate JPG
    console.log('🖼️  Generating JPG...');
    const screenshotPath = path.join(OUTPUT_DIR, `temp-screenshot.png`);
    
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      type: 'png'
    });
    
    // Convert PNG to JPG with high quality using Sharp
    const jpgPath = path.join(OUTPUT_DIR, `flyer-${timestamp}.jpg`);
    const jpgLatestPath = path.join(OUTPUT_DIR, 'flyer-latest.jpg');
    
    await sharp(screenshotPath)
      .jpeg({ 
        quality: 80,
        progressive: true,
        optimizeScans: true
      })
      .toFile(jpgPath);
    
    // Copy to latest
    await fs.copyFile(jpgPath, jpgLatestPath);
    
    console.log(`✅ JPG saved: ${jpgPath}`);
    console.log(`✅ JPG saved: ${jpgLatestPath}`);
    
    // Cleanup screenshot
    await fs.unlink(screenshotPath);
    
    await browser.close();
    
    // Generate 2-page PDF
    console.log('📄 Creating 2-page PDF...');
    const pdfPath = path.join(OUTPUT_DIR, `flyer-${timestamp}.pdf`);
    const pdfLatestPath = path.join(OUTPUT_DIR, 'flyer-latest.pdf');
    
    await createPDF(jpgLatestPath, pdfPath);
    await fs.copyFile(pdfPath, pdfLatestPath);
    
    console.log(`✅ PDF saved: ${pdfPath}`);
    console.log(`✅ PDF saved: ${pdfLatestPath}`);
    
    console.log('\n🎉 Flyer generation complete!');
    console.log(`\n📁 Output directory: ${OUTPUT_DIR}`);
    
  } catch (error) {
    console.error('❌ Error generating flyer:', error);
    process.exit(1);
  }
}

// Run the generator
generateFlyer();
