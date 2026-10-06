// Opens the search overlay (_includes/search-dialog.html) from the navbar's magnifying
// glass instead of going straight to the search page, and lists the best matches under
// the field as the visitor types (js/search-core.js, the same matching as the search page).
// A result opens that page; Enter, or "See all", opens /search/?q=... with every result.
// The down and up arrows move between the field and the results. On the search page itself
// the icon focuses that page's own field instead. Browsers without <dialog> follow the link.
//
// Loaded with `defer`, after js/search-core.js, so the document is fully parsed when this
// runs (see js/back-to-top.js for why there is no DOMContentLoaded guard).
(function () {
  const SHOWN = 6 // results listed in the overlay; the search page lists them all

  const dialog = document.getElementById('search-dialog')
  const links = document.querySelectorAll('a[data-search-dialog]')
  const core = window.siteSearch
  if (!dialog || !links.length || !core || typeof dialog.showModal !== 'function') return

  const form = dialog.querySelector('form')
  const input = dialog.querySelector('input[name="q"]')
  const hint = dialog.querySelector('.search-dialog-hint')
  const list = dialog.querySelector('.search-dialog-results')
  const more = dialog.querySelector('.search-dialog-more')
  const emptyHint = hint.textContent

  let pages = null
  let failed = false

  function render () {
    const query = input.value
    const found = core.terms(query)
    list.textContent = ''
    more.hidden = true
    if (!found.length) {
      hint.textContent = emptyHint
      return
    }
    if (!pages) {
      hint.textContent = failed ? 'The results could not load here. Press Enter to search on the search page.' : 'Loading…'
      return
    }

    const matches = core.search(pages, found)
    if (!matches.length) {
      hint.textContent = 'Nothing on the site matches “' + query.trim() + '”.'
      return
    }
    hint.textContent = matches.length + (matches.length === 1 ? ' page' : ' pages')

    const items = document.createDocumentFragment()
    matches.slice(0, SHOWN).forEach(function (page) {
      const item = document.createElement('li')
      const link = document.createElement('a')
      link.href = page.url
      const title = document.createElement('span')
      title.className = 'search-dialog-result-title'
      core.appendMarked(title, page.title, page.foldedTitle, 0, page.title.length, found)
      const meta = document.createElement('span')
      meta.className = 'search-dialog-result-meta'
      meta.textContent = page.date ? page.section + ' · ' + page.date : page.section
      link.appendChild(title)
      link.appendChild(meta)
      item.appendChild(link)
      items.appendChild(item)
    })
    list.appendChild(items)

    if (matches.length > SHOWN) {
      more.href = '/search/?q=' + encodeURIComponent(query.trim())
      more.textContent = 'See all ' + matches.length + ' results →'
      more.hidden = false
    }
  }

  function open () {
    // On a phone the icon is inside the navbar's menu: close the menu, so it is not
    // still open when the overlay closes (js/nav-toggle.js animates it shut)
    const toggler = document.querySelector('.navbar-toggler[aria-expanded="true"]')
    if (toggler) toggler.click()
    input.value = ''
    render()
    dialog.showModal()
    input.focus()
    if (!pages) {
      failed = false
      core.load(form.getAttribute('data-index'))
        .then(function (index) {
          pages = index
          render()
        })
        .catch(function () {
          failed = true
          render()
        })
    }
  }

  links.forEach(function (link) {
    link.addEventListener('click', function (event) {
      // a new tab or window was asked for: let the link do that
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
      event.preventDefault()
      const pageField = document.getElementById('site-search-input')
      if (pageField) {
        pageField.focus()
        pageField.select()
        return
      }
      open()
    })
  })

  input.addEventListener('input', render)

  // Down from the field goes to the first result, then down the list; up goes back
  dialog.addEventListener('keydown', function (event) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    const targets = [input].concat(Array.prototype.slice.call(list.querySelectorAll('a')))
    if (!more.hidden) targets.push(more)
    const at = targets.indexOf(document.activeElement)
    if (at === -1) return
    const next = at + (event.key === 'ArrowDown' ? 1 : -1)
    if (next < 0 || next >= targets.length) return
    event.preventDefault()
    targets[next].focus()
  })

  dialog.querySelector('.search-dialog-close').addEventListener('click', function () {
    dialog.close()
  })

  // A click on the dimmed page around the panel closes it: such a click lands on the
  // <dialog> element itself, outside the panel's box.
  dialog.addEventListener('click', function (event) {
    if (event.target !== dialog) return
    const box = dialog.getBoundingClientRect()
    const inside = event.clientX >= box.left && event.clientX <= box.right &&
      event.clientY >= box.top && event.clientY <= box.bottom
    if (!inside) dialog.close()
  })

  // Nothing typed: stay in the field rather than open an empty search page
  form.addEventListener('submit', function (event) {
    if (!input.value.trim()) {
      event.preventDefault()
      input.focus()
    }
  })
})()
