// Device detection
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

// Performance optimized debounce
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for scroll events
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Typewriter animation duration with performance limits
function setAnimationDuration() {
  const text = document.querySelector("h1.text-observed");
  if (!text) return;

  const textContent = text.textContent.trim();
  const maxLength = isMobile ? 100 : 200; // Reduced limit for mobile
  const textLength = Math.min(textContent.length, maxLength);
  const duration = isMobile ? textLength * 0.03 : textLength * 0.05; // Faster on mobile

  if (textContent.length > maxLength) {
    console.warn("Text length exceeds recommended limit for smooth animation");
  }

  document.documentElement.style.setProperty(
    "--animation-duration",
    `${duration}s`
  );
}

const debouncedSetAnimation = debounce(setAnimationDuration, 150);

// Text element setup
const textElement = document.querySelector("h1.text-observed");

// Optimized observer setup with mobile considerations
if (textElement) {
  const observerOptions = {
    characterData: true,
    childList: true,
    subtree: true,
  };

  const textObserver = new MutationObserver(debouncedSetAnimation);

  // Disconnect observer when element is not visible
  const visibilityObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        textObserver.observe(textElement, observerOptions);
      } else {
        textObserver.disconnect();
      }
    });
  });

  visibilityObserver.observe(textElement);

  // Optimized animation end handler
  const handleAnimationEnd = (e) => {
    if (e.animationName === "textReveal") {
      requestAnimationFrame(() => {
        textElement.classList.add("animation-end");
      });
    }
  };

  textElement.addEventListener("animationend", handleAnimationEnd, {
    passive: true,
  });
}

// Add Intersection Observer for navbar visibility
const navbar = document.querySelector(".navbar");
const heroSection = document.querySelector(".hero-section");

// Optimized navbar observer
if (heroSection && navbar) {
  const throttledNavbarUpdate = throttle((entry) => {
    requestAnimationFrame(() => {
      navbar.style.transform = entry.isIntersecting
        ? "translateY(-100%)"
        : "translateY(0)";
    });
  }, 100);

  const navbarObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(throttledNavbarUpdate);
    },
    {
      threshold: isMobile ? 0.05 : 0.1, // Lower threshold for mobile
      rootMargin: "-10px",
    }
  );

  navbarObserver.observe(heroSection);
}

// Optimized shine effect - disable on mobile
if (!isMobile) {
  const shine = (e, button) => {
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    requestAnimationFrame(() => {
      button.style.setProperty("--x", `${x}px`);
      button.style.setProperty("--y", `${y}px`);
    });
  };

  document.querySelectorAll(".cta-button.primary").forEach((button) => {
    button.addEventListener("mousemove", (e) => shine(e, button), {
      passive: true,
    });
  });
}

// Cleanup function
function cleanup() {
  // Only disconnect observers when page is hidden
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      // Only disconnect if observers exist
      if (typeof textObserver !== "undefined") textObserver.disconnect();
      if (typeof visibilityObserver !== "undefined")
        visibilityObserver.disconnect();
      if (typeof navbarObserver !== "undefined") navbarObserver.disconnect();
    }
  });
}

// Initialize with error handling and cleanup
try {
  window.addEventListener("load", () => {
    debouncedSetAnimation();
    cleanup();
  });
} catch (error) {
  console.error("Failed to initialize:", error);
}
