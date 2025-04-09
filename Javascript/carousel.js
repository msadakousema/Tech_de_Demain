class ImageCarousel {
  constructor(container) {
    this.container = container;
    this.card = container.closest(".card");
    this.images = container.querySelectorAll("img");
    this.isDragging = false;
    this.startPos = 0;
    this.currentIndex = 0;
    this.threshold = 100;
    this.interval = null;

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

    // Add hover pause/resume
    this.card.addEventListener("mouseenter", () => this.stopAutoPlay());
    this.card.addEventListener("mouseleave", () => this.startAutoPlay());
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

    const currentPosition = this.getPositionX(event);
    const diff = currentPosition - this.startPos;

    // Add resistance at the edges
    const resistance = 0.5;
    const maxTranslate = this.container.offsetWidth * resistance;

    let translate = diff;
    if (Math.abs(translate) > maxTranslate) {
      translate = maxTranslate * Math.sign(diff);
    }

    this.currentTranslate = translate;

    // Apply transforms
    const activeImg = this.container.querySelector("img.active");
    if (!activeImg) return;

    const prevImg = this.container.querySelector("img.previous");

    // Find the next image properly - get all images and find the next one after current index
    const allImages = Array.from(this.images);
    const nextIndex = (this.currentIndex + 1) % allImages.length;
    const nextImg = allImages[nextIndex];

    // Set z-index for proper layering
    activeImg.style.zIndex = "2";
    if (prevImg) prevImg.style.zIndex = "1";
    if (nextImg) nextImg.style.zIndex = "1";

    activeImg.style.transform = `translateX(${translate}px)`;

    if (translate > 0 && prevImg) {
      prevImg.style.transform = `translateX(${
        translate - this.container.offsetWidth
      }px)`;
      prevImg.style.opacity = "1";
    }

    if (translate < 0 && nextImg) {
      nextImg.style.transform = `translateX(${
        translate + this.container.offsetWidth
      }px)`;
      nextImg.style.opacity = "1";
    }
  }

  handleDragEnd(event) {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.container.classList.remove("dragging");
    this.container.classList.remove("no-transition");

    const diff = this.currentTranslate;
    const threshold = this.container.offsetWidth * 0.2; // 20% of container width

    // Clean up styles before transition
    this.images.forEach((img) => {
      img.style.cssText = ""; // Remove inline styles completely
    });

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        this.prevSlide();
      } else {
        this.nextSlide();
      }
    } else {
      // Reset to current slide without leftover styles
      this.showSlide(this.currentIndex, true);
    }

    // Resume autoplay after drag
    this.startAutoPlay();
  }

  showSlide(index, forceUpdate = false) {
    if (
      (!forceUpdate && index === this.currentIndex) ||
      this.images.length <= 1
    )
      return;

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

// Initialize carousels after DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Process cards without image containers
  document.querySelectorAll(".card").forEach((card) => {
    if (!card.querySelector(".image-container")) {
      const images = Array.from(card.querySelectorAll("img"));
      if (images.length) {
        const imageContainer = document.createElement("div");
        imageContainer.className = "image-container";

        // Clone images to prevent DOM manipulation errors
        images.forEach((img) => {
          const clone = img.cloneNode(true);
          imageContainer.appendChild(clone);
          img.remove(); // Remove original after cloning
        });

        card.insertBefore(imageContainer, card.firstChild);
      }
    }
  });

  // Initialize all carousels
  document.querySelectorAll(".image-container").forEach((container) => {
    new ImageCarousel(container);
  });
});
