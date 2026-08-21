(function () {
    'use strict';
    var overlay = null;

    function closeLightbox() {
        if (overlay) {
            overlay.remove();
            overlay = null;
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = '';
        }
    }

    function onKeyDown(e) {
        if (e.key === 'Escape') {
            closeLightbox();
        }
    }

    document.addEventListener('click', function (e) {
        var link = e.target.closest ? e.target.closest('a[data-lightbox]') : null;
        if (!link) {
            return;
        }
        e.preventDefault();
        closeLightbox();

        overlay = document.createElement('div');
        overlay.className = 'lightbox-overlay';

        var img = document.createElement('img');
        img.src = link.href;
        img.alt = 'Enlarged figure';
        overlay.appendChild(img);

        var closeBtn = document.createElement('button');
        closeBtn.className = 'lightbox-close';
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', 'Close');
        closeBtn.textContent = '\u00D7';
        closeBtn.addEventListener('click', function (ev) {
            ev.stopPropagation();
            closeLightbox();
        });
        overlay.appendChild(closeBtn);

        overlay.addEventListener('click', closeLightbox);
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKeyDown);
    });
})();