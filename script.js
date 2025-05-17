const el = {
    body: document.body, themeSwitcher: document.getElementById('themeSwitcher'),
    serverIpInput: document.getElementById('serverIpInput'), checkButton: document.getElementById('checkButton'),
    resultsArea: document.getElementById('resultsArea'), loader: document.getElementById('loader'),
    errorMessageContainer: document.getElementById('errorMessageContainer'), serverAddressDisplay: document.getElementById('serverAddressDisplay'),
    addressTypeIndicator: document.getElementById('addressTypeIndicator'), copyIpButton: document.getElementById('copyIpButton'),
    copyTooltip: document.getElementById('copyTooltip'), shareStatusButton: document.getElementById('shareStatusButton'),
    shareTooltip: document.getElementById('shareTooltip'), favoriteButton: document.getElementById('favoriteButton'),
    favTooltip: document.getElementById('favTooltip'), resolvedIpDisplay: document.getElementById('resolvedIpDisplay'),
    serverFavicon: document.getElementById('serverFavicon'), faviconDimensions: document.getElementById('faviconDimensions'),
    serverStatus: document.getElementById('serverStatus'), serverPlayers: document.getElementById('serverPlayers'),
    serverSizeIndicator: document.getElementById('serverSizeIndicator'), playerSlotPercentage: document.getElementById('playerSlotPercentage'),
    playerProgressBar: document.getElementById('playerProgressBar'), serverVersionName: document.getElementById('serverVersionName'),
    serverProtocol: document.getElementById('serverProtocol'), serverMotd: document.getElementById('serverMotd'),
    motdLines: document.getElementById('motdLines'), motdChars: document.getElementById('motdChars'),
    motdWords: document.getElementById('motdWords'), motdCodeStats: document.getElementById('motdCodeStats'),
    motdToggleRawButton: document.getElementById('motdToggleRawButton'), motdToggleCleanButton: document.getElementById('motdToggleCleanButton'),
    apiLastUpdated: document.getElementById('apiLastUpdated'), relativeTimeSinceUpdate: document.getElementById('relativeTimeSinceUpdate'),
    apiDuration: document.getElementById('apiDuration'), latencyFeel: document.getElementById('latencyFeel'),
    keywordTagsContainer: document.getElementById('keywordTagsContainer'), keywordTags: document.getElementById('keywordTags'),
    playerSampleSection: document.getElementById('playerSampleSection'), playerSampleCount: document.getElementById('playerSampleCount'),
    playerSampleList: document.getElementById('playerSampleList'), popularServerListEl: document.getElementById('popularServerListEl'),
    historySection: document.getElementById('historySection'), historyList: document.getElementById('historyList'),
    favoritesSection: document.getElementById('favoritesSection'), favoritesList: document.getElementById('favoritesList'),
    colorCanvas: document.getElementById('colorCanvas'), serverNotesSection: document.getElementById('serverNotesSection'),
    serverNoteInput: document.getElementById('serverNoteInput'), saveNoteButton: document.getElementById('saveNoteButton'),
    notesForServerAddress: document.getElementById('notesForServerAddress'), exportJsonButton: document.getElementById('exportJsonButton'),
    speculativeTTF: document.getElementById('speculativeTTF')
};

const DEFAULT_FAVICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAUSURBVHja7cEBAQ0AAADCoP6PbwcdAAAAAAAAAACDDY2VAAEp6x0XAAAAAElFTkSuQmCC';
el.serverFavicon.src = DEFAULT_FAVICON;

const popularServers = [ { name: "Hypixel Network", ip: "mc.hypixel.net" }, { name: "CubeCraft Games", ip: "play.cubecraft.net" }, { name: "Complex Gaming", ip: "hub.mc-complex.com" }, { name: "OPBlocks Network", ip: "play.opblocks.com" }, { name: "The Hive", ip: "play.hivemc.com" }, { name: "Minewind", ip: "server.minewind.com" }, { name: "Purple Prison", ip: "purpleprison.net" }, { name: "Universocraft", ip: "mc.universocraft.com"}, {name: "AppleMC", ip: "play.applemc.fun"} ];

