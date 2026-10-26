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
// Events: download_click (platform), contact_submit, feedback_submit (rating).

(function () {
    // The Eazycam app's web key, from Dropplink → Settings → Project details → Website. Public by design:
    // it only works from the website domains listed there (eazycam.app). Empty: nothing is sent.
    var WEB_KEY = '';

    // Calls made before the script loads wait in dropplink.q and run once it does.
    window.dropplink = window.dropplink || { q: [] };
    ['track', 'identify', 'logout', 'grant', 'revoke'].forEach(function (method) {
        window.dropplink[method] = window.dropplink[method] || function () {
            window.dropplink.q.push([method].concat([].slice.call(arguments)));
        };
    });

    if (!WEB_KEY) return;

    var script = document.createElement('script');
    script.src = new URL('dropplink.min.js', document.currentScript.src).href;
    script.async = true;
    script.dataset.key = WEB_KEY;
    document.head.appendChild(script);
})();
