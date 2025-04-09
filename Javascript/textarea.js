document.addEventListener("DOMContentLoaded", function () {
  const textareas = document.querySelectorAll(".textarea-container textarea");

  textareas.forEach((textarea) => {
    const counter = textarea.parentElement.querySelector(".counter");
    const maxLength = textarea.getAttribute("maxlength") || 500;

    // Set initial count
    updateCounter(textarea, counter, maxLength);

    textarea.addEventListener("input", () => {
      updateCounter(textarea, counter, maxLength);
    });

    // Add paste event listener to prevent excessive content
    textarea.addEventListener("paste", (e) => {
      const paste = (e.clipboardData || window.clipboardData).getData("text");
      if (paste.length + textarea.value.length > maxLength) {
        e.preventDefault();
        alert(`Le texte collé dépasse la limite de ${maxLength} caractères.`);
      }
    });
  });
});

function updateCounter(textarea, counter, maxLength) {
  const remaining = maxLength - textarea.value.length;
  counter.textContent = `${remaining}/${maxLength}`;

  // Update counter styling based on remaining characters
  counter.classList.remove("warning", "error");

  if (remaining < maxLength * 0.2) {
    // Less than 20% remaining
    counter.classList.add("warning");
  }
  if (remaining < maxLength * 0.1) {
    // Less than 10% remaining
    counter.classList.add("error");
  }
}