let currentMotdRaw = '', currentMotdFormatted = '', currentMotdClean = '';
let motdViewMode = 'formatted';
let queryHistory = JSON.parse(localStorage.getItem('mcServerQueryHistory_v3')) || [];
let favoriteServers = JSON.parse(localStorage.getItem('mcServerFavorites_v1')) || [];
let serverNotes = JSON.parse(localStorage.getItem('mcServerNotes_v2')) || {};
let currentQueryFullAddress = '';
let currentServerData = null;
const MAX_HISTORY_ITEMS = 8, MAX_FAVORITE_ITEMS = 20;
const SERVER_KEYWORDS = [ "Skyblock", "Survival", "Factions", "Creative", "PvP", "Minigames", "Economy", "Lifesteal", "SMP", "RPG", "Parkour", "Anarchy", "Vanilla", "Modded", "Pixelmon", "Prison", "Hardcore", "Oneblock", "Earth", "Towny", "Bedwars", "Skywars", "KitPvP", "OP", "Semi-Vanilla", "Roleplay", "Events", "UHC", "McMMO", "Grief", "NoGrief", "Hub" ];

function applyTheme(theme) {
    if (theme === 'light') {
        el.body.classList.remove('dark-theme'); el.body.classList.add('light-theme');
        el.themeSwitcher.textContent = '🌙 Dark Mode';
    } else {
        el.body.classList.remove('light-theme'); el.body.classList.add('dark-theme');
        el.themeSwitcher.textContent = '☀️ Light Mode';
    }
    localStorage.setItem('mcPageTheme', theme);
}
el.themeSwitcher.addEventListener('click', () => {
    const currentTheme = el.body.classList.contains('dark-theme') ? 'dark' : 'light';
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
});
const savedTheme = localStorage.getItem('mcPageTheme') || 'dark';
applyTheme(savedTheme);

function displayErrorMessage(message) { 
    el.errorMessageContainer.innerHTML = `<div class="error-message">${message}</div>`; 
    el.resultsArea.classList.add('hidden'); 
    el.resultsArea.style.setProperty('--dynamic-theme-color', 'var(--error-color)'); 
}
function clearErrorMessage() { el.errorMessageContainer.innerHTML = ''; }

