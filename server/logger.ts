const path = require("path");
const log = require('electron-log');
const isDev = require('electron-is-dev');

if (isDev) {
  // Hoist logs out of /build folder
  log.transports.file.resolvePath = () => path.join(__dirname, '../../logsmain.log');
}

log.transports.file.maxSize = 1024 * 1000;
log.transports.console.format = '[{h}:{i}:{s}.{ms}] [{level}] {text}';
log.transports.console.level = 'silly'

export default log