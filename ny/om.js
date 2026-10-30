(() => {
  const aabn = () => {
    let id = '';
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { return; }
    const e = id && document.getElementById(id);
    if (e instanceof HTMLDetailsElement) e.open = true;
  };
  aabn();
  addEventListener('hashchange', aabn);
})();
