(() => {
  "use strict";

  const stack = [];
  let current = null;
  const screens = {};

  function register(id) {
    const el = document.getElementById(id);
    if (el) screens[id] = el;
  }

  function applyVisibility(id) {
    Object.keys(screens).forEach((key) => {
      screens[key].classList.toggle("hidden", key !== id);
    });
  }

  function dispatchChange(id) {
    document.dispatchEvent(new CustomEvent("screenchange", { detail: { id, canGoBack: stack.length > 0 } }));
  }

  function show(id, opts = {}) {
    const { push = true } = opts;
    if (!screens[id]) {
      console.error("Unknown screen id:", id);
      return;
    }
    if (current && push) {
      stack.push(current);
    }
    current = id;
    applyVisibility(id);
    window.scrollTo(0, 0);
    dispatchChange(id);
  }

  function back() {
    if (stack.length === 0) return;
    const prev = stack.pop();
    current = prev;
    applyVisibility(prev);
    window.scrollTo(0, 0);
    dispatchChange(prev);
  }

  function resetTo(id) {
    stack.length = 0;
    current = null;
    show(id, { push: false });
  }

  function canGoBack() {
    return stack.length > 0;
  }

  function getCurrent() {
    return current;
  }

  window.Nav = { register, show, back, resetTo, canGoBack, getCurrent };
})();
