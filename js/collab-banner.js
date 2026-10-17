// The banner on the Collaborators page (papers/collaborators/index.html): its pictures shown in
// turn, starting from one picked at random on each visit, each fading into the next every eight
// seconds, with each picture's credit under it while
// it is on screen. The pause button stops and restarts them, the arrows step back and forth, and
// a counter ("3 / 12") says which is showing;
// they pause while the mouse is over the banner or a control has keyboard focus, and a swipe
// across the picture steps through them on a phone. A visitor who asks for
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
      // the slides not showing are inert: out of the tab order and the accessibility tree, credit
      // links included (aria-hidden would hide them from screen readers but leave them focusable)
      slide.inert = k !== current
      if (k === current) {
        const img = slide.querySelector('img')
        if (img) img.loading = 'eager'
      }
    })
    if (count) count.textContent = (current + 1) + ' / ' + slides.length
    // the next picture starts loading, so it is ready when its turn comes; at first, only once the
    // page has loaded, so it does not compete with the page's own pictures and fonts
    const upcoming = slides[(current + 1) % slides.length].querySelector('img')
    if (upcoming) {
      if (document.readyState === 'complete') upcoming.loading = 'eager'
      else window.addEventListener('load', function () { upcoming.loading = 'eager' }, { once: true })
    }
  }

  function schedule () {
    clearTimeout(timer)
    // the counter is read out by screen readers only while the pictures stand still, not at
    // every change while they play
    if (count) count.setAttribute('aria-live', paused || hovered ? 'polite' : 'off')
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
  // paused while a mouse is over the banner or a control has keyboard focus. Only a real mouse
  // and keyboard: iPhone Safari reports a tap as a hover and a focus that never end, which kept
  // the pictures paused after any tap, and the play button seemingly dead
  banner.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hovered = true; schedule() } })
  banner.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hovered = false; schedule() } })
  banner.addEventListener('focusin', function (e) {
    if (e.target.matches && e.target.matches(':focus-visible')) { hovered = true; schedule() }
  })
  banner.addEventListener('focusout', function () { hovered = false; schedule() })

  // a swipe across the picture steps to the next or previous one
  let touchX = null
  const stage = banner.querySelector('.collab-banner-slides')
  stage.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX }, { passive: true })
  stage.addEventListener('touchend', function (e) {
    if (touchX === null) return
    const dx = e.changedTouches[0].clientX - touchX
    touchX = null
    if (Math.abs(dx) > 40) { show(current + (dx < 0 ? 1 : -1)); schedule() }
  }, { passive: true })

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
