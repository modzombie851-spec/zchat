(function () {
  if (typeof window === 'undefined' || window.ZSAFE) return;
  var SEVERE = [
    'kill yourself', 'kill urself', 'kys', 'go die', 'hope you die', 'hope u die', 'end yourself', 'end urself', 'hang yourself', 'neck yourself',
    'drink bleach', 'you should die', 'u should die', 'nobody would miss you', 'no one would miss you', 'the world is better without you', 'i will kill you', 'ill kill you',
    'gonna kill you', 'i will find you', 'i know where you live', 'i will hurt you', 'watch your back', 'maranawa', 'marala dannam', 'kolluven', 'konnuduven', 'kolla poren'
  ];
  var STRONG = [
    'retard', 'retarded', 'whore', 'slut', 'bitch', 'cunt', 'skank', 'faggot', 'fag', 'tranny', 'dyke', 'nigger', 'chink', 'paki',
    'thevidiya', 'thevdiya', 'wesiya', 'vesiya', 'huththa', 'hutta', 'pakaya', 'ponnaya', 'punda', 'pundai', 'otha', 'ommala', 'kariya', 'sakkiliya', 'kalla thoni'
  ];
  var MILD = [
    'ugly', 'fat', 'fatty', 'fatso', 'stupid', 'idiot', 'dumb', 'dumbass', 'moron', 'loser', 'pathetic', 'worthless', 'useless', 'disgusting', 'gross',
    'freak', 'creep', 'weirdo', 'cringe', 'shut up', 'stfu', 'nobody likes you', 'no one likes you', 'nobody cares', 'no one cares', 'nobody asked', 'no one asked',
    'you suck', 'u suck', 'waste of space', 'waste of air', 'hate you', 'everyone hates you', 'liar', 'fuck', 'fucking', 'fucker', 'motherfucker', 'shit', 'bullshit',
    'asshole', 'dickhead', 'bastard', 'modaya', 'gona', 'pissu', 'kalakanni', 'balla', 'haraka', 'booruwa', 'loosu', 'naaye', 'mokkai', 'paithiyam'
  ];
  var PAIRED = ['trash', 'garbage', 'pig', 'cow', 'whale', 'monkey', 'donkey', 'dog', 'clown', 'joke', 'disgrace', 'failure', 'mistake', 'nobody'];
  var TARGET = /(^|[^a-z])(you|u|ur|your|youre|yours|yourself|ya|oya|oyaa|umba|umbe|thoo|nee|unaku|unakku|neenga|ninga)([^a-z]|$)|@[a-z0-9._]{3,}/;
  function esc(ch) { return ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function pattern(w) { return w.split('').map(function (ch) { return ch === ' ' ? '[\\s._*-]*' : esc(ch) + '+'; }).join(''); }
  function build(list) { return list.length ? new RegExp('(^|[^a-z])(' + list.map(pattern).join('|') + ')(?=$|[^a-z])', 'g') : null; }
  var RE = {
    severe: build(SEVERE),
    strong: build(STRONG),
    mild: build(MILD),
    paired: new RegExp('(^|[^a-z])((?:you|u|ur|youre|your|ya|oya|umba)\\s+(?:are\\s+|r\\s+|re\\s+|such\\s+an?\\s+|so\\s+|a\\s+|an\\s+|look\\s+like\\s+an?\\s+)?(?:' + PAIRED.map(pattern).join('|') + '))(?=$|[^a-z])', 'g')
  };
  var extraKey = '';
  var extraRe = null;
  function norm(t) {
    return String(t || '').toLowerCase()
      .replace(/[0@4]/g, function (c) { return c === '0' ? 'o' : 'a'; })
      .replace(/[1!|]/g, 'i').replace(/3/g, 'e').replace(/[5$]/g, 's').replace(/7/g, 't')
      .replace(/[‘’']/g, '').replace(/[​-‍⁠]/g, '');
  }
  function hits(re, s) {
    var out = [];
    if (!re) return out;
    re.lastIndex = 0;
    var m;
    while ((m = re.exec(s)) && out.length < 4) {
      var at = m.index + m[1].length;
      out.push([at, at + m[2].length]);
      if (re.lastIndex === m.index) re.lastIndex += 1;
    }
    return out;
  }
  function near(s, a, b) { return TARGET.test(s.slice(Math.max(0, a - 18), Math.min(s.length, b + 12))); }
  function kind(text, extra) {
    var raw = String(text || '');
    var s = norm(raw);
    if (!s.trim()) return { score: 0, hurt: false };
    var words = Array.isArray(extra) ? extra.filter(function (w) { return typeof w === 'string' && w.trim().length >= 2; }).map(function (w) { return w.trim().toLowerCase(); }).slice(0, 200) : [];
    var key = words.join('|');
    if (key !== extraKey) { extraKey = key; extraRe = build(words); }
    var score = 0;
    hits(RE.severe, s).forEach(function () { score += 3; });
    hits(RE.strong, s).slice(0, 2).forEach(function (h) { score += near(s, h[0], h[1]) ? 3 : 2; });
    hits(RE.paired, s).slice(0, 2).forEach(function () { score += 2; });
    var loose = 0;
    hits(RE.mild, s).concat(hits(extraRe, s)).slice(0, 3).forEach(function (h) { if (near(s, h[0], h[1])) score += 2; else loose = 1; });
    score += loose;
    if (score > 0) {
      var letters = raw.replace(/[^A-Za-z]/g, '');
      if (letters.length >= 12 && letters.replace(/[^A-Z]/g, '').length / letters.length > 0.7) score += 1;
    }
    return { score: score, hurt: score >= 2 };
  }
  window.ZSAFE = { kind: kind };
})();
