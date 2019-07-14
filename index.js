const {
    BrowserWindow,
    app,
    protocol,
    ipcMain,
} = require('electron');
const { createReadStream } = require('fs');

const PROTOCOL_PREFIX = 'electron-settings';
const ALLOWED_HOSTS = ['dawiidio.com'];

const isAllowedHost = url => {
    const { host } = new URL(url);

    return ALLOWED_HOSTS.includes(host);
};

const isSettingsProtocol = url => {
    const { protocol } = new URL(url);

    return protocol === PROTOCOL_PREFIX+':';
};

let window;
let name;

protocol.registerSchemesAsPrivileged([
    { scheme: PROTOCOL_PREFIX, privileges: { bypassCSP: true } }
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
        ({ url, method }, callback) => {
            const { host } = new URL(url);
            const pathToPage = `${__dirname}/pages/${host}.html`;

            callback({
                statusCode: 200,
                headers: {
                    'content-type': 'text/html'
                },
                data: createReadStream(pathToPage)
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
