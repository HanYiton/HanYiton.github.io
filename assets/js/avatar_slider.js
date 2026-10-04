/* ===== Avatar slider (inside the About Me card) ===== */
(function () {
    const root = document.getElementById('avatar-slider');
    if (!root) return;

    const slides = Array.from(root.querySelectorAll('.avatar-slide'));
    const dots = Array.from(root.querySelectorAll('.avatar-slider-dots li'));
    const prevBtn = root.querySelector('.avatar-slider-arrow.prev');
    const nextBtn = root.querySelector('.avatar-slider-arrow.next');
    if (slides.length < 2) return;

    let current = 0;
    let fadeTimer = null;
    let autoTimer = null;
    const FADE_STEPS = 12;
    const FADE_INTERVAL = 25;   // ~300ms crossfade
    const AUTO_INTERVAL = 3500;

    function crossfade(target) {
        if (target === current) return;
        const from = slides[current];
        const to = slides[target];

        // Cancel any in-progress fade
        if (fadeTimer) clearInterval(fadeTimer);

        let step = 0;
        fadeTimer = setInterval(function () {
            step++;
            const p = step / FADE_STEPS;
            from.style.opacity = 1 - p;
            to.style.opacity = p;
            if (step >= FADE_STEPS) {
                clearInterval(fadeTimer);
                fadeTimer = null;
                from.classList.remove('active');
                to.classList.add('active');
                from.style.opacity = '';
                to.style.opacity = '';
                current = target;
                dots.forEach(function (d, i) { d.classList.toggle('active', i === current); });
            }
        }, FADE_INTERVAL);
    }

    function goTo(i) {
        crossfade(((i % slides.length) + slides.length) % slides.length);
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    function startAuto() {
        stopAuto();
        autoTimer = setInterval(next, AUTO_INTERVAL);
    }

    function stopAuto() {
        if (autoTimer) {
            clearInterval(autoTimer);
            autoTimer = null;
        }
    }

    nextBtn.addEventListener('click', function () { next(); startAuto(); });
    prevBtn.addEventListener('click', function () { prev(); startAuto(); });

    dots.forEach(function (d) {
        d.addEventListener('click', function () {
            goTo(parseInt(d.getAttribute('data-slide-to'), 10));
            startAuto();
        });
    });

    // Pause while hovering
    root.addEventListener('mouseenter', stopAuto);
    root.addEventListener('mouseleave', startAuto);

    // Pause when the tab is hidden
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) stopAuto();
        else startAuto();
    });

    startAuto();
})();
