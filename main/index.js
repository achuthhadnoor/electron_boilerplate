const {
    BrowserWindow,
    app,
    Menu,
    Tray,
    globalShortcut
} = require("electron");

const isDev = require("electron-is-dev");
const prepareNext = require("electron-next");
const {
    resolve
} = require("app-root-path");
const Positioner = require("electron-positioner");
const AutoLaunch = require("auto-launch");
const log = require("electron-log");
// ICON PATH 
const path = require('path')
 
let extension = process.platform === 'win32' ?
    `icon.ico` // .ico on Win32
    :
    `icon.png` // .png on Darwin

let icon_path = {
    png: path.join(__dirname, 'tray', extension),
    ico: path.join(__dirname, 'tray', extension)
}

// Utils  
let tray;
let trayWindow;
let positioner;
const autoLauncher = new AutoLaunch({
    name: "Snipcode"
});
// Load saved configurations
const Store = require("electron-store");
const config = new Store({
    projectName: "SnipCode"
});
app.setAppUserModelId("com.snipcode.uiuxdx");
// Make switch only one instance.
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) { 
    app.quit();
} else {
    app.on("second-instance", (event, commandLine, workingDirectory) => { 
        // Someone tried to run a second instance, we should focus our window.
        if (trayWindow) {
            if (trayWindow.isMinimized()) trayWindow.restore();
            trayWindow.focus();
        }
    });
}

app.on('ready', async () => {
    await prepareNext('./renderer');
    // autoLauncher.enable();
    createTray();
    createWindow();
    checkForUpdates();
    registerGlobalShortcuts();
})

function createTray() {
    tray = new Tray(icon_path.png);
}

function createWindow() {
    trayWindow = new BrowserWindow({
        width: 600,
        height: 400,
        show: false,
        frame: false,
        transparent: true,
        maximizable: false,
        minimizable: false,
        skipTaskbar: true,
        resizable: false,
        titleBarStyle: "inset", //"hidden",
        webPreferences: {
            nodeIntegration: true,
            preload: join(__dirname, 'preload.js'),
        },
    });
    const devPath = "http://localhost:8000/";
    if (isDev) {
        trayWindow.loadURL(devPath);
        trayWindow.webContents.openDevTools();
    } else {
        // PRODUCTION Load the React build
        trayWindow.loadURL(
            url.format({
                pathname: resolve("renderer/out/index.html"),
                protocol: "file:",
                slashes: true
            })
        );
    }
    positioner = new Positioner(trayWindow);
    let trayPosition;
    if (process.platform === "win32") {
        trayPosition = "trayBottomCenter";
    } else if (process.platform === "darwin") {
        trayPosition = "trayCenter";
    } else {
        trayPosition = "trayRight";
    }
    positioner.move(trayPosition, tray.getBounds());
    trayWindow.setSkipTaskbar(true);
    
    trayWindow.on("ready-to-show", () => {
        trayWindow.show();
        if (app.dock) app.dock.hide();
        if (trayWindow.setSkipTaskbar) {
            trayWindow.setSkipTaskbar(true)
        }
    });
    if (platform() !== "win32") {
        // autoUpdater();
    }
}

function checkForUpdates(){

}

function registerGlobalShortcuts() {
    // Global Shortcut : Toggle Window
    const shortcutToggleWindow = globalShortcut.register("Super+Alt+Up", () => {
        toggleWindow();
    });
    const shortcutToggleState = globalShortcut.register("Super+Alt+Down", () => {
        toggleWindow();
    });
    if (!shortcutToggleState) {
        log.warn("Unable to register:CommandOrControl+Down");
    }
}