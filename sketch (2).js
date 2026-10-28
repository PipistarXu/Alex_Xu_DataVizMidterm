// Guess the Hour: this sketch uses D3 (loaded in index.html), not p5 drawing functions.
(function () {
  const DATA = {"total":[128790,87106,60010,48095,44610,51253,84261,137027,188217,211342,217736,213196,202825,198203,195815,191871,185641,175787,170287,168204,168211,179112,186413,159106],"cats":[{"id":"noise","label":"Noise","v":[67615,46608,30617,22517,17791,14701,15440,16760,18025,19576,20928,21464,22637,23115,24306,26872,29407,32372,36992,43236,51684,64137,85267,80934]},{"id":"heat","label":"Heat & hot water","v":[9151,6540,4882,4497,5121,6569,10039,15570,17009,18758,18652,17146,16014,15558,14208,14763,15794,15377,15885,16447,16940,16012,13430,11584]},{"id":"parking","label":"Parking & blocked driveways","v":[25963,15686,11588,10135,10546,14599,24265,37751,47257,44691,40361,39504,37611,35676,33551,32313,31672,34751,36767,36071,38001,42475,38538,30208]},{"id":"housing","label":"Apartment repairs","v":[6870,4725,3382,3133,3152,3795,7080,12650,20240,32359,39789,40124,38139,37556,34365,33103,29402,23171,19266,17895,14821,13237,11602,8733]},{"id":"trash","label":"Trash & sanitation","v":[2989,1998,1375,1187,1354,2257,8168,18672,31403,29268,27684,25924,23670,21552,20493,18878,18268,15926,13846,11910,9553,8497,7128,4780]},{"id":"streets","label":"Streets, lights & signals","v":[3041,2432,1516,1403,1571,2315,5333,9609,11719,14413,14968,14016,13068,14306,19246,16424,13538,11031,8878,7841,6849,6625,6784,5177]},{"id":"homeless","label":"Homeless assistance & encampments","v":[1640,1554,1164,1123,1442,1626,3240,5568,7768,7522,6136,5642,4650,4887,4372,4029,3824,3749,3554,3064,2618,2354,2050,1593]},{"id":"water","label":"Water & sewer","v":[1089,643,428,308,388,721,1674,3801,5747,6811,7053,7056,6791,6669,7007,7703,7320,6688,6194,6071,4881,3820,2920,1760]},{"id":"other","label":"Everything else","v":[10432,6920,5058,3792,3245,4670,9022,16646,29049,37944,42165,42320,40245,38884,38267,37786,36416,32722,28905,25669,22864,21955,18694,14337]}]};
  const CATS = DATA.cats, TOTAL = DATA.total, DAY = d3.sum(TOTAL), MAXT = d3.max(TOTAL);
  CATS.forEach(c => { c.day = d3.sum(c.v) / DAY; c.color = `var(--s-${c.id})`; });
  const REAL = CATS.filter(c => c.id !== "other");
  const share = (c, h) => c.v[h] / TOTAL[h];
  const fmtHour = h => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "AM" : "PM"}`;
  const fmtSpan = h => `${fmtHour(h)} to ${fmtHour((h + 1) % 24)}`;
  const pct = x => x < 0.1 ? (x * 100).toFixed(1) + "%" : Math.round(x * 100) + "%";
  const num = d3.format(",");
  const circDist = (a, b) => Math.min(Math.abs(a - b), 24 - Math.abs(a - b));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  const lower = c => c.label.toLowerCase();
  const MAXSHARE = 0.6;

  /* ---------- the game: six rounds, three kinds, alternating ---------- */
  const SEQUENCE = ["hour", "wave", "card", "hour", "wave", "card"];
  const KIND = {
    hour: { name: "Guess the hour", short: "Hour", max: 4 },
    wave: { name: "Wavelength", short: "Wave", max: 4 },
    card: { name: "Flashcard", short: "Card", max: 2 }
  };
  const MAXSCORE = d3.sum(SEQUENCE, k => KIND[k].max);
  const ICON = {
    hour: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    wave: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 17a9 9 0 0 1 18 0"/><path d="M12 17l4-6"/></svg>',
    card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="4" y="6" width="13" height="15" rx="2"/><path d="M8 3h10a2 2 0 0 1 2 2v12"/></svg>'
  };
  const CONF = ["var(--lamp)", "var(--coral)", "var(--mint)", "var(--rose)", "#b49cff"];
  function burst(on) {
    if (!on) return "";
    return `<div class="confetti" aria-hidden="true">${d3.range(26).map(i => `<i style="left:${(10 + Math.random() * 80).toFixed(0)}%;background:${CONF[i % 5]};animation-delay:${(Math.random() * 0.2).toFixed(2)}s;--dx:${(Math.random() * 140 - 70).toFixed(0)}px;--dy:${(-60 - Math.random() * 90).toFixed(0)}px;--r:${(Math.random() * 720 - 360).toFixed(0)}deg"></i>`).join("")}</div>`;
  }

  function buildHour(used) {
    const pool = d3.range(24).filter(h => !used.hours.has(h));
    const h = pick(pool); used.hours.add(h);
    return { type: "hour", h, guess: null, hint: false };
  }
  function niceMax(x) { return Math.max(5, Math.ceil(x * 115 / 5) * 5); }
  function buildWave(used) {
    if (!used.volume && Math.random() < 0.4) {
      used.volume = true;
      const h = pick([0, 1, 3, 4, 5, 6, 7, 13, 17, 20, 23].filter(x => !used.hours.has(x)));
      used.hours.add(h);
      return { type: "wave", kind: "volume", h, value: TOTAL[h] / MAXT * 100, max: 100,
        prompt: `How busy is the 311 line at ${fmtHour(h)}?`,
        sub: "0 means silent. 100 means as busy as the busiest hour of the day (10 AM).",
        left: "Silent", right: "Busiest", fmt: v => Math.round(v) + "",
        fact: `At ${fmtHour(h)} the line runs at ${Math.round(TOTAL[h] / MAXT * 100)}% of its 10 AM peak (${num(TOTAL[h])} requests over the year).`, guess: null };
    }
    const cands = [];
    REAL.filter(c => !used.cats.has(c.id)).forEach(c => {
      const s = d3.range(24).map(h => share(c, h));
      const pk = d3.maxIndex(s), lo = d3.minIndex(s);
      cands.push([c, pk], [c, pk], [c, lo], [c, (pk + 12) % 24]);
    });
    const [c, h] = pick(cands); used.cats.add(c.id);
    const M = niceMax(d3.max(d3.range(24), x => share(c, x)));
    const v = share(c, h) * 100;
    return { type: "wave", kind: "share", c, h, value: v, max: M,
      prompt: `At ${fmtHour(h)}, what share of all 311 requests is about ${lower(c)}?`,
      sub: `Set the dial anywhere from 0% to ${M}%.`,
      left: "0%", right: M + "%", fmt: x => (x < 10 ? x.toFixed(1) : Math.round(x)) + "%",
      fact: `At ${fmtHour(h)}, ${lower(c)} is ${pct(v / 100)} of all requests (its all-day share is ${pct(c.day)}).`, guess: null };
  }
  function buildCard(used) {
    for (let t = 0; t < 200; t++) {
      if (Math.random() < 0.5) {
        const h = Math.floor(Math.random() * 24);
        const fresh = REAL.filter(x => !used.cats.has(x.id)); const [a, b] = d3.shuffle((fresh.length >= 2 ? fresh : REAL).slice()).slice(0, 2);
        const sa = share(a, h), sb = share(b, h);
        const key = `cats:${[a.id, b.id].sort()}:${h}`;
        if (Math.abs(sa - sb) < 0.03 || Math.min(sa, sb) < 0.015 || used.cards.has(key)) continue;
        used.cards.add(key);
        const win = sa > sb ? 0 : 1;
        return { type: "card", h, q: `At ${fmtHour(h)}, which do New Yorkers report more?`,
          options: [a.label, b.label], correct: win, choice: null,
          answer: [a.label, b.label][win],
          fact: `From ${fmtSpan(h)}: ${lower(a)} ${pct(sa)}, ${lower(b)} ${pct(sb)} of all requests.`,
          bars: [{ label: a.label, v: sa, color: a.color }, { label: b.label, v: sb, color: b.color }] };
      } else {
        const fresh = REAL.filter(x => !used.cats.has(x.id));
        const c = pick(fresh.length ? fresh : REAL);
        const h1 = Math.floor(Math.random() * 24), h2 = Math.floor(Math.random() * 24);
        const s1 = share(c, h1), s2 = share(c, h2);
        const key = `hours:${c.id}:${[h1, h2].sort()}`;
        if (circDist(h1, h2) < 4 || Math.max(s1, s2) / Math.min(s1, s2) < 1.4 || used.cards.has(key)) continue;
        used.cards.add(key);
        const win = s1 > s2 ? 0 : 1;
        return { type: "card", q: `When is ${lower(c)} a bigger share of 311 requests?`,
          options: [fmtHour(h1), fmtHour(h2)], correct: win, choice: null,
          answer: [fmtHour(h1), fmtHour(h2)][win],
          fact: `${c.label}: ${pct(s1)} of requests at ${fmtHour(h1)}, ${pct(s2)} at ${fmtHour(h2)}.`,
          bars: [{ label: fmtHour(h1), v: s1, color: c.color }, { label: fmtHour(h2), v: s2, color: c.color }] };
      }
    }
  }
  function newGame() {
    const used = { hours: new Set(), cats: new Set(), cards: new Set(), volume: false };
    const rounds = SEQUENCE.map(k => k === "hour" ? buildHour(used) : k === "wave" ? buildWave(used) : buildCard(used));
    rounds.forEach(r => { r.points = null; });
    return { rounds, i: 0, phase: "intro" };
  }

  /* scoring: every kind on the same small scale, Wavelength style */
  function scoreHour(r) { const d = circDist(r.guess, r.h); return Math.max(0, [4, 3, 2, 1][d] ?? 0) - (r.hint ? 1 : 0); }
  const BANDS = [[0.05, 4], [0.11, 3], [0.18, 2]];
  function scoreWave(r) { const e = Math.abs(r.guess - r.value) / r.max; for (const [w, p] of BANDS) { if (e <= w) return p; } return 0; }

  const state = { tab: "play", hour: 3, scale: "mix", game: newGame() };
  const cur = () => state.game.rounds[state.game.i];
  const score = () => d3.sum(state.game.rounds, r => r.points || 0);

  /* ---------- 24-hour dial ---------- */
  const R0 = 92, R1 = 208, STEP = 2 * Math.PI / 24;
  const svg = d3.select("#dial");
  const gW = svg.append("g"), gTicks = svg.append("g"), gHand = svg.append("g"), gCenter = svg.append("g");
  svg.append("circle").attr("r", R1 + 50).attr("fill", "transparent").style("cursor", "pointer");
  const arc = d3.arc().padAngle(0.014).padRadius(R1).cornerRadius(2);
  const polar = (h, r) => [Math.sin(h * STEP) * r, -Math.cos(h * STEP) * r];
  for (let h = 0; h < 24; h++) {
    const major = h % 3 === 0;
    const [x1, y1] = polar(h, R1 + 6), [x2, y2] = polar(h, R1 + (major ? 14 : 10));
    gTicks.append("line").attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2)
      .attr("stroke", "var(--ink-3)").attr("stroke-width", major ? 1.5 : 1).attr("opacity", major ? 0.9 : 0.5);
    if (major) { const [x, y] = polar(h, R1 + 38); gTicks.append("text").attr("class", "tick-label").attr("x", x).attr("y", y).attr("text-anchor", "middle").attr("dominant-baseline", "central").text(fmtHour(h)); }
  }
  const cTime = gCenter.append("text").attr("class", "center-time").attr("text-anchor", "middle").attr("y", 8);
  const cSub = gCenter.append("text").attr("class", "center-sub").attr("text-anchor", "middle").attr("y", 34);
  const cSub2 = gCenter.append("text").attr("class", "center-sub2").attr("text-anchor", "middle").attr("y", 54);
  const radial = () => state.scale === "mix" ? d3.scaleRadial().domain([0, 1]).range([R0, R1]) : d3.scaleRadial().domain([0, MAXT]).range([R0, R1]);
  function segments(h) {
    const r = radial(); let acc = 0;
    return CATS.map(c => { const a = acc, b = acc + (state.scale === "mix" ? share(c, h) : c.v[h]); acc = b; return { c, h, ri: r(a), ro: r(b) }; });
  }
  // dial modes: "explore" | "blank" (pick an hour) | "reveal" | "mix" (decor)
  function dialMode() {
    if (state.tab === "explore") return "explore";
    const g = state.game, r = cur();
    if (g.phase === "round" && r.type === "hour") return r.phase === "reveal" ? "reveal" : "blank";
    return "mix";
  }
  function drawDial() {
    const mode = dialMode(), r = state.tab === "play" ? cur() : null;
    const blank = mode === "blank";
    let focus = mode === "explore" ? state.hour : mode === "reveal" ? r.h : null;
    const paths = [];
    for (let h = 0; h < 24; h++) {
      if (blank) paths.push({ d: arc({ innerRadius: R0, outerRadius: R1, startAngle: h * STEP, endAngle: (h + 1) * STEP }), fill: r.guess === h ? "var(--ink)" : "var(--well)", op: 1 });
      else segments(h).forEach(s => paths.push({ d: arc({ innerRadius: s.ri, outerRadius: s.ro, startAngle: h * STEP, endAngle: (h + 1) * STEP }), fill: s.c.color,
        op: focus === null || focus === h || (mode === "reveal" && r.guess === h) ? 1 : 0.6 }));
    }
    gW.selectAll("path").data(paths).join("path").attr("d", d => d.d).attr("fill", d => d.fill).attr("opacity", d => d.op).attr("stroke", "var(--surface)").attr("stroke-width", 1.5);
    const hands = [];
    if (mode === "explore") hands.push({ h: state.hour, kind: "main" });
    if (blank && r.guess !== null) hands.push({ h: r.guess, kind: "main" });
    if (mode === "reveal") { if (r.guess !== r.h) hands.push({ h: r.guess, kind: "guess" }); hands.push({ h: r.h, kind: "main" }); }
    gHand.selectAll("g").data(hands).join(e => { const g = e.append("g"); g.append("line"); g.append("circle"); return g; }).each(function (d) {
      const [x1, y1] = polar(d.h + 0.5, R0 - 8), [x2, y2] = polar(d.h + 0.5, R1 + 2), col = d.kind === "main" ? "var(--lamp)" : "var(--ink-2)";
      d3.select(this).select("line").attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2).attr("stroke", col).attr("stroke-width", 2.5).attr("stroke-linecap", "round").attr("stroke-dasharray", d.kind === "guess" ? "2 7" : null);
      d3.select(this).select("circle").attr("cx", x2).attr("cy", y2).attr("r", 6).attr("fill", col).attr("stroke", "var(--surface)").attr("stroke-width", 2);
    });
    if (mode === "explore") { cTime.text(fmtHour(state.hour)); cSub.text(num(TOTAL[state.hour]) + " requests"); cSub2.text(pct(TOTAL[state.hour] / DAY) + " of the day"); }
    else if (blank) { cTime.text(r.guess === null ? "?" : fmtHour(r.guess)); cSub.text(r.guess === null ? "pick an hour" : "your guess"); cSub2.text(""); }
    else if (mode === "reveal") { cTime.text(fmtHour(r.h)); cSub.text("the answer"); cSub2.text(r.guess === r.h ? "" : "you said " + fmtHour(r.guess)); }
    else if (state.game.phase === "done") { cTime.text(score()); cSub.text("out of " + MAXSCORE); cSub2.text(""); }
    else { cTime.text("24h"); cSub.text("of 311 requests"); cSub2.text(""); }
    const sl = document.getElementById("hour-slider");
    if (mode === "explore") sl.value = state.hour; else if (blank && r.guess !== null) sl.value = r.guess;
  }

  /* ---------- Wavelength gauge ---------- */
  const WR = 232, WR0 = 36;
  const wsvg = d3.select("#wave");
  const warc = d3.arc();
  const fToA = f => -Math.PI / 2 + f * Math.PI;
  const wpt = (f, r) => [Math.sin(fToA(f)) * r, -Math.cos(fToA(f)) * r];
  wsvg.append("path").attr("d", warc({ innerRadius: WR0, outerRadius: WR, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 })).attr("fill", "var(--well)");
  const gBands = wsvg.append("g"), gWTicks = wsvg.append("g"), gNeedle = wsvg.append("g"), gWLab = wsvg.append("g");
  [0, 0.25, 0.5, 0.75, 1].forEach(f => { const [x1, y1] = wpt(f, WR + 4), [x2, y2] = wpt(f, WR + 14); gWTicks.append("line").attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2).attr("stroke", "var(--ink-3)").attr("stroke-width", 1.5); });
  const wLeft = gWLab.append("text").attr("class", "tick-label").attr("x", -WR + 10).attr("y", 34).attr("text-anchor", "start");
  const wRight = gWLab.append("text").attr("class", "tick-label").attr("x", WR - 10).attr("y", 34).attr("text-anchor", "end");
  const wMid = gWLab.append("text").attr("class", "tick-label").attr("x", 0).attr("y", -WR - 22).attr("text-anchor", "middle");
  const needle = gNeedle.append("line").attr("stroke", "var(--coral)").attr("stroke-width", 5).attr("stroke-linecap", "round");
  const knob = gNeedle.append("circle").attr("r", 13).attr("fill", "var(--coral)").attr("stroke", "var(--surface)").attr("stroke-width", 3);
  gNeedle.append("circle").attr("r", 20).attr("fill", "var(--coral)");
  const ansLine = wsvg.append("line").attr("stroke", "var(--ink)").attr("stroke-width", 2).attr("stroke-dasharray", "3 5");
  const ansText = wsvg.append("text").attr("class", "tick-label").attr("text-anchor", "middle").style("fill", "var(--ink)").style("font-size", "18px");
  function drawWave() {
    const r = cur(); if (!r || r.type !== "wave") return;
    const mid = r.max / 2;
    wLeft.text(r.left); wRight.text(r.right); wMid.text(r.kind === "share" ? (Number.isInteger(mid) ? mid : mid.toFixed(1)) + "%" : "50");
    const g = r.guess === null ? r.max / 2 : r.guess, f = g / r.max;
    const [nx, ny] = wpt(f, WR - 22);
    needle.attr("x1", 0).attr("y1", 0).attr("x2", nx).attr("y2", ny);
    knob.attr("cx", nx).attr("cy", ny);
    gNeedle.attr("opacity", r.guess === null && r.phase !== "reveal" ? 0.55 : 1);
    const show = r.phase === "reveal";
    const fv = r.value / r.max, a0 = fToA(fv);
    const bands = show ? BANDS.slice().reverse().map(([w, p], i) => ({ w, p, i })) : [];
    const fills = { 2: "var(--lamp-3)", 3: "var(--lamp-2)", 4: "var(--lamp)" };
    gBands.selectAll("path").data(bands).join("path")
      .attr("d", d => warc({ innerRadius: WR0, outerRadius: WR, startAngle: Math.max(-Math.PI / 2, a0 - d.w * Math.PI), endAngle: Math.min(Math.PI / 2, a0 + d.w * Math.PI) }))
      .attr("fill", d => fills[d.p]);
    const labs = show ? [{ p: 4, a: a0 }, { p: 3, a: a0 - 0.08 * Math.PI }, { p: 3, a: a0 + 0.08 * Math.PI }, { p: 2, a: a0 - 0.145 * Math.PI }, { p: 2, a: a0 + 0.145 * Math.PI }]
      .filter(d => d.a > -Math.PI / 2 + 0.05 && d.a < Math.PI / 2 - 0.05) : [];
    gBands.selectAll("text").data(labs).join("text").attr("text-anchor", "middle").attr("dominant-baseline", "central")
      .attr("x", d => Math.sin(d.a) * (WR - 34)).attr("y", d => -Math.cos(d.a) * (WR - 34))
      .style("font-size", "20px").style("font-weight", 900).style("fill", d => d.p === 4 ? "var(--paper-ink)" : "var(--ink)").text(d => d.p);
    const [ax1, ay1] = wpt(fv, WR0), [ax2, ay2] = wpt(fv, WR + 6), [tx, ty] = wpt(fv, WR + 26);
    ansLine.attr("opacity", show ? 1 : 0).attr("x1", ax1).attr("y1", ay1).attr("x2", ax2).attr("y2", ay2);
    ansText.attr("opacity", show ? 1 : 0).attr("x", tx).attr("y", Math.min(ty, -6)).text(r.fmt(r.value));
  }
  function wavePointer(ev) {
    const r = cur(); if (!r || r.type !== "wave" || r.phase === "reveal") return;
    const node = wsvg.node(), pt = node.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
    const p = pt.matrixTransform(node.getScreenCTM().inverse());
    let a = Math.atan2(p.x, -p.y); a = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, a));
    r.guess = Math.round(((a + Math.PI / 2) / Math.PI) * r.max * 10) / 10;
    render();
  }
  let wDrag = false;
  wsvg.node().addEventListener("pointerdown", ev => { wDrag = true; try { wsvg.node().setPointerCapture(ev.pointerId); } catch (e) {} wavePointer(ev); });
  wsvg.node().addEventListener("pointermove", ev => { if (wDrag) wavePointer(ev); });
  wsvg.node().addEventListener("pointerup", () => { wDrag = false; });
  wsvg.node().addEventListener("pointercancel", () => { wDrag = false; });

  /* ---------- flashcard ---------- */
  function drawCard() {
    const r = cur(), wrap = document.getElementById("vis-card");
    if (!r || r.type !== "card") return;
    document.getElementById("card-q").textContent = r.q;
    document.getElementById("card-vs").innerHTML = r.options.map(o => `<span>${esc(o)}</span>`).join("");
    document.getElementById("card-ans").textContent = r.answer;
    document.getElementById("card-fact").textContent = r.fact;
    const mx = d3.max(r.bars, b => b.v);
    document.getElementById("card-cmp").innerHTML = r.bars.map(b => `<div class="row"><span class="sw" style="background:${b.color}"></span><span class="name">${esc(b.label)}</span><span class="val">${pct(b.v)}</span><div class="track"><div class="fill" style="width:${b.v / mx * 100}%;background:${b.color}"></div></div></div>`).join("");
    wrap.classList.toggle("flipped", r.phase === "reveal");
  }

  /* ---------- category rows ---------- */
  function drawRows(sel, h, withAvg) {
    const li = d3.select(sel).selectAll("li").data(CATS, c => c.id).join(enter => {
      const e = enter.append("li").attr("class", "row");
      e.append("span").attr("class", "sw").style("background", c => c.color);
      e.append("span").attr("class", "name").text(c => c.label);
      e.append("span").attr("class", "val");
      const t = e.append("div").attr("class", "track");
      t.append("div").attr("class", "fill").style("background", c => c.color);
      t.append("div").attr("class", "avg");
      return e;
    });
    li.select(".val").text(c => pct(share(c, h)));
    li.select(".fill").style("width", c => Math.min(100, share(c, h) / MAXSHARE * 100) + "%");
    li.select(".avg").style("left", c => `calc(${c.day / MAXSHARE * 100}% - 1px)`).property("hidden", !withAvg);
  }
  const standout = h => d3.greatest(REAL, c => share(c, h) / c.day);

  /* ---------- play panel ---------- */
  const P = document.getElementById("panel-play");
  function pipsHTML() {
    const g = state.game;
    return `<div class="pips" aria-label="Rounds">${g.rounds.map((r, i) => {
      const cls = r.points !== null ? "done" : (g.phase === "round" && i === g.i ? "now" : "");
      return `<span class="pip k-${r.type} ${cls}">${KIND[r.type].short}${r.points !== null ? " +" + r.points : ""}</span>`;
    }).join("")}</div>`;
  }
  function headHTML(r) {
    return `${pipsHTML()}<div class="scoreline"><span class="kind k-${r.type}">Round ${state.game.i + 1} of ${SEQUENCE.length} · ${KIND[r.type].name}</span><span class="pts">Score <b>${score()}</b> / ${MAXSCORE}</span></div>`;
  }
  function renderPlay() {
    const g = state.game;
    if (g.phase === "intro") {
      P.innerHTML = `<h2>Six rounds. Three ways to read the city's clock.</h2>
        <p>Every question comes from 3.65 million 311 requests made in 2025. The rounds take turns:</p>
        <ul class="modes">
          <li class="k-hour"><span class="mk">${ICON.hour}</span><div><b>Guess the hour</b><p>See what people reported in one secret hour. Pick that hour on the dial. <span class="worth">Up to 4 points.</span></p></div></li>
          <li class="k-wave"><span class="mk">${ICON.wave}</span><div><b>Wavelength</b><p>Swing the needle to estimate a number, like how much of 3 AM is noise. <span class="worth">Bullseye: 4 points.</span></p></div></li>
          <li class="k-card"><span class="mk">${ICON.card}</span><div><b>Flashcard</b><p>Two choices, one card. Pick one and the card flips. <span class="worth">2 points.</span></p></div></li>
        </ul>
        <div class="btnrow"><button class="btn" id="g-start">Start the game</button></div>`;
      return;
    }
    if (g.phase === "done") {
      const by = k => [d3.sum(g.rounds.filter(r => r.type === k), r => r.points), d3.sum(g.rounds.filter(r => r.type === k), r => KIND[r.type].max)];
      const s = score(), verdict = s >= 16 ? "You can read this city by its complaints." : s >= 10 ? "Good ear. The night is easy; the workday blurs together." : "Harder than it looks. Daytime hours look almost alike, which is its own finding.";
      P.innerHTML = `${burst(s >= 14)}${pipsHTML()}<div class="finalscore">${s}<small> / ${MAXSCORE}</small></div><h2>${s >= 16 ? "Night owl." : s >= 10 ? "Nice ears." : "Rookie on the night shift."}</h2><p>${verdict}</p>
        <div class="breakdown">${["hour", "wave", "card"].map(k => { const [a, b] = by(k); return `<div class="k-${k}"><div class="n">${a}/${b}</div><div class="l">${KIND[k].name}</div></div>`; }).join("")}</div>
        <p><b>What you learned</b></p>
        <ul class="learned">${g.rounds.map(r => `<li>${esc(r.type === "hour" ? `${fmtSpan(r.h)}: ${lower(standout(r.h))} is ${(share(standout(r.h), r.h) / standout(r.h).day).toFixed(1)}× its usual share.` : r.fact)}</li>`).join("")}</ul>
        <div class="btnrow"><button class="btn" id="g-again">Play again</button><button class="btn ghost" id="g-explore">Explore the day</button></div>`;
      return;
    }
    const r = cur();
    if (r.type === "hour") {
      const reveal = r.phase === "reveal";
      P.innerHTML = `${headHTML(r)}
        <h2>${reveal ? `It was ${fmtSpan(r.h)}` : "What time is it?"}</h2>
        <p>${reveal ? "" : "This is everything New Yorkers reported to 311 in one hour of the day. Pick the hour on the dial or with the slider, then lock it in."}</p>
        <ul class="rows" id="g-rows"></ul>
        ${r.hint ? `<p class="meta">Hint: this hour gets ${pct(TOTAL[r.h] / DAY)} of the day's requests. An average hour gets 4.2%, so the line is ${TOTAL[r.h] > DAY / 24 ? "busier" : "quieter"} than usual.</p>` : ""}
        ${reveal ? `<div class="result">${burst(r.points === KIND[r.type].max)}<div class="big">${circDist(r.guess, r.h) === 0 ? "Exactly right." : circDist(r.guess, r.h) + " hour" + (circDist(r.guess, r.h) > 1 ? "s" : "") + " off."} <span class="plus">+${r.points}</span></div>
            <p>The giveaway: <b>${lower(standout(r.h))}</b> is ${pct(share(standout(r.h), r.h))} of this hour, ${(share(standout(r.h), r.h) / standout(r.h).day).toFixed(1)} times its all-day share.</p>
            <div class="btnrow"><button class="btn" id="g-next">${g.i === SEQUENCE.length - 1 ? "See final score" : "Next round"}</button></div></div>`
        : `<div class="btnrow"><button class="btn" id="g-lock" ${r.guess === null ? "disabled" : ""}>${r.guess === null ? "Pick an hour" : "Lock in " + fmtHour(r.guess)}</button>
            <button class="btn ghost" id="g-hint" ${r.hint ? "disabled" : ""}>Hint: how busy? (−1)</button></div>`}`;
      drawRows("#g-rows", r.h, reveal);
    } else if (r.type === "wave") {
      const reveal = r.phase === "reveal";
      P.innerHTML = `${headHTML(r)}
        <h2>${esc(r.prompt)}</h2><p>${esc(r.sub)}</p>
        <div class="readout">${r.guess === null ? "–" : r.fmt(r.guess)}<small>${reveal ? "your guess" : "drag the needle"}</small></div>
        ${reveal ? `<div class="result">${burst(r.points === KIND[r.type].max)}<div class="big">Answer: ${r.fmt(r.value)}. <span class="plus">+${r.points}</span></div><p>${esc(r.fact)}</p>
            <p class="meta">Bullseye 4 points, next band 3, outer band 2.</p>
            <div class="btnrow"><button class="btn" id="g-next">${g.i === SEQUENCE.length - 1 ? "See final score" : "Next round"}</button></div></div>`
        : `<input type="range" class="wave-slider" id="w-slider" min="0" max="${r.max}" step="${r.max / 200}" value="${r.guess === null ? r.max / 2 : r.guess}" aria-label="Your estimate">
           <div class="btnrow"><button class="btn" id="g-lock" ${r.guess === null ? "disabled" : ""}>${r.guess === null ? "Move the needle" : "Lock in " + r.fmt(r.guess)}</button></div>`}`;
    } else {
      const reveal = r.phase === "reveal";
      P.innerHTML = `${headHTML(r)}
        <h2>${esc(r.q)}</h2><p>${reveal ? "" : "Pick one. The card flips to show the answer."}</p>
        <div class="opts">${r.options.map((o, i) => {
          const cls = reveal ? (i === r.correct ? "right" : i === r.choice ? "wrong" : "") : "";
          const badge = reveal ? (i === r.correct ? "Right answer" : i === r.choice ? "Your pick" : "") : "";
          return `<button class="opt ${cls}" data-i="${i}" ${reveal ? "disabled" : ""}><span>${esc(o)}</span><span class="badge">${badge}</span></button>`;
        }).join("")}</div>
        ${reveal ? `<div class="result">${burst(r.points === KIND[r.type].max)}<div class="big">${r.choice === r.correct ? "Correct." : "Not this time."} <span class="plus">+${r.points}</span></div>
          <div class="btnrow"><button class="btn" id="g-next">${g.i === SEQUENCE.length - 1 ? "See final score" : "Next round"}</button></div></div>` : ""}`;
    }
  }
  P.addEventListener("click", ev => {
    const t = ev.target.closest("button"); if (!t) return;
    const g = state.game, r = cur();
    if (t.id === "g-start") { g.phase = "round"; g.i = 0; r.phase = "ask"; }
    else if (t.id === "g-again") { state.game = newGame(); state.game.phase = "round"; cur().phase = "ask"; }
    else if (t.id === "g-explore") { state.tab = "explore"; }
    else if (t.id === "g-hint") { r.hint = true; }
    else if (t.id === "g-lock") {
      if (r.guess === null) return;
      r.points = r.type === "hour" ? Math.max(0, scoreHour(r)) : scoreWave(r); r.phase = "reveal";
    }
    else if (t.classList.contains("opt") && r.type === "card" && r.phase !== "reveal") {
      r.choice = +t.dataset.i; r.points = r.choice === r.correct ? 2 : 0; r.phase = "reveal";
    }
    else if (t.id === "g-next") { if (g.i === SEQUENCE.length - 1) g.phase = "done"; else { g.i++; cur().phase = "ask"; } }
    else return;
    render();
    const focusNext = P.querySelector("#g-next, #g-lock, .opt, #g-start, #g-again"); if (focusNext && ev.detail === 0) focusNext.focus();
  });
  P.addEventListener("input", ev => {
    if (ev.target.id === "w-slider") { cur().guess = +ev.target.value; drawWave();
      const ro = P.querySelector(".readout"); if (ro) ro.firstChild.nodeValue = cur().fmt(cur().guess);
      const lk = document.getElementById("g-lock"); if (lk) { lk.disabled = false; lk.textContent = "Lock in " + cur().fmt(cur().guess); } }
  });

  /* ---------- explore panel ---------- */
  function renderExplore() {
    const h = state.hour, top = d3.greatest(REAL, c => share(c, h)), so = standout(h), lift = share(so, h) / so.day;
    document.getElementById("ex-title").textContent = fmtSpan(h);
    document.getElementById("ex-meta").textContent = `${num(TOTAL[h])} requests in 2025 · ${pct(TOTAL[h] / DAY)} of the day`;
    let s = `The biggest slice is <b>${esc(lower(top))}</b> at ${pct(share(top, h))}.`;
    s += so.id !== top.id ? ` What stands out is <b>${esc(lower(so))}</b>: ${pct(share(so, h))} of this hour, ${lift.toFixed(1)} times its all-day share.` : ` That is ${lift.toFixed(1)} times its all-day share of ${pct(top.day)}.`;
    document.getElementById("ex-sentence").innerHTML = s;
    drawRows("#ex-rows", h, true);
  }

  /* ---------- render ---------- */
  function render() {
    const explore = state.tab === "explore", g = state.game, r = cur();
    document.getElementById("tab-play").setAttribute("aria-selected", !explore);
    document.getElementById("tab-explore").setAttribute("aria-selected", explore);
    document.getElementById("panel-play").hidden = explore;
    document.getElementById("panel-explore").hidden = !explore;
    const vis = explore || g.phase !== "round" ? "dial" : r.type === "hour" ? "dial" : r.type;
    document.getElementById("vis-dial").hidden = vis !== "dial";
    document.getElementById("vis-wave").hidden = vis !== "wave";
    document.getElementById("vis-card").hidden = vis !== "card";
    const mode = dialMode();
    document.getElementById("dial-controls").hidden = !(mode === "explore" || mode === "blank");
    document.getElementById("scale-seg").hidden = mode !== "explore";
    if (mode !== "explore") state.scale = "mix";
    document.getElementById("scale-mix").setAttribute("aria-pressed", state.scale === "mix");
    document.getElementById("scale-volume").setAttribute("aria-pressed", state.scale === "volume");
    const cap = { explore: state.scale === "mix" ? "Each wedge is one hour, split by what people reported. Drag around the dial or use the slider." : "Wedge height is the number of requests. 10 AM gets 4.9 times as many as 4 AM.",
      blank: "Midnight is at the top; the day runs clockwise. Tap the hour you think it is.",
      reveal: "The yellow hand is the answer. The dotted hand is your guess.",
      mix: "The full day of 311: each wedge is one hour, split by what people reported." };
    document.getElementById("vis-caption").textContent = vis === "wave" ? (r.phase === "reveal" ? "The bands show where the answer was. Closer bands score more." : "Drag the needle, or use the slider on the right.")
      : vis === "card" ? (r.phase === "reveal" ? "The back of the card shows the numbers." : "Choose an answer to flip the card.") : cap[mode];
    setSky(skyHour());
    drawDial();
    if (vis === "wave") drawWave();
    if (vis === "card") drawCard();
    if (explore) renderExplore(); else renderPlay();
  }

  /* ---------- dial pointer + controls ---------- */
  const tip = document.getElementById("tip"), node = svg.node();
  function locate(ev) {
    const pt = node.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
    const p = pt.matrixTransform(node.getScreenCTM().inverse());
    let ang = Math.atan2(p.x, -p.y); if (ang < 0) ang += 2 * Math.PI;
    return { h: Math.min(23, Math.floor(ang / STEP)), r: Math.hypot(p.x, p.y) };
  }
  function pickHour(h) {
    const mode = dialMode();
    if (mode === "explore") state.hour = h; else if (mode === "blank") cur().guess = h; else return;
    render();
  }
  let dragging = false;
  node.addEventListener("pointerdown", ev => { const { h, r } = locate(ev); if (r < R0 - 30) return; dragging = true; try { node.setPointerCapture(ev.pointerId); } catch (e) {} pickHour(h); });
  node.addEventListener("pointermove", ev => {
    const { h, r } = locate(ev); if (dragging) pickHour(h);
    const mode = dialMode();
    if (r < R0 || r > R1 + 4 || mode === "blank") { tip.hidden = true; return; }
    const seg = segments(h).find(s => r >= s.ri && r <= s.ro);
    tip.innerHTML = `<b>${fmtSpan(h)}</b><br>` + (seg ? `<span class="sw" style="background:${seg.c.color};width:10px;height:10px;margin-right:6px"></span>${esc(seg.c.label)}: <b>${pct(share(seg.c, h))}</b> (${num(seg.c.v[h])})` : `${num(TOTAL[h])} requests`);
    tip.hidden = false;
    const box = node.getBoundingClientRect(), x = ev.clientX - box.left, y = ev.clientY - box.top;
    tip.style.left = Math.max(0, Math.min(box.width - tip.offsetWidth, x + 14)) + "px";
    tip.style.top = Math.max(0, y - tip.offsetHeight - 12) + "px";
  });
  node.addEventListener("pointerup", () => { dragging = false; });
  node.addEventListener("pointercancel", () => { dragging = false; });
  node.addEventListener("pointerleave", () => { tip.hidden = true; });
  const curHour = () => dialMode() === "explore" ? state.hour : (cur().guess ?? 0);
  document.getElementById("hour-slider").addEventListener("input", e => pickHour(+e.target.value));
  document.getElementById("prev").addEventListener("click", () => pickHour((curHour() + 23) % 24));
  document.getElementById("next").addEventListener("click", () => pickHour((curHour() + 1) % 24));
  document.getElementById("scale-mix").addEventListener("click", () => { state.scale = "mix"; render(); });
  document.getElementById("scale-volume").addEventListener("click", () => { state.scale = "volume"; render(); });
  document.getElementById("tab-play").addEventListener("click", () => { state.tab = "play"; render(); });
  document.getElementById("tab-explore").addEventListener("click", () => { state.tab = "explore"; render(); });

  /* ---------- table view ---------- */
  const table = d3.select("#table");
  table.append("thead").append("tr").selectAll("th").data(["Hour", ...CATS.map(c => c.label), "Requests"]).join("th").text(d => d);
  table.append("tbody").selectAll("tr").data(d3.range(24)).join("tr").selectAll("td").data(h => [fmtHour(h), ...CATS.map(c => pct(share(c, h))), num(TOTAL[h])]).join("td").text(d => d);

  /* ---------- sky + skyline: follow the selected hour ---------- */
  // per hour: [top of sky, middle, horizon glow, stars 0..1, share of windows lit]
  const SKY = [
    ["#0d0a1f", "#24143a", "#4a2350", 1, 0.30], ["#0b0a1c", "#1f1236", "#3d1f4a", 1, 0.22],
    ["#0b0a1c", "#1f1236", "#3a1d48", 1, 0.16], ["#0b0a1c", "#1d1234", "#3a1d48", 1, 0.12],
    ["#120f28", "#251840", "#4d2a52", 0.9, 0.12], ["#1f1b45", "#4a2a60", "#c2577a", 0.6, 0.16],
    ["#2f3a78", "#7a4a80", "#ff9a5a", 0.2, 0.18], ["#3d65a8", "#8a7aa0", "#ffc27a", 0, 0.12],
    ["#2f6bb0", "#5a8ac0", "#a8d0f0", 0, 0.07], ["#2c6ab2", "#5a8cc4", "#a8d4f4", 0, 0.06],
    ["#2a69b4", "#588cc6", "#acd6f6", 0, 0.05], ["#2868b4", "#568cc8", "#b0d8f8", 0, 0.05],
    ["#2868b4", "#568cc8", "#b0d8f8", 0, 0.05], ["#2a69b2", "#5a8cc4", "#b4d6f2", 0, 0.05],
    ["#2e68ae", "#6088c0", "#c8d8e8", 0, 0.06], ["#3a6aac", "#6a88b8", "#ffe0a0", 0, 0.07],
    ["#3f5ea0", "#8a7aa8", "#ffc27a", 0, 0.09], ["#4a4a90", "#a05a80", "#ff9a5a", 0.05, 0.14],
    ["#3a2a6a", "#9a3f6a", "#ff7a59", 0.2, 0.22], ["#2a1a4a", "#6a2a5a", "#e0567a", 0.5, 0.30],
    ["#1e1238", "#45204e", "#9a3a6a", 0.8, 0.34], ["#170f2c", "#36193f", "#6a2a52", 1, 0.34],
    ["#130d26", "#2e1638", "#5a2449", 1, 0.33], ["#100c22", "#28143a", "#4f2350", 1, 0.32]
  ];
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const starBox = document.getElementById("stars");
  starBox.innerHTML = d3.range(70).map(() => `<i style="left:${(rnd() * 100).toFixed(1)}%;top:${(rnd() * 100).toFixed(1)}%;opacity:${(0.3 + rnd() * 0.7).toFixed(2)}"></i>`).join("");
  const SKW = 1100, SKH = 84;
  const sk = d3.select("#skyline");
  const orb = sk.append("g");
  const orbGlow = orb.append("circle").attr("r", 30);
  const orbBody = orb.append("circle").attr("r", 13);
  const wins = [];
  for (let x = 0; x < SKW;) {
    const w = 28 + rnd() * 52, h = 22 + rnd() * 58;
    sk.append("rect").attr("x", x).attr("y", SKH - h).attr("width", w - 3).attr("height", h).attr("fill", rnd() < 0.5 ? "#2e1f30" : "#352436");
    if (rnd() < 0.25) sk.append("rect").attr("x", x + w / 2 - 2).attr("y", SKH - h - 10).attr("width", 2).attr("height", 10).attr("fill", "#352436");
    for (let wx = x + 6; wx < x + w - 10; wx += 9) {
      for (let wy = SKH - h + 7; wy < SKH - 6; wy += 11) {
        wins.push({ x: wx, y: wy, r: rnd(), d: (rnd() * 3).toFixed(2) });
      }
    }
    x += w;
  }
  const winSel = sk.selectAll("rect.win").data(wins).join("rect").attr("class", "win").attr("x", d => d.x).attr("y", d => d.y).attr("width", 4).attr("height", 5)
    .attr("fill", d => d.r < 0.04 ? "var(--coral)" : "var(--lamp)").style("animation-delay", d => d.d + "s");
  let skyNow = null, orbKind = null;
  function setSky(h) {
    if (h === null || h === undefined || h === skyNow) return;
    skyNow = h;
    const [top, mid, glow, stars, lit] = SKY[h], root = document.documentElement.style;
    root.setProperty("--sky-top", top); root.setProperty("--sky-mid", mid); root.setProperty("--sky-glow", glow);
    starBox.style.opacity = stars;
    winSel.style("opacity", d => d.r < lit ? 0.85 : 0).classed("tw", d => d.r < lit && d.r > lit - 0.03);
    const day = h >= 6 && h < 18, t = ((day ? h - 6 : (h + 6) % 24) + 0.5) / 12;
    const cx = 80 + t * 940, cy = 72 - Math.sin(Math.PI * t) * 58, kind = day ? "sun" : "moon";
    orbBody.attr("fill", day ? "#ffd36b" : "#ffe6b3");
    orbGlow.attr("fill", day ? "#ffb347" : "#ffe6b3").attr("opacity", day ? 0.35 : 0.12);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (orbKind !== kind || reduce) orb.interrupt().attr("transform", `translate(${cx},${cy})`);
    else orb.transition().duration(900).ease(d3.easeCubicOut).attr("transform", `translate(${cx},${cy})`);
    orbKind = kind;
    document.getElementById("skytime").textContent = "Sky: " + fmtHour(h);
  }
  function skyHour() {
    if (state.tab === "explore") return state.hour;
    const g = state.game, r = cur();
    if (g.phase !== "round") return new Date().getHours();
    if (r.type === "hour") return r.phase === "reveal" ? r.h : r.guess;
    return r.h ?? null;
  }

  render();
  window.__gth = { state, newGame, render };
})();
