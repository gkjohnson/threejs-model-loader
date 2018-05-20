// Creates a ServiceWorker to intercept requests and serve
// files from zip files instead.

window.ZipServer =
class ZipServer {

    // Generate a 9 digit random id
    static _generateId() {

        return Math.random().toString(36).substr(2, 9);

    }

    static _dataTransferToZip(dataTransfer) {

        if (!(dataTransfer instanceof DataTransfer)) {

            throw new Error('Data must be of type "DataTransfer"', dataTransfer);

        }        

        return new Promise(resolve => {
            // keep track of how many async file read operations we
            // do so we know when they've all finished
            const zip = new JSZip();
            let ct = 0;

            // iterate down the file tree, firing a callback for every file
            function recurseDirectory(item, filecb) {
                if (item.isFile) {
                    filecb(item);
                } else {
                    let reader = item.createReader();
                    reader.readEntries(et => {
                        et.forEach(e => {
                            recurseDirectory(e, filecb);
                        });
                    })
                }
            }

            function loadFile(e, name) {
                zip.file(name, e.target.result);
                ct --;
                if (ct === 0) resolve(zip.generate({ type: "arraybuffer" }));
            
            }
            
            // Traverse down the tree and add the files into the zip
            const dtitems = dataTransfer.items && [...dataTransfer.items];
            const dtfiles = [...dataTransfer.files];

            if (dtitems && dtitems.length && dtitems[0].webkitGetAsEntry) {
            
                for (let i = 0; i < dtitems.length; i ++) {
                    const item = dtitems[i];
                    const entry = item.webkitGetAsEntry();
                    recurseDirectory(entry, f => {
                        ct ++;
                        f.file(res => {
                            const fr = new FileReader();
                            fr.onload = e => loadFile(e, f.fullPath);
                            fr.readAsArrayBuffer(res);
                        });
                    });
                }

            } else {
                
                dtfiles
                    .filter(file => file.size !== 0)
                    .forEach(file => {
                        ct ++;
                        const fr = new FileReader();
                        fr.onload = e => loadFile(e, file.name);
                        fr.readAsArrayBuffer(file);
                    });
            
                requestAnimationFrame(() => resolve(null));
            
            }
        });
    }

    // Returns the URL to load the worker script from
    static get _getWorkerUrl() {

        if (!this._workerUrl) {
            const el = document.createElement('a');
            el.href = './zipServerWorker.js';
            this._workerUrl = el.href;
        }

        return this._workerUrl;

    }

    // the associated worker and whether or not the worker
    // is ready to handle requests
    get ready() { return !!this._serviceWorker; }
    get serviceWorker() { return this._serviceWorker; }
    get enabled() { return !this._disabled; }
    set enabled(enabled) { 
        this._disabled = !enabled;
        if (this._serviceWorker) this._serviceWorker.postMessage({ disabled: !enabled });
    }

    constructor() {

        this._ids = [];
        this._serviceWorker = null;
        this._id = ZipServer._generateId();

        // before unload, clear all files
        window.addEventListener('beforeunload', () => this.clearAll());
    }

    /* Public API */
    // Returns a promise that resolves with the service worker
    // once it is registered and ready 
    register() {

        return new Promise((resolve, reject) => {
            navigator.serviceWorker.register(ZipServer._getWorkerUrl).then(reg => {
                if (!reg.active) {
                    (reg.installing || reg.waiting)
                        .addEventListener('statechange', () => {
                            this._serviceWorker = reg.active;
                            this.enabled = this.enabled;
                            resolve(reg.active)
                        });
                } else {
                    this._serviceWorker = reg.active;
                    this.enabled = this.enabled;
                    requestAnimationFrame(() => resolve(reg.active));
                }
            });
        });

    }

    // Unregisters ther service. This will unregister it from any
    // shared clients, as well.
    unregister() {

        if (!this.serviceWorker) {

            throw new Error('ZipServer has no service worker to unregister');
        
        }

        this._serviceWorker.unregister();
        this._serviceWorker = null;

    }

    // Takes a buffer representing a zip file to serve files from. If the
    // data is an ArrayBuffer and `transfer` == true, then the buffer is
    // transferred to the worker and will no longer be accessible.

    // Returns a handle with an id and dispose function for removing the zip
    addZip(buffer, transfer = true) {

        if (!this.ready) {

            throw new Error('ZipServer service worker not intialized, yet.');

        }

        // add the buffer
        const id = this._generateFileId();
        const transferable = [];

        if (buffer instanceof ArrayBuffer && transfer) transferable.push(buffer);
        
        this.serviceWorker.postMessage({ id, buffer }, transferable);
        this._ids.push(id);

        return {

            id,
            dispose: () => this.remove(id)
        
        }

    }

    // Create a zip based on a dataTransfer object retrieved from an event like
    // draggin and dropping of files.
    addDataTransfer(dataTransfer) {

        if (!this.ready) {

            throw new Error('ZipServer service worker not intialized, yet.');

        }

        return ZipServer
            ._dataTransferToZip(dataTransfer)
            .then(zip => this.addZip(zip));

    }

    // Removes the zip file with the provided id from being served
    remove(id) {

        if (!this.ready) {

            throw new Error('ZipServer service worker not intialized, yet.');

        }

        const index = this._ids.indexOf(id);
        if (!index === -1) {

            throw new Error(`Id ${ id } not a registered zip file`);

        }

        this._serviceWorker.postMessage({ id, buffer: null });
        this._ids.splice(index, 1);
        
    }

    // Clears all the registered zip files being served from this client instance
    clearAll() {

        this._ids.forEach(n => this.remove(n));

    }

    /* Private Functions */
    _generateFileId() {

        let id;
        while (!id || this._ids.indexOf(id) !== -1) {

            id = `${ this._id }_${ ZipServer._generateId() }`;

        }

        return id;

    }

}