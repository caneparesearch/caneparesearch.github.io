// Copy buttons for the BibTeX entries on the Software page (software/index.html). Each
// button sits in a .software-bibtex box after the <pre> it copies; it is hidden in the
// HTML and shown here, so without JavaScript (or without the Clipboard API, which needs
// HTTPS or localhost) the entries can still be selected and copied by hand. After a copy
// the button reads "Copied" for two seconds.
//
// Loaded with `defer`, so the page is fully parsed when this runs (see js/back-to-top.js).
(function () {
  if (!navigator.clipboard) return

  document.querySelectorAll('.software-bibtex-copy').forEach(function (button) {
    const pre = button.parentNode.querySelector('pre')
    if (!pre) return
    let timer

    button.addEventListener('click', function () {
      navigator.clipboard.writeText(pre.textContent).then(function () {
        button.textContent = 'Copied'
        clearTimeout(timer)
        timer = setTimeout(function () { button.textContent = 'Copy' }, 2000)
      }, function () {
        button.textContent = 'Copy failed'
      })
    })

    button.hidden = false
  })
})()
