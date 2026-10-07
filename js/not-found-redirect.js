// On the 404 page (404.html): if the missing address has capital letters and its
// lower-case version exists, go there. Team profiles used to live at addresses like
// /team/Piero-Canepa/ and now use /team/piero-canepa/; GitHub Pages treats the two as
// different, but they cannot both be built on a Mac, whose disk ignores case, so a
// redirect_from: page at the old address would overwrite the profile itself.
//
// The lower-case address is checked first, so a typo still shows this page instead of
// sending the visitor to another 404. location.replace keeps the old address out of the
// browser history, so Back does not land on it again.
(function () {
  const path = location.pathname
  const lower = path.toLowerCase()
  if (lower === path || !window.fetch) return

  fetch(lower, { method: 'HEAD' }).then(function (response) {
    if (response.ok) location.replace(lower + location.search + location.hash)
  }).catch(function () {})
})()
