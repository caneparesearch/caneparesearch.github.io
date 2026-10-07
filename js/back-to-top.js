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
  const THRESHOLD = 600
  const VISIBLE_CLASS = 'is-visible'

  const button = document.getElementById('back-to-top')
  if (!button) return

  // The button shows once a 1px marker THRESHOLD px down the page has scrolled out
  // of view above the window. An IntersectionObserver reports that without the page
  // being measured; reading window.scrollY at start-up instead forced the browser to
  // lay out the whole page early (Lighthouse's "forced reflow", about 150 ms).
  const marker = document.createElement('div')
  marker.setAttribute('aria-hidden', 'true')
  marker.style.cssText = 'position:absolute;top:' + THRESHOLD + 'px;left:0;width:1px;height:1px;pointer-events:none;visibility:hidden'
  document.body.appendChild(marker)

  new IntersectionObserver(function (entries) {
    const entry = entries[entries.length - 1]
    button.classList.toggle(VISIBLE_CLASS, !entry.isIntersecting && entry.boundingClientRect.top < 0)
  }).observe(marker)

  button.addEventListener('click', function () {
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  })
})()
