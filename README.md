# threejs-model-loader

[![npm version](https://img.shields.io/npm/v/threejs-model-loader.svg?style=flat-square)](https://www.npmjs.com/package/threejs-model-loader)
[![lgtm code quality](https://img.shields.io/lgtm/grade/javascript/g/gkjohnson/threejs-model-loader.svg?style=flat-square&label=code-quality)](https://lgtm.com/projects/g/gkjohnson/threejs-model-loader/)

THREE.js Model Loader for delegating to the appropriate and normalizing the result of different geometry loaders. Uses the file's extension to an appropriate loader function.

[Drag and drop example](https://gkjohnson.github.io/threejs-model-loader/example/index.bundle.html)

## ModelLoader

```js
import PLYLoader from 'three/examples/loaders/PLYLoader';
import ModelLoader from 'threejs-model-loader';

var loader = new ModelLoader();

// register the function to load ply files
loader.loaderCallbacks[ 'ply' ] = function( url, manager, onLoad, onProgress, onError ) {

	new PLYLoader( manager ).load( url, onLoad, onProgress, onError );

} );

loader.load( '.../model.ply', res => {

    // res.model
    // res.originalResult
    // res.extension

} );
```

### Static Members
#### ModelLoader.ExtensionToThreeLoader

A map of file extensions to THREE Loader names that are provided with the THREE project. When using imports or require the loaders are not available so these loader functions must be registered manually.

```js
{

	'dae': 'ColladaLoader',
	'fbx': 'FBXLoader',
	'gcode': 'GCodeLoader',
	'gltf': 'GLTFLoader',

	// ...

}
```

### Members
#### loaderCallbacks

An object that maps file extension to loader function callback. Defaults to empty. Add functions to the map to register load callbacks.

```js
{
	ply:  function( url, manager, onLoad, onProgress, onError ) {

		new PLYLoader( manager ).load( url, onLoad, onProgress, onError );

	}
}
```

### Functions
#### constructor(manager)

Instantiate the `ModelLoader` with a `THREE.LoadingManager`.

#### load(path, onLoad, onProgress, onError, options)

A function signature that mirrors all the THREE.js geometry loaders. An appropriate loader is selected from the loaderCallbacks based on the file extension.

`onLoad` is passed an object with following values.
```js
{
    model,         // THREE.js Object3D, Group, or Mesh that was loaded
    extension,     // The extension of the model that was loaded
    originalResult // The original result that the loader returned
}
```

##### options
###### extension

An override to the detected file extension.

#### parse(data, extension, onLoad, onError, options)

Takes the `data` to parse into geometry and the associated file extension.

The model is returned asynchronously in `onLoad`.

See `load` for documentation on what the `onLoad` function is passed.

### Override-able Functions
#### getLoaderCallback(extension, done)

Function used to get the function used to load the geometry.

By default this looks the given extension up in the `loaderCallbacks` object.

#### canLoadModel(extension)

Returns whether or not the ModelLoader can load a file with the provided extension.

By default this checks if the given extension is in the `loaderCallbacks` object.

## model-viewer Element
```html
<!-- Register the Element -->
<script href=".../model-viewer-element.js" />
<script>customElements.define('model-viewer', ModelViewer)</script>

<body>
  <model-viewer src=".../path/to/model.ply" display-shadow ambient-color="red"></model-viewer>
</body>
```
### Attributes

#### src

The url of the model to display.

#### display-shadow

Whether or not the render the shadow under the robot.

#### ambient-color

The color of the ambient light specified with css colors.

#### show-grid

Show a grid underneath the model.

#### auto-redraw

Automatically redraw the model every frame instead of waiting to be dirtied.

### Functions

#### redraw()

Dirty the renderer so the element will redraw next frame.

### Events

#### 'model-change'

Fires when a model is going to load.

#### 'model-loaded'

Fires when all the geometry has been fully loaded.

#### 'error'

Fires when there's a problem loading the model.

## Running the Example

Install Node.js and NPM.

Run `npm install`.

Run `npm run server`.

Visit `localhost:9080/example/` to view the page.
