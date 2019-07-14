const {
    BrowserWindow,
    app,
    protocol,
    ipcMain,
} = require('electron');
const { createReadStream } = require('fs');

const PROTOCOL_PREFIX = 'electron-settings';
const ALLOWED_HOSTS = ['dawiidio.com'];

/**
 *
 * @param url {string}
 * @returns {boolean}
 */
const isAllowedHost = url => {
    const { host } = new URL(url);

    return ALLOWED_HOSTS.includes(host);
};

/**
 *
 * @param url {string}
 * @returns {boolean}
 */
const isSettingsProtocol = url => {
    const { protocol } = new URL(url);

    return protocol === PROTOCOL_PREFIX+':';
};

/**
 * Return path with default pathname or path to application module
 *
 * @param isFileRequest {boolean}
 * @param pathname {string}
 * @param host {string}
 * @returns {string}
 */
const createPathToSource = (isFileRequest, { pathname, host }) =>
    `${__dirname}/public/${isFileRequest ? pathname.replace('/', '') : host}${isFileRequest ? '' : '.html'}`;

/**
 *
 * @param path {string}
 * @returns {boolean}
 */
const isPathToFile = path => path.includes('.');

let window;
let name;

protocol.registerSchemesAsPrivileged([
    {
        scheme: PROTOCOL_PREFIX,
        privileges: {
            bypassCSP: true,
            standard: true
        }
    }
]);

app.on('ready', () => {
    window = new BrowserWindow({
        webPreferences: {
            preload: `${__dirname}/preload.js`
        }
    });

    window.maximize();

    window.webContents.on('will-navigate', (ev, url) => {
        if (!isSettingsProtocol(url)) {
            if (!isAllowedHost(url)) {
                ev.preventDefault();
            }
        }
    });

    protocol.registerStreamProtocol(
        PROTOCOL_PREFIX,
        (request, callback) => {
            const headers = {};
            const { host, pathname } = new URL(request.url);
            const isFileRequest = isPathToFile(pathname);

            // if you want support more file types please use npm package mime-db or mime-types to check them
            if (isFileRequest)
                headers["content-type"] = 'image/jpg';
            else
                headers["content-type"] = 'text/html';

            const pathToSource = createPathToSource(isFileRequest, {
                host,
                pathname
            });

            callback({
                statusCode: 200,
                headers,
                data: createReadStream(pathToSource)
            });
        },
        (error) => {
            if (error) console.error('Failed to register protocol');
        }
    );

    window.loadURL(`${PROTOCOL_PREFIX}://index`);
});

ipcMain.on('setName', (ev, val) => {
    name = val;
});

ipcMain.on('getName', (ev) => {
    ev.returnValue = name;
});
