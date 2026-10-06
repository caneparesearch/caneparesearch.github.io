// Opens the search overlay (_includes/search-dialog.html) from the navbar's magnifying
// glass instead of going straight to the search page. Enter submits the query to
// /search/?q=..., which lists the results. On the search page itself the icon focuses
// that page's own field instead. Browsers without <dialog> follow the link as before.
//
// Loaded with `defer`, so the document is fully parsed when this runs (see
// js/back-to-top.js for why there is no DOMContentLoaded guard).
(function () {
  const dialog = document.getElementById('search-dialog')
  const links = document.querySelectorAll('a[data-search-dialog]')
  if (!dialog || !links.length || typeof dialog.showModal !== 'function') return

  const input = dialog.querySelector('input[name="q"]')
  const form = dialog.querySelector('form')

  function open () {
    input.value = ''
    dialog.showModal()
    input.focus()
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
