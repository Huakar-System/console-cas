const socket = io();

// Initialize Xterm.js
const term = new Terminal({
    cursorBlink: true,
    fontFamily: '"Fira Code", monospace',
    fontSize: 14,
    theme: {
        background: '#0c0c0c',
        foreground: '#cccccc',
        cursor: '#ffffff',
        selection: '#ffffff4d',
        black: '#000000',
        red: '#e06c75',
        green: '#98c379',
        yellow: '#d19a66',
        blue: '#61afef',
        magenta: '#c678dd',
        cyan: '#56b6c2',
        white: '#abb2bf',
        brightBlack: '#5c6370',
        brightRed: '#e06c75',
        brightGreen: '#98c379',
        brightYellow: '#d19a66',
        brightBlue: '#61afef',
        brightMagenta: '#c678dd',
        brightCyan: '#56b6c2',
        brightWhite: '#ffffff'
    }
});

const fitAddon = new FitAddon.FitAddon();
term.loadAddon(fitAddon);
term.open(document.getElementById('terminal-container'));
fitAddon.fit();

// Handle window resizing
window.addEventListener('resize', () => {
    fitAddon.fit();
    socket.emit('resize', {
        cols: term.cols,
        rows: term.rows
    });
});

let systemInfo = {
    platform: 'Loading...',
    hostname: 'unknown'
};

// Initial greeting (mimicking Ubuntu login)
function printGreeting() {
    term.writeln('\x1b[33m _   _ _                 _         \x1b[0m');
    term.writeln('\x1b[33m| | | | |               | |        \x1b[0m');
    term.writeln('\x1b[33m| | | | |__  _   _ _ __ | |_ _   _ \x1b[0m');
    term.writeln('\x1b[33m| | | | \'_ \\| | | | \'_ \\| __| | | |\x1b[0m');
    term.writeln('\x1b[33m| |_| | |_) | |_| | | | | |_| |_| |\x1b[0m');
    term.writeln('\x1b[33m \\___/|_.__/ \\__,_|_| |_|\\__|\\__,_|\x1b[0m');
    term.writeln('');
    term.writeln('Welcome to Ubuntu-focused Remote Console (CAS)');
    term.writeln('System: \x1b[32m' + systemInfo.platform + ' (' + systemInfo.hostname + ')\x1b[0m');
    term.writeln('Current time: ' + new Date().toLocaleString());
    term.writeln('Connected via WebSocket to Ubuntu Server...');
    term.writeln('');
}

socket.on('system-info', info => {
    systemInfo = info;
});

// Socket communication
term.onData(data => {
    socket.emit('input', data);
});

socket.on('output', data => {
    term.write(data);
});

// Print greeting after a short delay
setTimeout(printGreeting, 500);

// Initial resize to match server pty with client term
socket.emit('resize', {
    cols: term.cols,
    rows: term.rows
});
