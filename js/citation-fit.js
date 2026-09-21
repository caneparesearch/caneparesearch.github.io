// On a paper page, keeps the line under the title (authors; journal) to a single line where it can: if it
// wraps and lists three or more authors, the list is cut to the first authors that fit followed by "et al.",
// and "Canepa P." is always shown, followed by "..." when authors come after her. The full list stays in the tooltip. Without JavaScript the full list shows.
(function () {
  var cite = document.querySelector('.paper-cite');
  var box = cite && cite.querySelector('.cite-authors');
  if (!box) return;

  var full = box.innerHTML.trim();
  var names = full.split(/,\s+(?:and\s+)?|\s+and\s+/).map(function (n) { return n.trim(); }).filter(Boolean);
  if (names.length < 3) return;

  var canepa = -1;
  names.forEach(function (n, i) { if (canepa < 0 && /Canepa P\./.test(n)) canepa = i; });
  var fullText = box.textContent.trim();

  function wraps() {
    var cs = getComputedStyle(cite);
    var line = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5;
    return cite.getBoundingClientRect().height > line * 1.5;
  }

  function abbreviated(k) {
    var text = names.slice(0, k).join(', ') + ' et al.';
    if (canepa >= k) {
      text += ', ' + names[canepa];
      if (canepa < names.length - 1) text += ', ...';
    }
    return text;
  }

  function fit() {
    box.innerHTML = full;
    box.removeAttribute('title');
    if (!wraps()) return;
    box.title = fullText;
    for (var k = names.length - 1; k >= 1; k--) {
      box.innerHTML = abbreviated(k);
      if (!wraps()) return;
    }
  }

  var timer;
  window.addEventListener('resize', function () {
    clearTimeout(timer);
    timer = setTimeout(fit, 150);
  });
  window.addEventListener('load', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  fit();
})();
