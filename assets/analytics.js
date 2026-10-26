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
// ── The funnel ────────────────────────────────────────────────────────────────
// Dropplink's website funnel has fixed steps (landed → view_item → add_to_cart →
// begin_checkout → purchase), each counting visitors who also did every step
// before it. For Eazycam they mean:
//
//   landed          Visited any page (automatic)
//   view_item       Explored the product: the Features section (or anything below it) came into view
//   add_to_cart     Reached the downloads: the Download section came into view
//   begin_checkout  Started a download: clicked the Play Store or Windows button (props: platform)
//   purchase        Got the full setup: has downloaded both the phone app and the PC client, which
//                   Eazycam needs to work (props: platforms). Remembered across visits on this browser.
//
// So each drop-off reads as: left at the hero · didn't reach the downloads · saw them but didn't
// download · downloaded one half of the setup but not the other.
//
// Other events: contact_submit, feedback_submit (rating).

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

    // ── Funnel steps ──
    var SETUP = ['android', 'windows'];
    var DOWNLOADED_KEY = 'eazycam_downloaded';
    var SETUP_DONE_KEY = 'eazycam_setup_done';
    var sent = {};

    // Once per page view: the funnel counts visitors, so repeats add nothing.
    function step(name, props) {
        if (sent[name]) return;
        sent[name] = true;
        window.dropplink.track(name, props);
    }

    function stored(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }
    function store(key, value) {
        try { localStorage.setItem(key, value); } catch (e) { /* blocked storage: the step just isn't remembered */ }
    }

    // A section counts as seen once its top is in the upper three quarters of the window, or above it.
    function reached(id) {
        var el = document.getElementById(id);
        return Boolean(el) && el.getBoundingClientRect().top < window.innerHeight * 0.75;
    }

    function checkScroll() {
        if (reached('features')) step('view_item', { section: 'features' });
        if (reached('download')) step('add_to_cart', { section: 'download' });
    }

    /** A download button was clicked (index.html's trackDownload). */
    function download(platform) {
        // The buttons sit in the Download section, below Features: the visitor passed both.
        step('view_item', { section: 'features' });
        step('add_to_cart', { section: 'download' });
        window.dropplink.track('begin_checkout', { platform: platform });

        var done = (stored(DOWNLOADED_KEY) || '').split(',').filter(Boolean);
        if (done.indexOf(platform) === -1) done.push(platform);
        store(DOWNLOADED_KEY, done.join(','));
        var complete = SETUP.every(function (p) { return done.indexOf(p) !== -1; });
        if (complete && !stored(SETUP_DONE_KEY)) {
            store(SETUP_DONE_KEY, '1');
            window.dropplink.track('purchase', { platforms: SETUP.join(',') });
        }
    }

    window.eazycamFunnel = { download: download };

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
