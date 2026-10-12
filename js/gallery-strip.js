// The arrows of the photo strip on the Team page ("Life in the group", team/index.html): each
// scrolls the strip by about a screenful of photos, and is disabled at its end. The strip itself
// scrolls and snaps without this script (touch, trackpad, keyboard), so the arrows stay hidden
// unless it runs, and when every photo already fits.
(function () {
  const strip = document.getElementById('team-gallery-strip')
  const arrows = document.querySelector('.team-gallery-arrows')
  if (!strip || !arrows) return

  const prev = arrows.querySelector('.team-gallery-prev')
  const next = arrows.querySelector('.team-gallery-next')

  function update () {
    const max = strip.scrollWidth - strip.clientWidth
    arrows.hidden = max <= 1
    prev.disabled = strip.scrollLeft <= 1
    next.disabled = strip.scrollLeft >= max - 1
  }

  function step (direction) {
    strip.scrollBy({ left: direction * strip.clientWidth * 0.9 })
  }

  prev.addEventListener('click', function () { step(-1) })
  next.addEventListener('click', function () { step(1) })
  strip.addEventListener('scroll', update, { passive: true })
  window.addEventListener('resize', update)
  update()
})()
