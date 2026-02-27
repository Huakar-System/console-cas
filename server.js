require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Shell configuration
const shell = 'bash';

if (os.platform() !== 'linux') {
    console.error('CRITICAL ERROR: This application is strictly designed for Ubuntu Linux.');
    console.error('Current platform is NOT Linux. Exiting to prevent compatibility issues.');
    process.exit(1);
}

io.on('connection', (socket) => {
    console.log('User connected to Ubuntu Terminal');

    try {
        // Spawn an interactive bash shell
        // We use an interactive shell (-i) and tell it not to show its welcome message
        const bash = spawn(shell, ['-i'], {
            env: { ...process.env, TERM: 'xterm-256color' },
            cwd: os.homedir() || process.cwd(),
            shell: true
        });

        // Send system info to the client
        socket.emit('system-info', {
            platform: 'Ubuntu Linux',
            release: os.release(),
            hostname: os.hostname(),
            shell: shell
        });

        // Send shell output to the client
        bash.stdout.on('data', (data) => {
            socket.emit('output', data.toString());
        });

        bash.stderr.on('data', (data) => {
            socket.emit('output', data.toString());
        });

        // Receive user input and send it to the shell
        socket.on('input', (data) => {
            if (bash && bash.stdin.writable) {
                bash.stdin.write(data);
            }
        });

        // Handle terminal resizing (simplified for child_process)
        socket.on('resize', (size) => {
            // child_process doesn't natively support resizing a virtual terminal window 
            // without additional tools, but since we are replacing node-pty for ease,
            // we will ignore this for now to keep it simple and portable.
        });

        socket.on('disconnect', () => {
            console.log('User disconnected, killing bash process');
            try {
                bash.kill();
            } catch (e) {
                console.error('Error killing bash process:', e);
            }
        });

        bash.on('exit', (code, signal) => {
            console.log(`Bash process exited with code ${code} and signal ${signal}`);
            socket.disconnect();
        });

    } catch (err) {
        console.error('Failed to spawn Bash process:', err);
        socket.emit('output', '\r\n\x1b[31mError: Failed to spawn Ubuntu shell process.\x1b[0m\r\n');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
