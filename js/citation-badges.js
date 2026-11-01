// The Altmetric and Dimensions citation badges on a paper's page (_layouts/paper.html) are drawn
// by the services' own scripts, about 250 KB from their servers, more than the rest of the page.
// Their scripts are fetched only after the page itself has loaded, so they never hold up its
// first display, and only once the badges are near the screen: on a phone they sit further
// down, under the abstract, and are often never reached.
(function () {
  const badges = document.querySelectorAll('.altmetric-embed, .__dimensions_badge_embed__')
  if (!badges.length) return
  const scripts = ['https://d1bxh8uas1mnw7.cloudfront.net/assets/embed.js', 'https://badge.dimensions.ai/badge.js']
  let loaded = false

  function load () {
    if (loaded) return
    loaded = true
    scripts.forEach(function (src) {
      const s = document.createElement('script')
      s.src = src
      s.async = true
      document.body.appendChild(s)
    })
  }

  function watch () {
    if (!('IntersectionObserver' in window)) { load(); return }
    const seen = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting })) { seen.disconnect(); load() }
    }, { rootMargin: '200px' })
    badges.forEach(function (badge) { seen.observe(badge) })
  }

  if (document.readyState === 'complete') watch()
  else window.addEventListener('load', watch, { once: true })
})()
