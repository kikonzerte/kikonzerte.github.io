/**
 * Gallery functionality for Krienser Industrie Konzerte
 * Auto-loads images from assets/img/gallery and provides navigation
 */

// Gallery state
let galleryImages = [];
let currentIndex = 0;
let touchStartX = 0;
let touchEndX = 0;

// Load gallery images from JSON file
async function loadGalleryImages() {
  try {
    const response = await fetch('assets/data/gallery-images.json');
    if (!response.ok) {
      throw new Error('Failed to load gallery images');
    }
    const imageFilenames = await response.json();
    // Add path prefix to each filename
    return imageFilenames.map(filename => `assets/img/gallery/${filename}`);
  } catch (error) {
    console.error('Error loading gallery images:', error);
    return [];
  }
}

// Initialize gallery
async function initGallery() {
  galleryImages = await loadGalleryImages();
  
  if (galleryImages.length === 0) {
    console.warn('No gallery images found');
    return;
  }
  
  // Create thumbnails first
  createThumbnails();
  
  // Then load first image (this will also update thumbnails)
  showImage(0);
  
  // Setup navigation
  setupNavigation();
  
  // Setup keyboard controls
  setupKeyboardNavigation();
  
  // Setup touch/swipe controls
  setupTouchNavigation();
}

// Show image at specific index
function showImage(index) {
  if (index < 0 || index >= galleryImages.length) return;
  
  currentIndex = index;
  const mainImage = document.getElementById('gallery-main-image');
  mainImage.src = galleryImages[index];
  
  // Update thumbnails
  updateThumbnails();
  
  // Update navigation buttons
  updateNavButtons();
  
  // Update counter
  updateCounter();
}

// Create thumbnail elements (cyclical display)
function createThumbnails() {
  // Initial render will be done by updateThumbnails
}

// Update thumbnails to show linear view around current image (no wrapping)
function updateThumbnails() {
  const container = document.getElementById('gallery-thumbnails');
  container.innerHTML = '';
  
  // Number of thumbnails to show (should be odd for symmetry)
  // Adjust based on screen size
  const isMobile = window.innerWidth <= 768;
  const numVisible = isMobile ? 5 : 9;
  const halfVisible = Math.floor(numVisible / 2);
  
  // Calculate which thumbnails to show (linear, no wrapping)
  for (let i = -halfVisible; i <= halfVisible; i++) {
    let imageIndex = currentIndex + i;
    
    // Check if this index is valid (no wrapping)
    if (imageIndex < 0 || imageIndex >= galleryImages.length) {
      // Create empty placeholder
      const thumb = document.createElement('div');
      thumb.className = 'gallery-thumbnail gallery-thumbnail-empty';
      container.appendChild(thumb);
      continue;
    }
    
    const thumb = document.createElement('div');
    thumb.className = 'gallery-thumbnail';
    
    // Mark the center/active thumbnail
    if (i === 0) {
      thumb.classList.add('active');
    }
    
    thumb.innerHTML = `<img src="${galleryImages[imageIndex]}" alt="Gallery thumbnail ${imageIndex + 1}" />`;
    thumb.addEventListener('click', () => showImage(imageIndex));
    container.appendChild(thumb);
  }
}

// Update navigation button states (never disabled in cyclical mode)
function updateNavButtons() {
  const prevBtn = document.getElementById('gallery-prev');
  const nextBtn = document.getElementById('gallery-next');
  
  if (!prevBtn || !nextBtn) return;
  
  // In cyclical mode, buttons are never disabled
  prevBtn.disabled = false;
  nextBtn.disabled = false;
}

// Setup navigation buttons
function setupNavigation() {
  const prevBtn = document.getElementById('gallery-prev');
  const nextBtn = document.getElementById('gallery-next');
  
  if (!prevBtn || !nextBtn) return;
  
  prevBtn.addEventListener('click', () => navigatePrevious());
  nextBtn.addEventListener('click', () => navigateNext());
}

// Navigate to previous image (linear with wrap)
function navigatePrevious() {
  const newIndex = currentIndex - 1;
  if (newIndex < 0) {
    showImage(galleryImages.length - 1); // Wrap to last image
  } else {
    showImage(newIndex);
  }
}

// Navigate to next image (linear with wrap back to start)
function navigateNext() {
  const newIndex = currentIndex + 1;
  if (newIndex >= galleryImages.length) {
    showImage(0); // Restart at beginning
  } else {
    showImage(newIndex);
  }
}

// Setup keyboard navigation (arrow keys)
function setupKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    // Only handle arrow keys when gallery section is visible
    const gallerySection = document.getElementById('gallery');
    if (!gallerySection) return;
    
    // Check if gallery is in viewport (roughly)
    const rect = gallerySection.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    
    if (!isVisible) return;
    
    switch(e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        navigatePrevious();
        break;
      case 'ArrowRight':
        e.preventDefault();
        navigateNext();
        break;
    }
  });
}

// Setup touch/swipe navigation
function setupTouchNavigation() {
  const mainImage = document.getElementById('gallery-main-image');
  if (!mainImage) return;
  
  mainImage.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  
  mainImage.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });
}

// Handle swipe gesture
function handleSwipe() {
  const swipeThreshold = 50; // Minimum distance for swipe
  const diff = touchStartX - touchEndX;
  
  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0) {
      // Swiped left - show next image
      navigateNext();
    } else {
      // Swiped right - show previous image
      navigatePrevious();
    }
  }
}

// Update counter display
function updateCounter() {
  const counter = document.querySelector('.gallery-counter');
  if (counter) {
    counter.textContent = `${currentIndex + 1} von ${galleryImages.length}`;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGallery);
} else {
  initGallery();
}
