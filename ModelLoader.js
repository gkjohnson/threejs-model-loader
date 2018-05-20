/**
 * @author Garrett Johnson / http://gkjohnson.github.io/
 * https://github.com/gkjohnson/threejs-model-loader
 */

THREE.ModelLoader = function ( manager ) {

	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

	this.modelCache = {};

	this.cachedLoaders = {};
	this.loaderMap = {

		'3mf': '3MFLoader',
		'amf': 'AMFLoader',
		'bvh': 'BVHLoader',
		'assimp': 'AssimpLoader',
		'babylon': 'BabylonLoader',
		'dae': 'ColladaLoader',
		'drc': 'DRACOLoader',
		'fbx': 'FBXLoader',
		'gcode': 'GCodeLoader',
		'gltf': 'GLTFLoader',
		'glb': 'GLTFLoader',
		'kmz': 'KMZLoader',
		'md2': 'MD2Loader',
		'mmd': 'MMDLoader',
		'obj': 'OBJLoader',
		'ply': 'PLYLoader',
		'pcd': 'PCDLoader',
		'prwm': 'PRWMLoader',
		'stl': 'STLLoader',
		'tds': 'TDSLoader',
		'vtk': 'VTKLoader',
		'vtp': 'VTKLoader',
		'x': 'XLoader',
		'zae': 'ColladaArchiveLoader',

	};

};

THREE.ModelLoader.prototype = {

	constructor: THREE.ColladaLoader,

	toCacheKey: function ( url ) {

		// https://stackoverflow.com/questions/14780350/convert-relative-path-to-absolute-using-javascript
		this.linkTag = this.linkTag || document.createElement( 'a' );
		this.linkTag.href = url;
		return this.linkTag.href;

	},

	cloneResult: function ( argsarr ) {

		return argsarr.map( r => {

			if ( r.isObject3D ) {

				return r.clone();
			
			} else if ( 'scene' in r ) {

				// Handle the 'ColladaLoader' case where more than
				// just the geometry is returned
				return Object.assign( {}, r, { scene: r.scene.clone() } );

			} else {

				return Object.assign( {}, r );

			}

		} );

	},

	getLoader: function ( loaderName, manager, loadercb ) {

		loadercb( new THREE[ loaderName ]( manager ) );

	},

	extToLoader: function ( ext, maanger, loadercb, onError ) {

		// Get the name of the loader we need
		ext = ext ? ext.toLowerCase() : null;
		var loaderName = this.loaderMap[ ext ] || null;
		if ( loaderName == null ) {

			onError( new Error( `Model Loader : No loader specified for '${ ext }' extension` ) );

			return;

		}

		// If the loader isn't already cached the lets load it
		var loader = this.cachedLoaders[ loaderName ] || null;

		if ( loader != null ) {

			loadercb( loader );

		} else {

			this.getLoader( loaderName, this.manager, loader => {

				this.cachedLoaders[ loaderName ] = loader;
				loadercb( loader );

			} );

		}

	},

	load: function ( url, onLoad, onProgress, onError, extOverride = null ) {

		onError = onError || ( e => console.error( e ) );

		// Grab the processed data from the cache if it's been
		// loaded already
		var cachekey = this.toCacheKey( url );
		if ( this.modelCache[ cachekey ] != null ) {

			var args = this.modelCache[ cachekey ];
			requestAnimationFrame( () => onLoad( ...this.cloneResult( args ) ) );
			return;

		}

		// Get the extension associated the file so we can get the
		// appropriate loader
		var extMatches = url.match( /\.([^\.\/\\]+)$/ );
		var urlext = extMatches ? extMatches[ 1 ] : null;
		var ext = extOverride || urlext;

		if ( url == null ) {

			onError( new Error( 'Model Loader : No file extension found' ) );
			return;

		}


		this.extToLoader( ext, this.manager, loader => {

			// TODO: set the cross origin etc information
			loader.load( url, ( ...args ) => {

				this.modelCache[ cachekey ] = this.cloneResult( args );
				onLoad( ...args );

			}, onProgress, onError );

		}, onError );

	},

	parse: function ( data, ext, onLoad, onError ) {

		onError = onError || ( e => console.error( e ) );

		this.extToLoader( ext, this.manager, loader => {

			onLoad( loader.parse( data ) );

		}, onError );

	},

	// Clear the model cache
	clearCache: function () {

		this.modelCache = {};

	}

};
