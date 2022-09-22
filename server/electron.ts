import { app, BrowserWindow, ipcMain, Menu, Notification, Tray } from 'electron';
import engine from "./shortcut-monitoring-engine"
import { FETCH_SHORTCUTS } from '../src/message-control/messages'

import logger from "./logger";

const path = require('path');
const isDev = require('electron-is-dev');

engine.init()

let mainWindow: BrowserWindow | null;
let isQuitting = false;
const iconPath = path.join(__dirname, '../icon.png')

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 1000,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: iconPath,
  });

  const filePathCompiled = `file://${path.join(__dirname, '../index.html')}`;
  const filePathLocal = 'http://localhost:3000'
  const filePath = isDev ? filePathLocal : filePathCompiled

  mainWindow.loadURL(filePath);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.setMenuBarVisibility(false)
  }

  // May re-add in future, feels like better UX to keep window open for now
  // mainWindow?.on('minimize', function (event: any) {
  //   event.preventDefault();
  //   mainWindow?.hide();
  // });

  mainWindow?.on('close', function (event) {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }

    return false;
  });


}

// Set application name when we show notificartion
if (process.platform === 'win32') {
    app.setAppUserModelId("Shortcutmon");
}


app.on('ready', () => {
  createWindow()

  var appIcon = new Tray(iconPath)
  var contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show', click: () => {
        mainWindow?.show();
      }
    },
    {
      label: 'Quit', click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  appIcon.setContextMenu(contextMenu)
});

app.on('window-all-closed', (event: any) => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('asynchronous-message', (event, arg) => {
  logger.debug("Received message from renderer process: ", arg);

  if (arg === FETCH_SHORTCUTS) {
    logger.debug("Frontend sent a request to update shortcut cache, refreshing now")
    engine.fetchShortcuts()
  }

  event.reply('asynchronous-reply', ("done"));
});


export { }