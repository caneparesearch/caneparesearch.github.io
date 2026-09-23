// Reveals more posts as the visitor scrolls near the bottom of the page.
// The listing page itself renders every post (see e.g. news/index.html), marking
// all but the first batch `hidden`; this just removes that attribute in batches,
// so a revealed post is byte-for-byte the same markup as the ones shown up front
// (no separate fetch, no risk of it looking different).
(function () {
  var BATCH_SIZE = 8;
  var SCROLL_THRESHOLD = 600;
  var initialized = false;

  // Checking document.readyState and then conditionally adding a
  // DOMContentLoaded listener has a real race in Safari: readyState can
  // still read 'loading' after the event has already fired, so the
  // listener is registered for an event that will never come and this
  // script's setup silently never runs. Try immediately - safe even before
  // the DOM is ready, since querySelector on missing elements just returns
  // null - and retry on DOMContentLoaded as a fallback; the initialized
  // flag keeps the real setup from running twice if both attempts succeed.
  function tryInit() {
    if (initialized) return;
    var postList = document.querySelector('.post-list');
    var spinner = document.querySelector('.infinite-spinner');
    if (!postList || !spinner) return;
    initialized = true;

    function hiddenPosts() {
      return postList.querySelectorAll('.blog-post[hidden]');
    }

    function hideSpinner() {
      window.removeEventListener('scroll', maybeReveal);
      spinner.style.transition = 'opacity 400ms';
      spinner.style.opacity = '0';
      setTimeout(function () { spinner.style.display = 'none'; }, 400);
    }

    function revealNextBatch() {
      var hidden = hiddenPosts();
      for (var i = 0; i < BATCH_SIZE && i < hidden.length; i++) {
        hidden[i].removeAttribute('hidden');
      }
      if (hiddenPosts().length === 0) hideSpinner();
    }

    function maybeReveal() {
      var bottomScrollPosition = window.innerHeight + window.scrollY;
      var documentHeight = document.documentElement.scrollHeight;
      if (documentHeight - SCROLL_THRESHOLD < bottomScrollPosition) {
        revealNextBatch();
      }
    }

    if (hiddenPosts().length === 0) {
      hideSpinner();
      return;
    }

    window.addEventListener('scroll', maybeReveal, { passive: true });
    window.addEventListener('load', maybeReveal);
  }

  tryInit();
  document.addEventListener('DOMContentLoaded', tryInit);
})();
