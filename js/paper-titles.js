// Papers page: keeps each card's text (title, then authors and journal) no taller than its thumbnail.
// A title that would run below the picture is cut at the last whole line that fits and fades out
// (.is-cut in css/style.scss); the authors and journal line always shows in full. Thumbnails range
// from 100px to 131px tall and that line takes one or two lines, so each card is measured on its own.
// Phones, where a card has the screen's whole width, keep every title whole. Without JavaScript the
// titles fade after five lines instead (fade-lines in css/style.scss).
(function () {
  const blocks = document.querySelectorAll('.paperbox .media-block')
  if (!blocks.length || !window.ResizeObserver) return

  const phone = window.matchMedia('(max-width: 575.98px)')

  function fit (block) {
    const text = block.querySelector('.paper-card-text')
    const title = block.querySelector('.media-heading')
    const img = block.querySelector('img')
    if (!text || !title || !img) return

    title.classList.remove('is-cut')
    title.style.maxHeight = ''
    if (phone.matches || !block.offsetParent) return // phones, and cards hidden by the search

    // what sits below the title (the authors and journal line, in a line box as tall as the
    // card's text line) is measured as laid out, not from the small font's own height
    const below = text.getBoundingClientRect().height - title.getBoundingClientRect().height
    const line = parseFloat(getComputedStyle(title).lineHeight)
    const room = img.getBoundingClientRect().height - below
    if (!line || title.scrollHeight <= room + 0.5) return

    const lines = Math.max(1, Math.floor(room / line))
    title.style.maxHeight = lines * line + 'px'
    title.classList.add('is-cut')
  }

  // A card is refitted whenever its size changes: a new window width, the web font arriving, or the
  // search showing a card it had hidden. Fitting leaves the card as tall as its picture, so it settles.
  const observer = new ResizeObserver(function (entries) {
    entries.forEach(function (entry) { fit(entry.target) })
  })
  blocks.forEach(function (block) { observer.observe(block) })
  phone.addEventListener('change', function () { blocks.forEach(fit) })
})()
