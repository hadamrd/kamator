import { app, BrowserWindow, ipcMain, session } from "electron";
import path from "path";
import os from "os";

const express = require("express"); // Ensure this is imported
const crypto = require("crypto");
const open = require("open");
const axios = require("axios");

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

let mainWindow;
const localServerPort = 9001;
const clientId = "102";
const redirectUri = `http://127.0.0.1:${localServerPort}/authorized`;
let server; // This will hold the server instance
let storedCodeVerifier; // Store the code verifier

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, "icons/icon.png"), // tray icon
    width: 1000,
    height: 600,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(process.env.APP_URL);

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on("devtools-opened", () => {
      mainWindow.webContents.closeDevTools();
    });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  app.setAsDefaultProtocolClient('grinder');
  createWindow();
});

app.on("window-all-closed", () => {
  if (platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Generate code verifier and code challenge
function generateCodeVerifier() {
  return base64UrlEncode(crypto.randomBytes(32));
}

function generateCodeChallenge(codeVerifier) {
  return base64UrlEncode(
    crypto.createHash("sha256").update(codeVerifier).digest()
  );
}

function base64UrlEncode(buffer) {
  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

ipcMain.handle("start-auth", async (event) => {
  return new Promise((resolve, reject) => {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    storedCodeVerifier = codeVerifier;

    // Construct the URL
    const authUrl = `https://auth.ankama.com/login/ankama?code_challenge=${codeChallenge}&redirect_uri=${redirectUri}&client_id=${clientId}&direct=true&origin_tracker=https://www.ankama-launcher.com/dofus`;

    const expressApp = express();

    expressApp.get("/authorized", async (req, res) => {
      const code = req.query.code;
      if (code && storedCodeVerifier) {
        res.send(
          "<h1>Authorization successful! You can close this window now.</h1>"
        );
        resolve({ code, codeVerifier: storedCodeVerifier });
      } else {
        res.send("<h1>Authorization failed! No code received.</h1>");
        reject(new Error("Authorization failed! No code received."));
      }
      storedCodeVerifier = null;
      server.close();
      server = null;
    });

    // Check if the server is already running
    if (!server) {
      // Open the authentication URL in the user's default browser
      open(authUrl);

      // Start the local server
      server = expressApp.listen(localServerPort, () => {
        console.log(`Local server running on port ${localServerPort}`);
      });
    } else {
      // Server is already running, just open the URL
      open(authUrl);
    }
  });
});

ipcMain.handle('get-cookie', async (event, name) => {
  const cookies = await session.defaultSession.cookies.get({ name })
  console.log(cookies)
  return cookies[0]?.value || null
})
