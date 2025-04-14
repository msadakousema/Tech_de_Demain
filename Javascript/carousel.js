class ImageCarousel {
  constructor(container) {
    this.container = container;
    // Find the closest parent that's either a card or use the container itself
    this.parentElement = container.closest(".card") || container;
    this.images = Array.from(container.querySelectorAll("img"));
    this.isDragging = false;
    this.startPos = 0;
    this.currentIndex = 0;
    this.threshold = 100;
    this.interval = null;
    this.isInView = false;
    this.loadedImages = new Set();
    this.isInitialized = false;

    // Prevent default image dragging
    this.images.forEach((img) => {
      img.addEventListener("dragstart", (e) => e.preventDefault());
    });

    // Skip carousel setup for single images
    if (this.images.length <= 1) {
      if (this.images.length === 1) {
        this.images[0].classList.add("active");
      }
      return; // Exit early if there's only one or no images
    }

    // Defer initialization until in view
    this.setupIntersectionObserver();
  }

  setupIntersectionObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.isInitialized) {
            this.isInView = true;
            this.isInitialized = true;
            this.initialize();
            this.preloadVisibleImages();
          } else {
            this.isInView = false;
            this.stopAutoPlay();
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(this.container);
  }

  preloadVisibleImages() {
    requestAnimationFrame(() => {
      const visibleRange = 2; // Preload next 2 images
      for (let i = 0; i <= visibleRange; i++) {
        const index = (this.currentIndex + i) % this.images.length;
        const img = this.images[index];
        if (img && !this.loadedImages.has(img)) {
          img.src = img.dataset.src || img.src;
          this.loadedImages.add(img);
        }
      }
    });
  }

  initialize() {
    this.initializeStructure();
    this.initializeEvents();
    this.startAutoPlay();
  }

  initializeStructure() {
    // Clear ALL existing navigation and reset images
    this.container
      .querySelectorAll(".image-nav, .nav-buttons")
      .forEach((el) => el.remove());
    this.images.forEach((img) => {
      img.classList.remove("active", "previous", "slide-left", "slide-right");
      img.style.transform = "";
      img.style.zIndex = ""; // Reset z-index too
      img.style.opacity = ""; // Reset opacity too
    });

    // Create navigation buttons
    const prevBtn = document.createElement("button");
    prevBtn.className = "image-nav prev-btn";
    prevBtn.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>';

    const nextBtn = document.createElement("button");
    nextBtn.className = "image-nav next-btn";
    nextBtn.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>';

    // Create single nav-buttons container
    const navButtons = document.createElement("div");
    navButtons.className = "nav-buttons";

    // Create dots only for actual images (prevent duplicates)
    const imageArray = Array.from(this.images);
    imageArray.forEach((_, i) => {
      const dot = document.createElement("div");
      dot.className = i === 0 ? "nav-dot active" : "nav-dot";
      dot.dataset.index = i;
      navButtons.appendChild(dot);
    });

    // Add elements in order
    this.container.appendChild(prevBtn);
    this.container.appendChild(nextBtn);
    this.container.appendChild(navButtons);

    // Initialize first image
    this.images[0].classList.add("active");

    // Set the previous image (last image in the array)
    const lastIndex = this.images.length - 1;
    this.images[lastIndex].classList.add("previous");
  }

  initializeEvents() {
    // Touch events
    this.container.addEventListener("touchstart", (e) =>
      this.handleDragStart(e)
    );
    this.container.addEventListener("touchmove", (e) => this.handleDragMove(e));
    this.container.addEventListener("touchend", (e) => this.handleDragEnd(e));
    this.container.addEventListener("touchcancel", (e) =>
      this.handleDragEnd(e)
    );

    // Mouse events
    this.container.addEventListener("mousedown", (e) =>
      this.handleDragStart(e)
    );
    this.container.addEventListener("mousemove", (e) => this.handleDragMove(e));
    this.container.addEventListener("mouseup", (e) => this.handleDragEnd(e));
    this.container.addEventListener("mouseleave", (e) => this.handleDragEnd(e));

    // Prevent context menu
    this.container.addEventListener("contextmenu", (e) => e.preventDefault());

    // Navigation button events with better touch handling
    const prevBtn = this.container.querySelector(".prev-btn");
    const nextBtn = this.container.querySelector(".next-btn");

    if (prevBtn) {
      const handlePrev = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.prevSlide();
      };
      prevBtn.addEventListener("click", handlePrev);
      prevBtn.addEventListener("touchend", handlePrev);
    }

    if (nextBtn) {
      const handleNext = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.nextSlide();
      };
      nextBtn.addEventListener("click", handleNext);
      nextBtn.addEventListener("touchend", handleNext);
    }

    // Dots with touch support
    const dots = this.container.querySelectorAll(".nav-dot");
    dots.forEach((dot) => {
      const handleDot = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const index = parseInt(dot.dataset.index);
        if (index !== this.currentIndex) {
          this.showSlide(index);
        }
      };
      dot.addEventListener("click", handleDot);
      dot.addEventListener("touchend", handleDot);
    });

    // Add hover pause/resume to the parent element (card or container)
    this.parentElement.addEventListener("mouseenter", () =>
      this.stopAutoPlay()
    );
    this.parentElement.addEventListener("mouseleave", () =>
      this.startAutoPlay()
    );
  }

  getPositionX(event) {
    if (event.type.includes("touch")) {
      return event.touches[0]?.clientX || event.changedTouches[0]?.clientX || 0;
    }
    return event.pageX;
  }

  handleDragStart(event) {
    if (this.images.length <= 1) return;

    // Don't start drag on buttons
    if (event.target.closest(".image-nav")) return;

    this.isDragging = true;
    this.startPos = this.getPositionX(event);
    this.currentTranslate = 0;
    this.container.classList.add("dragging", "no-transition");

    // Stop autoplay during drag
    this.stopAutoPlay();
  }

  handleDragMove(event) {
    if (!this.isDragging) return;

    requestAnimationFrame(() => {
      const currentPosition = this.getPositionX(event);
      const diff = currentPosition - this.startPos;
      this.updatePosition(diff);
    });
  }

  updatePosition(diff) {
    const resistance = 0.5;
    const maxTranslate = this.container.offsetWidth * resistance;

    let translate = diff;
    if (Math.abs(translate) > maxTranslate) {
      translate = maxTranslate * Math.sign(diff);
    }

    this.currentTranslate = translate;

    requestAnimationFrame(() => {
      const activeImg = this.container.querySelector("img.active");
      if (!activeImg) return;

      const prevImg = this.container.querySelector("img.previous");
      const allImages = Array.from(this.images);
      const nextIndex = (this.currentIndex + 1) % allImages.length;
      const nextImg = allImages[nextIndex];

      // Ensure proper stacking with explicit z-indices
      activeImg.style.zIndex = "3";
      if (prevImg) prevImg.style.zIndex = "2";
      if (nextImg) nextImg.style.zIndex = "2";

      // Center alignment correction
      const containerWidth = this.container.offsetWidth;

      // Active image transform
      activeImg.style.transform = `translate3d(${translate}px, 0, 0)`;
      activeImg.style.opacity = "1";

      // Previous image transform
      if (prevImg) {
        const prevTranslate = translate - containerWidth;
        prevImg.style.transform = `translate3d(${prevTranslate}px, 0, 0)`;
        prevImg.style.opacity = translate > 0 ? "1" : "0.3";
      }

      // Next image transform
      if (nextImg) {
        const nextTranslate = translate + containerWidth;
        nextImg.style.transform = `translate3d(${nextTranslate}px, 0, 0)`;
        nextImg.style.opacity = translate < 0 ? "1" : "0.3";
      }

      // Add will-change for better performance
      [activeImg, prevImg, nextImg].forEach((img) => {
        if (img) {
          img.style.willChange = "transform, opacity";
        }
      });
    });
  }

  handleDragEnd(event) {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.container.classList.remove("dragging", "no-transition");

    const diff = this.currentTranslate;
    const threshold = this.container.offsetWidth * 0.2;

    // Reset will-change
    this.images.forEach((img) => {
      img.style.willChange = "auto";
    });

    // Clean up styles with RAF for smooth transition
    requestAnimationFrame(() => {
      this.images.forEach((img) => {
        img.style.transition = "all 0.3s var(--easing)";
        img.style.transform = "";
        img.style.opacity = "";
      });

      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          this.prevSlide();
        } else {
          this.nextSlide();
        }
      } else {
        this.showSlide(this.currentIndex, true);
      }

      // Resume autoplay after drag
      this.startAutoPlay();
    });
  }

  showSlide(index, forceUpdate = false) {
    if (
      (!forceUpdate && index === this.currentIndex) ||
      this.images.length <= 1
    )
      return;

    requestAnimationFrame(() => {
      // Clean up all images first
      this.images.forEach((img) => {
        img.className = ""; // Remove all classes
        img.style.cssText = ""; // Remove inline styles completely
      });

      // Add transition class first
      this.container.classList.add("transitioning");

      const previousIndex = this.currentIndex;
      const direction = index > previousIndex ? 1 : -1;

      // Apply new classes without inline styles
      if (direction > 0) {
        this.images[previousIndex].className = "previous slide-left";
        this.images[index].className = "active";
      } else {
        this.images[previousIndex].className = "previous slide-right";
        this.images[index].className = "active";
      }

      // Update dots
      const dots = this.container.querySelectorAll(".nav-dot");
      dots.forEach((dot, i) => dot.classList.toggle("active", i === index));

      // Remove transition class after animation completes
      setTimeout(() => {
        this.container.classList.remove("transitioning");
      }, 500);

      this.currentIndex = index;
      this.preloadVisibleImages();
    });
  }

  startAutoPlay() {
    if (this.images.length <= 1) return; // Skip autoplay for single images

    this.stopAutoPlay(); // Clear any existing interval first
    this.interval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  stopAutoPlay() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  nextSlide() {
    if (this.images.length <= 1) return; // Skip for single images

    const nextIndex = (this.currentIndex + 1) % this.images.length;
    this.showSlide(nextIndex);
  }

  prevSlide() {
    if (this.images.length <= 1) return; // Skip for single images

    const prevIndex =
      (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.showSlide(prevIndex);
  }
}

// Initialize carousels efficiently
function initCarousels() {
  const carousels = new Map();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !carousels.has(entry.target)) {
          carousels.set(entry.target, new ImageCarousel(entry.target));
        }
      });
    },
    { rootMargin: "50px" }
  );

  document.querySelectorAll(".image-container").forEach((container) => {
    observer.observe(container);
  });
}

document.addEventListener("DOMContentLoaded", initCarousels);
