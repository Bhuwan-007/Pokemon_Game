document.addEventListener("DOMContentLoaded", () => {
  // Smooth fade-in when arriving on the page
  setTimeout(() => {
    document.body.classList.add("loaded");
  }, 100);
});
// Precise normalized anchor points (x,y) from the original reference frame
// These are fractions [0..1], measured from the original screenshot frame.
const stoneAnchors = [
  {x: 0.0900, y: 0.7390},
  {x: 0.1634, y: 0.7531},
  {x: 0.2329, y: 0.7331},
  {x: 0.2832, y: 0.7590},
  {x: 0.3432, y: 0.7817},
  {x: 0.3860, y: 0.8077},
  {x: 0.4290, y: 0.8471},
  {x: 0.4727, y: 0.8451},
  {x: 0.5180, y: 0.8473},
  {x: 0.5532, y: 0.8473},
  {x: 0.6001, y: 0.8313},
  {x: 0.6445, y: 0.7840},
  {x: 0.7050, y: 0.8025},
  {x: 0.7714, y: 0.7573},
  {x: 0.8411, y: 0.7579},
  {x: 0.9076, y: 0.7493}
];

function placeStoneButtonsOverVideo() {
  const video = document.getElementById('bgVideo');
  const containerW = window.innerWidth;
  const containerH = window.innerHeight;

  // fallback intrinsic size (if not loaded yet) -- tweak if your original frame differs
  const vidW = video.videoWidth || 1897;
  const vidH = video.videoHeight || 1008;

  // object-fit: cover scaling -> scale so the video covers the container
  const scale = Math.max(containerW / vidW, containerH / vidH);
  const dispW = vidW * scale;
  const dispH = vidH * scale;

  // cropping offsets (video centered): positive when displayed dimension > container
  const offsetLeft = (dispW - containerW) / 2;
  const offsetTop  = (dispH - containerH) / 2;

  stoneAnchors.forEach((anchor, i) => {
    // anchor.x/anchor.y are relative fractions in original video frame
    const xOnVideo = anchor.x * vidW * scale; // pixel in displayed video coords
    const yOnVideo = anchor.y * vidH * scale;

    // convert to pixel coords relative to container (0..containerW/H)
    const xInContainer = xOnVideo - offsetLeft;
    const yInContainer = yOnVideo - offsetTop;

    // convert to percentage for CSS
    const leftPerc = (xInContainer / containerW) * 100;
    const topPerc  = (yInContainer / containerH) * 100;

    const btn = document.querySelector('.stone-' + (i+1));
    if (btn) {
      btn.style.left = leftPerc + '%';
      btn.style.top  = topPerc + '%';
    }
  });
}

function ensureVideoThenPlace() {
  const video = document.getElementById('bgVideo');
  if (!video) return;
  // place after metadata (so video.videoWidth/videoHeight available), and on resize
  video.addEventListener('loadedmetadata', placeStoneButtonsOverVideo, {once:true});
  window.addEventListener('resize', () => window.requestAnimationFrame(placeStoneButtonsOverVideo));
  // also try to place once immediately (works with fallbacks)
  window.requestAnimationFrame(placeStoneButtonsOverVideo);
}
document.addEventListener('DOMContentLoaded', ensureVideoThenPlace);

window.addEventListener('resize', () => placeButtons(video));

// --- Stone click handler setup --- //
// --- Glowing top banner setup --- //
const textContainer = document.getElementById("stone-text-container");

// Define your messages (you’ll edit these later)
const stoneTexts = {
  1: "This is the Index of the Moon Cave...",
  2: "The tale begins with an Introduction...",
  3: "Git — the sacred tool of collaboration...",
  4: "Open Source — the eternal flame of sharing...",
  5: "GitHub — GitHub is a web-based platform built around Git, a powerful, distributed version control system (DVCS). It offers cloud hosting for Git repositories, allowing developers worldwide to store, track changes, and collaborate on code projects efficiently. Beyond just version control, GitHub provides a user-friendly interface and social coding features that are essential for collaborative software development, especially for open-source projects. It acts as a central hub where code is managed, shared, and reviewed.",
  6: "The Forum — where the seekers gather...",
  7: "Repositories — the archives of power...",
  8: "Fork — the path of divergence...",
  9: "Clone — the mirror of creation...",
  10: "Branches — the threads of destiny...",
  11: "Committing — engraving your will into history...",
  12: "Pushing and Pulling — the dance of exchange...",
  13: "Pull Request — the offering of contribution...",
  14: "Merging — the unification of efforts...",
  15: "Collaboration — the heart of progress...",
  16: "Order — the balance within chaos..."
};

document.querySelectorAll(".stone-btn").forEach((btn, i) => {
  btn.addEventListener("click", () => {
    showAncientText(i + 1);
  });
});

function showAncientText(stoneId) {
  const text = stoneTexts[stoneId];
  if (!text) return;

  // If already showing, hide first
  if (textContainer.classList.contains("show")) {
    textContainer.classList.remove("show");
    setTimeout(() => updateText(text), 300);
  } else {
    updateText(text);
  }
}

function updateText(content) {
  textContainer.innerText = content;
  textContainer.classList.add("show");

  // Auto-hide after 5 seconds (optional)
  clearTimeout(window._textTimeout);
  window._textTimeout = setTimeout(() => {
    textContainer.classList.remove("show");
  }, 10000);
}

