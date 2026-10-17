// Settles the layout of the Collaborators map (js/collaborators.js) in a background thread, so the
// 340 steps of the force simulation, seconds of work on a slow phone, never block the page. It
// receives each person's radius, number of links and whether they are the hub, and the links;
// runs the same forces as the page; and sends back where everyone ends up and the radius of the
// containing circle. The page keeps its own simulation, stopped, for dragging people about.
self.onmessage = function (event) {
  importScripts(event.data.d3)
  const d3 = self.d3
  const nodes = event.data.nodes.map(function (n) {
    const node = { r: n.r, links: n.links }
    if (n.hub) { node.fx = 0; node.fy = 0 }
    return node
  })
  const links = event.data.links.map(function (l) { return { source: l.source, target: l.target, papers: l.papers } })

  const sim = d3.forceSimulation(nodes).stop()
    .force('link', d3.forceLink(links).distance(function (l) { return 90 / Math.sqrt(l.papers) }).strength(function (l) {
      return 0.6 / Math.min(l.source.links, l.target.links)
    }))
    .force('charge', d3.forceManyBody().strength(-90).distanceMax(700))
    .force('collide', d3.forceCollide().radius(function (n) { return n.r + 4 }))
    .force('x', d3.forceX(0).strength(0.03))
    .force('y', d3.forceY(0).strength(0.03))

  for (let i = 0; i < 220; i++) sim.tick()

  // the containing circle: holds 95% of people with room to spare; the rest are moved back to its
  // edge after every step (after it, not as one of its forces, which the step's own movement undoes)
  const d = nodes.map(function (n) { return Math.hypot(n.x, n.y) + n.r }).sort(function (a, b) { return a - b })
  const bound = d[Math.floor(d.length * 0.95)] * 1.08
  function contain () {
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
  }
  sim.alpha(0.3)
  for (let i = 0; i < 120; i++) { sim.tick(); contain() }

  self.postMessage({ x: nodes.map(function (n) { return n.x }), y: nodes.map(function (n) { return n.y }), bound })
}
