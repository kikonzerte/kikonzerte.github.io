/**
 * Events loader and renderer for Krienser Industrie Konzerte
 * Loads events from events.json and dynamically renders them
 */

// Auto-generate ID from title (lowercase, remove special chars, replace spaces with hyphens)
function generateId(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Parse date from dateDisplay (e.g., "So, 29.03.26, 17:00" -> ISO date)
function parseDateFromDisplay(dateDisplay) {
  // Extract first date if multiple dates (e.g., "Sa, 30.05.26, 19:00, So, 31.05.26, 17:00")
  const firstDate = dateDisplay.split(',').slice(0, 3).join(',');
  
  // Match pattern: "DayName, DD.MM.YY, HH:MM"
  const match = firstDate.match(/(\d{2})\.(\d{2})\.(\d{2}),?\s*(\d{2}):(\d{2})/);
  
  if (match) {
    const [, day, month, year, hours, minutes] = match;
    const fullYear = `20${year}`; // Assume 20xx century
    // ISO format: YYYY-MM-DDTHH:MM:SS
    return `${fullYear}-${month}-${day}T${hours}:${minutes}:00`;
  }
  
  // Fallback: return current date if parsing fails
  console.warn('Could not parse date from:', dateDisplay);
  return new Date().toISOString();
}

// Auto-lookup image by date pattern (YY-MM-DD format in filename)
function findImageByDate(dateDisplay, imageHint = null) {
  // If image is explicitly provided, use it
  if (imageHint) {
    return `assets/img/upcoming/${imageHint}`;
  }
  
  // Extract date from dateDisplay: "So, 29.03.26, 17:00" -> "26-03-29"
  const match = dateDisplay.match(/(\d{2})\.(\d{2})\.(\d{2})/);
  
  if (match) {
    const [, day, month, year] = match;
    const datePattern = `${year}-${month}-${day}`;
    
    // Try common image extensions
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];
    
    // Return first match (you can implement actual file existence check if needed)
    // For now, assume .jpg as default
    return `assets/img/upcoming/${datePattern}.jpg`;
  }
  
  // Fallback to a placeholder or default image
  return 'assets/img/upcoming/placeholder.jpg';
}

// Process event to add missing fields
function processEvent(event) {
  // Auto-generate ID if missing
  if (!event.id) {
    event.id = generateId(event.title);
  }
  
  // Auto-generate date from dateDisplay if missing
  if (!event.date) {
    event.date = parseDateFromDisplay(event.dateDisplay);
  }
  
  // Auto-lookup image if missing
  if (!event.image) {
    event.image = findImageByDate(event.dateDisplay);
  }
  
  return event;
}

// Function to create calendar event (.ics file)
function createCalendarEvent(event) {
  const startDate = new Date(event.date);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
  
  // Format dates for iCalendar (YYYYMMDDTHHMMSS)
  const formatICalDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Krienser Industrie Konzerte//Event//DE',
    'BEGIN:VEVENT',
    `UID:${event.id}@kikonzerte.ch`,
    `DTSTAMP:${formatICalDate(new Date())}`,
    `DTSTART:${formatICalDate(startDate)}`,
    `DTEND:${formatICalDate(endDate)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.artists}\\n\\n${event.description.replace(/\n/g, '\\n')}`,
    `LOCATION:Krienser Industrie Konzerte, Kriens`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  // Create download link
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.id}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Function to create email mailto link
function createEmailLink(event) {
  const subject = encodeURIComponent(`Anmeldung: ${event.title} - ${event.dateDisplay}`);
  const body = encodeURIComponent(`Hallo,\n\nich möchte mich für folgendes Konzert anmelden:\n\n${event.title}\n${event.dateDisplay}\n\nViele Grüsse`);
  return `mailto:info@kikonzerte.ch?subject=${subject}&body=${body}`;
}

// Function to render a single event card
function renderEventCard(event) {
  const card = document.createElement('article');
  card.className = 'event-card';
  card.innerHTML = `
    <img src="${event.image}" alt="${event.title}" class="event-image" loading="lazy">
    <div class="event-content">
      <h3 class="event-title">${event.title}</h3>
      <p class="event-date" data-event-id="${event.id}">${event.dateDisplay}</p>
      <p class="event-artists">${event.artists}</p>
      <p class="event-description">${event.description}</p>
      <div class="event-footer">${event.footer}</div>
      <div class="event-actions">
        <a href="${createEmailLink(event)}" class="btn btn-orange">ANMELDEN</a>
      </div>
    </div>
  `;
  
  // Add click event to date for calendar download
  const dateElement = card.querySelector('.event-date');
  dateElement.addEventListener('click', (e) => {
    e.preventDefault();
    createCalendarEvent(event);
  });
  
  return card;
}

// Carousel navigation functions
function scrollCarousel(direction) {
  const container = document.getElementById('events-container');
  const cardWidth = container.querySelector('.event-card')?.offsetWidth || 0;
  const gap = parseInt(getComputedStyle(container).gap) || 0;
  const scrollAmount = cardWidth + gap;
  
  if (direction === 'left') {
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  } else {
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }
}

// Update navigation button states
function updateNavButtons() {
  const container = document.getElementById('events-container');
  const prevBtn = document.getElementById('events-prev');
  const nextBtn = document.getElementById('events-next');
  
  if (!prevBtn || !nextBtn || !container) return;
  
  // Check if at start
  prevBtn.disabled = container.scrollLeft <= 0;
  
  // Check if at end
  const maxScroll = container.scrollWidth - container.clientWidth;
  nextBtn.disabled = container.scrollLeft >= maxScroll - 1; // -1 for rounding errors
}

// Initialize carousel navigation
function initCarouselNav() {
  const container = document.getElementById('events-container');
  const prevBtn = document.getElementById('events-prev');
  const nextBtn = document.getElementById('events-next');
  
  if (!container || !prevBtn || !nextBtn) return;
  
  // Add event listeners
  prevBtn.addEventListener('click', () => scrollCarousel('left'));
  nextBtn.addEventListener('click', () => scrollCarousel('right'));
  
  // Update button states on scroll
  container.addEventListener('scroll', updateNavButtons);
  
  // Update initial state
  updateNavButtons();
  
  // Touch/swipe support (already handled by CSS scroll-snap)
}

// Function to load and display events
async function loadEvents() {
  const container = document.getElementById('events-container');
  
  try {
    const response = await fetch('events.json');
    if (!response.ok) {
      throw new Error('Failed to load events');
    }
    
    const data = await response.json();
    
    // Clear loading message
    container.innerHTML = '';
    
    // Render upcoming events
    if (data.upcoming && data.upcoming.length > 0) {
      data.upcoming.forEach(event => {
        const processedEvent = processEvent(event);
        container.appendChild(renderEventCard(processedEvent));
      });
      
      // Initialize navigation after cards are loaded
      setTimeout(initCarouselNav, 100);
    } else {
      container.innerHTML = '<p class="loading-message">Zurzeit sind keine Konzerte geplant. Schauen Sie bald wieder vorbei!</p>';
    }
  } catch (error) {
    console.error('Error loading events:', error);
    container.innerHTML = '<p class="loading-message">Fehler beim Laden der Konzerte. Bitte versuchen Sie es später erneut.</p>';
  }
}

// Load events when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadEvents);
} else {
  loadEvents();
}
