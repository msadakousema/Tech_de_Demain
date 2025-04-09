document.addEventListener("DOMContentLoaded", () => {
  // Page-specific elements
  const filterBtns = document.querySelectorAll(".filter-btn");
  const cards = document.querySelectorAll(".card");
  const countLabel = document.querySelector(".project-count");
  const searchInput = document.querySelector(".search-input");
  const resetBtn = document.querySelector(".reset-filter");
  const searchWrapper = document.querySelector(".search-wrapper");

  // Add clear button
  const clearBtn = document.createElement("button");
  clearBtn.className = "clear-search";
  clearBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
  </svg>`;
  searchWrapper.appendChild(clearBtn);

  // Add keyboard shortcut hint
  const shortcutHint = document.createElement("span");
  shortcutHint.className = "search-shortcut";
  shortcutHint.textContent = "⌘K";
  if (!navigator.platform.includes("Mac")) {
    shortcutHint.textContent = "Ctrl+K";
  }
  searchWrapper.appendChild(shortcutHint);

  // Clear search
  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchInput.focus();
    handleSearchInput();
  });

  // Handle search input
  function handleSearchInput() {
    const hasText = searchInput.value.length > 0;
    searchWrapper.classList.toggle("has-text", hasText);
    clearBtn.classList.toggle("visible", hasText);

    let visibleCount = 0;
    const searchTerm = searchInput.value.toLowerCase();

    cards.forEach((card) => {
      const text = card.textContent.toLowerCase();
      const shouldShow = text.includes(searchTerm);

      card.classList.toggle("filtered", !shouldShow);
      if (shouldShow) visibleCount++;
    });

    updateCount(visibleCount);
  }

  searchInput.addEventListener("input", handleSearchInput);

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Focus search with Cmd+K or Ctrl+K
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      searchInput.focus();
    }

    // Clear search with Escape
    if (e.key === "Escape" && document.activeElement === searchInput) {
      searchInput.value = "";
      searchInput.blur();
      handleSearchInput();
    }
  });

  function updateCount(visibleCards) {
    countLabel.textContent = `${visibleCards} projet${
      visibleCards > 1 ? "s" : ""
    }`;
  }

  function filterCards(filter) {
    let visibleCount = 0;

    cards.forEach((card) => {
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

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      filterCards(btn.dataset.filter);
    });
  });

  resetBtn.addEventListener("click", () => {
    searchInput.value = "";
    filterBtns.forEach((btn) => btn.classList.remove("active"));
    filterBtns[0].classList.add("active");
    cards.forEach((card) => card.classList.remove("filtered"));
    updateCount(cards.length);
  });

  // Initialize with total count
  updateCount(cards.length);

  // Add mouse move handler for search wrapper
  searchWrapper.addEventListener("mousemove", (e) => {
    const rect = searchWrapper.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    searchWrapper.style.setProperty("--x", `${x}%`);
    searchWrapper.style.setProperty("--y", `${y}%`);
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
      searchInput.placeholder = phrases[currentPhrase].substring(
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
      searchInput.placeholder = phrases[currentPhrase].substring(
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
  searchWrapper.addEventListener("click", () => {
    searchWrapper.classList.add("active");
    searchInput.focus();
  });

  document.addEventListener("click", (e) => {
    if (!searchWrapper.contains(e.target)) {
      searchWrapper.classList.remove("active");
    }
  });

  // Start typewriter effect
  typeWriter();

  // Handle filters visibility on scroll
  const filters = document.querySelector(".filters");
  const searchContainer = document.querySelector(".search-container");
  let lastScroll = window.scrollY;
  let isVisible = true;

  window.addEventListener("scroll", () => {
    const currentScroll = window.scrollY;
    const scrollingDown = currentScroll > lastScroll;
    const searchContainerBottom =
      searchContainer.offsetTop + searchContainer.offsetHeight;

    // Only on mobile and after scrolling past search container
    if (
      window.innerWidth <= 768 &&
      currentScroll > searchContainerBottom + 200
    ) {
      if (scrollingDown && isVisible) {
        filters.classList.add("hidden");
        isVisible = false;
      } else if (!scrollingDown && !isVisible) {
        filters.classList.remove("hidden");
        isVisible = true;
      }
    } else {
      filters.classList.remove("hidden");
      isVisible = true;
    }

    lastScroll = currentScroll;
  });
});
