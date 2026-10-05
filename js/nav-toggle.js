// Opens and closes the mobile navbar menu (the button with data-bs-toggle="collapse"
// in _layouts/default.html). It replaces Bootstrap's JavaScript bundle (80 KB, 24 KB
// compressed), which the site loaded only for this. It uses Bootstrap's own CSS
// classes the same way: "collapse" hides the menu, "show" keeps it open, and
// "collapsing" animates its height (no animation with prefers-reduced-motion).
//
// Loaded with `defer`, so the document is fully parsed when this runs (see
// js/back-to-top.js for why there is no DOMContentLoaded guard).
(function () {
  const buttons = document.querySelectorAll('[data-bs-toggle="collapse"][data-bs-target]')

  buttons.forEach(function (button) {
    const menu = document.querySelector(button.getAttribute('data-bs-target'))
    if (!menu) return
    let busy = false

    // Calls done() once the height transition ends, or at once when there is none
    function afterTransition (done) {
      const seconds = parseFloat(window.getComputedStyle(menu).transitionDuration) || 0
      if (seconds === 0) { done(); return }
      let finished = false
      function finish () {
        if (finished) return
        finished = true
        menu.removeEventListener('transitionend', finish)
        done()
      }
      menu.addEventListener('transitionend', finish)
      setTimeout(finish, seconds * 1000 + 50) // in case transitionend never fires
    }

    function open () {
      menu.classList.remove('collapse')
      menu.classList.add('collapsing')
      menu.style.height = '0px'
      menu.offsetHeight // eslint-disable-line no-unused-expressions -- force a reflow so the height animates
      menu.style.height = menu.scrollHeight + 'px'
      button.classList.remove('collapsed')
      button.setAttribute('aria-expanded', 'true')
      afterTransition(function () {
        menu.classList.remove('collapsing')
        menu.classList.add('collapse', 'show')
        menu.style.height = ''
        busy = false
      })
    }

    function close () {
      menu.style.height = menu.getBoundingClientRect().height + 'px'
      menu.offsetHeight // eslint-disable-line no-unused-expressions -- force a reflow so the height animates
      menu.classList.add('collapsing')
      menu.classList.remove('collapse', 'show')
      menu.style.height = ''
      button.classList.add('collapsed')
      button.setAttribute('aria-expanded', 'false')
      afterTransition(function () {
        menu.classList.remove('collapsing')
        menu.classList.add('collapse')
        busy = false
      })
    }

    button.addEventListener('click', function (event) {
      event.preventDefault()
      if (busy) return
      busy = true
      if (menu.classList.contains('show')) close()
      else open()
    })
  })
})()
