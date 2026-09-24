// Google Analytics (gtag.js). The page view is queued at once, but the ~150 KB library is only
// fetched after the page has finished loading, so on slow connections it does not compete with the
// page's own stylesheet and fonts.
//
// This lives in a file rather than inline in the page because the Content-Security-Policy header
// (set in Cloudflare) allows inline scripts only by their exact SHA-256 hash: any edit to an inline
// script silently blocks it until the hash there is updated. Files from the site itself are allowed.
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());

gtag('config', 'G-2MGVFYKFQX');

window.addEventListener('load', function () {
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=G-2MGVFYKFQX';
  document.head.appendChild(s);
});
