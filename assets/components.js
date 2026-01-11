
const navPromise = fetch('navbar.html').then(res => res.ok ? res.text() : null).catch(e => { console.error(e); return null; });
const footerPromise = fetch('footer.html').then(res => res.ok ? res.text() : null).catch(e => { console.error(e); return null; });

const loadComponents = async () => {

    const [navHtml, footerHtml] = await Promise.all([navPromise, footerPromise]);


    const navPlaceholder = document.getElementById('navbar-placeholder');
    if (navPlaceholder && navHtml) {
        navPlaceholder.innerHTML = navHtml;


        const menuBtn = document.querySelector('.mobile-menu-btn');
        const mobileMenu = document.querySelector('.mobile-menu');
        const menuLinks = document.querySelectorAll('.mobile-menu a');

        if (menuBtn && mobileMenu) {
            menuBtn.addEventListener('click', () => {
                menuBtn.classList.toggle('active');
                mobileMenu.classList.toggle('active');
                document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
            });

            menuLinks.forEach(link => {
                link.addEventListener('click', () => {
                    menuBtn.classList.remove('active');
                    mobileMenu.classList.remove('active');
                    document.body.style.overflow = '';
                });
            });
        }
    }


    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder && footerHtml) {
        footerPlaceholder.innerHTML = footerHtml;
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadComponents);
} else {
    loadComponents();
}
