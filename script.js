// script.js (refactored and modular)
document.addEventListener('DOMContentLoaded', () => {
  const el = {
    body: document.body,
    themeSwitcher: document.getElementById('themeSwitcher'),
    input: document.getElementById('serverIpInput'),
    checkBtn: document.getElementById('checkButton'),
    loader: document.getElementById('loader'),
    results: document.getElementById('resultsArea'),
    error: document.getElementById('errorMessageContainer'),
    favicon: document.getElementById('serverFavicon'),
    serverName: document.getElementById('serverAddressDisplay'),
    status: document.getElementById('serverStatus'),
    addressType: document.getElementById('addressTypeIndicator'),
    players: document.getElementById('serverPlayers'),
    version: document.getElementById('serverVersionName'),
    protocol: document.getElementById('serverProtocol'),
    ping: document.getElementById('apiDuration'),
    feel: document.getElementById('latencyFeel'),
    motd: document.getElementById('serverMotd'),
    motdRaw: document.getElementById('motdToggleRawButton'),
    motdClean: document.getElementById('motdToggleCleanButton'),
    motdStats: document.getElementById('motdCodeStats'),
    historyList: document.getElementById('historyList'),
    favoritesList: document.getElementById('favoritesList')
  };

  let history = JSON.parse(localStorage.getItem('mcHistory')) || [];

  function switchTheme() {
    const isDark = el.body.classList.toggle('light-theme');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  }

  function showError(message) {
    el.error.innerHTML = `<div class="error-message">${message}</div>`;
    el.results.classList.add('hidden');
  }

  function showLoader(show) {
    el.loader.classList.toggle('hidden', !show);
  }

  function setStatus(isOnline) {
    el.status.textContent = isOnline ? 'Online' : 'Offline';
    el.status.className = 'status ' + (isOnline ? 'status-online' : 'status-offline');
  }

  function updateHistory(ip) {
    history = [ip, ...history.filter(h => h !== ip)].slice(0, 10);
    localStorage.setItem('mcHistory', JSON.stringify(history));
    renderHistory();
  }

  function renderHistory() {
    el.historyList.innerHTML = '';
    history.forEach(ip => {
      const li = document.createElement('li');
      li.textContent = ip;
      li.onclick = () => queryServer(ip);
      el.historyList.appendChild(li);
    });
  }

  async function queryServer(ip) {
    if (!ip) return showError('Please enter a server address.');

    showLoader(true);
    showError('');
    el.results.classList.add('hidden');

    try {
      const url = `https://mcapi.us/server/status?ip=${encodeURIComponent(ip)}`;
      const res = await fetch(url);
      const data = await res.json();
      showLoader(false);

      if (data.status === 'error' || !data.online) {
        setStatus(false);
        showError(`Server offline or error.`);
        return;
      }

      updateHistory(ip);

      el.favicon.src = data.favicon || '';
      el.serverName.textContent = ip;
      el.addressType.classList.remove('hidden');
      el.addressType.textContent = /^\d/.test(ip) ? 'IP Addr' : 'Hostname';

      el.players.textContent = `${data.players.now} / ${data.players.max}`;
      el.version.textContent = data.server.name;
      el.protocol.textContent = data.server.protocol;
      el.ping.textContent = `${(parseInt(data.duration || 0) / 1e6).toFixed(2)} ms`;
      el.feel.textContent = latencyFeel(parseInt(data.duration || 0));

      const motd = data.motd || '';
      el.motd.textContent = motd;
      el.motdStats.innerHTML = `Characters: ${motd.length}`;

      setStatus(true);
      el.results.classList.remove('hidden');
    } catch (err) {
      console.error(err);
      showLoader(false);
      showError('Failed to fetch server data.');
    }
  }

  function latencyFeel(ms) {
    if (ms < 100e6) return 'Fast';
    if (ms < 250e6) return 'Moderate';
    return 'Slow';
  }

  // Event Listeners
  el.themeSwitcher.addEventListener('click', switchTheme);
  el.checkBtn.addEventListener('click', () => queryServer(el.input.value.trim()));
  el.input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') el.checkBtn.click();
  });
  el.motdRaw.addEventListener('click', () => {
    el.motd.textContent = el.motd.textContent;
  });
  el.motdClean.addEventListener('click', () => {
    el.motd.textContent = el.motd.textContent.replace(/§./g, '');
  });

  // Init
  if (localStorage.getItem('theme') === 'light') {
    el.body.classList.add('light-theme');
  }
  renderHistory();
});