function formatMotd(motdJson) {
    let rawText = '', formattedHtml = '', cleanText = '';
    const colorMap = {'0':'black','1':'dark_blue','2':'dark_green','3':'dark_aqua','4':'dark_red','5':'dark_purple','6':'gold','7':'gray','8':'dark_gray','9':'blue','a':'green','b':'aqua','c':'red','d':'light_purple','e':'yellow','f':'white'};
    const formatMap = {'k':'obfuscated','l':'bold','m':'strikethrough','n':'underline','o':'italic'};
    let colorCodeCounts = {}, formatCodeCounts = {};

    function processPart(part, isFormatting) {
        let textContent = part.text || "";
        rawText += textContent; 
        cleanText += textContent.replace(/§[0-9a-fk-or]/gi, '');
        
        let currentHtml = ''; let classes = [];
        if (part.color) {
            const colorKey = Object.keys(colorMap).find(key => colorMap[key] === part.color || `#${colorMap[key]}` === part.color || key === part.color);
            if (colorKey) { 
                classes.push(`mc-${colorMap[colorKey]}`); 
                colorCodeCounts[colorMap[colorKey]] = (colorCodeCounts[colorMap[colorKey]] || 0) + 1; 
            } else { 
                currentHtml += `<span style="color:${part.color}">`; 
                colorCodeCounts[part.color] = (colorCodeCounts[part.color] || 0) + 1;
            }
        }
        Object.keys(formatMap).forEach(key => { 
            if (part[formatMap[key]]) { 
                classes.push(`mc-${formatMap[key]}`); 
                formatCodeCounts[formatMap[key]] = (formatCodeCounts[formatMap[key]] || 0) + 1; 
            }
        });
        if (part.bold) { classes.push('mc-bold'); formatCodeCounts.bold = (formatCodeCounts.bold || 0) + 1; }
        if (part.italic) { classes.push('mc-italic'); formatCodeCounts.italic = (formatCodeCounts.italic || 0) + 1; }
        if (part.underlined) { classes.push('mc-underline'); formatCodeCounts.underline = (formatCodeCounts.underline || 0) + 1; }
        if (part.strikethrough) { classes.push('mc-strikethrough'); formatCodeCounts.strikethrough = (formatCodeCounts.strikethrough || 0) + 1; }

        if (isFormatting) {
            if (classes.length > 0) formattedHtml += `<span class="${classes.join(' ')}">${textContent}</span>`;
            else if (currentHtml.startsWith('<span style')) formattedHtml += `${textContent}</span>`; 
            else formattedHtml += textContent;
        } 
        return currentHtml;
    }

    if (typeof motdJson === 'string') {
        rawText = motdJson; 
        cleanText = rawText.replace(/§[0-9a-fk-or]/gi, '');
        let tempFormattedHtml = rawText;
        
        const codeRegex = /§([0-9a-fk-or])/gi;
        let lastIndex = 0;
        let resultHtml = "";
        let openSpans = 0;

        tempFormattedHtml.replace(codeRegex, (match, code, offset) => {
            resultHtml += tempFormattedHtml.substring(lastIndex, offset);
            const codeLower = code.toLowerCase();
            let classNames = [];
            if (colorMap[codeLower]) { classNames.push(`mc-${colorMap[codeLower]}`); colorCodeCounts[colorMap[codeLower]] = (colorCodeCounts[colorMap[codeLower]] || 0) + 1; }
            if (formatMap[codeLower]) { classNames.push(`mc-${formatMap[codeLower]}`); formatCodeCounts[formatMap[codeLower]] = (formatCodeCounts[formatMap[codeLower]] || 0) + 1; }
            
            if (openSpans > 0) { resultHtml += '</span>'; openSpans--; }
            if (classNames.length > 0) { resultHtml += `<span class="${classNames.join(' ')}">`; openSpans++; }
            
            lastIndex = offset + match.length;
            return match; 
        });
        resultHtml += tempFormattedHtml.substring(lastIndex);
        while(openSpans > 0) { resultHtml += '</span>'; openSpans--; }
        formattedHtml = resultHtml;

    } else if (motdJson && motdJson.extra) { 
        motdJson.extra.forEach(part => processPart(part, true));
    } else if (motdJson && (motdJson.text || motdJson.text === "")) { 
        processPart(motdJson, true);
    } else if (motdJson) { 
        rawText = JSON.stringify(motdJson); 
        formattedHtml = JSON.stringify(motdJson, null, 2); 
        cleanText = rawText;
    } else { 
        rawText = "N/A"; formattedHtml = "N/A"; cleanText = "N/A"; 
    }
    
    let codeStatsHtml = 'Colors: ';
    for (const c in colorCodeCounts) codeStatsHtml += `<span class="mc-${c}" style="padding:1px 3px; border:1px solid var(--border-color); margin-right:4px; border-radius:3px;">${colorCodeCounts[c]}</span> `;
    codeStatsHtml += '<br>Formats: ';
    for (const f in formatCodeCounts) codeStatsHtml += `<span class="mc-${f}" style="padding:1px 3px; border:1px solid var(--border-color); margin-right:4px; border-radius:3px;">${formatCodeCounts[f]}</span> `;

    return { 
        formatted: formattedHtml || 'N/A', 
        raw: rawText || 'N/A', 
        clean: cleanText || 'N/A', 
        lines: rawText.split('\n').length, 
        chars: rawText.length, 
        words: rawText.trim().split(/\s+/).filter(Boolean).length, 
        codeStats: codeStatsHtml 
    };
}

function timeSince(ts) { 
    if (!ts) return 'N/A'; 
    const s = Math.floor((new Date() - new Date(ts * 1000)) / 1000); 
    let i = s / 31536000; if (i > 1) return `${Math.floor(i)}y ago`; 
    i = s / 2592000; if (i > 1) return `${Math.floor(i)}mo ago`; 
    i = s / 86400; if (i > 1) return `${Math.floor(i)}d ago`; 
    i = s / 3600; if (i > 1) return `${Math.floor(i)}h ago`; 
    i = s / 60; if (i > 1) return `${Math.floor(i)}m ago`; 
    return Math.floor(s) < 5 ? "just now" : `${Math.floor(s)}s ago`; 
}
function getServerSizeIndicator(max) { if (max >= 1000) return "Massive"; if (max >= 200) return "Large"; if (max >= 50) return "Medium"; return max > 0 ? "Small" : ""; }

