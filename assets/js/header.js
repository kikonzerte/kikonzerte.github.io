/**
 * Header Scroll Behavior and Mobile Menu
 * Krienser Industrie Konzerte
 */

(function() {
  'use strict';

  // ==================== Variables ====================
  const header = document.getElementById('site-header');
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  
  let lastScrollTop = 0;
  const scrollThreshold = 100; // Minimum scroll before header hides
  let ticking = false;

  // ==================== Header Scroll Behavior ====================
  
  function handleScroll() {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    
    // Don't do anything if we're at the very top
    if (currentScroll <= 0) {
      header.classList.remove('header-hidden');
      header.classList.add('header-visible');
      lastScrollTop = currentScroll;
      return;
    }
    
    // Scrolling down
    if (currentScroll > lastScrollTop && currentScroll > scrollThreshold) {
      header.classList.add('header-hidden');
      header.classList.remove('header-visible');
      
      // Close mobile menu if open when scrolling down
      if (mobileNav.classList.contains('active')) {
        closeMobileMenu();
      }
    } 
    // Scrolling up
    else if (currentScroll < lastScrollTop) {
      header.classList.remove('header-hidden');
      header.classList.add('header-visible');
    }
    
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  }

  // Use requestAnimationFrame for better performance
  function requestTick() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  }

  // ==================== Mobile Menu ====================
  
  function toggleMobileMenu() {
    mobileMenuToggle.classList.toggle('active');
    mobileNav.classList.toggle('active');
    
    // Prevent body scroll when menu is open
    if (mobileNav.classList.contains('active')) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  function closeMobileMenu() {
    mobileMenuToggle.classList.remove('active');
    mobileNav.classList.remove('active');
    document.body.style.overflow = '';
  }

  // ==================== Smooth Scrolling for Anchor Links ====================
  
  function smoothScroll(event) {
    const target = event.currentTarget;
    const targetHref = target.getAttribute('href');
    
    // Only apply to anchor links (starting with #)
    if (targetHref && targetHref.startsWith('#')) {
      event.preventDefault();
      
      const targetElement = document.querySelector(targetHref);
      if (targetElement) {
        // Close mobile menu if open
        if (mobileNav.classList.contains('active')) {
          closeMobileMenu();
        }
        
        // Calculate offset for fixed header
        const headerHeight = header.offsetHeight;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    }
  }

  // ==================== Event Listeners ====================
  
  // Scroll event
  window.addEventListener('scroll', requestTick, { passive: true });
  
  // Mobile menu toggle
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
  }
  
  // Close mobile menu when clicking on a link
  if (mobileNav) {
    const mobileNavLinks = mobileNav.querySelectorAll('a');
    mobileNavLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        // If it's an anchor link, use smooth scroll
        if (href && href.startsWith('#')) {
          smoothScroll(e);
        } else {
          // For external links or email links, just close the menu
          closeMobileMenu();
        }
      });
    });
  }
  
  // Add smooth scrolling to all anchor links
  const allAnchorLinks = document.querySelectorAll('a[href^="#"]');
  allAnchorLinks.forEach(link => {
    link.addEventListener('click', smoothScroll);
  });
  
  // Close mobile menu when clicking outside
  document.addEventListener('click', function(event) {
    const isClickInsideNav = mobileNav.contains(event.target);
    const isClickOnToggle = mobileMenuToggle.contains(event.target);
    
    if (!isClickInsideNav && !isClickOnToggle && mobileNav.classList.contains('active')) {
      closeMobileMenu();
    }
  });
  
  // Handle window resize
  window.addEventListener('resize', function() {
    // Close mobile menu on resize if screen becomes larger
    if (window.innerWidth > 768 && mobileNav.classList.contains('active')) {
      closeMobileMenu();
    }
  });

  // ==================== Initialize ====================
  
  // Set initial header state
  header.classList.add('header-visible');
  
})();
