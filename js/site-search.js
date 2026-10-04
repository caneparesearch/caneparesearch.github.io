// Site search (search/index.html). Downloads search/index.json, the text of every news
// post, paper, research page, team member, video and page under misc/, and as the visitor
// types lists the pages that contain every word of the query, each with its section, date
// and a passage of its text around the first match. Words in double quotes must appear
// together, in that order, as on the papers list (js/paper-filter.js). Pages whose title
// has the words come first, then those whose authors, journal or other names have them,
// then the rest, keeping the index order (newest first in each section) within each.
// The query is kept in the address (?q=...), which is how the "page not found" page
// (404.html) sends visitors here; Escape clears it.
//
// Loaded with `defer`, so the page is fully parsed when this runs (see js/back-to-top.js).
(function () {
  const form = document.querySelector('.site-search')
  const input = document.getElementById('site-search-input')
  const status = document.querySelector('.paper-search-status')
  const list = document.querySelector('.site-search-results')
  if (!form || !input || !status || !list || !window.fetch) return

  // Lower case without accents, one character for one character, so a position found
  // in the folded text is the same position in the original (for the passage shown).
  function fold (text) {
    return text.split('').map(function (ch) {
      const plain = ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      return plain.length === 1 ? plain : ch.toLowerCase().charAt(0) || ch
    }).join('')
  }

  // "…" phrases (straight or curly quotes) and the remaining single words
  function terms (query) {
    const phrases = []
    const rest = fold(query.replace(/\s+/g, ' ')).replace(/["“”]([^"“”]+)["“”]?/g, function (all, phrase) {
      if (phrase.trim()) phrases.push(phrase.trim())
      return ' '
    })
    return phrases.concat(rest.replace(/["“”]/g, ' ').split(' ').filter(Boolean))
  }

  let pages = null

  // The index holds text without markup, but strip_html leaves entities (&lt;, &nbsp;...);
  // a <textarea> decodes them without running or loading anything.
  const decoder = document.createElement('textarea')
  function decode (text) {
    decoder.innerHTML = text || ''
    return decoder.value.replace(/\u00a0/g, ' ')
  }

  // Appends text[start..end) to `parent`, with every term found in it (in the folded
  // copy, `folded`) wrapped in <mark>.
  function appendMarked (parent, text, folded, start, end, found) {
    const part = folded.slice(start, end)
    let i = 0
    while (i < part.length) {
      // the earliest term from here, and the longest one if two start together
      let next = -1
      let length = 0
      found.forEach(function (term) {
        const j = part.indexOf(term, i)
        if (j !== -1 && (next === -1 || j < next || (j === next && term.length > length))) {
          next = j
          length = term.length
        }
      })
      if (next === -1) {
        parent.appendChild(document.createTextNode(text.slice(start + i, end)))
        break
      }
      if (next > i) parent.appendChild(document.createTextNode(text.slice(start + i, start + next)))
      const mark = document.createElement('mark')
      mark.textContent = text.slice(start + next, start + next + length)
      parent.appendChild(mark)
      i = next + length
    }
  }

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
    appendMarked(p, text, folded, start, end, found)
    if (end < text.length) p.appendChild(document.createTextNode(' …'))
    return p
  }

  function result (page, found) {
    const item = document.createElement('li')
    const link = document.createElement('a')
    link.href = page.url
    appendMarked(link, page.title, page.foldedTitle, 0, page.title.length, found)
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
    const found = terms(query)
    if (!found.length) {
      status.textContent = ''
      return
    }
    if (!pages) {
      status.textContent = 'Loading…'
      return
    }

    const matches = []
    pages.forEach(function (page, order) {
      const all = page.foldedTitle + ' ' + page.foldedExtra + ' ' + page.foldedText
      if (!found.every(function (term) { return all.indexOf(term) !== -1 })) return
      const rank = found.every(function (term) { return page.foldedTitle.indexOf(term) !== -1 }) ? 0
        : found.every(function (term) { return (page.foldedTitle + ' ' + page.foldedExtra).indexOf(term) !== -1 }) ? 1 : 2
      matches.push({ page, rank, order })
    })
    matches.sort(function (a, b) { return a.rank - b.rank || a.order - b.order })

    if (!matches.length) {
      status.textContent = 'Nothing on the site matches “' + query.trim() + '”.'
      return
    }
    status.textContent = matches.length + (matches.length === 1 ? ' page' : ' pages')
    const items = document.createDocumentFragment()
    matches.forEach(function (match) { items.appendChild(result(match.page, found)) })
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

  fetch(form.getAttribute('data-index'))
    .then(function (response) {
      if (!response.ok) throw new Error(response.status)
      return response.json()
    })
    .then(function (index) {
      pages = index.map(function (page) {
        page.title = decode(page.title)
        page.extra = decode(page.extra)
        page.text = decode(page.text)
        page.foldedTitle = fold(page.title)
        page.foldedExtra = fold(page.extra)
        page.foldedText = fold(page.text)
        return page
      })
      apply(input.value)
    })
    .catch(function () {
      status.textContent = 'The search could not load. Please reload the page.'
    })
})()
