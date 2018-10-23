(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('three'), require('./ModelLoader.js')) :
	typeof define === 'function' && define.amd ? define(['three', './ModelLoader.js'], factory) :
	(factory(global.THREE,global.ModelLoader));
}(this, (function (THREE,ModelLoader) { 'use strict';

	ModelLoader = ModelLoader && ModelLoader.hasOwnProperty('default') ? ModelLoader['default'] : ModelLoader;

	// model-viewer element
	// Loads and displays a 3D model

	// Events
	// model-change: Fires when a model is going to load
	// model-loaded: Fires when all the geometry has been fully loaded
	// error: Fires when there's a problem loading the model
	class ModelViewer extends HTMLElement {

		static get observedAttributes() {

			return [ 'src', 'display-shadow', 'ambient-color', 'show-grid' ];

		}

		get loadingManager() {

			return this._loadingManager = this._loadingManager || new THREE.LoadingManager();

		}

		get modelLoader() {

			return this._modelLoader = this._modelLoader || new ModelLoader( this.loadingManager );

		}

		get src() {

			return this.getAttribute( 'src' ) || '';

		}
		set src( val ) {

			this.setAttribute( 'src', val );

		}

		get displayShadow() {

			return this.hasAttribute( 'display-shadow' ) || false;

		}
		set displayShadow( val ) {

			val = !! val;
			val ? this.setAttribute( 'display-shadow', '' ) : this.removeAttribute( 'display-shadow' );

		}

		get ambientColor() {

			return this.getAttribute( 'ambient-color' ) || '#455A64';

		}
		set ambientColor( val ) {

			val ? this.setAttribute( 'ambient-color', val ) : this.removeAttribute( 'ambient-color' );

		}

		get showGrid() {

			return this.hasAttribute( 'show-grid' ) || false;

		}
		set showGrid( val ) {

			val ? this.setAttribute( 'show-grid', true ) : this.removeAttribute( 'show-grid' );

		}

		get autoRedraw() {

			return this.hasAttribute( 'auto-redraw' ) || false;

		}
		set autoRedraw( val ) {

			val ? this.setAttribute( 'auto-redraw', true ) : this.removeAttribute( 'auto-redraw' );

		}

		/* Lifecycle Functions */
		constructor() {

			super();

			// Scene setup
			const scene = new THREE.Scene();
			const camera = new THREE.PerspectiveCamera( 75, 1, 0.1, 1000 );
			camera.position.z = 10;

			const ambientLight = new THREE.HemisphereLight( this.ambientColor, '#000' );
			ambientLight.groundColor.lerp( ambientLight.color, 0.5 );
			ambientLight.intensity = 0.5;
			ambientLight.position.set( 0, 1, 0 );
			scene.add( ambientLight );

			// Light setup
			const dirLight = new THREE.DirectionalLight( 0xffffff );
			dirLight.position.set( 4, 10, 4 );
			dirLight.shadow.bias = - 0.0001;
			dirLight.shadow.mapSize.width = 2048;
			dirLight.shadow.mapSize.height = 2048;
			dirLight.castShadow = true;
			scene.add( dirLight );
			scene.add( dirLight.target );

			// Containers setup
			const scaleContainer = new THREE.Object3D();
			scene.add( scaleContainer );

			const rotator = new THREE.Object3D();
			scaleContainer.add( rotator );

			const plane = new THREE.Mesh(
				new THREE.PlaneGeometry(),
				new THREE.ShadowMaterial( { side: THREE.DoubleSide, transparent: true, opacity: 0.25 } )
			);
			plane.rotation.set( - Math.PI / 2, 0, 0 );
			plane.scale.multiplyScalar( 20 );
			plane.receiveShadow = true;
			scaleContainer.add( plane );

			const gridHelper = new THREE.GridHelper( 10, 10, 0xffffff, 0xeeeeee );
			gridHelper.material.transparent = true;
			gridHelper.material.opacity = 0.6;
			gridHelper.visible = false;
			scaleContainer.add( gridHelper );

			// Renderer setup
			const renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
			renderer.setClearColor( 0xffffff );
			renderer.setClearAlpha( 0 );
			renderer.shadowMap.enabled = true;

			// enable gamma correction before display
			renderer.gammaOutput = true;

			// Controls setup
			const controls = new THREE.OrbitControls( camera, renderer.domElement );
			controls.rotateSpeed = 2.0;
			controls.zoomSpeed = 5;
			controls.panSpeed = 2;
			controls.enableZoom = true;
			controls.enablePan = false;
			controls.enableDamping = false;
			controls.maxDistance = 50;
			controls.minDistance = 0.25;
			controls.addEventListener( 'change', () => this._dirty = true );

			this.renderer = renderer;
			this.camera = camera;
			this.controls = controls;

			this.scene = scene;
			this.rotator = rotator;
			this.scaleContainer = scaleContainer;
			this.ambientLight = ambientLight;
			this.directionalLight = dirLight;

			this.plane = plane;
			this.gridHelper = gridHelper;

			this._model = null;
			this._requestId = 0;

			this.loadingManager.onLoad = () => this._dirty = true;

			const _renderLoop = () => {

				if ( this.parentNode ) {

					this._refresh();
					this.controls.update();
					if ( this._dirty || this.autoRedraw ) {

						this.directionalLight.castShadow = this.displayShadow;

						if ( this._model && this.displayShadow ) {

							// Update the shadow camera rendering bounds to encapsulate the
							// model. We use the bounding sphere of the bounding box for
							// simplicity -- this could be a tighter fit.
							const bbox = new THREE.Box3().setFromObject( this._model );
							const center = bbox.getCenter( new THREE.Vector3() );
							const sphere = bbox.getBoundingSphere( new THREE.Sphere() );
							const minmax = sphere.radius;
							const cam = this.directionalLight.shadow.camera;
							cam.left = cam.bottom = - minmax;
							cam.right = cam.top = minmax;

							// Update the camera to focus on the center of the model so the
							// shadow can encapsulate it
							const dirLight = this.directionalLight;
							const offset = dirLight.position.clone().sub( dirLight.target.position );
							dirLight.target.position.copy( center );
							dirLight.position.copy( center ).add( offset );
							cam.updateProjectionMatrix();

						}

						this.renderer.render( scene, camera );
						this._dirty = false;

					}

				}
				this._renderLoopId = requestAnimationFrame( _renderLoop );

			};
			_renderLoop();

		}

		connectedCallback() {

			// Add our initialize styles for the element if they haven't
			// been added yet
			if ( ! this.constructor._styletag ) {

				const styletag = document.createElement( 'style' );
				styletag.innerHTML =
	            `
                ${this.tagName} { display: block; }
                ${this.tagName} canvas {
                    width: 100%;
                    height: 100%;
                }
            `;
				document.head.appendChild( styletag );
				this.constructor._styletag = styletag;

			}

			// add the renderer
			if ( this.childElementCount === 0 ) {

				this.appendChild( this.renderer.domElement );

			}

		}

		disconnectedCallback() {

			cancelAnimationFrame( this._renderLoopId );

		}

		attributeChangedCallback( attr, oldval, newval ) {

			this._dirty = true;

			switch ( attr ) {

				case 'src': {

					this._loadModel( this.src );
					break;

				}

				case 'ambient-color': {

					this.ambientLight.color.set( this.ambientColor );
					this.ambientLight.groundColor.set( '#000' ).lerp( this.ambientLight.color, 0.5 );
					break;

				}

				case 'show-grid': {

					this.gridHelper.visible = this.showGrid;
					break;

				}

			}

		}

		/* Public API */
		redraw() {

			this._dirty = true;

		}

		/* Private Functions */
		_refresh() {

			const r = this.renderer;
			const w = this.clientWidth;
			const h = this.clientHeight;
			const currsize = r.getSize();

			if ( currsize.width != w || currsize.height != h ) {

				this._dirty = true;

				r.setPixelRatio( window.devicePixelRatio );
				r.setSize( w, h, false );

				this.camera.aspect = w / h;
				this.camera.updateProjectionMatrix();

			}

		}

		_loadModel( src ) {

			if ( this._prevsrc === src ) return;
			this._prevsrc = src;

			if ( this._model ) {

				this._model.parent.remove( this._model );
				this._model = null;
				this._dirty = true;

			}

			if ( src ) {

				this.dispatchEvent( new CustomEvent( 'model-change', { bubbles: true, cancelable: true, composed: true, detail: src } ) );

				// Keep track of this request and make
				// sure it doesn't get overwritten by
				// a subsequent one
				this._requestId ++;
				const requestId = this._requestId;

				this.modelLoader
					.load( src, res => {

						if ( this._requestId !== requestId ) return;

						this._addModel( res.model );
						this.dispatchEvent( new CustomEvent( 'model-loaded', { bubbles: true, cancelable: true, composed: true } ) );

					}, null, err => {

						this.dispatchEvent( new CustomEvent( 'error', { bubbles: true, cancelable: true, composed: true, detail: err } ) );

					} );

			}

		}

		_addModel( obj ) {

			const rotator = this.rotator;
			const scaleContainer = this.scaleContainer;
			const plane = this.plane;
			const gridHelper = this.gridHelper;

			this._model = obj;

			// Get the bounds of the model and scale and set appropriately
			obj.updateMatrixWorld( true );
			const box = new THREE.Box3().expandByObject( obj );
			const sphere = box.getBoundingSphere( new THREE.Sphere() );
			const s = 3 / sphere.radius;

			rotator.add( obj );
			rotator.rotation.set( 0, 0, 0 );
			obj.position
				.copy( sphere.center )
				.negate();

			scaleContainer.scale.set( 1, 1, 1 ).multiplyScalar( s );

			// add an additional tiny offset so the shadow plane won't
			// z-fight with the bottom of the model
			const offset = Math.abs( box.max.y - box.min.y ) * 1e-5;
			plane.position.y = obj.position.y + box.min.y - offset;
			plane
				.scale
				.set( 1, 1, 1 )
				.multiplyScalar( 100 / s );

			gridHelper.position.copy( plane.position );
			gridHelper.position.y -= offset;

			// make sure the obj will cast shadows
			obj.traverse( c => {

				c.castShadow = true;
				c.receiveShadow = true;

				if ( c.isMesh ) {

					if ( c.material ) {

						const mats = Array.isArray( c.material ) ? c.material : [ c.material ];
						mats.forEach( ( m, i ) => {

							if ( m instanceof THREE.MeshBasicMaterial ) {

								const mat = new THREE.MeshPhongMaterial( { color: 0x888888 } );
								if (
									c.geometry.isBufferGeometry && 'color' in c.geometry.attributes
									|| c.geometry.isGeometry
								) {

									mat.vertexColors = THREE.VertexColors;

								}

								if ( c.geometry.isBufferGeometry && ! ( 'normal' in c.geometry.attributes ) ) {

									c.geometry.computeVertexNormals();

								}

								mat.map = m.map;

								mats[ i ] = mat;
								m = mat;

							}

							// TODO: Lambert materials don't handle shadows well, so
							// we replace them here. Remove this once the THREE bug is fixed
							// Mentioned in https://github.com/mrdoob/three.js/issues/8238
							if ( m instanceof THREE.MeshLambertMaterial ) {

								// Can't use the `copy` function because the phong material expects
								// a specular color
								// https://github.com/mrdoob/three.js/issues/14401
								const mat = new THREE.MeshPhongMaterial();
								Object.keys( m )
									.filter( key => key in mat && m[ key ] && key != 'type' )
									.forEach( key => mat[ key ] = m[ key ] );

								mats[ i ] = mat;
								m = mat;

							}

							if ( m.map ) {

								// The texture's color space is assumed to be
								// in sRGB, though most of the THREE loaders assume
								// a Linear color space.
								m.map.encoding = THREE.GammaEncoding;
								m.needsUpdate = true;

							}

							m.shadowSide = THREE.DoubleSide;

						} );

						if ( Array.isArray( c.material ) ) c.material = mats;
						else c.material = mats[ 0 ];

					}

				}

			} );

			this._dirty = true;

		}

	}

	window.ModelViewer = ModelViewer;

})));
//# sourceMappingURL=model-viewer-element.js.map
