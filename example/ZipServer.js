// Creates a ServiceWorker to intercept requests and serve
// files from zip files instead.

window.ZipServer =
class ZipServer {

    // Generate a 9 digit random id
    static _generateId() {

        return Math.random().toString(36).substr(2, 9);

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
                            resolve(reg.active)
                        });
                } else {
                    this._serviceWorker = reg.active;
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
    add(buffer, transfer = true) {

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