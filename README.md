# threejs-model-loader

THREE.js Model Loader for loading any geometry format. Uses the file's extension to determine which THREE geometry loader to use.

## Use

```js
var loader = new THREE.ModelLoader();

// overriding the getLoader function so loaders can be
// loaded as-needed
loader.getLoader = function( loaderName, manager, loadercb ) {

    function createLoader() {
    
        return new THREE[loaderName]( manager );
        
    }

    if ( THREE[ loaderName ] == null ) {

        // fetch the loader script from the server and run it
        // if it's not already on the page
        fetch(`.../node_modules/three/examples/js/loaders/${ loaderName }.js`)
            .then(res => res.text())
            .then(tex => {

                eval(text);
                loadercb( createLoader() );
            
            });
            
    } else {

        loadercb( createLoader() );

    }

}
```

#### ModelLoader.load(path, onLoad, onProgress, onError, extOverride)

A function signature that mirrors all the THREE.js geometry loaders. An appriopriate loader is selected based on the file name.

If `extOverride` is set, then that extension is used to select the loader.

#### ModelLoader.parse(data, ext, onLoad, onError)

Takes the `data` to parse into geometry and the associated file extension in `ext`.

The model is returned asynchronously in `onLoad` to support async fetching of the loaders.
