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
        // We use -i for interactive and set some env vars to help without a TTY
        const bash = spawn(shell, ['-i'], {
            env: { 
                ...process.env, 
                TERM: 'vt100', // Use a simpler terminal type for better compatibility without pty
                SUDO_ASKPASS: '/bin/false',
                LANG: 'en_US.UTF-8'
            },
            cwd: os.homedir() || process.cwd(),
            shell: false // Don't use system shell to wrap our bash
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
                // If the user sends a carriage return, make sure it's handled for the shell
                bash.stdin.write(data);
            }
        });

        // Resize isn't supported without pty, so we ignore it here
        socket.on('resize', (size) => {
            // child_process spawn doesn't support resizing
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
            socket.emit('output', '\r\n\x1b[33mSession terminated.\x1b[0m\r\n');
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
