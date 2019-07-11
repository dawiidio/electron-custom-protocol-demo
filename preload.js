(() => {
    const electron = require('electron');
    const { version } = require('./package');

    window.electronAPI = {
        apiVersion: version,
        setName(value) {
            electron.ipcRenderer.send('setName', value);
        },
        getName() {
            return electron.ipcRenderer.sendSync('getName');
        }
    };
})();