function updateAndRenderList(listType, ip) {
    let list = listType === 'history' ? queryHistory : favoriteServers;
    const maxItems = listType === 'history' ? MAX_HISTORY_ITEMS : MAX_FAVORITE_ITEMS;
    const storageKey = listType === 'history' ? 'mcServerQueryHistory_v3' : 'mcServerFavorites_v1';
    
    list = list.filter(item => item !== ip); 
    list.unshift(ip);
    if (list.length > maxItems) list.pop();
    localStorage.setItem(storageKey, JSON.stringify(list));
    if (listType === 'history') queryHistory = list; else favoriteServers = list;
    renderList(listType);
}

function removeFromList(listType, ip) {
    let list = listType === 'history' ? queryHistory : favoriteServers;
    const storageKey = listType === 'history' ? 'mcServerQueryHistory_v3' : 'mcServerFavorites_v1';
    list = list.filter(item => item !== ip);
    localStorage.setItem(storageKey, JSON.stringify(list));
    if (listType === 'history') queryHistory = list; else favoriteServers = list;
    renderList(listType);
}

function renderList(listType) {
    const listEl = listType === 'history' ? el.historyList : el.favoritesList;
    const sectionEl = listType === 'history' ? el.historySection : el.favoritesSection;
    const list = listType === 'history' ? queryHistory : favoriteServers;

    listEl.innerHTML = '';
    if (list.length === 0) { sectionEl.classList.add('hidden'); return; }
    sectionEl.classList.remove('hidden');
    list.forEach(ip => {
        const li = document.createElement('li'); 
        const name = document.createElement('span'); 
        name.className = 'server-name'; 
        name.textContent = ip;
        if (listType === 'favorites') { 
            const icon = document.createElement('span'); 
            icon.className = 'fav-list-icon'; 
            icon.textContent = '⭐'; 
            li.prepend(icon); 
        }
        const btn = document.createElement('button'); 
        btn.className = 'list-action-button'; 
        btn.innerHTML = '×'; 
        btn.title = 'Remove';
        btn.onclick = (e) => { e.stopPropagation(); removeFromList(listType, ip); };
        li.append(name, btn);
        li.onclick = () => { el.serverIpInput.value = ip; fetchServerStatus(ip); window.scrollTo({ top: 0, behavior: 'smooth' }); };
        listEl.appendChild(li);
    });
}
function toggleFavorite(ip) {
    if (favoriteServers.includes(ip)) { removeFromList('favorites', ip); } 
    else { updateAndRenderList('favorites', ip); }
    updateFavoriteButtonState(ip);
}
function updateFavoriteButtonState(ip) {
    if (favoriteServers.includes(ip)) { 
        el.favoriteButton.classList.add('favorited'); 
        el.favTooltip.textContent = 'Unfavorite';
    } else { 
        el.favoriteButton.classList.remove('favorited'); 
        el.favTooltip.textContent = 'Favorite';
    }
}

function getDominantColor(imgEl, cb) {
    const canvas = el.colorCanvas; 
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    imgEl.crossOrigin = "Anonymous"; 
    const tempImg = new Image(); 
    tempImg.crossOrigin = "Anonymous";
    tempImg.onload = () => {
        canvas.width = tempImg.width; 
        canvas.height = tempImg.height; 
        ctx.drawImage(tempImg, 0, 0);
        try {
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data; 
            let counts = {}; 
            let max = 0; 
            let dom = null;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i+3] < 128 || (data[i] > 245 && data[i+1] > 245 && data[i+2] > 245) || (data[i] < 10 && data[i+1] < 10 && data[i+2] < 10)) continue;
                let rgb = `rgb(${data[i]},${data[i+1]},${data[i+2]})`; 
                counts[rgb] = (counts[rgb] || 0) + 1;
                if (counts[rgb] > max) { max = counts[rgb]; dom = rgb; }
            } 
            cb(dom || 'var(--primary-color)');
        } catch (e) { console.error("Canvas dominant color:", e); cb('var(--primary-color)'); }
    };
    tempImg.onerror = () => { console.error("Image load for dominant color."); cb('var(--primary-color)'); }
    tempImg.src = imgEl.src;
}

