# threejs-model-loader

THREE.js Model Loader for delegating to the appropriate geometry loader. Uses the file's extension to determine which THREE geometry loader to use.

[Drag and drop example](https://gkjohnson.github.io/threejs-model-loader/example/index.bundle.html)

## Use

```js
var loader = new THREE.ModelLoader();

// overriding the getLoader function so loaders can be
// loaded as-needed
loader.getLoader = function( loaderName, manager, loadercb ) {

    function createLoader() {
    
        return new THREE[ loaderName ]( manager );
        
    }

    if ( THREE[ loaderName ] == null ) {

        // fetch the loader script from the server and run it
        // if it's not already on the page
        fetch(`.../node_modules/three/examples/js/loaders/${ loaderName }.js`)
            .then(res => res.text())
            .then(tex => {

                eval( text );
                loadercb( createLoader() );
            
            });
            
    } else {

        loadercb( createLoader() );

    }

}

loader.load( '.../model.ply', res => {

    // res.model
    // res.originalResult
    // res.extension
    
} );
```

### Functions
##### ModelLoader.load(path, onLoad, onProgress, onError, extOverride)

A function signature that mirrors all the THREE.js geometry loaders. An appriopriate loader is selected based on the file name.

If `extOverride` is set, then that extension is used to select the loader.

`onLoad` is passed an object with values 
```js
{
    model,         // THREE.js Object3D, Group, or Mesh that was loaded
    extension,     // The extension of the model that was loaded
    originalResult // The original result that the loader returned
}
```

##### ModelLoader.parse(data, ext, onLoad, onError)

Takes the `data` to parse into geometry and the associated file extension in `ext`.

The model is returned asynchronously in `onLoad` to support async fetching of the loaders.

See `load` for documentation on what the `onLoad` function is passed.

### Override-able Methods
##### ModelLoader.getLoader(loaderName, manager, loadercb)

Function used to return an instance of a particular loader. Once the loader has been created, pass it into `loadercb`. See above code snippet for an example.

### Members
##### ModeLoader.loaderMap

List of `extension` to `loaderName`, used to select the loader for each extension. The list can be modified by adding and removing keys from the list. Every loader is expected to be found on the `THREE` object.

```js
loader.loadMap[ 'obj' ] = 'OBJLoader';
delete loader.loadMap[ 'stl' ];
```
