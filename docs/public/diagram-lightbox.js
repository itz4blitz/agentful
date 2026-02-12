(() => {
  const LIGHTBOX_ID = 'diagram-lightbox';
  let overlay = null;
  let panel = null;
  let content = null;
  let closeButton = null;

  function ensureLightbox() {
    if (overlay) return;

    overlay = document.createElement('div');
    overlay.id = LIGHTBOX_ID;
    overlay.className = 'diagram-lightbox';
    overlay.setAttribute('aria-hidden', 'true');

    panel = document.createElement('div');
    panel.className = 'diagram-lightbox-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Expanded diagram');

    closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'diagram-lightbox-close';
    closeButton.setAttribute('aria-label', 'Close expanded diagram');
    closeButton.textContent = 'Close';

    content = document.createElement('div');
    content.className = 'diagram-lightbox-content';

    closeButton.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeLightbox();
    });

    panel.appendChild(closeButton);
    panel.appendChild(content);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && overlay.classList.contains('open')) {
        closeLightbox();
      }
    });
  }

  function closeLightbox() {
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    if (content) content.innerHTML = '';
    document.body.style.overflow = '';
  }

  function openLightbox(diagramContainer) {
    const sourceSvg = diagramContainer.querySelector('svg');
    if (!sourceSvg) return;

    ensureLightbox();

    const clonedSvg = sourceSvg.cloneNode(true);
    content.innerHTML = '';
    content.appendChild(clonedSvg);

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function bindDiagram(container) {
    if (container.dataset.expandBound === 'true') return;
    container.dataset.expandBound = 'true';
    container.setAttribute('tabindex', '0');
    container.setAttribute('role', 'button');
    container.setAttribute('aria-label', 'Expand diagram');

    container.addEventListener('click', () => openLightbox(container));
    container.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLightbox(container);
      }
    });
  }

  function bindAllDiagrams() {
    document.querySelectorAll('.mermaid-diagram').forEach((container) => {
      bindDiagram(container);
    });
  }

  function boot() {
    bindAllDiagrams();

    const observer = new MutationObserver(() => {
      bindAllDiagrams();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
