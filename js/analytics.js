// Google Analytics (gtag.js), only once the visitor has accepted cookies in the banner at the
// foot of the page (_includes/cookie-banner.html). The choice is kept in localStorage; until it
// is made the banner shows on every page and nothing is sent to Google. "Cookie settings" in the
// footer shows the banner again. Once accepted, the ~150 KB library is only fetched after the page
// has finished loading, so on slow connections it does not compete with the page's own stylesheet
// and fonts.
//
// This lives in a file rather than inline in the page because the Content-Security-Policy header
// (set in Cloudflare) allows inline scripts only by their exact SHA-256 hash: any edit to an inline
// script silently blocks it until the hash there is updated. Files from the site itself are allowed.
(function () {
  const ID = 'G-2MGVFYKFQX'
  const KEY = 'cookie-consent' // "accepted" or "declined"

  const banner = document.getElementById('cookie-banner')
  const settings = document.getElementById('cookie-settings')

  // localStorage can throw (blocked site data, some private windows): then the banner is shown
  // on every page and analytics stays off unless accepted on that page
  function readChoice () {
    try { return window.localStorage.getItem(KEY) } catch (e) { return null }
  }
  function saveChoice (choice) {
    try { window.localStorage.setItem(KEY, choice) } catch (e) {}
  }

  let started = false
  function startAnalytics () {
    if (started) return
    started = true
    window.dataLayer = window.dataLayer || []
    window.gtag = function () { window.dataLayer.push(arguments) }
    window.gtag('js', new Date())
    window.gtag('config', ID)
    const load = function () {
      const s = document.createElement('script')
      s.async = true
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID
      document.head.appendChild(s)
    }
    if (document.readyState === 'complete') load()
    else window.addEventListener('load', load)
  }

  // Analytics' own cookies (_ga, _ga_<id>), set on the site's domain and its parent, removed when
  // a visitor who had accepted declines; the page is reloaded so the library stops as well
  function removeAnalyticsCookies () {
    const host = window.location.hostname
    const domains = ['', host, '.' + host, '.' + host.split('.').slice(-2).join('.')]
    document.cookie.split(';').forEach(function (c) {
      const name = c.split('=')[0].trim()
      if (name !== '_ga' && name.indexOf('_ga_') !== 0) return
      domains.forEach(function (d) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : '')
      })
    })
  }

  function showBanner () {
    if (banner) banner.hidden = false
  }
  function hideBanner () {
    if (banner) banner.hidden = true
  }

  if (banner) {
    banner.querySelector('[data-cookie-accept]').addEventListener('click', function () {
      saveChoice('accepted')
      hideBanner()
      startAnalytics()
    })
    banner.querySelector('[data-cookie-decline]').addEventListener('click', function () {
      saveChoice('declined')
      hideBanner()
      if (started) {
        removeAnalyticsCookies()
        window.location.reload()
      }
    })
  }

  if (settings) {
    settings.hidden = false
    settings.querySelector('button').addEventListener('click', function () {
      showBanner()
      if (banner) banner.querySelector('[data-cookie-accept]').focus()
    })
  }

  const choice = readChoice()
  if (choice === 'accepted') startAnalytics()
  else if (choice !== 'declined') showBanner()
})()