function loadServerNote(addr) { 
    el.notesForServerAddress.textContent = addr; 
    el.serverNoteInput.value = serverNotes[addr] || ''; 
}
el.saveNoteButton.addEventListener('click', () => {
    if (currentQueryFullAddress) {
        const note = el.serverNoteInput.value.trim();
        if (note) serverNotes[currentQueryFullAddress] = note; 
        else delete serverNotes[currentQueryFullAddress];
        localStorage.setItem('mcServerNotes_v2', JSON.stringify(serverNotes));
        el.saveNoteButton.textContent = '✅ Saved!'; 
        setTimeout(() => { el.saveNoteButton.textContent = 'Save Note'; }, 1500);
    }
});

function getLatencyFeel(durationMs) {
    if (durationMs === null || typeof durationMs === 'undefined') return { text: "N/A", color: "var(--border-color)"};
    if (durationMs < 100) return { text: "Very Fast", color: "var(--success-color)"};
    if (durationMs < 250) return { text: "Fast", color: "var(--success-color)"};
    if (durationMs < 500) return { text: "Average", color: "var(--warning-color)"};
    if (durationMs < 1000) return { text: "Slow", color: "var(--error-color)"};
    return { text: "Very Slow", color: "var(--error-color)"};
}

function detectKeywords(text) {
    const detected = []; 
    const lowerText = text.toLowerCase();
    SERVER_KEYWORDS.forEach(keyword => { 
        if (new RegExp(`\\b${keyword.toLowerCase().replace(/ /g, '\\s*')}\\b`, 'i').test(lowerText)) detected.push(keyword); 
    });
    return detected;
}
function getSpeculativeTTF(current, max) {
    if (current >= max || max === 0 || current === null || max === null) return null;
    const diff = max - current;
    const minutes = diff; 
    if (minutes < 1) return null; // Don't show if already full or very close
    if (minutes < 60) return `${minutes} min (speculative)`;
    return `${(minutes / 60).toFixed(1)} hr (speculative)`;
}

