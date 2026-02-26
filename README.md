# Console-CAS

A web-based terminal for Linux and Windows.

## Configuration

Before starting the server, you should configure your environment variables:

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` to suit your needs (e.g., change the `PORT` or `SHELL`).

## Linux Installation (Debian/Ubuntu)

If you are running this on a Linux server, you need to install the following system dependencies to compile `node-pty`:

```bash
sudo apt-get update
sudo apt-get install -y python3 make g++ build-essential
```

Then install the project dependencies:

```bash
npm install
```

And start the server:

```bash
npm start
```

## Running with Docker

The easiest way to make this project work on any Linux system is using Docker.

1. **Build the image:**
   ```bash
   docker build -t console-cas .
   ```

2. **Run the container:**
   ```bash
   docker run -p 3000:3000 -v /var/run/docker.sock:/var/run/docker.sock console-cas
   ```

## Troubleshooting Linux Issues

- **Permissions**: Ensure the user running the server has permissions to access the shell.
- **Root Shell**: If you want to use it to manage the system, you might need to run the server with appropriate privileges, but be careful with security.
- **Port 3000**: Ensure port 3000 is open in your firewall.
