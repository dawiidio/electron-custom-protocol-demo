const {
    BrowserWindow,
    app,
    protocol,
    ipcMain,
} = require('electron');

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

    protocol.registerHttpProtocol(PROTOCOL_PREFIX, req => {
        const { host } = new URL(req.url);
        const pathToPage = `file://${__dirname}/pages/${host}.html`;

        window.loadURL(pathToPage);
    });

    window.loadURL(`${PROTOCOL_PREFIX}://index`);
});

let name = '';

ipcMain.on('setName', (ev, val) => {
    name = val;
});

ipcMain.on('getName', (ev) => {
    ev.returnValue = name;
});
