// Search box for the papers list (papers/index.html). As the visitor types, it hides
// the paper cards whose text does not contain every word of the query, hides the years
// left with no papers, and says how many papers match. A card's text is its data-search
// attribute (title, authors, journal, year, DOI) plus the paper's abstract, which comes
// from papers/search.json: that file is fetched the first time the box is used (or at
// once, for a ?q= address), and until it arrives the search covers the rest. The query
// is kept in the address (?q=...) so a filtered list can be shared or bookmarked, and
// Escape clears it.
//
// Loaded with `defer`, so the page is fully parsed when this runs (see js/back-to-top.js).
(function () {
  var box = document.querySelector('.paper-search');
  var input = document.getElementById('paper-search-input');
  var status = document.querySelector('.paper-search-status');
  if (!box || !input || !status) return;

  var cards = Array.prototype.slice.call(document.querySelectorAll('.paperbox[data-search]'));
  var years = Array.prototype.slice.call(document.querySelectorAll('.paper-year'));

  // Lower case without accents, so "lopez" finds "López".
  function normalize(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  // Normalize each card's text once, rather than on every keystroke.
  cards.forEach(function (card) {
    card.searchText = normalize(card.getAttribute('data-search'));
  });

  // Fetch the abstracts once, add each to its card's text, and search again with them.
  // If the fetch fails, the search simply keeps working without them.
  var abstractsRequested = false;
  function loadAbstracts() {
    if (abstractsRequested || !window.fetch) return;
    abstractsRequested = true;
    fetch(box.getAttribute('data-abstracts'))
      .then(function (response) {
        if (!response.ok) throw new Error(response.status);
        return response.json();
      })
      .then(function (abstracts) {
        cards.forEach(function (card) {
          var abstract = abstracts[card.getAttribute('data-url')];
          if (abstract) card.searchText += ' ' + normalize(abstract);
        });
        if (input.value) apply(input.value);
      })
      .catch(function () {});
  }

  function apply(query) {
    var words = normalize(query).split(/\s+/).filter(Boolean);
    var shown = 0;

    cards.forEach(function (card) {
      var match = words.every(function (word) { return card.searchText.indexOf(word) !== -1; });
      card.hidden = !match;
      if (match) shown++;
    });

    years.forEach(function (year) {
      year.hidden = !year.querySelector('.paperbox:not([hidden])');
    });

    if (!words.length) {
      status.textContent = '';
    } else if (shown === 0) {
      status.textContent = 'No papers match “' + query.trim() + '”.';
    } else {
      status.textContent = shown + ' of ' + cards.length + (cards.length === 1 ? ' paper' : ' papers');
    }

    // Cards in a row are made the same height (see _layouts/default.html); which cards
    // share a row has just changed, so measure them again.
    if (window.jQuery && jQuery.fn.matchHeight) jQuery.fn.matchHeight._update();
  }

  // Keep ?q= in step with the box without adding a history entry per keystroke.
  function saveQuery(query) {
    var url = new URL(window.location.href);
    if (query.trim()) {
      url.searchParams.set('q', query.trim());
    } else {
      url.searchParams.delete('q');
    }
    history.replaceState(null, '', url);
  }

  input.addEventListener('focus', loadAbstracts);

  input.addEventListener('input', function () {
    loadAbstracts();
    apply(input.value);
    saveQuery(input.value);
  });

  input.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && input.value) {
      input.value = '';
      apply('');
      saveQuery('');
    }
  });

  box.hidden = false;
  var initial = new URLSearchParams(window.location.search).get('q');
  if (initial) {
    input.value = initial;
    apply(initial);
    loadAbstracts();
  }
})();
