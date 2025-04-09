const downloadButton = document.querySelector(".btn-download");

downloadButton.addEventListener("click", (event) => {
  event.preventDefault(); // Prevent default link behavior

  if (!downloadButton.classList.contains("downloading")) {
    downloadButton.classList.add("downloading");
    document.documentElement.style.setProperty("--fill", "0%"); // Reset fill

    // Trigger reflow to restart animation (force layout recalculation)
    void downloadButton.offsetWidth;

    // Simulate download (start slightly before animation completes)
    setTimeout(() => {
      const link = document.createElement("a");
      link.href = downloadButton.href;
      link.download = downloadButton.download;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 600); // Start download after 0.6s

    // After the animation, remove the 'downloading' class
    setTimeout(() => {
      downloadButton.classList.remove("downloading");
    }, 800); // Reset button after 0.8s
  }
});
