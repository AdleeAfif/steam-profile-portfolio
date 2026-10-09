document.addEventListener("click", (event) => {
  for (const dropdown of document.querySelectorAll<HTMLDetailsElement>("details[data-nav-dropdown][open]")) {
    if (!dropdown.contains(event.target as Node)) dropdown.open = false;
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  for (const dropdown of document.querySelectorAll<HTMLDetailsElement>("details[data-nav-dropdown][open]")) {
    dropdown.open = false;
    dropdown.querySelector("summary")?.focus();
  }
});
