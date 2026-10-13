// The role buttons on the Team page (team/index.html): each shows only the current members and
// alumni of one role (data-role on each card, from _includes/member-role.html), hides the alumni
// groups and headings left empty, and keeps the role in the address (/team/?role=phd-students),
// so a filtered page can be shared. Pressing the pressed button again, or All, shows everyone.
//
// Loaded with `defer`, so the page is fully parsed when this runs (see js/back-to-top.js).
(function () {
  const bar = document.querySelector('.team-roles')
  if (!bar) return

  const buttons = Array.prototype.slice.call(bar.querySelectorAll('.paper-topic'))
  const cards = Array.prototype.slice.call(document.querySelectorAll('.memberbox[data-role]'))
  const groups = Array.prototype.slice.call(document.querySelectorAll('.team-alumni-group'))
  const alumniTitle = document.querySelector('.team-alumni-title')
  const current = document.querySelector('.team-current')
  const status = document.querySelector('.team-roles-status')
  let role = ''

  function apply () {
    let shown = 0
    cards.forEach(function (card) {
      card.hidden = !!role && card.getAttribute('data-role') !== role
      if (!card.hidden) shown++
    })
    groups.forEach(function (group) {
      group.hidden = !group.querySelector('.memberbox:not([hidden])')
    })
    if (alumniTitle) alumniTitle.hidden = groups.every(function (group) { return group.hidden })
    if (current) current.hidden = !current.querySelector('.memberbox:not([hidden])')
    buttons.forEach(function (button) {
      button.setAttribute('aria-pressed', button.getAttribute('data-role') === role ? 'true' : 'false')
    })
    if (status) status.textContent = role ? shown + (shown === 1 ? ' person' : ' people') : ''
  }

  function save () {
    const url = new URL(window.location.href)
    if (role) {
      url.searchParams.set('role', role)
    } else {
      url.searchParams.delete('role')
    }
    if (url.href !== window.location.href) history.replaceState(null, '', url)
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      const value = button.getAttribute('data-role')
      role = value === role ? '' : value
      apply()
      save()
    })
  })

  const wanted = new URLSearchParams(window.location.search).get('role') || ''
  role = buttons.some(function (button) { return button.getAttribute('data-role') === wanted }) ? wanted : ''
  bar.hidden = false
  apply()
})()
