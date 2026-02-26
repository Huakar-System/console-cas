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
const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

io.on('connection', (socket) => {
    console.log('User connected to terminal');

    // Create a new pseudo-terminal for each connection
    const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.env.HOME || process.env.USERPROFILE,
        env: process.env
    });

    // Send shell output to the client
    ptyProcess.onData((data) => {
        socket.emit('output', data);
    });

    // Receive user input and send it to the shell
    socket.on('input', (data) => {
        ptyProcess.write(data);
    });

    // Handle terminal resizing
    socket.on('resize', (size) => {
        ptyProcess.resize(size.cols, size.rows);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected, killing pty process');
        ptyProcess.kill();
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
