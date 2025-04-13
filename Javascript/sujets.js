document.addEventListener("DOMContentLoaded", () => {
  // Cache DOM queries
  const elements = {
    filterBtns: document.querySelectorAll(".filter-btn"),
    cards: document.querySelectorAll(".card"),
    countLabel: document.querySelector(".project-count"),
    searchInput: document.querySelector(".search-input"),
    resetBtn: document.querySelector(".reset-filter"),
    searchWrapper: document.querySelector(".search-wrapper"),
  };

  // Add clear button
  const clearBtn = document.createElement("button");
  clearBtn.className = "clear-search";
  clearBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
  </svg>`;
  elements.searchWrapper.appendChild(clearBtn);

  // Add keyboard shortcut hint
  const shortcutHint = document.createElement("span");
  shortcutHint.className = "search-shortcut";
  shortcutHint.textContent = "⌘K";
  if (!navigator.platform.includes("Mac")) {
    shortcutHint.textContent = "Ctrl+K";
  }
  elements.searchWrapper.appendChild(shortcutHint);

  // Clear search
  clearBtn.addEventListener("click", () => {
    elements.searchInput.value = "";
    elements.searchInput.focus();
    handleSearchInput();
  });

  // Debounce function
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

  // Optimize search
  const handleSearchInput = debounce(() => {
    const searchTerm = elements.searchInput.value.toLowerCase();
    let visibleCount = 0;

    requestAnimationFrame(() => {
      elements.cards.forEach((card) => {
        const text = card.textContent.toLowerCase();
        const shouldShow = text.includes(searchTerm);
        card.classList.toggle("filtered", !shouldShow);
        if (shouldShow) visibleCount++;
      });
      updateCount(visibleCount);
    });
  }, 150);

  elements.searchInput.addEventListener("input", handleSearchInput);

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Focus search with Cmd+K or Ctrl+K
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      elements.searchInput.focus();
    }

    // Clear search with Escape
    if (e.key === "Escape" && document.activeElement === elements.searchInput) {
      elements.searchInput.value = "";
      elements.searchInput.blur();
      handleSearchInput();
    }
  });

  function updateCount(visibleCards) {
    elements.countLabel.textContent = `${visibleCards} projet${
      visibleCards > 1 ? "s" : ""
    }`;
  }

  function filterCards(filter) {
    let visibleCount = 0;

    elements.cards.forEach((card) => {
      const cardFilter = card.dataset.filter;
      const shouldShow = filter === "all" || cardFilter === filter;

      if (shouldShow) {
        card.classList.remove("filtered");
        visibleCount++;
      } else {
        card.classList.add("filtered");
      }
    });

    updateCount(visibleCount);
  }

  // Add URL parameter handling
  function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  // Function to trigger filter button click
  function triggerFilter(filterValue) {
    const targetBtn = Array.from(elements.filterBtns).find(
      (btn) => btn.dataset.filter === filterValue
    );

    if (targetBtn) {
      elements.filterBtns.forEach((btn) => btn.classList.remove("active"));
      targetBtn.classList.add("active");
      filterCards(filterValue);
    }
  }

  // Check URL parameters on load
  const filterParam = getUrlParameter("filter");
  if (filterParam) {
    triggerFilter(filterParam);
  }

  elements.filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filterValue = btn.dataset.filter;
      elements.filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      filterCards(filterValue);

      // Update URL without page reload
      const url = new URL(window.location);
      url.searchParams.set("filter", filterValue);
      window.history.pushState({}, "", url);
    });
  });

  elements.resetBtn.addEventListener("click", () => {
    elements.searchInput.value = "";
    elements.filterBtns.forEach((btn) => btn.classList.remove("active"));
    elements.filterBtns[0].classList.add("active");
    elements.cards.forEach((card) => card.classList.remove("filtered"));
    updateCount(elements.cards.length);

    // Clear URL parameters
    const url = new URL(window.location);
    url.searchParams.delete("filter");
    window.history.pushState({}, "", url);
  });

  // Initialize with total count
  updateCount(elements.cards.length);

  // Add mouse move handler for search wrapper
  elements.searchWrapper.addEventListener("mousemove", (e) => {
    const rect = elements.searchWrapper.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    elements.searchWrapper.style.setProperty("--x", `${x}%`);
    elements.searchWrapper.style.setProperty("--y", `${y}%`);
  });

  // Typewriter effect for search placeholder
  const phrases = [
    "Rechercher un sujet...",
    "Explorer les projets...",
    "Trouver une inspiration...",
  ];
  let currentPhrase = 0;
  let charIndex = 0;
  let isTyping = true;

  function typeWriter() {
    if (charIndex < phrases[currentPhrase].length) {
      elements.searchInput.placeholder = phrases[currentPhrase].substring(
        0,
        charIndex + 1
      );
      charIndex++;
      setTimeout(typeWriter, 100);
    } else {
      isTyping = false;
      setTimeout(erase, 1500);
    }
  }

  function erase() {
    if (charIndex > 0) {
      elements.searchInput.placeholder = phrases[currentPhrase].substring(
        0,
        charIndex - 1
      );
      charIndex--;
      setTimeout(erase, 50);
    } else {
      isTyping = true;
      currentPhrase = (currentPhrase + 1) % phrases.length;
      setTimeout(typeWriter, 500);
    }
  }

  // Change from using searchContainer to searchWrapper for consistency
  elements.searchWrapper.addEventListener("click", () => {
    elements.searchWrapper.classList.add("active");
    elements.searchInput.focus();
  });

  document.addEventListener("click", (e) => {
    if (!elements.searchWrapper.contains(e.target)) {
      elements.searchWrapper.classList.remove("active");
    }
  });

  // Start typewriter effect
  typeWriter();
});
