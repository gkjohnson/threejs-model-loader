/**
 * @author Garrett Johnson / http://gkjohnson.github.io/
 * https://github.com/gkjohnson/threejs-model-loader
 */
import { DefaultLoadingManager, MeshPhongMaterial, Mesh } from 'three';

const loaderMap = {

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

function extractExtension( url ) {

	var extMatches = url.match( /\.([^\.\/\\]+)$/ );
	var urlExt = extMatches ? extMatches[ 1 ] : null;
	return urlExt;

}

export default
class ModelLoader {

	static get ExtensionToThreeLoader() {

		return loaderMap;

	}

	constructor( manager ) {

		this.manager = ( manager !== undefined ) ? manager : DefaultLoadingManager;
		this.loaderCallbacks = {};

	}

	/* Override-able Interface */
	// function that creates a loader instance and passes it back to
	// the `loaderCb`.
	getLoadCallback( ext, done ) {

		done( this.loaderCallbacks[ ext ] || null );

	}

	canLoadModel( urlOrExt ) {

		return urlOrExt in this.loaderCallbacks || extractExtension( urlOrExt ) in this.loaderCallbacks;

	}

	/* Public Functions */
	load( url, onLoad, onProgress, onError, options = {} ) {

		onError = onError || ( e => console.error( e ) );

		// Get the extension associated the file so we can get the
		// appropriate loader
		var urlExt = extractExtension( url );
		var ext = options.extension || urlExt;

		if ( ext == null ) {

			onError( new Error( 'ModelLoader : No file extension found' ) );

		} else {

			this.getLoadCallback( ext, func => {

				if ( func ) {

					func( url, this.manager, res => {

						onLoad( this.formResult( res ) );

					}, onProgress, onError, options );

				} else {

					onError( new Error( `ModelLoader: No load callback provided for extension '${ ext }'.` ) );

				}

			} );

		}

	}

	parse( data, extension, onLoad, onError, options = {} ) {

		options = Object.assign( {

			extension

		}, options );

		const blob = new Blob( [ data ] );
		const url = URL.createObjectURL( blob );
		this.load( url, onLoad, undefined, onError, options );

	}

	/* Private Functions */
	// Forms the resultant object from a load to normalize the return format.
	formResult( res, extension ) {

		let model = res.scene || res.object || res;
		if ( model.isBufferGeometry || model.isGeometry ) {

			const material = new MeshPhongMaterial( { color: 0xffffff } );
			model = new Mesh( model, material );

		}

		return {

			model,
			extension,
			originalResult: res

		};

	}

};
