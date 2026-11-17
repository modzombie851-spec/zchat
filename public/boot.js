(function () {
  try {
    var ls = window.localStorage;
    var signedIn = Object.keys(ls).some(function (k) { return /^sb-.*-auth-token$/.test(k); });
    var mode = ls.getItem('zchat-theme-mode') || (ls.getItem('zchat-theme') === 'light' ? 'light' : 'dark');
    var dark = mode === 'dark';
    if (mode === 'auto') dark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (mode === 'schedule') {
      var s = JSON.parse(ls.getItem('zchat-theme-sched') || 'null') || { from: '19:00', to: '07:00' };
      var p = function (x) { var t = String(x || '0:0').split(':'); return (parseInt(t[0], 10) || 0) * 60 + (parseInt(t[1], 10) || 0); };
      var d = new Date(); var m = d.getHours() * 60 + d.getMinutes(); var a = p(s.from); var b = p(s.to);
      dark = a === b ? true : (a < b ? (m >= a && m < b) : (m >= a || m < b));
    }
    var bg = !signedIn ? '#FFFFFF' : dark ? (ls.getItem('zchat-pure-black') === '1' ? '#000000' : '#0C0C0E') : '#FFFFFF';
    document.documentElement.style.setProperty('--zboot', bg);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', bg);
  } catch (e) {}
})();
