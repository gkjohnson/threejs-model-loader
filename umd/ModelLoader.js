(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('three')) :
	typeof define === 'function' && define.amd ? define(['three'], factory) :
	(global.ModelLoader = factory(global.THREE));
}(this, (function (THREE) { 'use strict';

	/**
	 * @author Garrett Johnson / http://gkjohnson.github.io/
	 * https://github.com/gkjohnson/threejs-model-loader
	 */

	class ModelLoader {

		constructor( manager ) {

			this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

			this.cachedLoaders = {};
			this.loaderClasses = THREE;
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
				'wrl': 'VRMLLoader',
				'x': 'XLoader',
				'zae': 'ColladaArchiveLoader',

			};

		}

		/* Override-able Interface */
		// function that creates a loader instance and passes it back to
		// the `loaderCb`.
		getLoader( loaderName, manager, loaderCb ) {

			loaderCb( new this.loaderClasses[ loaderName ]( manager ) );

		}

		/* Public Functions */
		load( url, onLoad, onProgress, onError, extOverride = null ) {

			onError = onError || ( e => console.error( e ) );

			// Get the extension associated the file so we can get the
			// appropriate loader
			var extMatches = url.match( /\.([^\.\/\\]+)$/ );
			var urlext = extMatches ? extMatches[ 1 ] : null;
			var ext = extOverride || urlext;

			if ( url == null ) {

				onError( new Error( 'Model Loader : No file extension found' ) );
				return;

			}

			this.extToLoader( ext, loader => {

				// TODO: set the cross origin etc information
				loader.load( url, res => {

					onLoad( this.formResult( res ) );

				}, onProgress, onError );

			}, onError );

		}

		parse( data, ext, onLoad, onError ) {

			onError = onError || ( e => console.error( e ) );

			this.extToLoader( ext, this.manager, loader => {

				onLoad( this.formResult( loader.parse( data ) ) );

			}, onError );

		}

		/* Private Functions */
		// Forms the resultant object from a load to normalize the return format.
		formResult( res, extension ) {

			const mat = new THREE.MeshBasicMaterial( { color: 0xffffff } );
			let model = res.scene || res.object || res;
			model = model.isBufferGeometry || model.isGeometry ? new THREE.Mesh( model, mat ) : model;

			return {

				model,
				extension,
				originalResult: res

			};

		}

		// Creates a loader based on the provided extension. The loader is passed
		// into the `loaderCb` callback function
		extToLoader( ext, loaderCb, onError ) {

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

				loaderCb( loader );

			} else {

				this.getLoader( loaderName, this.manager, loader => {

					this.cachedLoaders[ loaderName ] = loader;
					loaderCb( loader );

				} );

			}

		}

	}

	return ModelLoader;

})));
//# sourceMappingURL=ModelLoader.js.map
