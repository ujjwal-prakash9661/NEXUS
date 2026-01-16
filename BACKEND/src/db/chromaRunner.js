const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function startChroma() {
    console.log("Initializing Vector Database...");

    // Attempt to locate chroma.exe in standard Windows Python paths or rely on PATH
    // The user provided: C:\Users\HP\AppData\Roaming\Python\Python313\Scripts\chroma.exe
    // We can try to run 'chroma' directly if it's in PATH, or fallback to the known path.

    const chromaPath = "C:\\Users\\HP\\AppData\\Roaming\\Python\\Python313\\Scripts\\chroma.exe";
    const isChromaInPath = false; // Assume we use the specific path for reliability based on user logs

    const command = chromaPath;
    const args = ["run", "--host", "0.0.0.0", "--port", "8000"];

    const chroma = spawn(command, args, {
        shell: true,
        stdio: 'ignore' // detach stdio so it doesn't clutter server logs, or 'pipe' to debug
    });

    console.log(`Vector Database Service Started (PID: ${chroma.pid})`);

    chroma.on('error', (err) => {
        console.error("Failed to start Vector DB:", err);
    });

    // Kill chroma when server exits
    process.on('SIGINT', () => {
        chroma.kill();
        process.exit();
    });
}

module.exports = startChroma;
