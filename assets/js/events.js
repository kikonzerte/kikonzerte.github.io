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

// Parse date from date string (e.g., "So, 29.03.26, 17:00" -> ISO date)
function parseDate(dateString) {
  // Extract first date if multiple dates (e.g., "Sa, 30.05.26, 19:00, So, 31.05.26, 17:00")
  const firstDate = dateString.split(',').slice(0, 3).join(',');
  
  // Match pattern: "DayName, DD.MM.YY, HH:MM"
  const match = firstDate.match(/(\d{2})\.(\d{2})\.(\d{2}),?\s*(\d{2}):(\d{2})/);
  
  if (match) {
    const [, day, month, year, hours, minutes] = match;
    const fullYear = `20${year}`; // Assume 20xx century
    // ISO format: YYYY-MM-DDTHH:MM:SS
    return `${fullYear}-${month}-${day}T${hours}:${minutes}:00`;
  }
  
  // Fallback: return current date if parsing fails
  console.warn('Could not parse date from:', dateString);
  return new Date().toISOString();
}

// Auto-lookup image by date pattern (YY-MM-DD format in filename)
function findImageByDate(dateString) {
  // Extract date from date string: "So, 29.03.26, 17:00" -> "26-03-29"
  const match = dateString.match(/(\d{2})\.(\d{2})\.(\d{2})/);
  
  if (match) {
    const [, day, month, year] = match;
    const datePattern = `${year}-${month}-${day}`;
    
    // Return with .jpg as default extension
    // Browser will try to load it, and if it fails, will show broken image
    // In the future, we could implement a check for .png, .jpeg, etc.
    return `assets/img/upcoming/${datePattern}.jpg`;
  }
  
  // Fallback to a placeholder or default image
  console.warn('Could not extract date from:', dateString);
  return 'assets/img/upcoming/placeholder.jpg';
}

// Process event to add missing fields
function processEvent(event) {
  // Auto-generate ID if missing
  if (!event.id) {
    event.id = generateId(event.title);
  }
  
  // Handle multiple dates or single date
  if (event.dates && Array.isArray(event.dates)) {
    // Store all dates for the event
    event.allDates = event.dates.map(dateString => ({
      display: dateString,
      iso: parseDate(dateString)
    }));
    // Use first date as primary date for sorting
    event.dateString = event.dates[0];
    event.dateISO = event.allDates[0].iso;
  } else {
    // Fallback to single date
    event.dateString = event.date;
    event.dateISO = parseDate(event.date);
    event.allDates = [{
      display: event.date,
      iso: event.dateISO
    }];
  }
  
  // Image is required - no auto-lookup
  // Just ensure it's provided in the JSON
  
  return event;
}

