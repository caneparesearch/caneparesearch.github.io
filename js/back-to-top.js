// Shows the #back-to-top button (see _layouts/default.html) once the page has been
// scrolled past a threshold, and scrolls to the top when it's clicked.
(function () {
  var THRESHOLD = 600;
  var VISIBLE_CLASS = 'is-visible';

  function start() {
    var button = document.getElementById('back-to-top');
    if (!button) return;

    function update() {
      button.classList.toggle(VISIBLE_CLASS, window.scrollY > THRESHOLD);
    }

    window.addEventListener('scroll', update, { passive: true });
    update();

    button.addEventListener('click', function () {
      var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
