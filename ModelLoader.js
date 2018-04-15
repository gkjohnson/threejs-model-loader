/**
 * @author Garrett Johnson / http://gkjohnson.github.io/
 * https://github.com/gkjohnson/threejs-model-loader
 */

THREE.ModelLoader = function ( manager ) {

    this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

    this.modelCache = {};

    this.cachedLoaders = {};
    this.loaderMap = {

        'assimp':   'AssimpLoader',
        'dae':      'ColladaLoader',
        'gltf':     'GLTFLoader',
        'obj':      'OBJLoader2',
        'ply':      'PLYLoader',
        'stl':      'STLLoader',
        'zae':      'ColladaArchiveLoader',

        // TODO: Add more extensions

    };

}

THREE.ModelLoader.prototype = { 

    constructor: THREE.ColladaLoader,

    crossOrigin: 'Anonymous',

    getLoader: function ( loaderName, manager, loadercb ) {

        loadercb( new THREE[ loaderName ]( manager ) );

    },

    load: function ( url, onLoad, onProgress, onError, extOverride = null ) {

        // Grab the processed data from the cache if it's been
        // loaded already
        if ( this.modelCache[ url ] != null ) {
        
            // TODO: Go through and make copies of the THREEjs models here?
            // Or do that for the cached stuff?
            var args = this.modelCache[ url ];
            requestAnimationFrame(() => onLoad(...args))
            return;

        }

        // Get the extension associated the file so we can get the
        // appropriate loader
        var extMatches = url.match(/\.([^\.\/\\]+)$/);
        var urlext = extMatches ? extMatches[1] : null;
        var ext = extOverride || url

        if ( url == null ) {

            console.error('Model Loader : No file extension found');
            return;

        }

        // Get the name of the loader we need
        var loaderName = this.loaderMap[ext] || null;
        if ( loaderName == null ) {

            console.error( `Model Loader : No loader specified for '${ ext }' extension` );
            return;

        }

        var loadModel = l => {
            
            // TODO: set the cross origin etc information
            l.load( url, function( ...args ) {
                
                this.modelCache[ url ] = args;
                onLoad( ...args );

            }, onProgress, onError );
        
        }

        // If the loader isn't already cached the lets load it
        var loader = this.cachedLoaders[ loaderName ] || null;

        if ( loader != null ) {
        
            loadModel( loader )
        
        } else {

            this.getLoader( loaderName, this.manager, loader => {
            
                this.cachedLoaders[ loaderName ] = loader;
                loaderModel( loader );

            });

        }

    },

    // Clear the model cache
    clear: function () {

        this.modelCache = {};

    }

}