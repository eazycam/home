// Dropplink website attribution for eazycam.app.
//
// Loads the Dropplink web script (assets/dropplink.min.js, @ondropp/dropplink-web
// from dropplink-sdks/web) on every page. It records page views, sessions, time on
// page and where each visit came from (UTM tags, the referrer and the
// dropp_click_id a Dropplink link adds), and the events the pages send with
// dropplink.track(). All of it shows in Dropplink under Web campaigns, Users and
// Events for the Eazycam app.
//
// Include it in each page's <head>, before other scripts:
//   <script src="assets/analytics.js"></script>
//
// ── Events ────────────────────────────────────────────────────────────────────
// Eazycam's own events (custom, not the shop-style standard names), for building
// funnels in Dropplink. Once per page view unless noted:
//
//   features_viewed      The Features section came into view (or anything below it)
//   setup_guide_viewed   The "Ready in 3 Minutes" setup steps came into view
//   downloads_viewed     The Download section came into view
//   get_started_clicked  "Get Started Free" (props: location = hero | navbar | menu); every click
//   setup_guide_clicked  "How to setup" (props: location); every click
//   download_started     The Play Store or Windows button (props: platform); every click
//   setup_downloaded     Has now downloaded both the phone app and the PC client, which Eazycam needs
//                        (props: platforms). Once per browser, remembered across visits.
//   feedback_opened      The review button; every click
//   feedback_submitted   The feedback form was accepted (props: rating)
//   contact_submitted    The contact form was accepted
//
// Scroll events follow position, so a jump straight to the downloads also records
// the sections the visitor passed on the way.

(function () {
    // The Eazycam app's web key, from Dropplink → Settings → Project details → Website. Public by design:
    // it only works from the website domains listed there (eazycam.app). Empty: nothing is sent.
    var WEB_KEY = 'pk_0adf93ea1900adc4';

    // Calls made before the script loads wait in dropplink.q and run once it does.
    window.dropplink = window.dropplink || { q: [] };
    ['track', 'identify', 'logout', 'grant', 'revoke'].forEach(function (method) {
        window.dropplink[method] = window.dropplink[method] || function () {
            window.dropplink.q.push([method].concat([].slice.call(arguments)));
        };
    });

    // ── Events ──
    var SETUP = ['android', 'windows'];
    var DOWNLOADED_KEY = 'eazycam_downloaded';
    var SETUP_DONE_KEY = 'eazycam_setup_done';
    var SECTIONS = [
        ['features', 'features_viewed'],
        ['how-it-works', 'setup_guide_viewed'],
        ['download', 'downloads_viewed'],
    ];
    var sent = {};

    function track(name, props) {
        window.dropplink.track(name, props);
    }

    // Once per page view.
    function once(name, props) {
        if (sent[name]) return;
        sent[name] = true;
        track(name, props);
    }

    function stored(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }
    function store(key, value) {
        try { localStorage.setItem(key, value); } catch (e) { /* blocked storage: it just isn't remembered */ }
    }

    // A section counts as seen once its top is in the upper three quarters of the window, or above it.
    function reached(id) {
        var el = document.getElementById(id);
        return Boolean(el) && el.getBoundingClientRect().top < window.innerHeight * 0.75;
    }

    function checkScroll() {
        SECTIONS.forEach(function (section) {
            if (reached(section[0])) once(section[1]);
        });
    }

    /** A download button was clicked (index.html's trackDownload). */
    function download(platform) {
        // The buttons sit in the Download section, below the others: the visitor passed them all.
        SECTIONS.forEach(function (section) { once(section[1]); });
        track('download_started', { platform: platform });

        var done = (stored(DOWNLOADED_KEY) || '').split(',').filter(Boolean);
        if (done.indexOf(platform) === -1) done.push(platform);
        store(DOWNLOADED_KEY, done.join(','));
        var complete = SETUP.every(function (p) { return done.indexOf(p) !== -1; });
        if (complete && !stored(SETUP_DONE_KEY)) {
            store(SETUP_DONE_KEY, '1');
            track('setup_downloaded', { platforms: SETUP.join(',') });
        }
    }

    window.eazycamFunnel = { download: download };

    // Calls to action anywhere on the site, including the navbar, which loads after the page.
    function where(el) {
        if (el.closest('.mobile-menu')) return 'menu';
        if (el.closest('nav, .navbar, #navbar-placeholder')) return 'navbar';
        return 'hero';
    }
    document.addEventListener('click', function (event) {
        var target = event.target instanceof Element ? event.target : null;
        if (!target) return;
        if (target.closest('#review-btn')) return track('feedback_opened');
        var link = target.closest('a[href]');
        if (!link) return;
        var href = link.getAttribute('href') || '';
        if (/#download$/.test(href)) track('get_started_clicked', { location: where(link) });
        else if (/#how-it-works$/.test(href)) track('setup_guide_clicked', { location: where(link) });
    }, true);

    // Only the home page has these sections; elsewhere this does nothing.
    function watch() {
        if (!document.getElementById('features') && !document.getElementById('download')) return;
        checkScroll();
        window.addEventListener('scroll', checkScroll, { passive: true });
        window.addEventListener('hashchange', checkScroll);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch);
    else watch();

    if (!WEB_KEY) return;

    var script = document.createElement('script');
    script.src = new URL('dropplink.min.js', document.currentScript.src).href;
    script.async = true;
    script.dataset.key = WEB_KEY;
    document.head.appendChild(script);
})();