async function fetchServerStatus(userInputIp) {
    clearErrorMessage(); 
    el.resultsArea.classList.add('hidden'); 
    el.playerSampleSection.classList.add('hidden');
    el.playerSampleList.innerHTML = ''; 
    el.loader.style.display = 'block'; 
    el.faviconDimensions.classList.add('hidden');
    el.resolvedIpDisplay.classList.add('hidden'); 
    el.copyButtonText('Copy Address'); 
    el.shareStatusButtonText('Copy Summary');
    el.resultsArea.style.setProperty('--dynamic-theme-color', 'var(--border-color)');
    el.keywordTagsContainer.classList.add('hidden'); 
    el.keywordTags.innerHTML = '';
    el.speculativeTTF.classList.add('hidden');

    let queryIp = userInputIp, displayIp = userInputIp, port = '25565';
    currentQueryFullAddress = userInputIp.toLowerCase(); 

    if (userInputIp.includes(':')) { 
        [queryIp, port] = userInputIp.split(':'); 
        currentQueryFullAddress = `${queryIp.toLowerCase()}:${port}`; 
    } else { 
        displayIp = `${userInputIp}`; 
        currentQueryFullAddress = `${queryIp.toLowerCase()}:${port}`; 
    }
    el.serverAddressDisplay.firstChild.textContent = displayIp + ' ';
    
    const isHostname = !/^\d{1,3}(\.\d{1,3}){3}$/.test(queryIp);
    el.addressTypeIndicator.textContent = isHostname ? 'Hostname' : 'IP Addr'; 
    el.addressTypeIndicator.classList.remove('hidden');
    loadServerNote(currentQueryFullAddress); 
    updateFavoriteButtonState(currentQueryFullAddress);

    try {
        const response = await fetch(`https://mcapi.us/server/status?ip=${encodeURIComponent(queryIp)}&port=${encodeURIComponent(port)}`);
        currentServerData = await response.json();
        el.loader.style.display = 'none';

        if (currentServerData.status === 'error' || !currentServerData.online) {
            el.resultsArea.style.setProperty('--dynamic-theme-color', 'var(--error-color)');
            el.serverStatus.textContent = 'Offline'; 
            el.serverStatus.className = 'status-offline';
            el.serverFavicon.src = DEFAULT_FAVICON; 
            el.faviconDimensions.classList.add('hidden');
            el.serverPlayers.textContent = 'N/A';
            el.serverSizeIndicator.textContent = '';
            el.playerSlotPercentage.textContent = 'N/A';
            el.playerProgressBar.style.width = '0%'; 
            el.playerProgressBar.textContent = ''; 
            el.playerProgressBar.className = 'progress-bar';
            el.serverVersionName.textContent = (currentServerData.server && currentServerData.server.name) || 'N/A';
            el.serverProtocol.textContent = (currentServerData.server && currentServerData.server.protocol) || 'N/A';
            
            const motdData = formatMotd(currentServerData.motd || (currentServerData.error || 'Server offline.'));
            currentMotdFormatted = motdData.formatted; 
            currentMotdRaw = motdData.raw; 
            currentMotdClean = motdData.clean;
            el.serverMotd.innerHTML = currentMotdFormatted;
            el.motdLines.textContent = motdData.lines; 
            el.motdChars.textContent = motdData.chars; 
            el.motdWords.textContent = motdData.words; 
            el.motdCodeStats.innerHTML = motdData.codeStats;
            motdViewMode = 'formatted'; 
            el.motdToggleRawButton.textContent = 'Raw'; 
            el.motdToggleCleanButton.textContent = 'Clean';

            el.apiLastUpdated.textContent = currentServerData.last_updated ? new Date(parseInt(currentServerData.last_updated)*1000).toLocaleString() : 'N/A';
            el.relativeTimeSinceUpdate.textContent = timeSince(currentServerData.last_updated);
            const apiDurMs = currentServerData.duration ? (parseInt(currentServerData.duration)/1000000) : null;
            el.apiDuration.textContent = apiDurMs ? `${apiDurMs.toFixed(2)} ms` : 'N/A';
            const lf = getLatencyFeel(apiDurMs);
            el.latencyFeel.textContent = lf.text; 
            el.latencyFeel.style.backgroundColor = lf.color;
            
            el.resultsArea.classList.remove('hidden');
            if (currentServerData.error && currentServerData.error.toLowerCase() !== "offline") displayErrorMessage(`API Error: ${currentServerData.error}`);
            else { 
                const lastOnline = currentServerData.last_online ? `Last online: ${new Date(parseInt(currentServerData.last_online)*1000).toLocaleString()}` : 'Unknown last online.'; 
                displayErrorMessage(`Server offline: ${userInputIp}. ${lastOnline}`); 
            }
            return;
        }
        
        updateAndRenderList('history', userInputIp);

        if (currentServerData.ip && (queryIp.toLowerCase() !== currentServerData.ip.toLowerCase() || port !== (currentServerData.port || '25565').toString())) {
            el.resolvedIpDisplay.textContent = `Resolved to: ${currentServerData.ip}:${currentServerData.port || port}`; 
            el.resolvedIpDisplay.classList.remove('hidden');
            currentQueryFullAddress = `${currentServerData.ip.toLowerCase()}:${currentServerData.port || port}`; 
            loadServerNote(currentQueryFullAddress); 
            updateFavoriteButtonState(currentQueryFullAddress);
        }

        el.serverStatus.textContent = 'Online'; 
        el.serverStatus.className = 'status-online';
        el.serverFavicon.onload = () => { 
            el.faviconDimensions.textContent = `${el.serverFavicon.naturalWidth}x${el.serverFavicon.naturalHeight}`; 
            el.faviconDimensions.classList.remove('hidden'); 
            getDominantColor(el.serverFavicon, (c) => { el.resultsArea.style.setProperty('--dynamic-theme-color', c); }); 
        };
        el.serverFavicon.onerror = () => { 
            el.serverFavicon.src = DEFAULT_FAVICON; 
            el.faviconDimensions.classList.add('hidden'); 
            el.resultsArea.style.setProperty('--dynamic-theme-color', 'var(--border-color)'); 
        };
        el.serverFavicon.src = currentServerData.favicon || DEFAULT_FAVICON;

        el.serverPlayers.textContent = `${currentServerData.players.now} / ${currentServerData.players.max}`;
        el.serverSizeIndicator.textContent = getServerSizeIndicator(currentServerData.players.max);
        const perc = (currentServerData.players.max > 0) ? ((currentServerData.players.now / currentServerData.players.max) * 100) : 0;
        el.playerSlotPercentage.textContent = `${perc.toFixed(1)}%`; 
        el.playerProgressBar.style.width = `${perc}%`;
        el.playerProgressBar.textContent = `${perc.toFixed(0)}%`;
        el.playerProgressBar.className = 'progress-bar'; 
        if (perc >= 100) el.playerProgressBar.classList.add('full'); 
        else if (perc >= 85) el.playerProgressBar.classList.add('nearly-full');
        
        const ttf = getSpeculativeTTF(currentServerData.players.now, currentServerData.players.max);
        if(ttf) { 
            el.speculativeTTF.textContent = `Est. Time to Full: ${ttf} (at 1 player/min)`; 
            el.speculativeTTF.classList.remove('hidden'); 
        } else { 
            el.speculativeTTF.classList.add('hidden'); 
        }

        el.serverVersionName.textContent = currentServerData.server.name || 'Unknown'; 
        el.serverProtocol.textContent = currentServerData.server.protocol || 'N/A';
        const motdData = formatMotd(currentServerData.motd_json || currentServerData.motd);
        currentMotdFormatted = motdData.formatted; 
        currentMotdRaw = motdData.raw; 
        currentMotdClean = motdData.clean;
        el.serverMotd.innerHTML = currentMotdFormatted;
        el.motdLines.textContent = motdData.lines; 
        el.motdChars.textContent = motdData.chars; 
        el.motdWords.textContent = motdData.words; 
        el.motdCodeStats.innerHTML = motdData.codeStats;
        motdViewMode = 'formatted'; 
        el.motdToggleRawButton.textContent = 'Raw'; 
        el.motdToggleCleanButton.textContent = 'Clean';
        
        const combinedTextForKeywords = `${currentServerData.server.name || ''} ${currentMotdClean}`.toLowerCase();
        const detected = detectKeywords(combinedTextForKeywords);
        if(detected.length > 0) { 
            el.keywordTags.innerHTML = detected.map(k => `<span class="keyword-tag">${k}</span>`).join(''); 
            el.keywordTagsContainer.classList.remove('hidden'); 
        } else { 
            el.keywordTagsContainer.classList.add('hidden'); 
        }

        el.apiLastUpdated.textContent = new Date(parseInt(currentServerData.last_updated)*1000).toLocaleString();
        el.relativeTimeSinceUpdate.textContent = timeSince(currentServerData.last_updated);
        const apiDurMs = currentServerData.duration ? (parseInt(currentServerData.duration)/1000000) : null;
        el.apiDuration.textContent = apiDurMs ? `${apiDurMs.toFixed(2)} ms` : 'N/A';
        const lf = getLatencyFeel(apiDurMs);
        el.latencyFeel.textContent = lf.text; 
        el.latencyFeel.style.backgroundColor = lf.color;


        if (currentServerData.players.sample && currentServerData.players.sample.length > 0) {
            el.playerSampleCount.textContent = currentServerData.players.sample.length; 
            el.playerSampleList.innerHTML = '';
            currentServerData.players.sample.forEach(p => {
                const li = document.createElement('li'); 
                const avatar = document.createElement('img'); 
                avatar.className = 'player-avatar';
                avatar.src = `https://cravatar.eu/helmavatar/${p.name}/28.png`; 
                avatar.alt = p.name; 
                avatar.onerror = () => { avatar.src = `https://cravatar.eu/helmavatar/Steve/28.png`; }; 
                li.append(avatar, document.createTextNode(p.name)); 
                el.playerSampleList.appendChild(li);
            });
            el.playerSampleSection.classList.remove('hidden');
        } else { 
            el.playerSampleSection.classList.add('hidden'); 
        }
        el.resultsArea.classList.remove('hidden');
    } catch (error) { 
        el.loader.style.display = 'none'; 
        console.error("Fetch/Processing error:", error); 
        displayErrorMessage(`Error processing data for ${userInputIp}. Details in console.`); 
        el.resultsArea.classList.add('hidden'); 
    }
}