// Function to create calendar event (.ics file)
function createCalendarEvent(event, dateObj = null) {
  // Use provided date or fall back to event's primary date
  const dateToUse = dateObj || { display: event.dateString, iso: event.dateISO };
  const startDate = new Date(dateToUse.iso);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
  
  // Format dates for iCalendar (YYYYMMDDTHHMMSS)
  const formatICalDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  // Create unique ID for this specific date
  const eventId = dateObj ? `${event.id}-${dateToUse.display.replace(/[^0-9]/g, '')}` : event.id;
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Krienser Industrie Konzerte//Event//DE',
    'BEGIN:VEVENT',
    `UID:${eventId}@kikonzerte.ch`,
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
  link.download = `${eventId}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Function to create email mailto link
function createEmailLink(event, selectedDate = null) {
  const dateText = selectedDate || event.dateString;
  const subject = encodeURIComponent(`Anmeldung KiK: ${event.title} - ${dateText}`);
  const body = encodeURIComponent(`Hallo,\n\nich möchte mich für folgendes Konzert anmelden:\n\n${event.title}\n${dateText}\n\nViele Grüsse`);
  return `mailto:info@kikonzerte.ch?subject=${subject}&body=${body}`;
}

// Function to create and show date selection modal
function showDateModal(event) {
  // Create modal if it doesn't exist
  let modal = document.getElementById('date-selection-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'date-selection-modal';
    modal.className = 'date-modal';
    document.body.appendChild(modal);
  }
  
  // Build modal content
  const modalHTML = `
    <div class="date-modal-content">
      <div class="date-modal-header">
        <h3 class="date-modal-title">Datum auswählen</h3>
        <button class="date-modal-close" aria-label="Schliessen">&times;</button>
      </div>
      <p class="date-modal-subtitle">Bitte wählen Sie ein Datum für Ihre Anmeldung:</p>
      <div class="date-options">
        ${event.allDates.map((dateObj, index) => `
          <button class="date-option" data-date-index="${index}">${dateObj.display}</button>
        `).join('')}
      </div>
    </div>
  `;
  
  modal.innerHTML = modalHTML;
  modal.classList.add('active');
  
  // Close modal on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
  
  // Close modal on X button click
  const closeBtn = modal.querySelector('.date-modal-close');
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });
  
  // Handle date selection
  const dateOptions = modal.querySelectorAll('.date-option');
  dateOptions.forEach((option) => {
    option.addEventListener('click', () => {
      const dateIndex = parseInt(option.getAttribute('data-date-index'));
      const selectedDate = event.allDates[dateIndex].display;
      
      // Open email with selected date
      window.location.href = createEmailLink(event, selectedDate);
      
      // Close modal
      modal.classList.remove('active');
    });
  });
  
  // Close on Escape key
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      modal.classList.remove('active');
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

// Function to render a single event card
function renderEventCard(event) {
  const card = document.createElement('article');
  card.className = 'event-card';
  
  // Render multiple dates or single date
  let datesHTML = '';
  if (event.allDates && event.allDates.length > 1) {
    datesHTML = '<div class="event-dates">';
    event.allDates.forEach((dateObj, index) => {
      datesHTML += `<p class="event-date" data-date-index="${index}">${dateObj.display}</p>`;
    });
    datesHTML += '</div>';
  } else {
    datesHTML = `<p class="event-date" data-date-index="0">${event.dateString}</p>`;
  }
  
  // For multiple dates, use button instead of link
  const registerButtonHTML = event.allDates && event.allDates.length > 1
    ? '<button class="btn btn-orange btn-register">ANMELDEN</button>'
    : `<a href="${createEmailLink(event)}" class="btn btn-orange btn-register">ANMELDEN</a>`;
  
  card.innerHTML = `
    <img src="${event.image}" alt="${event.title}" class="event-image" loading="lazy">
    <div class="event-content">
      <h3 class="event-title">${event.title}</h3>
      ${datesHTML}
      <p class="event-artists">${event.artists}</p>
      <p class="event-description">${event.description}</p>
      <div class="event-footer">${event.footer}</div>
      <div class="event-actions">
        ${registerButtonHTML}
      </div>
    </div>
  `;
  
  // Add click events to dates for calendar download
  const dateElements = card.querySelectorAll('.event-date');
  dateElements.forEach((dateElement, index) => {
    dateElement.addEventListener('click', (e) => {
      e.preventDefault();
      const dateIndex = parseInt(dateElement.getAttribute('data-date-index'));
      const dateObj = event.allDates[dateIndex];
      createCalendarEvent(event, dateObj);
    });
  });
  
  // If multiple dates, show modal on register button click
  if (event.allDates && event.allDates.length > 1) {
    const registerBtn = card.querySelector('.btn-register');
    registerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showDateModal(event);
    });
  }
  
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

// Check if all cards fit on screen and center them if they do
function checkCardsFit() {
  const container = document.getElementById('events-container');
  if (!container) return;
  
  const cards = container.querySelectorAll('.event-card');
  if (cards.length === 0) return;
  
  // Calculate total width needed for all cards
  let totalWidth = 0;
  
  cards.forEach((card, index) => {
    totalWidth += card.offsetWidth;
    
    // Add left margin (all cards have it)
    const leftMargin = parseInt(getComputedStyle(card).marginLeft) || 0;
    totalWidth += leftMargin;
    
    // Add right margin for last card
    if (index === cards.length - 1) {
      const rightMargin = parseInt(getComputedStyle(card).marginRight) || 0;
      totalWidth += rightMargin;
    }
  });
  
  // Get container width
  const containerWidth = container.clientWidth;
  
  // Add or remove centering class based on whether all cards fit
  if (totalWidth <= containerWidth) {
    container.classList.add('cards-fit');
  } else {
    container.classList.remove('cards-fit');
  }
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
  
  // Check if cards fit and center them if they do
  checkCardsFit();
  
  // Re-check on window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      checkCardsFit();
      updateNavButtons();
    }, 150);
  });
  
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
