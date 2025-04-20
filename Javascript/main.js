// Add scroll prevention class
document.documentElement.classList.add("no-scroll");

window.addEventListener("load", function () {
  const loader = document.querySelector("#loader");

  // Remove scroll prevention and hide loader
  const hideLoader = () => {
    document.documentElement.classList.remove("no-scroll");
    loader.style.opacity = "0";
    loader.style.transition = "opacity 0.5s ease";
    setTimeout(() => {
      loader.style.display = "none";
    }, 500);
  };

  // Ensure loader is hidden even if resources take too long
  const loaderTimeout = setTimeout(hideLoader, 5000);

  // Normal loader hide
  hideLoader();
  clearTimeout(loaderTimeout);
});

document.addEventListener("DOMContentLoaded", function () {
  //Date
  document.getElementById("current-year").textContent =
    new Date().getFullYear();

  const themeToggle = document.querySelector(".switch");
  let isLightMode = localStorage.getItem("lightmode") === "enabled";

  // Initial state
  if (isLightMode) {
    document.body.classList.add("lightmode");
    themeToggle.classList.add("active");
  }

  themeToggle.addEventListener("click", function () {
    isLightMode = !isLightMode;
    document.body.classList.toggle("lightmode");
    this.classList.toggle("active");
    localStorage.setItem("lightmode", isLightMode ? "enabled" : "disabled");
  });

  // Mobile menu toggle - single source of truth
  const menuToggle = document.querySelector(".toggle");
  const navIcons = document.querySelector(".nav-icons");
  let isMenuOpen = false;

  menuToggle.addEventListener("click", function (e) {
    e.stopPropagation(); // Prevent event bubbling
    this.classList.toggle("active");
    navIcons.classList.toggle("menu-open");

    // Close any open accordions when toggling menu
    document.querySelectorAll(".animated").forEach((btn) => {
      btn.classList.remove("active");
    });
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!navIcons.contains(e.target) && !menuToggle.contains(e.target)) {
      menuToggle.classList.remove("active");
      navIcons.classList.remove("menu-open");
    }
  });

  // Update navbar height CSS variable
  function updateNavbarHeight() {
    const navbar = document.querySelector(".navbar");
    const navbarHeight = navbar.offsetHeight;
    document.documentElement.style.setProperty(
      "--navbar-height",
      `${navbarHeight}px`
    );
  }

  // Run on load and resize
  window.addEventListener("load", updateNavbarHeight);
  window.addEventListener("resize", updateNavbarHeight);

  // Accordion functionality
  const accordionButtons = document.querySelectorAll(".animated");

  accordionButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      // Don't trigger if clicking on a link inside
      if (e.target.tagName === "A" || e.target.closest("a")) {
        return;
      }

      const wasActive = this.classList.contains("active");

      // Close all accordions first
      accordionButtons.forEach((btn) => {
        btn.classList.remove("active");
      });

      // Toggle menu-open class based on accordion state
      if (!wasActive) {
        this.classList.add("active");
        navIcons.classList.add("menu-open");
        menuToggle.classList.add("active");
        isMenuOpen = true;
      } else {
        navIcons.classList.remove("menu-open");
        menuToggle.classList.remove("active");
        isMenuOpen = false;
      }
    });
  });

  // Close both accordion and menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".animated") && !e.target.closest(".toggle")) {
      accordionButtons.forEach((btn) => {
        btn.classList.remove("active");
      });
      navIcons.classList.remove("menu-open");
      menuToggle.classList.remove("active");
      isMenuOpen = false;
    }
  });

  // Close menu when clicking a link
  navIcons.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      isMenuOpen = false;
      menuToggle.classList.remove("active");
      navIcons.classList.remove("menu-open");
    });
  });
});
