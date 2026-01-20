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
    const response = await fetch('gallery-images.json');
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
}

// Create thumbnail elements
function createThumbnails() {
  const container = document.getElementById('gallery-thumbnails');
  container.innerHTML = '';
  
  // Show 5 thumbnails at a time (current + 2 before + 2 after, or adjust based on position)
  galleryImages.forEach((imagePath, index) => {
    const thumb = document.createElement('div');
    thumb.className = 'gallery-thumbnail';
    thumb.innerHTML = `<img src="${imagePath}" alt="Gallery thumbnail ${index + 1}" />`;
    thumb.addEventListener('click', () => showImage(index));
    container.appendChild(thumb);
  });
}

// Update active thumbnail
function updateThumbnails() {
  const thumbnails = document.querySelectorAll('.gallery-thumbnail');
  thumbnails.forEach((thumb, index) => {
    if (index === currentIndex) {
      thumb.classList.add('active');
      // Scroll thumbnail into center of view
      thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    } else {
      thumb.classList.remove('active');
    }
  });
}

// Update navigation button states
function updateNavButtons() {
  const prevBtn = document.getElementById('gallery-prev');
  const nextBtn = document.getElementById('gallery-next');
  
  if (!prevBtn || !nextBtn) return;
  
  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === galleryImages.length - 1;
}

// Setup navigation buttons
function setupNavigation() {
  const prevBtn = document.getElementById('gallery-prev');
  const nextBtn = document.getElementById('gallery-next');
  
  if (!prevBtn || !nextBtn) return;
  
  prevBtn.addEventListener('click', () => navigatePrevious());
  nextBtn.addEventListener('click', () => navigateNext());
}

// Navigate to previous image
function navigatePrevious() {
  if (currentIndex > 0) {
    showImage(currentIndex - 1);
  }
}

// Navigate to next image
function navigateNext() {
  if (currentIndex < galleryImages.length - 1) {
    showImage(currentIndex + 1);
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGallery);
} else {
  initGallery();
}
