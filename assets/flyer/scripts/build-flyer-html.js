/**
 * Build standalone flyer HTML from events.json
 * Creates flyer-template.html with actual event data
 */

const fs = require('fs').promises;
const path = require('path');

// Paths
const EVENTS_PATH = path.join(__dirname, '../../../assets/data/events.json');
const FLYER_EVENTS_PATH = path.join(__dirname, '../flyer-events.json');
const OUTPUT_PATH = path.join(__dirname, '../flyer-template.html');
const STYLES_PATH = path.join(__dirname, '../flyer-styles.css');

/**
 * Parse date from event date string
 */
function parseDate(dateString) {
  if (Array.isArray(dateString)) {
    dateString = dateString[0];
  }
  
  const firstDate = dateString.split(',').slice(0, 3).join(',');
  const match = firstDate.match(/(\d{2})\.(\d{2})\.(\d{2}),?\s*(\d{2}):(\d{2})/);
  
  if (match) {
    const [, day, month, year, hours, minutes] = match;
    const fullYear = `20${year}`;
    return new Date(`${fullYear}-${month}-${day}T${hours}:${minutes}:00`);
  }
  
  console.warn('Could not parse date from:', dateString);
  return new Date();
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  if (Array.isArray(dateString)) {
    return dateString[0];
  }
  return dateString;
}

/**
 * Load and filter upcoming events
 */
async function loadEvents() {
  const data = await fs.readFile(EVENTS_PATH, 'utf-8');
  const events = JSON.parse(data);
  
  const now = new Date();
  
  const upcomingEvents = events.upcoming
    .map(event => ({
      ...event,
      parsedDate: parseDate(event.dates || event.date)
    }))
    .filter(event => event.parsedDate >= now)
    .sort((a, b) => a.parsedDate - b.parsedDate)
    .slice(0, 3);
  
  return upcomingEvents;
}

/**
 * Generate HTML for event blocks
 */
function generateEventHTML(events, flyerTitles, flyerDescriptions) {
  return events.map(event => {
    const dateDisplay = formatDate(event.dates || event.date);
    // Fix image path - events.json has "assets/img/..." but we need "../img/..." from flyer folder
    const imagePath = event.image.replace('assets/', '../');

    // Use flyer-specific title/description if available, otherwise fall back to original
    const title = flyerTitles[event.title] || event.title;
    const description = flyerDescriptions[event.title] || event.description;

    return `      <!-- ${event.title} -->
      <div class="event-block">
        <div class="event-content">
          <h2 class="event-title">${title}</h2>
          <div class="event-date">${dateDisplay}</div>
          <div class="event-description">${description}</div>
        </div>
        <img src="${imagePath}" alt="${title}" class="event-image" />
      </div>`;
  }).join('\n\n');
}

/**
 * Load flyer-specific titles and descriptions
 */
async function loadFlyerOverrides() {
  try {
    const data = await fs.readFile(FLYER_EVENTS_PATH, 'utf-8');
    const json = JSON.parse(data);
    return {
      titles: json['event-titles'] || {},
      descriptions: json['event-descriptions'] || {}
    };
  } catch (error) {
    console.warn('⚠️  Could not load flyer-events.json, using original titles/descriptions');
    return { titles: {}, descriptions: {} };
  }
}

/**
 * Build complete HTML file
 */
async function buildHTML() {
  try {
    console.log('📋 Loading events...');
    const events = await loadEvents();
    
    if (events.length === 0) {
      console.error('❌ No upcoming events found!');
      return;
    }
    
    console.log(`✅ Found ${events.length} upcoming event(s)`);
    events.forEach((event, i) => {
      console.log(`   ${i + 1}. ${event.title} - ${formatDate(event.dates || event.date)}`);
    });
    
    console.log('📝 Loading flyer titles/descriptions...');
    const { titles: flyerTitles, descriptions: flyerDescriptions } = await loadFlyerOverrides();

    events.forEach(event => {
      if (flyerTitles[event.title]) {
        console.log(`   ✂️  "${event.title}" → "${flyerTitles[event.title]}"`);
      }
    });

    console.log('\n🎨 Generating HTML...');

    const eventsHTML = generateEventHTML(events, flyerTitles, flyerDescriptions);
    
    const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>KiK Flyer</title>
  <link rel="stylesheet" href="flyer-styles.css">
  <style>
    /* Export mode - full size, no scaling */
    body.export-mode {
      background: var(--color-dark-blue);
      padding: 0;
      display: block;
      min-height: auto;
    }
    
    body.export-mode .flyer-container {
      transform: none;
      box-shadow: none;
    }
  </style>
  <script>
    // Detect if opened directly in browser vs export
    if (window.location.search.includes('export=true')) {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.classList.add('export-mode');
      });
    }
  </script>
</head>
<body>
  <div class="flyer-container">
    <!-- Events Section -->
    <div id="events-section">
${eventsHTML}
    </div>
    
    <!-- Bottom Section -->
    <div class="flyer-bottom">
      <img src="flyerbottom.png" alt="Contact Information" />
    </div>
  </div>
</body>
</html>`;
    
    await fs.writeFile(OUTPUT_PATH, html);
    
    console.log(`✅ HTML saved: ${OUTPUT_PATH}`);
    console.log('\n📝 You can now:');
    console.log('   1. Open flyer-template.html in your browser to preview');
    console.log('   2. Edit flyer-styles.css and refresh to see changes');
    console.log('   3. Run "npm run generate-flyer" to export PDF/JPG');
    
  } catch (error) {
    console.error('❌ Error building HTML:', error);
    process.exit(1);
  }
}

buildHTML();
