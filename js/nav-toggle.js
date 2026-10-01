// Opens and closes the navigation menu on small screens (the button with
// data-bs-toggle="collapse" in _layouts/default.html). It replaces Bootstrap's
// JavaScript bundle (79 KB), which the site loaded only for this. The menu slides
// like Bootstrap's: the stylesheet's .collapse, .collapsing and .show classes do
// the work, and the height is set here so the transition has something to animate.
//
// Loaded with `defer`, so the page is fully parsed when this runs (see js/back-to-top.js).
(function () {
  var buttons = document.querySelectorAll('[data-bs-toggle="collapse"]');

  // Length of the stylesheet's transition on .collapsing (0 with reduced motion),
  // so the menu is settled even if no transitionend event arrives.
  function duration(el) {
    var d = parseFloat(getComputedStyle(el).transitionDuration) || 0;
    return d * 1000;
  }

  function finish(el, open, done) {
    var settled = false;
    function end() {
      if (settled) return;
      settled = true;
      el.removeEventListener('transitionend', end);
      el.classList.remove('collapsing');
      el.classList.add('collapse');
      if (open) el.classList.add('show');
      el.style.height = '';
      done();
    }
    el.addEventListener('transitionend', end);
    setTimeout(end, duration(el) + 50);
  }

  function toggle(button, el) {
    if (el.classList.contains('collapsing')) return; // still moving
    var open = !el.classList.contains('show');
    button.setAttribute('aria-expanded', String(open));
    button.classList.toggle('collapsed', !open);

    if (open) {
      el.classList.remove('collapse');
      el.classList.add('collapsing');
      el.style.height = '0px';
      el.offsetHeight; // apply the starting height before animating
      el.style.height = el.scrollHeight + 'px';
    } else {
      el.style.height = el.getBoundingClientRect().height + 'px';
      el.offsetHeight;
      el.classList.add('collapsing');
      el.classList.remove('collapse', 'show');
      el.style.height = '';
    }
    finish(el, open, function () {});
  }

  Array.prototype.forEach.call(buttons, function (button) {
    var el = document.querySelector(button.getAttribute('data-bs-target'));
    if (!el) return;
    button.addEventListener('click', function () { toggle(button, el); });
  });
})();
