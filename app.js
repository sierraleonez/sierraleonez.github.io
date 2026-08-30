/* Undercover — vanilla JS pass & play. Kata rahasia dimuat dari words.json */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var STORE_KEY = 'undercover.customPairs';

  var state = {
    packs: [],
    custom: [],
    playerCount: 4,
    names: [],
    undercover: 1,
    mrwhite: 0,
    players: [],
    pair: null,
    round: 1,
    revealIndex: 0,
    revealed: false,
    order: [],
    pendingMrWhite: null
  };

  /* ---------- helpers ---------- */
  function show(id) {
    var list = document.querySelectorAll('.screen');
    for (var i = 0; i < list.length; i++) list[i].classList.remove('active');
    $(id).classList.add('active');
    window.scrollTo(0, 0);
  }
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  function initial(name) { return (name || '?').trim().charAt(0).toUpperCase() || '?'; }
  function norm(s) { return (s || '').toLowerCase().replace(/[^a-z0-9]+/gi, ''); }
  function loadCustom() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { return []; }
  }
  function saveCustom() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state.custom)); } catch (e) {}
  }

  /* ---------- words.json ---------- */
  function loadWords() {
    return fetch('words.json', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        var packs = [];
        if (data && Array.isArray(data.packs)) {
          data.packs.forEach(function (p) {
            var pairs = (p.pairs || []).filter(function (x) { return x && x.civilian && x.undercover; });
            if (pairs.length) packs.push({ name: p.name || 'Pack', pairs: pairs });
          });
        } else if (Array.isArray(data)) {
          // bentuk sederhana: [{civilian, undercover}, ...]
          var pairs = data.filter(function (x) { return x && x.civilian && x.undercover; });
          if (pairs.length) packs.push({ name: 'Kata', pairs: pairs });
        }
        state.packs = packs;
        $('packInfo').textContent = packs.length
          ? packs.length + ' pack, ' + totalPairs() + ' pasangan kata dari words.json'
          : 'words.json kosong — tambahkan kata sendiri di bawah.';
        renderPacks();
      })
      .catch(function (err) {
        state.packs = [];
        $('packInfo').textContent = 'Gagal memuat words.json (' + err.message + '). Pakai kata custom di bawah.';
        renderPacks();
      });
  }
  function totalPairs() {
    return state.packs.reduce(function (n, p) { return n + p.pairs.length; }, 0);
  }
  function renderPacks() {
    var sel = $('packSelect');
    sel.innerHTML = '';
    var opts = [{ v: 'all', t: 'Semua pack' }];
    state.packs.forEach(function (p, i) { opts.push({ v: String(i), t: p.name + ' (' + p.pairs.length + ')' }); });
    if (state.custom.length) opts.push({ v: 'custom', t: 'Kata custom (' + state.custom.length + ')' });
    opts.forEach(function (o) {
      var el = document.createElement('option');
      el.value = o.v; el.textContent = o.t;
      sel.appendChild(el);
    });
  }
  function activePairs() {
    var v = $('packSelect').value;
    if (v === 'custom') return state.custom.slice();
    if (v === 'all') {
      var all = [];
      state.packs.forEach(function (p) { all = all.concat(p.pairs); });
      return all.concat(state.custom);
    }
    var pack = state.packs[Number(v)];
    return pack ? pack.pairs.slice() : state.custom.slice();
  }

  /* ---------- setup ---------- */
  function renderNames() {
    var box = $('nameList');
    var prev = state.names.slice();
    box.innerHTML = '';
    state.names = [];
    for (var i = 0; i < state.playerCount; i++) {
      var val = prev[i] || 'Pemain ' + (i + 1);
      state.names.push(val);
      var inp = document.createElement('input');
      inp.type = 'text';
      inp.value = val;
      inp.maxLength = 16;
      inp.setAttribute('aria-label', 'Nama pemain ' + (i + 1));
      (function (idx, el) {
        el.addEventListener('input', function () { state.names[idx] = el.value; });
      })(i, inp);
      box.appendChild(inp);
    }
  }
  function clampRoles() {
    var max = state.playerCount - 1; // minimal 1 warga
    if (state.undercover < 0) state.undercover = 0;
    if (state.mrwhite < 0) state.mrwhite = 0;
    if (state.undercover + state.mrwhite > max) {
      if (state.mrwhite > 0) state.mrwhite = Math.max(0, max - state.undercover);
      if (state.undercover + state.mrwhite > max) state.undercover = max - state.mrwhite;
    }
    if (state.undercover + state.mrwhite === 0) state.undercover = 1;
    $('undercoverCount').textContent = state.undercover;
    $('mrwhiteCount').textContent = state.mrwhite;
    var civ = state.playerCount - state.undercover - state.mrwhite;
    $('compositionHint').textContent = civ + ' warga · ' + state.undercover + ' undercover · ' + state.mrwhite + ' Mr. White';
  }
  function renderCustom() {
    var ul = $('customList');
    ul.innerHTML = '';
    state.custom.forEach(function (p, i) {
      var li = document.createElement('li');
      li.textContent = p.civilian + ' / ' + p.undercover + ' ';
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = '×'; b.title = 'Hapus';
      b.addEventListener('click', function () {
        state.custom.splice(i, 1); saveCustom(); renderCustom(); renderPacks();
      });
      li.appendChild(b);
      ul.appendChild(li);
    });
  }

  /* ---------- game ---------- */
  function startGame() {
    $('setupError').textContent = '';
    var pool = activePairs();
    if (!pool.length) { $('setupError').textContent = 'Belum ada pasangan kata. Tambahkan di words.json atau kata custom.'; return; }
    if (state.playerCount - state.undercover - state.mrwhite < 1) { $('setupError').textContent = 'Harus ada minimal 1 warga.'; return; }

    state.pair = pool[Math.floor(Math.random() * pool.length)];
    var roles = [];
    var i;
    for (i = 0; i < state.undercover; i++) roles.push('undercover');
    for (i = 0; i < state.mrwhite; i++) roles.push('mrwhite');
    while (roles.length < state.playerCount) roles.push('civilian');
    shuffle(roles);

    state.players = state.names.map(function (name, idx) {
      var role = roles[idx];
      return {
        id: idx,
        name: (name || '').trim() || 'Pemain ' + (idx + 1),
        role: role,
        word: role === 'civilian' ? state.pair.civilian : (role === 'undercover' ? state.pair.undercover : null),
        alive: true
      };
    });

    state.round = 1;
    state.revealIndex = 0;
    state.revealed = false;
    renderReveal();
    show('screen-reveal');
  }

  function renderReveal() {
    var p = state.players[state.revealIndex];
    state.revealed = false;
    $('revealProgress').textContent = 'Kartu ' + (state.revealIndex + 1) + ' dari ' + state.players.length;
    $('revealName').textContent = p.name;
    $('revealHint').textContent = 'Pastikan hanya ' + p.name + ' yang melihat layar.';
    $('secretCard').className = 'secret';
    $('secretText').textContent = 'Tap untuk lihat kata';
    $('revealNext').hidden = true;
  }
  function revealCard() {
    if (state.revealed) return;
    var p = state.players[state.revealIndex];
    state.revealed = true;
    $('secretCard').className = 'secret revealed';
    if (p.role === 'mrwhite') {
      $('secretText').innerHTML = 'Kamu <span class="word">Mr. White</span>' +
        '<span class="sub">Tanpa kata. Ikuti obrolan, tebak kata warga.</span>';
    } else {
      $('secretText').innerHTML = 'Kata kamu <span class="word">' + escapeHtml(p.word) + '</span>' +
        '<span class="sub">Jangan sebut kata ini secara langsung.</span>';
    }
    $('revealNext').hidden = false;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function nextReveal() {
    state.revealIndex++;
    if (state.revealIndex >= state.players.length) { startRound(); return; }
    renderReveal();
  }

  function alivePlayers() { return state.players.filter(function (p) { return p.alive; }); }

  function startRound() {
    var alive = shuffle(alivePlayers().slice());
    // Mr. White jangan bicara pertama
    if (alive.length > 1 && alive[0].role === 'mrwhite') {
      var swapAt = -1;
      for (var i = 1; i < alive.length; i++) if (alive[i].role !== 'mrwhite') { swapAt = i; break; }
      if (swapAt > 0) { var t = alive[0]; alive[0] = alive[swapAt]; alive[swapAt] = t; }
    }
    state.order = alive;
    $('roundPill').textContent = 'Ronde ' + state.round;
    var ol = $('speakOrder');
    ol.innerHTML = '';
    alive.forEach(function (p) {
      var li = document.createElement('li');
      li.textContent = p.name;
      ol.appendChild(li);
    });
    renderAlive($('aliveList'), false);
    show('screen-round');
  }

  function renderAlive(box, showRoles) {
    box.innerHTML = '';
    state.players.forEach(function (p) {
      var d = document.createElement('div');
      d.className = 'chip' + (p.alive ? '' : ' dead');
      var a = document.createElement('span');
      a.className = 'avatar';
      a.textContent = initial(p.name);
      d.appendChild(a);
      var s = document.createElement('span');
      s.textContent = p.name + (showRoles ? ' · ' + roleLabel(p.role) : '');
      d.appendChild(s);
      box.appendChild(d);
    });
  }
  function roleLabel(role) {
    return role === 'civilian' ? 'Warga' : role === 'undercover' ? 'Undercover' : 'Mr. White';
  }

  function renderVote() {
    var grid = $('voteGrid');
    grid.innerHTML = '';
    alivePlayers().forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = p.name;
      b.addEventListener('click', function () { eliminate(p); });
      grid.appendChild(b);
    });
    show('screen-vote');
  }

  function eliminate(p) {
    p.alive = false;
    $('resultAvatar').textContent = initial(p.name);
    $('resultName').textContent = p.name + ' tereliminasi';
    var tag = $('resultRole');
    tag.textContent = roleLabel(p.role);
    tag.className = 'role-tag role-' + p.role;
    $('resultNote').textContent = p.role === 'civilian'
      ? 'Dia warga biasa. Aduh.'
      : (p.role === 'undercover' ? 'Kata dia: "' + state.pair.undercover + '".' : 'Dia dapat kesempatan menebak kata warga.');
    state.pendingMrWhite = p.role === 'mrwhite' ? p : null;
    show('screen-result');
  }

  function afterResult() {
    if (state.pendingMrWhite) {
      $('guessWho').textContent = state.pendingMrWhite.name + ', ini kesempatan terakhirmu.';
      $('guessInput').value = '';
      show('screen-guess');
      $('guessInput').focus();
      return;
    }
    proceed();
  }

  function submitGuess() {
    var guess = $('guessInput').value;
    if (!guess.trim()) return;
    var who = state.pendingMrWhite;
    state.pendingMrWhite = null;
    if (norm(guess) === norm(state.pair.civilian)) {
      gameOver('mrwhite', who.name + ' menebak "' + state.pair.civilian + '" dengan tepat.');
    } else {
      proceed();
    }
  }

  function proceed() {
    var alive = alivePlayers();
    var impostors = alive.filter(function (p) { return p.role !== 'civilian'; }).length;
    var civilians = alive.length - impostors;
    if (impostors === 0) { gameOver('civilian', 'Semua undercover dan Mr. White sudah tersingkir.'); return; }
    if (impostors >= civilians) { gameOver('undercover', 'Jumlah penyusup sudah menyamai warga.'); return; }
    state.round++;
    startRound();
  }

  function gameOver(winner, reason) {
    var titles = {
      civilian: '🎉 Warga Menang!',
      undercover: '🕵️ Undercover Menang!',
      mrwhite: '🎩 Mr. White Menang!'
    };
    $('overTitle').textContent = titles[winner];
    $('overReason').textContent = reason;
    $('overCivilian').textContent = state.pair.civilian;
    $('overUndercover').textContent = state.pair.undercover;
    renderAlive($('overRoster'), true);
    show('screen-over');
  }

  /* ---------- events ---------- */
  $('playersMinus').addEventListener('click', function () {
    if (state.playerCount > 3) { state.playerCount--; renderNames(); clampRoles(); $('playerCount').textContent = state.playerCount; }
  });
  $('playersPlus').addEventListener('click', function () {
    if (state.playerCount < 20) { state.playerCount++; renderNames(); clampRoles(); $('playerCount').textContent = state.playerCount; }
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-role]'), function (btn) {
    btn.addEventListener('click', function () {
      var delta = Number(btn.getAttribute('data-delta'));
      if (btn.getAttribute('data-role') === 'undercover') state.undercover += delta;
      else state.mrwhite += delta;
      clampRoles();
    });
  });
  $('addCustom').addEventListener('click', function () {
    var c = $('customCivilian').value.trim();
    var u = $('customUndercover').value.trim();
    if (!c || !u) return;
    state.custom.push({ civilian: c, undercover: u });
    saveCustom();
    $('customCivilian').value = '';
    $('customUndercover').value = '';
    renderCustom();
    renderPacks();
  });
  $('startBtn').addEventListener('click', startGame);
  $('secretCard').addEventListener('click', revealCard);
  $('revealNext').addEventListener('click', nextReveal);
  $('toVote').addEventListener('click', renderVote);
  $('backToRound').addEventListener('click', function () { show('screen-round'); });
  $('resultNext').addEventListener('click', afterResult);
  $('guessSubmit').addEventListener('click', submitGuess);
  $('guessInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') submitGuess(); });
  $('playAgain').addEventListener('click', startGame);
  $('backSetup').addEventListener('click', function () { show('screen-setup'); });

  /* ---------- boot ---------- */
  state.custom = loadCustom();
  renderNames();
  clampRoles();
  renderCustom();
  loadWords();
})();
