const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');

if (toggle && links) {
    toggle.hidden = false;
    links.dataset.enhanced = '';
    const closeMenu = (restoreFocus = false) => {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        if (restoreFocus) toggle.focus();
    };
    toggle.addEventListener('click', () => {
        const open = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
    });
    links.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && links.classList.contains('open')) closeMenu(true);
    });
    document.addEventListener('click', event => {
        if (!event.target.closest('.nav')) closeMenu();
    });
    window.matchMedia('(min-width: 721px)').addEventListener('change', event => {
        if (event.matches) closeMenu();
    });
}
