function initializePreview() {
  const urlInput = document.querySelector(".url-input");
  const copyButton = document.querySelector(".copy-button");
  const iframe = document.querySelector(".preview-container iframe");
  const dots = document.querySelectorAll(".browser-dot");

  function copyUrl() {
    urlInput.select();
    document.execCommand("copy");
    showCopyFeedback();
  }

  function showCopyFeedback() {
    // Add temporary feedback class
    urlInput.classList.add("copied");

    // Show temporary tooltip
    const tooltip = document.createElement("div");
    tooltip.className = "copy-tooltip";
    tooltip.textContent = "URL copiée !";
    urlInput.parentNode.appendChild(tooltip);

    // Remove feedback after animation
    setTimeout(() => {
      urlInput.classList.remove("copied");
      tooltip.remove();
    }, 2000);
  }

  // URL input click-to-copy
  if (urlInput) {
    urlInput.addEventListener("click", copyUrl);
  }

  // Copy button functionality
  if (copyButton) {
    copyButton.addEventListener("click", copyUrl);
  }

  // Handle URL input interactions
  if (urlInput) {
    urlInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const url = urlInput.value;
        if (url && iframe) {
          iframe.src = url;
        }
      }
    });
  }

  // Browser dots functionality
  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const action = dot.getAttribute("data-action");
      const container = document.querySelector(".preview-container");

      switch (action) {
        case "Fermer":
          container.style.opacity = "0";
          setTimeout(() => (container.style.display = "none"), 300);
          break;
        case "Réduire":
          container.classList.toggle("minimized");
          break;
        case "Agrandir":
          container.classList.toggle("maximized");
          break;
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", initializePreview);