el.checkButton.addEventListener('click', () => { 
    const ip = el.serverIpInput.value.trim(); 
    if (ip) fetchServerStatus(ip); 
    else displayErrorMessage('Server address is required.'); 
});
el.serverIpInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') el.checkButton.click(); });

el.copyButtonText = (text) => { el.copyTooltip.textContent = text; };
el.shareStatusButtonText = (text) => { el.shareTooltip.textContent = text; };

el.copyIpButton.addEventListener('click', () => {
    const text = el.serverIpInput.value.trim() || currentQueryFullAddress;
    if (navigator.clipboard && text) { 
        navigator.clipboard.writeText(text)
            .then(() => { el.copyButtonText('✅ Copied!'); setTimeout(() => el.copyButtonText('Copy Address'), 1500);})
            .catch(err => { console.error('Copy fail: ', err); alert('Copy failed.'); });
    } else if (text) { 
        const ta = document.createElement("textarea"); 
        ta.value = text; 
        el.body.appendChild(ta);
        ta.focus(); ta.select(); 
        try { 
            document.execCommand('copy'); 
            el.copyButtonText('✅ Copied!'); 
            setTimeout(() => el.copyButtonText('Copy Address'), 1500);
        } catch (e) { alert('Copy failed.');} 
        el.body.removeChild(ta); 
    }
});

