// Site search (search/index.html). As the visitor types, lists the pages that contain every
// word of the query, each with its section, date and a passage of its text around the first
// match. The matching and ordering are in js/search-core.js, shared with the navbar's search
// overlay (js/search-dialog.js), which sends Enter here.
// The query is kept in the address (?q=...), which is how the overlay and the "page not
// found" page (404.html) send visitors here; Escape clears it.
//
// Loaded with `defer`, after js/search-core.js, so the page is fully parsed when this runs
// (see js/back-to-top.js).
(function () {
  const form = document.querySelector('.site-search')
  const input = document.getElementById('site-search-input')
  const status = document.querySelector('.paper-search-status')
  const list = document.querySelector('.site-search-results')
  const core = window.siteSearch
  if (!form || !input || !status || !list || !core || !window.fetch) return

  let pages = null

  // The passage of `text` around the first of the terms it contains, about 220
  // characters, cut at spaces, with every term in it marked.
  function passage (page, found) {
    const text = page.text
    const folded = page.foldedText
    let at = -1
    found.forEach(function (term) {
      const i = folded.indexOf(term)
      if (i !== -1 && (at === -1 || i < at)) at = i
    })
    let start = 0
    let end = Math.min(text.length, 220)
    if (at !== -1) {
      start = Math.max(0, at - 80)
      end = Math.min(text.length, start + 220)
      if (start > 0) start = text.indexOf(' ', start) + 1 || start
    }
    if (end < text.length) end = text.lastIndexOf(' ', end) > start ? text.lastIndexOf(' ', end) : end

    const p = document.createElement('p')
    p.className = 'site-search-passage'
    if (start > 0) p.appendChild(document.createTextNode('… '))
    core.appendMarked(p, text, folded, start, end, found)
    if (end < text.length) p.appendChild(document.createTextNode(' …'))
    return p
  }

  function result (page, found) {
    const item = document.createElement('li')
    const link = document.createElement('a')
    link.href = page.url
    core.appendMarked(link, page.title, page.foldedTitle, 0, page.title.length, found)
    const title = document.createElement('h2')
    title.className = 'site-search-title'
    title.appendChild(link)
    const meta = document.createElement('p')
    meta.className = 'site-search-meta'
    meta.textContent = page.date ? page.section + ' · ' + page.date : page.section
    item.appendChild(title)
    item.appendChild(meta)
    if (page.text) item.appendChild(passage(page, found))
    return item
  }

  function apply (query) {
    list.textContent = ''
    const found = core.terms(query)
    if (!found.length) {
      status.textContent = ''
      return
    }
    if (!pages) {
      status.textContent = 'Loading…'
      return
    }

    const start = performance.now()
    const matches = core.search(pages, found)
    const ms = performance.now() - start
    if (!matches.length) {
      status.textContent = 'Nothing on the site matches “' + query.trim() + '”.'
      return
    }
    status.textContent = core.summary(matches.length, ms)
    const items = document.createDocumentFragment()
    matches.forEach(function (page) { items.appendChild(result(page, found)) })
    list.appendChild(items)
  }

  // Keep ?q= in step with the box without adding a history entry per keystroke, once
  // typing pauses (Safari throws if replaceState is called too often; see paper-filter.js).
  let saveTimer
  function saveQueryNow () {
    clearTimeout(saveTimer)
    const query = input.value.trim()
    const url = new URL(window.location.href)
    if (query) {
      url.searchParams.set('q', query)
    } else {
      url.searchParams.delete('q')
    }
    if (url.href !== window.location.href) history.replaceState(null, '', url)
  }
  function saveQuerySoon () {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(saveQueryNow, 300)
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault()
    apply(input.value)
    saveQueryNow()
  })

  input.addEventListener('input', function () {
    apply(input.value)
    saveQuerySoon()
  })

  input.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && input.value) {
      input.value = ''
      apply('')
      saveQueryNow()
    }
  })

  input.addEventListener('blur', saveQueryNow)
  window.addEventListener('pagehide', saveQueryNow)

  // Coming here is asking to search, so the box is ready to type in.
  const initial = new URLSearchParams(window.location.search).get('q')
  if (initial) input.value = initial
  input.focus()
  apply(input.value)

  core.load(form.getAttribute('data-index'))
    .then(function (index) {
      pages = index
      apply(input.value)
    })
    .catch(function () {
      status.textContent = 'The search could not load. Please reload the page.'
    })
})()
