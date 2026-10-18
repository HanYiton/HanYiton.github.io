/* Portrait selection and publication filters for the academic homepage. */
(() => {
    "use strict";
    const photo = document.getElementById("portrait-image");
    if (photo) {
        let portraits = [];
        try { portraits = JSON.parse(photo.dataset.portraits || "[]"); } catch { /* Keep the default portrait. */ }
        if (portraits.length) {
            const chosen = portraits[Math.floor(Math.random() * portraits.length)];
            photo.src = chosen.src;
            photo.alt = chosen.alt || photo.alt;
            photo.style.objectPosition = chosen.position || "50% 38%";
        }
    }

    const filters = [...document.querySelectorAll("[data-filter]")];
    const papers = [...document.querySelectorAll(".paper")];
    const allPapersLink = document.getElementById("all-papers-link");
    const paperStatus = document.getElementById("paper-status");
    function setFilter(filter) {
        filters.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.filter === filter)));
        papers.forEach(paper => { paper.hidden = filter !== "all" && paper.dataset.selected !== "true"; });
        const count = papers.filter(paper => !paper.hidden).length;
        if (paperStatus) paperStatus.textContent = `Showing ${count} ${filter === "all" ? "total" : "selected"} publications.`;
        if (allPapersLink) allPapersLink.hidden = filter === "all";
    }
    if (filters.length) setFilter(document.body.dataset.publicationsView === "all" ? "all" : "selected");
    filters.forEach(button => button.addEventListener("click", () => setFilter(button.dataset.filter)));
    allPapersLink?.addEventListener("click", () => {
        setFilter("all");
        document.getElementById("publications").scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    });

    if ("IntersectionObserver" in window) {
        const navigation = [...document.querySelectorAll('.nav-links a[href^="#"]')];
        const observer = new IntersectionObserver(entries => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                navigation.forEach(link => {
                    if (link.getAttribute("href") === `#${entry.target.id}`) link.setAttribute("aria-current", "location");
                    else link.removeAttribute("aria-current");
                });
            }
        }, { rootMargin: "-15% 0px -65% 0px" });
        navigation.forEach(link => {
            const section = document.querySelector(link.getAttribute("href"));
            if (section) observer.observe(section);
        });
    }
})();
