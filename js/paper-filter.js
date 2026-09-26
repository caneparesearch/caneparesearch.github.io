// Search box for the papers list (papers/index.html). As the visitor types, it hides
// the paper cards whose text does not contain every word of the query, hides the years
// left with no papers, and says how many papers match. A card's text is its data-search
// attribute (title, authors, journal and its full name, year, DOI) plus the paper's
// abstract, which comes
// from papers/search.json: that file is fetched the first time the box is used (or at
// once, for a ?q= address), and until it arrives the search covers the rest. The query
// is kept in the address (?q=...) so a filtered list can be shared or bookmarked, and
// Escape clears it.
//
// Authors are stored as "Surname I. I.", so a full name is matched against that form:
// "Jean-Noël Chotard" finds "Chotard J.-N.", and "Shyue Ping Ong" finds "Ong S. P.". A query
// word that is not in the text still counts when it could be the given name of one of
// the paper's authors whose surname is also in the query. Team members are also found
// by their full name or another name alone ("Pieremanuele", "Jerry"): the page lists
// them in data-team, and each member's names are added to the text of every paper on
// which they appear as "Surname I.". Words in double quotes must
// appear together, in that order: "Chemistry of Materials" (with the quotes) leaves out
// papers whose abstract merely contains those three words.
//
// Loaded with `defer`, so the page is fully parsed when this runs (see js/back-to-top.js).
(function () {
  var box = document.querySelector('.paper-search');
  var input = document.getElementById('paper-search-input');
  var status = document.querySelector('.paper-search-status');
  if (!box || !input || !status) return;

  var cards = Array.prototype.slice.call(document.querySelectorAll('.paperbox[data-search]'));
  var years = Array.prototype.slice.call(document.querySelectorAll('.paper-year'));

  // Lower case without accents and with single spaces, so "lopez" finds "López" and a
  // quoted phrase is not missed over a double space.
  function normalize(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ');
  }

  // "Ong S. P." -> { surnames: ['ong'], initials: ['s', 'p'] }. A compound surname
  // ("Gomez-Bombarelli R.") also answers to each of its parts.
  function parseAuthors(list) {
    return normalize(list || '').split(/,\s*(?:and\s+)?|\s+and\s+/).map(function (name) {
      var tokens = name.trim().split(/\s+/).filter(Boolean);
      var initials = [];
      while (tokens.length > 1 && /^([a-z]\.-?)+$/.test(tokens[tokens.length - 1])) {
        initials = tokens.pop().replace(/[.-]/g, '').split('').concat(initials);
      }
      var surname = tokens.join(' ');
      return { surnames: [surname].concat(surname.split(/[\s-]+/)), initials: initials };
    }).filter(function (author) { return author.initials.length; });
  }

  // Team members as [name, other names...]; the first is the team page's title.
  var team = [];
  try { team = JSON.parse(box.getAttribute('data-team') || '[]'); } catch (e) {}

  // Whether a member ("Piero Canepa", or surname first as in "Wang Lu") is one of the
  // card's authors: one word of the name is an author's surname and another word starts
  // with that author's first initial.
  function isAuthor(card, name) {
    var tokens = normalize(name).replace(/\./g, '').split(' ').filter(Boolean);
    return tokens.some(function (surname, i) {
      if (surname.length < 2) return false;
      var given = tokens.filter(function (t, j) { return j !== i; })[0];
      return given && card.authors.some(function (author) {
        return author.initials[0] === given.charAt(0) && author.surnames.indexOf(surname) !== -1;
      });
    });
  }

  // Normalize each card's text and author list once, rather than on every keystroke,
  // and add the names of the team members who wrote it.
  cards.forEach(function (card) {
    card.searchText = normalize(card.getAttribute('data-search'));
    card.authors = parseAuthors(card.getAttribute('data-authors'));
    team.forEach(function (names) {
      if (isAuthor(card, names[0])) card.searchText += ' ' + normalize(names.join(' '));
    });
  });

  // Whether `word` can be read as the given name of an author of this card whose
  // surname is another word of the query.
  function givenName(card, word, words) {
    if (!/^[a-z][a-z-]+$/.test(word)) return false;
    return card.authors.some(function (author) {
      return author.initials.indexOf(word.charAt(0)) !== -1 && words.some(function (other) {
        return other !== word && author.surnames.indexOf(other) !== -1;
      });
    });
  }

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
    // "…" phrases (straight or curly quotes) first, then the remaining single words
    var phrases = [];
    var rest = normalize(query).replace(/["“”]([^"“”]+)["“”]?/g, function (all, phrase) {
      if (phrase.trim()) phrases.push(phrase.trim());
      return ' ';
    });
    var words = rest.replace(/["“”]/g, ' ').split(/\s+/).filter(Boolean); // lone quotes
    var shown = 0;

    cards.forEach(function (card) {
      var match = phrases.every(function (phrase) {
        return card.searchText.indexOf(phrase) !== -1;
      }) && words.every(function (word) {
        return card.searchText.indexOf(word) !== -1 || givenName(card, word, words);
      });
      card.hidden = !match;
      if (match) shown++;
    });

    years.forEach(function (year) {
      year.hidden = !year.querySelector('.paperbox:not([hidden])');
    });

    if (!words.length && !phrases.length) {
      status.textContent = '';
    } else if (shown === 0) {
      status.textContent = 'No papers match “' + query.trim() + '”.';
    } else {
      status.textContent = shown + ' of ' + cards.length + (cards.length === 1 ? ' paper' : ' papers');
    }
  }

  // Keep ?q= in step with the box without adding a history entry per keystroke.
  function saveQueryNow() {
    clearTimeout(saveTimer);
    var query = input.value.trim();
    var url = new URL(window.location.href);
    if (query) {
      url.searchParams.set('q', query);
    } else {
      url.searchParams.delete('q');
    }
    if (url.href !== window.location.href) history.replaceState(null, '', url);
  }

  // Safari throws once a page calls replaceState too often (holding Backspace can get
  // there), so the address is updated once typing pauses rather than on every key; it
  // is also updated straight away when the box loses focus or the page is left, so
  // following a paper link and coming back keeps the filtered list.
  var saveTimer;
  function saveQuerySoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveQueryNow, 300);
  }

  input.addEventListener('focus', loadAbstracts);

  input.addEventListener('input', function () {
    loadAbstracts();
    apply(input.value);
    saveQuerySoon();
  });

  input.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && input.value) {
      input.value = '';
      apply('');
      saveQueryNow();
    }
  });

  input.addEventListener('blur', saveQueryNow);
  window.addEventListener('pagehide', saveQueryNow);

  box.hidden = false;
  var initial = new URLSearchParams(window.location.search).get('q');
  if (initial) {
    input.value = initial;
    apply(initial);
    loadAbstracts();
  }
})();
