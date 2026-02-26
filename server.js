require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const pty = require('node-pty');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Shell configuration
// On Windows we use powershell, on Linux we try to use the user's preferred shell or bash
const shell = os.platform() === 'win32' ? 'powershell.exe' : (process.env.SHELL || 'bash');

io.on('connection', (socket) => {
    console.log('User connected to terminal');

    try {
        // Create a new pseudo-terminal for each connection
        const ptyProcess = pty.spawn(shell, [], {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: os.homedir() || process.cwd(),
            env: process.env
        });

        // Send system info to the client
        socket.emit('system-info', {
            platform: os.platform(),
            release: os.release(),
            hostname: os.hostname(),
            shell: shell
        });

        // Send shell output to the client
        ptyProcess.onData((data) => {
            socket.emit('output', data);
        });

        // Receive user input and send it to the shell
        socket.on('input', (data) => {
            if (ptyProcess) ptyProcess.write(data);
        });

        // Handle terminal resizing
        socket.on('resize', (size) => {
            if (ptyProcess) ptyProcess.resize(size.cols, size.rows);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected, killing pty process');
            try {
                ptyProcess.kill();
            } catch (e) {
                console.error('Error killing pty process:', e);
            }
        });

        ptyProcess.onExit(({ exitCode, signal }) => {
            console.log(`PTY process exited with code ${exitCode} and signal ${signal}`);
            socket.disconnect();
        });

    } catch (err) {
        console.error('Failed to spawn PTY process:', err);
        socket.emit('output', '\r\n\x1b[31mError: Failed to spawn shell process. Make sure the shell is available and you have the necessary permissions.\x1b[0m\r\n');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
