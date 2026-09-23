// Turns <span class="email-link" data-user data-domain> (see _includes/email-link.html) into a link that
// reveals its mailto address only while a visitor hovers, focuses or taps it. The address is kept in this
// script's memory, so neither the page source nor the page after it has loaded contains it.
//
// No DOMContentLoaded/readyState guard: this script is loaded with `defer`, which by
// spec only ever runs after the document (including <body>, which the MutationObserver
// below needs) is fully parsed. See js/back-to-top.js for why an earlier readyState
// check was removed - it has a real race in Safari that can skip the setup entirely.
(function () {
  function arm(link, address) {
    function reveal() { link.setAttribute('href', 'mailto:' + address); }
    function hide() { link.setAttribute('href', '#'); }

    link.addEventListener('pointerenter', reveal);
    link.addEventListener('focus', reveal);
    link.addEventListener('touchstart', reveal, { passive: true });
    link.addEventListener('pointerleave', hide);
    link.addEventListener('blur', hide);
    link.addEventListener('click', function (event) {
      if (link.getAttribute('href') === '#') {
        event.preventDefault();
        reveal();
        window.location.href = link.getAttribute('href');
      }
    });
  }

  function decode() {
    var spans = document.querySelectorAll('span.email-link[data-user]');
    for (var i = 0; i < spans.length; i++) {
      var span = spans[i];
      var address = span.getAttribute('data-user') + '@' + span.getAttribute('data-domain');
      var link = document.createElement('a');
      link.setAttribute('href', '#');
      link.textContent = span.textContent;
      var classes = span.className.replace(/\bemail-link\b/, '').trim();
      if (classes) link.className = classes;
      arm(link, address);
      span.parentNode.replaceChild(link, span);
    }
  }

  decode();
  // posts added later by infinite scroll
  new MutationObserver(decode).observe(document.body, { childList: true, subtree: true });
})();
