// The co-author network on the Collaborators page (papers/collaborators/index.html). The people
// and links come from the page (#collab-data, built by _plugins/collaborators.rb); the layout is
// D3's force simulation (js/vendor/d3-force.min.js, loaded before this), drawn on a canvas,
// which stays quick with a few hundred circles and a few thousand lines.
//
// Circles are sized by the papers a person shares with us, team members in the site's orange accent;
// names show for the most frequent collaborators and, as one zooms in, for everyone. Clicking a
// circle (or choosing a name in the box) focuses that person: their lines and co-authors stay,
// the rest fade, and a note gives their papers with a link to them on the Papers page. Wheel or
// pinch zooms, dragging the background moves the map, dragging a circle moves it, and "Reset
// view" brings everything back. Colours follow the light or dark theme.
//
// Loaded with `defer`, after js/vendor/d3-force.min.js (see js/back-to-top.js).
(function () {
  const root = document.querySelector('.collab')
  const source = document.getElementById('collab-data')
  if (!root || !source || !window.d3 || !window.d3.forceSimulation) return

  const data = JSON.parse(source.textContent)
  const nodes = data.nodes.map(function (n) { return Object.assign({ links: 0 }, n) })
  const links = data.links.map(function (l) {
    nodes[l.source].links++
    nodes[l.target].links++
    return { source: l.source, target: l.target, papers: l.papers }
  })
  const neighbours = nodes.map(function () { return new Set() })
  links.forEach(function (l) {
    neighbours[l.source].add(l.target)
    neighbours[l.target].add(l.source)
  })

  const canvas = root.querySelector('.collab-canvas')
  const ctx = canvas.getContext('2d')
  const stage = root.querySelector('.collab-stage')
  const info = root.querySelector('.collab-info')
  const search = root.querySelector('.collab-search')
  const reset = root.querySelector('.collab-reset')

  function radius (n) { return n.hub ? 14 : 3 + 2.2 * Math.sqrt(n.papers) }
  nodes.forEach(function (n) { n.r = radius(n) })
  const hub = nodes.filter(function (n) { return n.hub })[0]
  if (hub) { hub.fx = 0; hub.fy = 0 }

  // the view: a scale and an offset, in CSS pixels, from the layout's centre
  let width = 0
  let height = 0
  let view = { k: 1, x: 0, y: 0 }
  let focus = null
  let bound = 0 // the containing circle's radius, once set (setBound below)
  let dragging = null

  function resize () {
    const ratio = window.devicePixelRatio || 1
    width = stage.clientWidth
    height = stage.clientHeight
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    draw()
  }

  function colours () {
    const style = getComputedStyle(document.documentElement)
    function v (name) { return style.getPropertyValue(name).trim() }
    return { bg: v('--site-bg'), text: v('--site-text'), heading: v('--site-heading'), accent: v('--site-accent'), muted: v('--site-muted'), border: v('--site-border'), tint: v('--site-tag-bg') || v('--site-bg') }
  }

  function toScreen (n) { return [width / 2 + view.x + n.x * view.k, height / 2 + view.y + n.y * view.k] }
  function toWorld (px, py) { return [(px - width / 2 - view.x) / view.k, (py - height / 2 - view.y) / view.k] }

  function draw () {
    if (!width) return
    const c = colours()
    ctx.clearRect(0, 0, width, height)
    ctx.save()
    ctx.translate(width / 2 + view.x, height / 2 + view.y)
    ctx.scale(view.k, view.k)

    // the containing circle: a faint disc and ring around everyone
    if (bound) {
      ctx.globalAlpha = 1
      ctx.beginPath()
      ctx.arc(0, 0, bound, 0, 2 * Math.PI)
      ctx.fillStyle = c.tint
      ctx.fill()
      ctx.lineWidth = 1.5 / view.k
      ctx.strokeStyle = c.border
      ctx.stroke()
    }

    // lines: all faint, the focused person's in the link colour on top
    ctx.lineWidth = 0.6 / view.k
    ctx.strokeStyle = c.border
    ctx.globalAlpha = focus ? 0.15 : 0.55
    ctx.beginPath()
    links.forEach(function (l) {
      ctx.moveTo(l.source.x, l.source.y)
      ctx.lineTo(l.target.x, l.target.y)
    })
    ctx.stroke()
    if (focus) {
      ctx.globalAlpha = 0.9
      ctx.strokeStyle = c.accent
      links.forEach(function (l) {
        if (l.source !== focus && l.target !== focus) return
        ctx.lineWidth = (0.8 + 0.6 * l.papers) / view.k
        ctx.beginPath()
        ctx.moveTo(l.source.x, l.source.y)
        ctx.lineTo(l.target.x, l.target.y)
        ctx.stroke()
      })
    }

    // circles
    nodes.forEach(function (n) {
      const lit = !focus || n === focus || neighbours[focus.index].has(n.index)
      ctx.globalAlpha = lit ? 1 : 0.2
      ctx.fillStyle = n.hub ? c.heading : n.team ? c.accent : c.muted
      ctx.beginPath()
      ctx.arc(n.x, n.y, n.r, 0, 2 * Math.PI)
      ctx.fill()
      if (n === focus) {
        ctx.lineWidth = 2.5 / view.k
        ctx.strokeStyle = c.heading
        ctx.stroke()
      }
    })

    // names: frequent collaborators always, everyone once zoomed in, the focused person's circle
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    nodes.forEach(function (n) {
      const near = focus && (n === focus || neighbours[focus.index].has(n.index))
      const show = near || n.hub || n.papers >= 5 * Math.min(1, 1 / view.k) || view.k >= 2.5 || (view.k >= 1.6 && n.papers >= 2)
      if (!show) return
      ctx.globalAlpha = !focus || near ? 1 : 0.25
      const size = (n === focus ? 14 : n.papers >= 8 || n.hub ? 12.5 : 11) / view.k
      ctx.font = (n === focus || n.hub ? '600 ' : '') + size + 'px "IBM Plex Sans", "IBM Plex Sans fallback", Helvetica, Arial, sans-serif'
      ctx.fillStyle = n.team || n.hub ? c.heading : c.text
      ctx.lineWidth = 3 / view.k
      ctx.strokeStyle = c.bg
      ctx.strokeText(n.name, n.x, n.y + n.r + 2 / view.k)
      ctx.fillText(n.name, n.x, n.y + n.r + 2 / view.k)
    })
    ctx.restore()
  }

  // layout: linked people pulled together (more papers, closer), everyone pushed apart a little
  const sim = window.d3.forceSimulation(nodes)
    .force('link', window.d3.forceLink(links).distance(function (l) { return 90 / Math.sqrt(l.papers) }).strength(function (l) {
      return 0.6 / Math.min(l.source.links, l.target.links)
    }))
    .force('charge', window.d3.forceManyBody().strength(-90).distanceMax(700))
    .force('collide', window.d3.forceCollide().radius(function (n) { return n.r + 4 }))
    .force('x', window.d3.forceX(0).strength(0.03))
    .force('y', window.d3.forceY(0).strength(0.03))
    .on('tick', draw)

  function nodeAt (px, py) {
    const p = toWorld(px, py)
    let best = null
    let bestDistance = Infinity
    nodes.forEach(function (n) {
      const d = Math.hypot(n.x - p[0], n.y - p[1])
      if (d < n.r + 4 / view.k && d < bestDistance) { best = n; bestDistance = d }
    })
    return best
  }

  function setFocus (n) {
    focus = n
    if (n) {
      const count = neighbours[n.index].size
      const papersUrl = '/papers/?q=' + encodeURIComponent(n.query)
      info.innerHTML = ''
      const name = document.createElement('strong')
      name.textContent = n.name
      info.appendChild(name)
      info.appendChild(document.createTextNode(' · ' + n.papers + (n.papers === 1 ? ' paper' : ' papers') + (n.hub ? '' : ' · ' + count + (count === 1 ? ' co-author' : ' co-authors')) + ' · '))
      const a = document.createElement('a')
      a.href = papersUrl
      a.textContent = 'papers'
      info.appendChild(a)
      if (n.url) {
        info.appendChild(document.createTextNode(' · '))
        const t = document.createElement('a')
        t.href = n.url
        t.textContent = 'team page'
        info.appendChild(t)
      }
      info.hidden = false
    } else {
      info.hidden = true
    }
    draw()
  }

  function centreOn (n, k) {
    view.k = k
    view.x = -n.x * k
    view.y = -n.y * k
  }

  // the whole circle in view (or, before it exists, everyone)
  function fit () {
    if (bound) {
      const k = Math.min(width, height) / (2 * bound + 40)
      view = { k, x: 0, y: 0 }
      return
    }
    let minX = Infinity; let maxX = -Infinity; let minY = Infinity; let maxY = -Infinity
    nodes.forEach(function (n) {
      minX = Math.min(minX, n.x - n.r); maxX = Math.max(maxX, n.x + n.r)
      minY = Math.min(minY, n.y - n.r); maxY = Math.max(maxY, n.y + n.r)
    })
    const k = Math.min(width / (maxX - minX + 40), height / (maxY - minY + 40), 2)
    view = { k, x: -((minX + maxX) / 2) * k, y: -((minY + maxY) / 2) * k }
  }

  // The containing circle, centred on the hub: sized once the layout has settled to hold most
  // people (the 95th percentile of their distance from the centre, plus room), then a force
  // keeps everyone inside it, the small separate groups that drift out among them
  function setBound () {
    const d = nodes.map(function (n) { return Math.hypot(n.x, n.y) + n.r }).sort(function (a, b) { return a - b })
    bound = d[Math.floor(d.length * 0.95)] * 1.08
    sim.force('contain', function () {
      nodes.forEach(function (n) {
        if (n.fx != null) return
        const r = Math.hypot(n.x, n.y)
        const limit = bound - n.r - 2
        if (r > limit) {
          const s = limit / r
          n.x *= s; n.y *= s
          n.vx *= 0.5; n.vy *= 0.5
        }
      })
    })
  }

  // pointer: drag a circle, drag the background to move, two fingers to pinch, click to focus
  const pointers = new Map()
  let moved = false
  let pinch = null

  canvas.addEventListener('pointerdown', function (event) {
    canvas.setPointerCapture(event.pointerId)
    pointers.set(event.pointerId, { x: event.offsetX, y: event.offsetY })
    moved = false
    if (pointers.size === 2) {
      const p = Array.from(pointers.values())
      pinch = { d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), k: view.k }
      dragging = null
      return
    }
    const n = nodeAt(event.offsetX, event.offsetY)
    dragging = n ? { node: n } : { pan: true }
  })

  canvas.addEventListener('pointermove', function (event) {
    const last = pointers.get(event.pointerId)
    if (!last) {
      canvas.style.cursor = nodeAt(event.offsetX, event.offsetY) ? 'pointer' : 'grab'
      return
    }
    const dx = event.offsetX - last.x
    const dy = event.offsetY - last.y
    pointers.set(event.pointerId, { x: event.offsetX, y: event.offsetY })
    if (Math.abs(dx) + Math.abs(dy) > 1) moved = true
    if (pinch && pointers.size === 2) {
      const p = Array.from(pointers.values())
      zoomAt((p[0].x + p[1].x) / 2, (p[0].y + p[1].y) / 2, pinch.k * Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) / pinch.d / view.k)
      return
    }
    if (!dragging) return
    if (dragging.node && !dragging.node.hub) {
      const w = toWorld(event.offsetX, event.offsetY)
      dragging.node.fx = w[0]
      dragging.node.fy = w[1]
      sim.alphaTarget(0.2).restart()
    } else if (dragging.pan) {
      view.x += dx
      view.y += dy
      draw()
    }
  })

  function release (event) {
    pointers.delete(event.pointerId)
    if (pointers.size < 2) pinch = null
    if (!dragging) return
    if (dragging.node && !dragging.node.hub) {
      dragging.node.fx = null
      dragging.node.fy = null
      sim.alphaTarget(0)
    }
    if (!moved) setFocus(dragging.node || null)
    dragging = null
  }
  canvas.addEventListener('pointerup', release)
  canvas.addEventListener('pointercancel', release)

  function zoomAt (px, py, factor) {
    const k = Math.min(8, Math.max(0.2, view.k * factor))
    const w = toWorld(px, py)
    view.k = k
    view.x = px - width / 2 - w[0] * k
    view.y = py - height / 2 - w[1] * k
    draw()
  }
  canvas.addEventListener('wheel', function (event) {
    event.preventDefault()
    zoomAt(event.offsetX, event.offsetY, Math.exp(-event.deltaY * 0.0015))
  }, { passive: false })

  // the box: choosing or typing a full name focuses that person
  search.addEventListener('change', findTyped)
  search.addEventListener('keydown', function (event) { if (event.key === 'Enter') findTyped() })
  function findTyped () {
    const wanted = search.value.trim().toLowerCase()
    if (!wanted) return
    const n = nodes.filter(function (m) { return m.name.toLowerCase() === wanted })[0] ||
      nodes.filter(function (m) { return m.name.toLowerCase().indexOf(wanted) !== -1 })[0]
    if (!n) return
    centreOn(n, Math.max(view.k, 1.8))
    setFocus(n)
  }

  reset.addEventListener('click', function () {
    search.value = ''
    fit()
    setFocus(null)
  })

  // the theme button changes the colours: redraw
  new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] })
  window.addEventListener('resize', resize)

  root.hidden = false
  resize()
  // settle the layout before showing it, then let it finish moving on screen
  sim.stop()
  for (let i = 0; i < 220; i++) sim.tick()
  setBound()
  sim.alpha(0.3)
  for (let i = 0; i < 120; i++) sim.tick()
  fit()
  draw()
  sim.alpha(0.05).restart()
})()
