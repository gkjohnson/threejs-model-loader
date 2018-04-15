# threejs-model-loader

THREE.js Model Loader for delegating to the appropriate geometry loader and caches the loaded geometry for fast subsequent loads. Uses the file's extension to determine which THREE geometry loader to use.

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
```

### Functions
##### ModelLoader.load(path, onLoad, onProgress, onError, extOverride)

A function signature that mirrors all the THREE.js geometry loaders. An appriopriate loader is selected based on the file name.

If `extOverride` is set, then that extension is used to select the loader.

##### ModelLoader.parse(data, ext, onLoad, onError)

Takes the `data` to parse into geometry and the associated file extension in `ext`.

The model is returned asynchronously in `onLoad` to support async fetching of the loaders.

##### ModelLoader.Clear()

Clears the cached models.

### Virtual Methods
##### ModelLoader.getLoader(loaderName, manager, loadercb)

Function used to return an instance of a particular loader. Once the loader has been created, pass it into `loadercb`. See above code snippet for an example.

### Members
##### ModeLoader.loaderMap

List of `extension` to `loaderName`, used to select the loader for each extension. The list can be modified by adding and removing keys from the list. Every loader is expected to be found on the `THREE` object.

```js
loader.loadMap[ 'obj' ] = 'OBJLoader';
delete loader.loadMap[ 'stl' ];
```

##### ModelLoader.modelCache

The list of cached models indexd by the url used to load model. Individual cached models can be cleared by deleting the key.