el.shareStatusButton.addEventListener('click', () => {
    if (el.resultsArea.classList.contains('hidden') || !currentServerData) { alert("No data to share."); return; }
    const name = el.serverAddressDisplay.firstChild.textContent.trim().replace('(default port 25565)','');
    const shareText = `MC Server: ${name} | Status: ${el.serverStatus.textContent} | Players: ${el.serverPlayers.textContent} | Version: ${el.serverVersionName.textContent} | MOTD: ${currentMotdClean.substring(0,40)}...`;
    if (navigator.clipboard) { 
        navigator.clipboard.writeText(shareText)
            .then(() => { el.shareStatusButtonText('✅ Summary Copied!'); setTimeout(() => el.shareStatusButtonText('Copy Summary'), 1500);})
            .catch(err => { alert('Failed to copy summary.'); });
    } else { alert("Clipboard sharing not supported."); }
});

el.favoriteButton.addEventListener('click', () => { if(currentQueryFullAddress) toggleFavorite(currentQueryFullAddress); });
el.motdToggleRawButton.addEventListener('click', () => { el.serverMotd.textContent = currentMotdRaw; motdViewMode = 'raw'; });
el.motdToggleCleanButton.addEventListener('click', () => { el.serverMotd.textContent = currentMotdClean; motdViewMode = 'clean'; });
el.serverMotd.addEventListener('click', () => { 
    if(motdViewMode !== 'formatted') {
        el.serverMotd.innerHTML = currentMotdFormatted; 
        motdViewMode = 'formatted';
    } 
});
el.serverFavicon.addEventListener('click', () => { 
    if(el.serverFavicon.src && el.serverFavicon.src !== DEFAULT_FAVICON) window.open(el.serverFavicon.src, '_blank'); 
});
el.exportJsonButton.addEventListener('click', () => {
    if (currentServerData) {
        const dataStr = JSON.stringify(currentServerData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `${(currentQueryFullAddress || 'server_data').replace(/[:.]/g, '_')}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    } else { alert('No server data to export yet.'); }
});

popularServers.forEach(s => {
    const li = document.createElement('li'); 
    const name = document.createElement('span'); 
    name.className = 'server-name'; 
    name.textContent = s.name;
    const ip = document.createElement('span'); 
    ip.className = 'server-ip'; 
    ip.textContent = s.ip; 
    li.append(name, ip);
    li.onclick = () => { 
        el.serverIpInput.value = s.ip; 
        fetchServerStatus(s.ip); 
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    };
    el.popularServerListEl.appendChild(li);
});

renderHistory(); 
renderList('favorites');
