// Copy buttons for the BibTeX entries (_includes/bibtex-box.html) on the paper pages and
// the Software page: a copy icon in the top right corner of the entries. Each button sits
// beside the <pre> it copies; it is hidden in the HTML and shown here, so without
// JavaScript (or without the Clipboard API, which needs HTTPS or localhost) the entries
// can still be selected and copied by hand. After a copy the icon is a check mark, and the
// button's label "Copied", for two seconds.
//
// Loaded with `defer`, so the page is fully parsed when this runs (see js/back-to-top.js).
(function () {
  if (!navigator.clipboard) return

  const COPY_ICON = 'fa-regular fa-copy fa-fw'
  const DONE_ICON = 'fa-solid fa-check fa-fw'

  document.querySelectorAll('.bibtex-copy').forEach(function (button) {
    const pre = button.parentNode.querySelector('pre')
    const icon = button.querySelector('i')
    if (!pre || !icon) return
    const label = button.getAttribute('aria-label')
    let timer

    function show (text, iconClass) {
      button.setAttribute('aria-label', text)
      button.title = text
      icon.className = iconClass
    }

    button.addEventListener('click', function () {
      navigator.clipboard.writeText(pre.textContent).then(function () {
        show('Copied', DONE_ICON)
        clearTimeout(timer)
        timer = setTimeout(function () { show(label, COPY_ICON) }, 2000)
      }, function () {
        show('Copy failed: select the text instead', COPY_ICON)
      })
    })

    button.hidden = false
  })
})()
