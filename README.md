# threejs-model-loader
Model loader for loading any geometry model format

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
