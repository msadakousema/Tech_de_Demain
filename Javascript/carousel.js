class ImageCarousel {
  constructor(container) {
    this.container = container;
    this.parentElement = container.closest(".card") || container;
    this.images = Array.from(container.querySelectorAll("img"));
    this.currentIndex = 0;
    this.isDragging = false;
    this.startPos = 0;
    this.currentTranslate = 0;
    this.threshold = container.offsetWidth * 0.2;
    this.interval = null;
    this.isInView = false;
    this.loadedImages = new Set();
    this.isInitialized = false;
    this.animationId = null;
    this.rafPending = false;
    this.transitionDuration = 300; // ms

    // Skip carousel setup for single images
    if (this.images.length <= 1) {
      if (this.images.length === 1) {
        this.images[0].classList.add("active");
      }
      return; // Exit early if there's only one or no images
    }

    // Prevent default image dragging
    this.preventImageDrag();

    // Defer initialization until in view
    this.setupIntersectionObserver();
  }

  preventImageDrag() {
    const preventDrag = (e) => e.preventDefault();
    this.images.forEach((img) => {
      img.addEventListener("dragstart", preventDrag, { passive: false });
    });
  }

  setupIntersectionObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !this.isInitialized) {
          this.isInView = true;
          this.isInitialized = true;
          this.initialize();
          this.preloadVisibleImages();
        } else if (entry.isIntersecting && this.isInitialized) {
          this.isInView = true;
          if (!this.interval) {
            this.startAutoPlay();
          }
        } else {
          this.isInView = false;
          this.stopAutoPlay();
        }
      },
      { threshold: 0.1, rootMargin: "20px" }
    );
    observer.observe(this.container);
  }

  preloadVisibleImages() {
    if (this.rafPending) return;
    this.rafPending = true;

    requestAnimationFrame(() => {
      this.rafPending = false;
      const visibleRange = 2; // Preload current, next, and previous images
      const indices = [];

      // Add current index and next few images
      for (let i = 0; i <= visibleRange; i++) {
        indices.push((this.currentIndex + i) % this.images.length);
      }

      // Add previous image
      indices.push(
        (this.currentIndex - 1 + this.images.length) % this.images.length
      );

      // Deduplicate indices
      const uniqueIndices = [...new Set(indices)];

      // Load images
      uniqueIndices.forEach((index) => {
        const img = this.images[index];
        if (img && !this.loadedImages.has(img) && img.dataset.src) {
          const loader = new Image();
          loader.onload = () => {
            img.src = img.dataset.src;
            this.loadedImages.add(img);
          };
          loader.src = img.dataset.src;
        }
      });
    });
  }

  initialize() {
    this.initializeStructure();
    this.initializeEvents();
    this.startAutoPlay();
  }

  initializeStructure() {
    // Clear ALL existing navigation and reset images
    const existingNavs = this.container.querySelectorAll(
      ".image-nav, .nav-buttons"
    );
    existingNavs.forEach((el) => el.remove());

    // Reset all images
    this.images.forEach((img) => {
      img.className = "";
      img.style = "";
    });

    // Create navigation buttons with better reusability
    const navFragment = document.createDocumentFragment();

    // Prev button
    const prevBtn = document.createElement("button");
    prevBtn.className = "image-nav prev-btn";
    prevBtn.setAttribute("aria-label", "Previous image");
    prevBtn.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>';
    navFragment.appendChild(prevBtn);

    // Next button
    const nextBtn = document.createElement("button");
    nextBtn.className = "image-nav next-btn";
    nextBtn.setAttribute("aria-label", "Next image");
    nextBtn.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>';
    navFragment.appendChild(nextBtn);

    // Nav dots container
    const navButtons = document.createElement("div");
    navButtons.className = "nav-buttons";
    navButtons.setAttribute("role", "tablist");
    navButtons.setAttribute("aria-label", "Image navigation");

    // Create dots
    this.images.forEach((_, i) => {
      const dot = document.createElement("div");
      dot.className = i === 0 ? "nav-dot active" : "nav-dot";
      dot.dataset.index = i;
      dot.setAttribute("role", "tab");
      dot.setAttribute("tabindex", "0");
      dot.setAttribute("aria-selected", i === 0 ? "true" : "false");
      dot.setAttribute("aria-label", `Image ${i + 1}`);
      navButtons.appendChild(dot);
    });

    navFragment.appendChild(navButtons);

    // Append all navigation elements at once
    this.container.appendChild(navFragment);

    // Initialize first image
    this.images[0].classList.add("active");

    // Set the previous image (last image in the array)
    const lastIndex = this.images.length - 1;
    this.images[lastIndex].classList.add("previous");
  }

  initializeEvents() {
    // Better event handling with bound methods to avoid closure overhead
    this.handleDragStartBound = this.handleDragStart.bind(this);
    this.handleDragMoveBound = this.handleDragMove.bind(this);
    this.handleDragEndBound = this.handleDragEnd.bind(this);
    this.prevSlideBound = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.prevSlide();
    };
    this.nextSlideBound = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.nextSlide();
    };

    // Touch events with passive where possible
    this.container.addEventListener("touchstart", this.handleDragStartBound, {
      passive: true,
    });
    this.container.addEventListener("touchmove", this.handleDragMoveBound, {
      passive: false,
    });
    this.container.addEventListener("touchend", this.handleDragEndBound);
    this.container.addEventListener("touchcancel", this.handleDragEndBound);

    // Mouse events
    this.container.addEventListener("mousedown", this.handleDragStartBound);
    // Add these conditionally to prevent unnecessary event processing
    this.mouseMoveHandler = (e) => {
      if (this.isDragging) {
        this.handleDragMoveBound(e);
      }
    };
    this.mouseUpHandler = (e) => {
      if (this.isDragging) {
        this.handleDragEndBound(e);
      }
    };
    // Use document for mouse events to catch movements outside the container
    document.addEventListener("mousemove", this.mouseMoveHandler);
    document.addEventListener("mouseup", this.mouseUpHandler);

    // Prevent context menu
    this.container.addEventListener("contextmenu", (e) => e.preventDefault());

    // Navigation button events
    const prevBtn = this.container.querySelector(".prev-btn");
    const nextBtn = this.container.querySelector(".next-btn");

    if (prevBtn) {
      prevBtn.addEventListener("click", this.prevSlideBound);
      prevBtn.addEventListener("touchend", this.prevSlideBound, {
        passive: false,
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", this.nextSlideBound);
      nextBtn.addEventListener("touchend", this.nextSlideBound, {
        passive: false,
      });
    }

    // Dots with keyboard support and event delegation
    const navButtons = this.container.querySelector(".nav-buttons");
    if (navButtons) {
      // Use event delegation instead of attaching to each dot
      navButtons.addEventListener("click", (e) => {
        const dot = e.target.closest(".nav-dot");
        if (dot) {
          e.preventDefault();
          e.stopPropagation();
          const index = parseInt(dot.dataset.index);
          if (index !== this.currentIndex) {
            this.showSlide(index);
          }
        }
      });

      navButtons.addEventListener(
        "touchend",
        (e) => {
          const dot = e.target.closest(".nav-dot");
          if (dot) {
            e.preventDefault();
            e.stopPropagation();
            const index = parseInt(dot.dataset.index);
            if (index !== this.currentIndex) {
              this.showSlide(index);
            }
          }
        },
        { passive: false }
      );

      // Keyboard navigation for accessibility
      navButtons.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          const dot = e.target.closest(".nav-dot");
          if (dot) {
            e.preventDefault();
            const index = parseInt(dot.dataset.index);
            if (index !== this.currentIndex) {
              this.showSlide(index);
            }
          }
        }
      });
    }

    // Add hover pause/resume with debounce
    let hoverTimer;
    this.parentElement.addEventListener("mouseenter", () => {
      clearTimeout(hoverTimer);
      this.stopAutoPlay();
    });

    this.parentElement.addEventListener("mouseleave", () => {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => this.startAutoPlay(), 100);
    });

    // Add keyboard navigation
    this.container.setAttribute("tabindex", "0");
    this.container.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        this.prevSlide();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        this.nextSlide();
      }
    });
  }

  cleanupEvents() {
    this.container.removeEventListener("touchstart", this.handleDragStartBound);
    this.container.removeEventListener("touchmove", this.handleDragMoveBound);
    this.container.removeEventListener("touchend", this.handleDragEndBound);
    this.container.removeEventListener("touchcancel", this.handleDragEndBound);
    this.container.removeEventListener("mousedown", this.handleDragStartBound);
    document.removeEventListener("mousemove", this.mouseMoveHandler);
    document.removeEventListener("mouseup", this.mouseUpHandler);

    const prevBtn = this.container.querySelector(".prev-btn");
    const nextBtn = this.container.querySelector(".next-btn");

    if (prevBtn) {
      prevBtn.removeEventListener("click", this.prevSlideBound);
      prevBtn.removeEventListener("touchend", this.prevSlideBound);
    }

    if (nextBtn) {
      nextBtn.removeEventListener("click", this.nextSlideBound);
      nextBtn.removeEventListener("touchend", this.nextSlideBound);
    }

    this.stopAutoPlay();
  }

  getPositionX(event) {
    // Optimize position detection
    return event.type.includes("touch")
      ? event.touches?.[0]?.clientX || event.changedTouches?.[0]?.clientX || 0
      : event.clientX;
  }

  handleDragStart(event) {
    if (this.images.length <= 1) return;

    // Don't start drag on buttons or nav
    if (event.target.closest(".image-nav, .nav-dot, .nav-buttons")) return;

    this.isDragging = true;
    this.startPos = this.getPositionX(event);
    this.currentTranslate = 0;
    this.container.classList.add("dragging");

    // Cancel any existing animations
    this.cancelAnimationFrame();

    // Force hardware acceleration and prepare for animation
    this.setWillChangeProperties(true);

    // Stop autoplay during drag
    this.stopAutoPlay();
  }

  setWillChangeProperties(enabled) {
    const properties = enabled ? "transform, opacity" : "auto";

    // Only set on images that might be visible in the current context
    const activeImg = this.images[this.currentIndex];
    const prevIdx =
      (this.currentIndex - 1 + this.images.length) % this.images.length;
    const nextIdx = (this.currentIndex + 1) % this.images.length;

    [activeImg, this.images[prevIdx], this.images[nextIdx]].forEach((img) => {
      if (img) img.style.willChange = properties;
    });
  }

  handleDragMove(event) {
    if (!this.isDragging) return;

    // Prevent page scrolling during drag
    event.preventDefault();

    // Use RAF for smoother animation
    if (!this.rafPending) {
      this.rafPending = true;

      requestAnimationFrame(() => {
        this.rafPending = false;
        const currentPosition = this.getPositionX(event);
        const diff = currentPosition - this.startPos;
        this.updatePosition(diff);
      });
    }
  }

  updatePosition(diff) {
    const resistance = 0.5;
    const containerWidth = this.container.offsetWidth;
    const maxTranslate = containerWidth * resistance;

    // Apply resistance to make dragging feel more natural
    let translate = diff;
    if (Math.abs(translate) > maxTranslate) {
      translate = maxTranslate * Math.sign(diff);
    }

    this.currentTranslate = translate;

    // Get the necessary images
    const activeImg = this.images[this.currentIndex];
    const prevIdx =
      (this.currentIndex - 1 + this.images.length) % this.images.length;
    const nextIdx = (this.currentIndex + 1) % this.images.length;
    const prevImg = this.images[prevIdx];
    const nextImg = this.images[nextIdx];

    // Ensure proper stacking with explicit z-indices
    activeImg.style.zIndex = "3";
    prevImg.style.zIndex = "2";
    nextImg.style.zIndex = "2";

    // Apply transforms for the illusion of sliding
    const opacity = (val) =>
      Math.max(0.3, Math.min(1, 1 - Math.abs(val) / containerWidth));

    // Active image transform
    activeImg.style.transform = `translate3d(${translate}px, 0, 0)`;
    activeImg.style.opacity = "1";

    // Previous image transform (appears when dragging right)
    const prevTranslate = translate - containerWidth;
    prevImg.style.transform = `translate3d(${prevTranslate}px, 0, 0)`;
    prevImg.style.opacity = opacity(prevTranslate);

    // Next image transform (appears when dragging left)
    const nextTranslate = translate + containerWidth;
    nextImg.style.transform = `translate3d(${nextTranslate}px, 0, 0)`;
    nextImg.style.opacity = opacity(nextTranslate);
  }

  handleDragEnd(event) {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.container.classList.remove("dragging");

    const diff = this.currentTranslate;

    // Disable will-change to save memory
    this.setWillChangeProperties(false);

    // Schedule transition in next frame for smoothness
    requestAnimationFrame(() => {
      // Add transition for smooth animation back
      this.images.forEach((img) => {
        img.style.transition = `transform ${this.transitionDuration}ms var(--easing, cubic-bezier(0.25, 1, 0.5, 1)), opacity ${this.transitionDuration}ms var(--easing, cubic-bezier(0.25, 1, 0.5, 1))`;
      });

      if (Math.abs(diff) > this.threshold) {
        // Enough momentum to change slide
        if (diff > 0) {
          this.prevSlide();
        } else {
          this.nextSlide();
        }
      } else {
        // Not enough momentum, snap back
        this.showSlide(this.currentIndex, true);
      }

      // Clean up transition after animation completes
      setTimeout(() => {
        this.images.forEach((img) => {
          img.style.transition = "";
        });
        // Resume autoplay after drag
        this.startAutoPlay();
      }, this.transitionDuration);
    });
  }

  cancelAnimationFrame() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  showSlide(index, forceUpdate = false) {
    if (
      (!forceUpdate && index === this.currentIndex) ||
      this.images.length <= 1
    )
      return;

    // Cancel any ongoing animations
    this.cancelAnimationFrame();

    // Clean up all images first
    this.images.forEach((img) => {
      img.className = ""; // Remove all classes
      img.style.cssText = ""; // Remove inline styles completely
    });

    // Calculate direction for animation
    const previousIndex = this.currentIndex;
    const direction =
      index > previousIndex
        ? index - previousIndex <= this.images.length / 2
          ? 1
          : -1
        : previousIndex - index <= this.images.length / 2
        ? -1
        : 1;

    // Add transition class for smoother animations
    this.container.classList.add("transitioning");

    // Apply new classes
    this.images[previousIndex].className =
      direction > 0 ? "previous slide-left" : "previous slide-right";
    this.images[index].className = "active";

    // Update dots
    const dots = this.container.querySelectorAll(".nav-dot");
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
      dot.setAttribute("aria-selected", i === index ? "true" : "false");
    });

    // Remove transition class after animation completes
    setTimeout(() => {
      this.container.classList.remove("transitioning");
    }, this.transitionDuration);

    this.currentIndex = index;

    // Preload next images after a slight delay to prioritize current animation
    setTimeout(() => this.preloadVisibleImages(), 100);
  }

  startAutoPlay() {
    if (this.images.length <= 1 || !this.isInView) return; // Skip autoplay for single images or when not in view

    this.stopAutoPlay(); // Clear any existing interval first

    this.interval = setInterval(() => {
      if (document.hidden) return; // Don't advance when page is hidden
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

  // Public method for external control
  destroy() {
    this.cleanupEvents();
    this.stopAutoPlay();
    this.cancelAnimationFrame();

    // Remove all added elements
    this.container
      .querySelectorAll(".image-nav, .nav-buttons")
      .forEach((el) => el.remove());

    // Reset all images
    this.images.forEach((img) => {
      img.className = "";
      img.style = "";
      img.removeEventListener("dragstart", (e) => e.preventDefault());
    });

    // Remove attributes
    this.container.removeAttribute("tabindex");
  }
}

// Initialize carousels efficiently
function initCarousels() {
  const carousels = new Map();
  let resizeTimer;

  // Efficient intersection observer setup
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !carousels.has(entry.target)) {
          const carousel = new ImageCarousel(entry.target);
          carousels.set(entry.target, carousel);
        }
      });
    },
    { rootMargin: "100px 0px", threshold: 0.1 }
  );

  // Find all potential carousel containers
  document.querySelectorAll(".image-container").forEach((container) => {
    observer.observe(container);
  });

  // Handle window resize events efficiently
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      carousels.forEach((carousel) => {
        // Update threshold based on new container width
        if (carousel.container) {
          carousel.threshold = carousel.container.offsetWidth * 0.2;
        }
      });
    }, 250); // Debounce resize events
  });

  // Clean up on page unload
  window.addEventListener("beforeunload", () => {
    carousels.forEach((carousel) => {
      if (typeof carousel.destroy === "function") {
        carousel.destroy();
      }
    });
    carousels.clear();
    observer.disconnect();
  });

  return {
    getCarousel(element) {
      return carousels.get(element);
    },
    destroyAll() {
      carousels.forEach((carousel) => {
        if (typeof carousel.destroy === "function") {
          carousel.destroy();
        }
      });
      carousels.clear();
      observer.disconnect();
    },
  };
}

// Initialize once DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCarousels);
} else {
  // DOM already loaded, initialize immediately
  initCarousels();
}
