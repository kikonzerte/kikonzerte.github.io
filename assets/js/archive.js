/**
 * Archive loader and renderer for Krienser Industrie Konzerte
 * Loads concert archive data from JSON files and dynamically renders them
 */

let seasonsData = null;
let currentSeasonId = null;

// Get season ID from URL parameter or default to current season
function getSeasonFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('season');
}

// Update URL with season parameter
function updateURL(seasonId) {
  const url = new URL(window.location);
  url.searchParams.set('season', seasonId);
  window.history.pushState({}, '', url);
}

// Load seasons metadata
async function loadSeasons() {
  try {
    const response = await fetch('assets/data/archive-seasons.json');
    if (!response.ok) {
      throw new Error('Failed to load seasons data');
    }
    seasonsData = await response.json();
    return seasonsData;
  } catch (error) {
    console.error('Error loading seasons:', error);
    showError('Fehler beim Laden der Saison-Daten.');
    return null;
  }
}

// Load specific season data
async function loadSeasonData(seasonId) {
  try {
    const season = seasonsData.seasons.find(s => s.id === seasonId);
    if (!season) {
      throw new Error(`Season ${seasonId} not found`);
    }
    
    const response = await fetch(season.file);
    if (!response.ok) {
      throw new Error('Failed to load season data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading season data:', error);
    showError('Fehler beim Laden der Konzertdaten.');
    return null;
  }
}

// Render a single concert item
function renderConcert(concert, index) {
  const article = document.createElement('article');
  article.className = 'archive-concert';
  
  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'archive-concert-image-wrapper';
  
  const img = document.createElement('img');
  img.src = concert.image;
  img.alt = concert.title;
  img.className = 'archive-concert-image';
  img.loading = 'lazy';
  
  imageWrapper.appendChild(img);
  
  const info = document.createElement('div');
  info.className = 'archive-concert-info';
  
  const date = document.createElement('h1');
  date.className = 'archive-concert-date';
  date.textContent = concert.date;
  
  const title = document.createElement('p');
  title.className = 'archive-concert-title';
  title.textContent = concert.title;
  
  info.appendChild(date);
  info.appendChild(title);
  
  // Add subtitle if present
  if (concert.subtitle) {
    const subtitle = document.createElement('p');
    subtitle.className = 'archive-concert-subtitle';
    subtitle.textContent = concert.subtitle;
    info.appendChild(subtitle);
  }
  
  article.appendChild(imageWrapper);
  article.appendChild(info);
  
  return article;
}

// Render a special event section with multiple concerts
function renderSpecialEventSection(eventTitle, concerts) {
  const section = document.createElement('div');
  section.className = 'archive-special-section';
  
  // Add title
  const title = document.createElement('h2');
  title.className = 'archive-special-section-title';
  title.textContent = eventTitle;
  section.appendChild(title);
  
  // Render all concerts in this section
  concerts.forEach((concert, index) => {
    const concertElement = renderConcert(concert, index);
    section.appendChild(concertElement);
  });
  
  return section;
}

// Render a special event section
function renderSpecialEvent(specialEvent) {
  const section = document.createElement('div');
  section.className = 'archive-special-event';
  
  const title = document.createElement('h2');
  title.className = 'archive-special-title';
  title.textContent = specialEvent.title;
  
  section.appendChild(title);
  
  // Render concerts within special event
  specialEvent.concerts.forEach((concert, index) => {
    const concertElement = renderConcert(concert, index);
    section.appendChild(concertElement);
  });
  
  return section;
}

// Render season navigation
function renderSeasonNav(currentSeasonId) {
  const navContainer = document.getElementById('archive-season-nav');
  navContainer.innerHTML = '';
  
  seasonsData.seasons.forEach(season => {
    const link = document.createElement('a');
    link.href = `?season=${season.id}`;
    link.className = 'archive-season-link';
    link.textContent = season.displayName;
    
    if (season.id === currentSeasonId) {
      link.classList.add('active');
    }
    
    // Prevent default and load season dynamically
    link.addEventListener('click', (e) => {
      e.preventDefault();
      loadSeason(season.id);
    });
    
    navContainer.appendChild(link);
  });
}

// Show error message
function showError(message) {
  const contentContainer = document.getElementById('archive-content');
  contentContainer.innerHTML = `<p class="loading-message">${message}</p>`;
}

// Parse date string to sortable format
function parseDate(dateString) {
  // Try to match full date pattern first
  let match = dateString.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  
  if (match) {
    const [, day, month, year] = match;
    return new Date(year, month - 1, day);
  }
  
  // Handle multi-day events like "28./29.10.2023" - extract date and month/year from end
  match = dateString.match(/(\d{2})\.\/?(\d{2})?\.?(\d{2})\.(\d{4})/);
  
  if (match) {
    const [, day1, day2, month, year] = match;
    // Use first day
    return new Date(year, month - 1, day1);
  }
  
  return new Date();
}

// Load and render a season
async function loadSeason(seasonId) {
  const titleElement = document.getElementById('archive-season-title');
  const contentContainer = document.getElementById('archive-content');
  
  // Show loading state
  titleElement.textContent = 'Lade...';
  contentContainer.innerHTML = '<p class="loading-message">Konzerte werden geladen...</p>';
  
  // Load season data
  const seasonData = await loadSeasonData(seasonId);
  
  if (!seasonData) {
    return;
  }
  
  // Update title
  titleElement.textContent = seasonData.displayName;
  
  // Clear content
  contentContainer.innerHTML = '';
  
  // Merge all concerts into one array
  let allConcerts = [];
  
  // Add regular concerts
  if (seasonData.concerts && seasonData.concerts.length > 0) {
    allConcerts = allConcerts.concat(seasonData.concerts.map(c => ({ ...c, isSpecial: false })));
  }
  
  // Add concerts from special events
  if (seasonData.specialEvents && seasonData.specialEvents.length > 0) {
    seasonData.specialEvents.forEach(specialEvent => {
      if (specialEvent.concerts && specialEvent.concerts.length > 0) {
        specialEvent.concerts.forEach(concert => {
          allConcerts.push({
            ...concert,
            isSpecial: true,
            specialEventTitle: specialEvent.title
          });
        });
      }
    });
  }
  
  // Sort concerts by date (newest first)
  allConcerts.sort((a, b) => {
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    return dateB - dateA; // Descending order (newest first)
  });
  
  // Render all concerts, grouping consecutive special events
  if (allConcerts.length > 0) {
    let i = 0;
    while (i < allConcerts.length) {
      const concert = allConcerts[i];
      
      // Check if this is a special event and if following concerts are part of the same event
      if (concert.isSpecial && concert.specialEventTitle) {
        const specialEventConcerts = [concert];
        const eventTitle = concert.specialEventTitle;
        
        // Collect all consecutive concerts with the same special event title
        let j = i + 1;
        while (j < allConcerts.length && 
               allConcerts[j].isSpecial && 
               allConcerts[j].specialEventTitle === eventTitle) {
          specialEventConcerts.push(allConcerts[j]);
          j++;
        }
        
        // Render as a special event section if more than one concert
        if (specialEventConcerts.length > 1) {
          const section = renderSpecialEventSection(eventTitle, specialEventConcerts);
          contentContainer.appendChild(section);
          i = j; // Skip the concerts we just rendered
        } else {
          // Single special event concert, render normally
          const concertElement = renderConcert(concert, i);
          contentContainer.appendChild(concertElement);
          i++;
        }
      } else {
        // Regular concert
        const concertElement = renderConcert(concert, i);
        contentContainer.appendChild(concertElement);
        i++;
      }
    }
  } else {
    contentContainer.innerHTML = '<p class="loading-message">Keine Konzerte für diese Saison verfügbar.</p>';
  }
  
  // Update URL
  updateURL(seasonId);
  currentSeasonId = seasonId;
  
  // Render navigation
  renderSeasonNav(seasonId);
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize archive page
async function initArchive() {
  // Load seasons metadata
  const seasons = await loadSeasons();
  
  if (!seasons) {
    return;
  }
  
  // Determine which season to load
  let seasonToLoad = getSeasonFromURL();
  
  // If no season in URL, use current season
  if (!seasonToLoad) {
    seasonToLoad = seasons.currentSeason;
  }
  
  // Verify season exists
  const seasonExists = seasons.seasons.find(s => s.id === seasonToLoad);
  if (!seasonExists) {
    console.warn(`Season ${seasonToLoad} not found, falling back to current season`);
    seasonToLoad = seasons.currentSeason;
  }
  
  // Load the season
  await loadSeason(seasonToLoad);
}

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
  const seasonId = getSeasonFromURL();
  if (seasonId && seasonId !== currentSeasonId) {
    loadSeason(seasonId);
  }
});

// Load archive when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initArchive);
} else {
  initArchive();
}
