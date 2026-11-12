// The kind buttons on the News Index (news/archive/index.html): each shows only the posts of one
// kind of news (data-kind on each card, from the post's `kind`, see _data/news_kinds.yml), hides
// the years left empty and their "Jump to" links, gives each year the number of posts shown, and
// keeps the kind in the address (/news/archive/?kind=talk), so a filtered list can be shared and
// the kind names on the News page and the posts can link to it. Pressing the pressed button
// again, or All, shows everything. Modelled on js/team-filter.js.
//
// Loaded with `defer`, so the page is fully parsed when this runs (see js/back-to-top.js).
(function () {
  const bar = document.querySelector('.news-kinds')
  const fold = document.querySelector('.news-kinds-fold')
  if (!bar) return
  const foldCurrent = fold && fold.querySelector('.filter-fold-current')

  const buttons = Array.prototype.slice.call(bar.querySelectorAll('.paper-topic'))
  const items = Array.prototype.slice.call(document.querySelectorAll('.news-archive-item[data-kind]'))
  const years = Array.prototype.slice.call(document.querySelectorAll('.news-year'))
  const status = document.querySelector('.news-kinds-status')
  let kind = ''

  function apply () {
    let shown = 0
    items.forEach(function (item) {
      item.hidden = !!kind && item.getAttribute('data-kind') !== kind
      if (!item.hidden) shown++
    })
    years.forEach(function (year) {
      const count = year.querySelectorAll('.news-archive-item:not([hidden])').length
      year.hidden = count === 0
      const label = year.querySelector('.year-count')
      if (label) {
        const n = kind ? count : Number(label.getAttribute('data-total'))
        label.textContent = n + (n === 1 ? ' post' : ' posts')
      }
      const jump = document.querySelector('.page-jump a[href="#' + year.id + '"]')
      if (jump) jump.parentNode.hidden = year.hidden
    })
    buttons.forEach(function (button) {
      const on = button.getAttribute('data-kind') === kind
      button.setAttribute('aria-pressed', on ? 'true' : 'false')
      // the "Kinds" toggle the buttons are folded under names the kind chosen
      if (on && foldCurrent) foldCurrent.textContent = kind ? ': ' + button.textContent.replace(/\s*\d+\s*$/, '').trim() : ''
    })
    if (status) status.textContent = kind ? shown + (shown === 1 ? ' post' : ' posts') : ''
  }

  function save () {
    const url = new URL(window.location.href)
    if (kind) {
      url.searchParams.set('kind', kind)
    } else {
      url.searchParams.delete('kind')
    }
    if (url.href !== window.location.href) history.replaceState(null, '', url)
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      const value = button.getAttribute('data-kind')
      kind = value === kind ? '' : value
      apply()
      save()
    })
  })

  const wanted = new URLSearchParams(window.location.search).get('kind') || ''
  kind = buttons.some(function (button) { return button.getAttribute('data-kind') === wanted }) ? wanted : ''
  if (fold) {
    fold.hidden = false
    // arriving with a kind chosen (from a kind name on a post), the buttons are shown open
    if (kind) fold.open = true
  }
  apply()
})()
