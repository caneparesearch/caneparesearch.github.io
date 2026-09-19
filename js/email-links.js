// Turns <span class="email-link" data-user data-domain> (see _includes/email-link.html)
// into a mailto link, so the address never appears in the page source for spam bots to harvest.
(function () {
  function decode() {
    var spans = document.querySelectorAll('span.email-link[data-user]');
    for (var i = 0; i < spans.length; i++) {
      var span = spans[i];
      var address = span.getAttribute('data-user') + '@' + span.getAttribute('data-domain');
      var link = document.createElement('a');
      link.href = 'mailto:' + address;
      link.textContent = address;
      var classes = span.className.replace(/\bemail-link\b/, '').trim();
      if (classes) link.className = classes;
      span.parentNode.replaceChild(link, span);
    }
  }

  function start() {
    decode();
    // posts added later by infinite scroll
    new MutationObserver(decode).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
