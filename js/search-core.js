// The site search's matching, shared by the search page (js/site-search.js) and the navbar's
// search overlay (js/search-dialog.js), so both always find the same pages in the same order.
// It downloads search/index.json (the text of every page; see that file) once per page view,
// and finds the pages that contain every word of a query. Words in double quotes must appear
// together, in that order, as on the papers list (js/paper-filter.js). The results come in
// three groups: first the pages without a date (section pages, codes, team members...) whose
// title or names have the words; then the news and papers, newest first; then the other
// undated pages, which only mention the words in their text. Within a group, and between
// news and papers of the same day, pages with the words in their title come first, then those
// with them in their names (authors, journal...), then the index order.
//
// Loaded with `defer` before the scripts that use it. The search page loads it too, ahead of
// its own script, so it may run twice on that page; the second run keeps the first.
window.siteSearch = window.siteSearch || (function () {
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

  // The index holds text without markup, but strip_html leaves entities (&lt;, &nbsp;...);
  // a <textarea> decodes them without running or loading anything.
  const decoder = document.createElement('textarea')
  function decode (text) {
    decoder.innerHTML = text || ''
    return decoder.value.replace(/\u00a0/g, ' ')
  }

  // The index, downloaded and prepared once; a failed download is tried again next time
  let loading = null
  function load (url) {
    if (!loading) {
      loading = fetch(url)
        .then(function (response) {
          if (!response.ok) throw new Error(response.status)
          return response.json()
        })
        .then(function (index) {
          return index.map(function (page) {
            page.title = decode(page.title)
            page.extra = decode(page.extra)
            page.text = decode(page.text)
            page.foldedTitle = fold(page.title)
            page.foldedExtra = fold(page.extra)
            page.foldedText = fold(page.text)
            return page
          })
        })
        .catch(function (error) {
          loading = null
          throw error
        })
    }
    return loading
  }

  // The pages containing every term, best first
  function search (pages, found) {
    const matches = []
    pages.forEach(function (page, order) {
      const all = page.foldedTitle + ' ' + page.foldedExtra + ' ' + page.foldedText
      if (!found.every(function (term) { return all.indexOf(term) !== -1 })) return
      const inTitle = found.every(function (term) { return page.foldedTitle.indexOf(term) !== -1 })
      const inNames = found.every(function (term) { return (page.foldedTitle + ' ' + page.foldedExtra).indexOf(term) !== -1 })
      const rank = inTitle ? 0 : (inNames ? 1 : 2)
      const group = page.time ? 1 : (rank < 2 ? 0 : 2)
      matches.push({ page, rank, group, order })
    })
    matches.sort(function (a, b) {
      if (a.group !== b.group) return a.group - b.group
      // newest first; "YYYY-MM-DD" strings compare in date order
      if (a.page.time !== b.page.time) return a.page.time < b.page.time ? 1 : -1
      return a.rank - b.rank || a.order - b.order
    })
    return matches.map(function (match) { return match.page })
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

  // "7 pages in 0.4 ms": the number of matches and how long `search` took. Browsers round
  // their clocks to protect privacy (Chrome to 0.1 ms, Firefox and Safari to 1 ms), so a
  // search too fast for the clock to tell shows as "under 1 ms".
  function summary (count, ms) {
    const pages = count + (count === 1 ? ' page' : ' pages')
    return ms > 0 ? pages + ' in ' + ms.toFixed(1) + ' ms' : pages + ' in under 1 ms'
  }

  return { terms, load, search, appendMarked, summary }
})()
