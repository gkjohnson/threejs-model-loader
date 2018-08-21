// Converts a datatransfer structer into an object with all paths and files
// listed out. Returns a promise that resolves with the file structure.
function dataTransferToFiles( dataTransfer ) {

	if ( ! ( dataTransfer instanceof DataTransfer ) ) {

		throw new Error( 'Data must be of type "DataTransfer"', dataTransfer );

	}

	const files = {};

	// recurse down the webkit file structure resolving
	// the paths to files names to store in the `files`
	// object
	function recurseDirectory( item ) {

		if ( item.isFile ) {

			return new Promise( resolve => {

				item.file( file => {

					files[ item.fullPath ] = file;
					resolve();

				} );

			} );

		} else {

			const reader = item.createReader();

			return new Promise( resolve => {

				const promises = [];
				reader.readEntries( et => {

					et.forEach( e => {

						promises.push( recurseDirectory( e ) );

					} );

					Promise.all( promises ).then( () => resolve() );

				} );

			} );

		}

	}

	return new Promise( resolve => {

		// Traverse down the tree and add the files into the zip
		const dtitems = dataTransfer.items && [ ...dataTransfer.items ];
		const dtfiles = [ ...dataTransfer.files ];

		if ( dtitems && dtitems.length && dtitems[ 0 ].webkitGetAsEntry ) {

			const promises = [];
			for ( let i = 0; i < dtitems.length; i ++ ) {

				const item = dtitems[ i ];
				const entry = item.webkitGetAsEntry();

				promises.push( recurseDirectory( entry ) );

			}
			Promise.all( promises ).then( () => resolve( files ) );

		} else {

			// add a '/' prefix to math the file directory entry
			// on webkit browsers
			dtfiles
				.filter( f => f.size !== 0 )
				.forEach( f => files[ '/' + f.name ] = f );

			resolve( files );

		}

	} );

}

window.addEventListener( 'WebComponentsReady', () => {

	customElements.define( 'model-viewer', ModelViewer );
	const errorel = document.getElementById( 'error' );
	const viewer = document.querySelector( 'model-viewer' );
	const bgColors = [
		'#FFC107',
		'#F06292',
		'#009688',
		'#3F51B5',
		'#CDDC39'
	];

	viewer.addEventListener( 'error', e => {

		errorel.innerText = e.detail;
		viewer.src = '';

	} );
	viewer.addEventListener( 'model-change', e => errorel.innerText = '' );

	// overriding the getLoader function so loaders can be
	// loaded as-needed
	viewer.modelLoader.getLoader = function ( loaderName, manager, loadercb ) {

		function createLoader( ln ) {

			ln = ln || loaderName;

			return new THREE[ ln ]( manager );

		}

		function getSource( name ) {

			let f =
                        fetch( `../node_modules/three/examples/js/loaders/${ name }.js` )
                        	.then( res => res.text() );
			f.then( text => eval( text ) );

			return f;

		}

		if ( THREE[ loaderName ] == null ) {

			if ( loaderName === 'OBJLoader2' ) {

				getSource( 'LoaderSupport' )
					.then( () => getSource( loaderName ) )
					.then( () => loadercb( createLoader() ) );

			} else if ( loaderName === 'KMZLoader' ) {

				getSource( 'ColladaLoader' )
					.then( () => getSource( loaderName ) )
					.then( () => loadercb( createLoader() ) );

			} else if ( loaderName === '3MFLoader' ) {

				getSource( loaderName )
					.then( () => loadercb( createLoader( 'ThreeMFLoader' ) ) );

			} else {

				getSource( loaderName )
					.then( () => loadercb( createLoader() ) );

			}

		} else {

			loadercb( createLoader() );

		}

	};

	document.addEventListener( 'dragover', e => e.preventDefault() );
	document.addEventListener( 'dragenter', e => e.preventDefault() );
	document.addEventListener( 'drop', e => {

		e.preventDefault();

		const newcol = bgColors.shift();
		bgColors.push( newcol );
		viewer.ambientColor = '#' + new THREE.Color( newcol ).lerp( new THREE.Color( 0xffffff ), 0.7 ).getHexString();
		viewer.style.backgroundColor = newcol;

		// convert the files
		dataTransferToFiles( e.dataTransfer )
			.then( files => {

            	// removes '..' and '.' tokens and normalizes slashes
				const cleanFilePath = path => {

					return path
						.replace( /\\/g, '/' )
						.split( /\//g )
						.reduce( ( acc, el ) => {

							if ( el === '..' ) acc.pop();
							else if ( el !== '.' ) acc.push( el );
							return acc;

						}, [] )
						.join( '/' );

				};

				// set the loader url modifier to check the list
				// of files
				const fileNames = Object.keys( files ).map( n => cleanFilePath( n ) );
				viewer.loadingManager.setURLModifier( url => {

					// find the matching file given the requested url
					const cleaned = cleanFilePath( url );
					const fileName = fileNames
						.filter( name => {

							const len = Math.min( name.length, cleaned.length );

							// check if the end of file and url are the same
							return cleaned.substr( cleaned.length - len ) === name.substr( name.length - len );

						} ).pop();

					if ( fileName !== undefined ) {

						const bloburl = URL.createObjectURL( files[ fileName ] );

						// revoke the url after it's been used
						requestAnimationFrame( () => URL.revokeObjectURL( bloburl ) );

						return bloburl;

					}

					return url;

				} );

				// set the source of the element to the most likely intended display model
				const filesNames = Object.keys( files );
				const extregex = new RegExp(
					`(${ Object
						.keys( viewer.modelLoader.loaderMap )
						.join( '|' )
					})$`, 'i' );

				viewer.src =
                            filesNames
                            	.filter( n => extregex.test( n ) )
                            	.shift();

			} );

	} );

} );
