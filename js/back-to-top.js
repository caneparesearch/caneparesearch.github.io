// Shows the #back-to-top button (see _layouts/default.html) once the page has been
// scrolled past a threshold, and scrolls to the top when it's clicked.
//
// No DOMContentLoaded/readyState guard: this script is loaded with `defer`,
// which by spec only ever runs after the document is fully parsed, so
// document.getElementById below is always safe. (An earlier version checked
// document.readyState first, but that has a real race in Safari - readyState
// can still read 'loading' after DOMContentLoaded already fired, so a
// listener registered for it then never runs and the button silently never
// works. See js/infinite-scroll.js, loaded with `async`, for the pattern
// that's actually needed when the DOM-ready guarantee doesn't hold.)
(function () {
  var THRESHOLD = 600;
  var VISIBLE_CLASS = 'is-visible';

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
})();
