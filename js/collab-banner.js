// The banner on the Collaborators page (papers/collaborators/index.html): its pictures shown in
// turn, starting from one picked at random on each visit, each fading into the next every eight
// seconds, with each picture's credit under it while
// it is on screen. The pause button stops and restarts them, the arrows step back and forth, and
// a counter ("3 / 12") says which is showing;
// they pause while the mouse is over the banner or a control has focus. A visitor who asks for
// reduced motion sees one picture, and can step through them with the arrows. Without this
// script the first picture stays.
(function () {
  const banner = document.querySelector('.collab-banner')
  if (!banner) return
  const slides = Array.prototype.slice.call(banner.querySelectorAll('.collab-banner-slide'))
  const controls = banner.querySelector('.collab-banner-controls')
  const pause = banner.querySelector('.collab-banner-pause')
  const prev = banner.querySelector('.collab-banner-prev')
  const next = banner.querySelector('.collab-banner-next')
  const count = banner.querySelector('.collab-banner-count')
  if (slides.length < 2 || !controls) return

  const DELAY = 8000
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let current = 0
  let paused = reduced
  let hovered = false
  let timer = null

  function show (i) {
    current = (i + slides.length) % slides.length
    slides.forEach(function (slide, k) {
      slide.classList.toggle('is-active', k === current)
      slide.setAttribute('aria-hidden', k === current ? 'false' : 'true')
      if (k === current) {
        const img = slide.querySelector('img')
        if (img) img.loading = 'eager'
      }
    })
    if (count) count.textContent = (current + 1) + ' / ' + slides.length
    // the next picture starts loading now, so it is ready when its turn comes
    const upcoming = slides[(current + 1) % slides.length].querySelector('img')
    if (upcoming) upcoming.loading = 'eager'
  }

  function schedule () {
    clearTimeout(timer)
    if (!paused && !hovered) timer = setTimeout(function () { show(current + 1); schedule() }, DELAY)
  }

  function setPaused (p) {
    paused = p
    pause.classList.toggle('is-paused', paused)
    pause.setAttribute('aria-label', paused ? 'Play the pictures' : 'Pause the pictures')
    schedule()
  }

  pause.addEventListener('click', function () { setPaused(!paused) })
  prev.addEventListener('click', function () { show(current - 1); schedule() })
  next.addEventListener('click', function () { show(current + 1); schedule() })
  banner.addEventListener('mouseenter', function () { hovered = true; schedule() })
  banner.addEventListener('mouseleave', function () { hovered = false; schedule() })
  banner.addEventListener('focusin', function () { hovered = true; schedule() })
  banner.addEventListener('focusout', function () { hovered = false; schedule() })

  controls.hidden = false
  setPaused(paused)
  // a different picture first on each visit: the page arrives showing the first, and the switch
  // happens at once, before the page is drawn, rather than as a fade
  const start = Math.floor(Math.random() * slides.length)
  if (start) {
    slides.forEach(function (slide) { slide.style.transition = 'none' })
    show(start)
    void banner.offsetWidth // apply the switch now, without its transition
    slides.forEach(function (slide) { slide.style.transition = '' })
  } else {
    show(0)
  }
})()
