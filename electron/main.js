const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");

let serverProcess;

function startBackend() {
  const serverPath = path.join(__dirname, "..", "server", "server.js");

  serverProcess = spawn(process.execPath, [serverPath], {
    cwd: path.join(__dirname, "..", "server"),
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
    },
    stdio: "inherit",
  });

  serverProcess.on("error", (error) => {
    console.error("Failed to start backend:", error);
  });

  serverProcess.on("exit", (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

function waitForBackend() {
  return new Promise((resolve, reject) => {
    const maxAttempts = 30;
    let attempts = 0;

    const check = () => {
      attempts++;

      const request = http.get("http://localhost:5000/", (response) => {
        response.resume();

        if (response.statusCode >= 200 && response.statusCode < 500) {
          console.log("Backend is ready.");
          resolve();
        } else {
          retry();
        }
      });

      request.on("error", () => {
        retry();
      });

      request.setTimeout(1000, () => {
        request.destroy();
        retry();
      });
    };

    const retry = () => {
      if (attempts >= maxAttempts) {
        reject(new Error("Backend did not become ready in time."));
        return;
      }

      setTimeout(check, 500);
    };

    check();
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#f5f7fa",

    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const frontendPath = path.join(
    __dirname,
    "..",
    "client",
    "dist",
    "index.html"
  );

  win.loadFile(frontendPath);

  // Keep DevTools open during development
  win.webContents.openDevTools();
}

app.whenReady().then(async () => {
  try {
    startBackend();

    await waitForBackend();

    createWindow();
  } catch (error) {
    console.error("Application startup failed:", error);
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (serverProcess) {
    serverProcess.kill();
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
