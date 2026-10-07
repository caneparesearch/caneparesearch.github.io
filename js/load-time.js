// Shows in the footer (#load-time, see _layouts/default.html) how long the page took
// to load: from the moment the browser started the request to the end of the load
// event, as the browser's Navigation Timing API measured it on the visitor's own
// connection. The site is static, so there is no server render time to show. The
// note stays hidden when the browser does not report the timing.
//
// Loaded with `defer`, so it runs before the load event; loadEventEnd is only set once
// the load handlers have returned, hence the setTimeout.
(function () {
  const note = document.getElementById('load-time')
  if (!note || !window.performance || !performance.getEntriesByType) return

  function show () {
    const nav = performance.getEntriesByType('navigation')[0]
    if (!nav || !nav.loadEventEnd) return
    const seconds = (nav.loadEventEnd - nav.startTime) / 1000
    note.textContent = 'Page loaded in ' + seconds.toFixed(2) + ' s'
    note.hidden = false
  }

  if (document.readyState === 'complete') {
    setTimeout(show, 0)
  } else {
    window.addEventListener('load', function () { setTimeout(show, 0) })
  }
})()
