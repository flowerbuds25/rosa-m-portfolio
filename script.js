const featuredIds = ["rosary-branding", "nature-graphic", "where-the-trees-go"];
const projectGrid = document.querySelector("#project-grid");
const featuredGrid = document.querySelector("#featured-grid");
const motionGrid = document.querySelector("#motion-grid");
const filters = document.querySelector("#filters");
const resultCount = document.querySelector("#result-count");
const projectDialog = document.querySelector("#project-dialog");
const dialogCategory = document.querySelector("#dialog-category");
const dialogContent = document.querySelector("#dialog-content");
let projects = [];
let activeCategory = "All work";

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
})[character]);

const assetUrl = (path) => new URL(path, document.baseURI).href;

function cardMarkup(project, featured = false) {
  const image = project.media.find((item) => item.type === "image");
  const thumbnail = image ? project.thumbnail || image.path : project.thumbnail;
  const imageMarkup = thumbnail
    ? `<img src="${escapeHtml(assetUrl(thumbnail))}" alt="${escapeHtml(image ? image.alt : project.thumbnailAlt || project.title)}" loading="lazy" decoding="async">${image ? "" : '<span class="video-play-badge" aria-hidden="true"></span>'}`
    : `<span class="play-mark" aria-hidden="true"></span><span class="poster-type">${escapeHtml(project.category)}</span><span class="poster-title">${escapeHtml(project.title)}</span>`;
  const imageClass = image ? "project-image" : thumbnail ? "project-image video-thumbnail" : "project-image video-poster";
  return `<button class="project-card" type="button" data-project="${escapeHtml(project.id)}" aria-label="Open project: ${escapeHtml(project.title)}">
    <span class="${imageClass}">${imageMarkup}</span>
    <span class="project-meta"><span class="project-category">${escapeHtml(project.category)}</span></span>
    <span class="project-title">${escapeHtml(project.title)}</span>
  </button>`;
}

function renderFilters() {
  const categories = ["All work", ...new Set(projects.map((project) => project.category))];
  filters.innerHTML = categories.map((category) => `<button class="filter-button" type="button" data-category="${escapeHtml(category)}" aria-pressed="${category === activeCategory}">${escapeHtml(category)}</button>`).join("");
}

function renderProjects() {
  const visibleProjects = activeCategory === "All work"
    ? projects
    : projects.filter((project) => project.category === activeCategory);
  projectGrid.innerHTML = visibleProjects.length
    ? visibleProjects.map((project) => cardMarkup(project)).join("")
    : '<p class="empty-state">No projects in this category yet.</p>';
  resultCount.textContent = `${visibleProjects.length} ${visibleProjects.length === 1 ? "project" : "projects"}`;
}

function renderFeatured() {
  const featured = featuredIds.map((id) => projects.find((project) => project.id === id)).filter(Boolean);
  featuredGrid.innerHTML = featured.map((project) => cardMarkup(project, true)).join("");
}

function renderMotion() {
  const videos = projects.filter((project) => project.category === "Video Editing & Multimedia");
  motionGrid.innerHTML = videos.map((project) => cardMarkup(project)).join("");
}

function openProject(projectId) {
  const project = projects.find((item) => item.id === projectId);
  if (!project) return;

  const media = project.media[0];
  const mediaMarkup = media.type === "video"
    ? `<iframe src="${escapeHtml(media.embedUrl)}" title="${escapeHtml(project.title)} video player" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin"></iframe>`
    : `<img src="${escapeHtml(assetUrl(media.path))}" alt="${escapeHtml(media.alt)}">`;
  const tools = project.software.length ? project.software.join(", ") : "To be added";

  dialogCategory.textContent = project.category;
  dialogContent.innerHTML = `<div class="dialog-media${media.type === "video" ? " video-player" : ""}">${mediaMarkup}</div>
    <h2 id="dialog-title">${escapeHtml(project.title)}</h2>
    <p class="dialog-description">${escapeHtml(project.description)}</p>
    <div class="detail-list">
      <div><strong>Role</strong>${escapeHtml(project.role || "To be added")}</div>
      <div><strong>Tools</strong>${escapeHtml(tools)}</div>
    </div>
    ${project.behanceUrl ? `<a class="dialog-external" href="${escapeHtml(project.behanceUrl)}" target="_blank" rel="noreferrer">View on Behance ↗</a>` : ""}
    ${media.type === "video" ? `<a class="dialog-external" href="${escapeHtml(media.url)}" target="_blank" rel="noreferrer">Open original video ↗</a>` : ""}`;
  projectDialog.showModal();
}

document.addEventListener("click", (event) => {
  const card = event.target.closest("[data-project]");
  if (card) openProject(card.dataset.project);

  const filter = event.target.closest("[data-category]");
  if (filter) {
    activeCategory = filter.dataset.category;
    renderFilters();
    renderProjects();
  }
});

projectDialog.addEventListener("click", (event) => {
  if (event.target === projectDialog) projectDialog.close();
});

document.querySelector("#year").textContent = new Date().getFullYear();

fetch(new URL("./projects.json", document.baseURI))
  .then((response) => {
    if (!response.ok) throw new Error(`Project catalog request failed (${response.status})`);
    return response.json();
  })
  .then((catalog) => {
    projects = catalog;
    renderFilters();
    renderProjects();
    renderFeatured();
    renderMotion();
  })
  .catch((error) => {
    console.error(error);
    projectGrid.innerHTML = '<p class="empty-state">The project catalog could not be loaded. Please try again after serving this folder from a local web server.</p>';
  });