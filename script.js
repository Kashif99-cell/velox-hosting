let currentServer = "";
let serverStatusMap = {
    'ALI': 'limbo',
    'Kashif99': 'limbo',
    'BlockBashSMP': 'online'
};

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    window.scrollTo(0, 0);
}

function triggerCloudflare() {
    document.getElementById('cfModal').style.display = 'flex';
    document.getElementById('cfSpinner').style.display = 'none';
    document.getElementById('cfCircle').style.display = 'block';
    document.getElementById('cfCircle').className = "fa-regular fa-circle";
    document.getElementById('cfCircle').style.color = "var(--text-muted)";
}

function verifyCloudflare() {
    let spinner = document.getElementById('cfSpinner');
    let circle = document.getElementById('cfCircle');
    
    circle.style.display = 'none';
    spinner.style.display = 'block';

    setTimeout(() => {
        spinner.style.display = 'none';
        circle.style.display = 'block';
        circle.className = "fa-solid fa-circle-check";
        circle.style.color = "var(--success)";

        setTimeout(() => {
            document.getElementById('cfModal').style.display = 'none';
            switchView('dashboard');
        }, 600);
    }, 1000);
}

function openServerPanel(name, status) {
    currentServer = name;
    document.getElementById('panelServerName').innerText = name;
    let statusVal = serverStatusMap[name] || status;
    
    let consoleBox = document.getElementById('consoleLogs');
    if (statusVal === 'limbo') {
        document.getElementById('limboNotice').style.display = 'flex';
        consoleBox.innerHTML = `[System] Server is in limbo mode.<br>[System] Click "Wake Server" to activate container.`;
    } else {
        document.getElementById('limboNotice').style.display = 'none';
        consoleBox.innerHTML = `[System] Loading libraries, please wait...<br>[Server] Done (3.421s)! For help, type "help"`;
    }
    switchView('serverPanel');
}

function wakeServer() {
    let consoleBox = document.getElementById('consoleLogs');
    document.getElementById('limboNotice').style.display = 'none';
    serverStatusMap[currentServer] = 'online';
    consoleBox.innerHTML += `<br>[System] Waking up server container...`;
    setTimeout(() => {
        consoleBox.innerHTML += `<br>[System] Allocated resources successfully! Server is now online.`;
        consoleBox.scrollTop = consoleBox.scrollHeight;
    }, 1000);
}

function sendCommand() {
    let input = document.getElementById('commandInput');
    let consoleBox = document.getElementById('consoleLogs');
    if(input.value.trim() !== "") {
        consoleBox.innerHTML += `<br>> ${input.value}`;
        consoleBox.innerHTML += `<br>[Server] Command executed successfully.`;
        input.value = "";
        consoleBox.scrollTop = consoleBox.scrollHeight;
    }
}

function openCreateModal() {
    document.getElementById('createModal').style.display = 'flex';
}

function closeCreateModal() {
    document.getElementById('createModal').style.display = 'none';
}

function createServer() {
    let nameInput = document.getElementById('newServerName').value.trim();
    if(nameInput === "") {
        alert("Please enter a server name!");
        return;
    }
    serverStatusMap[nameInput] = 'limbo';
    let grid = document.getElementById('serversGrid');
    grid.innerHTML += `
        <div class="server-card" onclick="openServerPanel('${nameInput}', 'limbo')">
            <div class="server-info-top">
                <span class="server-name">${nameInput}</span>
                <span class="status-badge status-limbo">In limbo</span>
            </div>
            <div class="server-specs">
                <span><i class="fa-solid fa-microchip"></i> 2 GB RAM / 2vCPU</span>
                <span><i class="fa-solid fa-gamepad"></i> Paper 1.21</span>
            </div>
            <span style="font-size: 0.85rem; color: var(--accent);">Manage Server &rarr;</span>
        </div>
    `;
    closeCreateModal();
    document.getElementById('newServerName').value = "";
}
