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

// Create thumbnail elements with duplicates for centering
function createThumbnails() {
  const container = document.getElementById('gallery-thumbnails');
  container.innerHTML = '';
  
  const numClones = 5; // Number of images to clone on each side for centering
  
  // Add clones at the beginning (last images)
  for (let i = galleryImages.length - numClones; i < galleryImages.length; i++) {
    const thumb = document.createElement('div');
    thumb.className = 'gallery-thumbnail gallery-thumbnail-clone';
    thumb.innerHTML = `<img src="${galleryImages[i]}" alt="Gallery thumbnail clone" />`;
    thumb.addEventListener('click', () => showImage(i));
    container.appendChild(thumb);
  }
  
  // Add main thumbnails
  galleryImages.forEach((imagePath, index) => {
    const thumb = document.createElement('div');
    thumb.className = 'gallery-thumbnail';
    thumb.setAttribute('data-index', index);
    thumb.innerHTML = `<img src="${imagePath}" alt="Gallery thumbnail ${index + 1}" />`;
    thumb.addEventListener('click', () => showImage(index));
    container.appendChild(thumb);
  });
  
  // Add clones at the end (first images)
  for (let i = 0; i < numClones; i++) {
    const thumb = document.createElement('div');
    thumb.className = 'gallery-thumbnail gallery-thumbnail-clone';
    thumb.innerHTML = `<img src="${galleryImages[i]}" alt="Gallery thumbnail clone" />`;
    thumb.addEventListener('click', () => showImage(i));
    container.appendChild(thumb);
  }
}

// Update active thumbnail
function updateThumbnails() {
  // Remove active class from all thumbnails
  const allThumbnails = document.querySelectorAll('.gallery-thumbnail');
  allThumbnails.forEach(thumb => thumb.classList.remove('active'));
  
  // Find and activate the main thumbnail (not clone)
  const mainThumbnail = document.querySelector(`.gallery-thumbnail[data-index="${currentIndex}"]`);
  if (mainThumbnail) {
    mainThumbnail.classList.add('active');
    // Scroll thumbnail into center of view
    mainThumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
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

// Navigate to previous image (cyclical)
function navigatePrevious() {
  const newIndex = currentIndex - 1;
  if (newIndex < 0) {
    showImage(galleryImages.length - 1); // Wrap to end
  } else {
    showImage(newIndex);
  }
}

// Navigate to next image (cyclical)
function navigateNext() {
  const newIndex = currentIndex + 1;
  if (newIndex >= galleryImages.length) {
    showImage(0); // Wrap to beginning
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGallery);
} else {
  initGallery();
}
