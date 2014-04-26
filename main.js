"use strict";
require(['util','lib/three.min', 'lib/tween.min'], function(util) {
    var textures = {
        hole: new THREE.ImageUtils.loadTexture("assets/hole.png"),
        grass: new THREE.ImageUtils.loadTexture("assets/grass.png"),
        heli: new THREE.ImageUtils.loadTexture("assets/heli.png"),
        gopher: new THREE.ImageUtils.loadTexture("assets/gopher.png")
    }

    var scene = new THREE.Scene();

    var Map = function( width, height, Generator) {

        function localToModel(x,y,z) {
            return new THREE.Vector3(
                -0.5+1/width*x+1/width/2,
                -0.5+1/height*y+1/height/2,
                z
            ); 
        }

        var tiles = [];
        var targetMeshes = [];
        var tilesWithGopherMounds = [];

        function populate() {
            for( var x = 0; x < width; x++ ) {
                for( var y = 0; y < height; y++ ) {
                    var tile = new Generator(x, y, width, height)
                    tile.mesh.position = localToModel(x, y, 0.005);
                    tiles.push(tile);
                    targetMeshes.push(tile.mesh);
                }
            }
        }

        function findTileByMesh(mesh) {
            var result = tiles.filter( function(tile) { 
                return tile.mesh === mesh;
            });

            if( result === 0) {
                console.log("warning: no tile associated with this mesh.");
                return undefined;
            }
            else if( result.length > 1) {
                console.log("warning: multiple tiles contain this mesh.");
                return undefined;
            }
            else {
                return result[0];
            }
        }

        function getUnlinkedTiles() {
            return tiles.filter( function(tile){
                return tile.linkedTo === undefined;
            });
        }

        function linkTwoTiles() {
            var unlinkedTiles = getUnlinkedTiles();
            util.shuffleArray( unlinkedTiles );
            var tileA = unlinkedTiles.pop(); 
            var tileB = unlinkedTiles.pop();

            tileA.linkedTo = tileB;
            tileB.linkedTo = tileA;

            tileA.mesh.material.map = textures.hole;
            tileB.mesh.material.map = textures.hole;

        }

        function getUnoccupiedGopherMounds() {
            return tiles.filter( function(tile) {
                return (tile.linkedTo !== undefined && tile.hasGopher !== true &&
                   tile.linkedTo.hasGopher !== true );
            })
        }

        function addGopher() {
            var available = getUnoccupiedGopherMounds();
            if( available.length > 0) {
                util.randomFromArray(available).hasGopher = true;
            }
        }

        function getTilesWithGopher() {
            return tiles.filter( function(tile) {
                return tile.hasGopher;
            });
        }

        function getTile(x,y) {
            return tiles[y*width+x];
        }

        populate();

        return {
            width:width,
            height:height,
            localToModel:localToModel,
            targetMeshes:targetMeshes,
            tilesWithGopherMounds: tilesWithGopherMounds,
            linkTwoTiles: linkTwoTiles,
            addGopher: addGopher,
            getTilesWithGopher: getTilesWithGopher,
            findTileByMesh: findTileByMesh,
            getTile: getTile,
            tiles: tiles,
        }
    }

    var TileMesh = function(mapWidth, mapHeight) {
        var geometry = new THREE.PlaneGeometry(1/mapWidth,1/mapHeight);
        var material = new THREE.MeshBasicMaterial( { map: textures.grass, wireframe: false } );
        var mesh = new THREE.Mesh( geometry, material );
        return mesh;
    }

    var Tile = function(x, y, mapWidth, mapHeight) {
        return {
            x:x,
            y:y,
            mesh: new TileMesh(mapWidth, mapHeight),
            linkedTo:undefined,
        }
    }

    var map = new Map(5, 5, Tile);
    map.linkTwoTiles();
    map.linkTwoTiles();
    map.linkTwoTiles();
    map.addGopher();
    map.addGopher();

    function RotorMesh() {
        var geometry = new THREE.PlaneGeometry(1/map.width,1/map.height/15);
        var material = new THREE.MeshBasicMaterial( {color:0xFF00FF, wireframe: false} ); 
        var mesh = new THREE.Mesh( geometry, material );
        return mesh;
    }

    var rotor_mesh = new RotorMesh();
    rotor_mesh.position = map.localToModel(0,0,0.2);
    scene.add( rotor_mesh );

    function GopherMesh() {
        var geometry = new THREE.PlaneGeometry(1/map.width,1/map.height);
        var material = new THREE.MeshBasicMaterial( { map: textures.gopher, transparent:true, wireframe: false } );
        var mesh = new THREE.Mesh( geometry, material );
        mesh.rotation.x = Math.PI/2;
        return mesh;
    }

    map.getTilesWithGopher().forEach( function(tile) {
        var gopher_mesh = new GopherMesh(); 
        gopher_mesh.position = map.localToModel(tile.x, tile.y, 0.0);
        scene.add( gopher_mesh );
    })

    function HeliMesh() {
        var geometry = new THREE.PlaneGeometry(1/map.width,1/map.height);
        var material = new THREE.MeshBasicMaterial( { map: textures.heli, transparent:true, wireframe: false } );
        var mesh = new THREE.Mesh( geometry, material );
        mesh.rotation.x = Math.PI/2;
        return mesh;
    }

    var heli_mesh = new HeliMesh();
    heli_mesh.position = map.localToModel(0,0,0.1);
    scene.add( heli_mesh );

    var camera = new THREE.PerspectiveCamera( 15, window.innerWidth / window.innerHeight, 1, 10000 );
    var cameraCenter = {x:0, y:-3, z:2};
    camera.position.z = cameraCenter.z;
    camera.position.y = cameraCenter.y;
    camera.up = new THREE.Vector3(0,1,0);
    camera.lookAt( new THREE.Vector3(0,0,0));

    map.tiles.forEach( function( tile ) {
        scene.add( tile.mesh );
    })

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );

    document.body.appendChild( renderer.domElement );


    var mouse = {x:0,y:0};
    function onDocumentMouseDown(e) {
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

        var vector = new THREE.Vector3( mouse.x, mouse.y, 1);
        projector.unprojectVector(vector, camera);

        var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

        var intersects = ray.intersectObjects( map.targetMeshes )
        if( intersects.length > 0 ) {
            intersects.forEach( function( intersected ) {
                var tile = map.findTileByMesh( intersected.object );
                moveHeli( tile );
            })
        }
    }

    function moveHeli( tile ) {
        var currentPosition = {
            x: heli_mesh.position.x,
            y: heli_mesh.position.y,
        }

        var modelCoordinates = map.localToModel(tile.x, tile.y, 0.05);
        var targetPosition = {
            x: modelCoordinates.x,
            y: modelCoordinates.y,
        }

        var tween = new TWEEN.Tween( currentPosition )
            .to( targetPosition, 500 )
            .easing( TWEEN.Easing.Circular.InOut )
            .onUpdate( function() {
                heli_mesh.position.x = currentPosition.x;
                heli_mesh.position.y = currentPosition.y;
                heli_mesh.position.z = 0.05;

                rotor_mesh.position.x = currentPosition.x;
                rotor_mesh.position.y = currentPosition.y;
                rotor_mesh.position.z = 0.15;
            })
            .start();
    }

    var projector = new THREE.Projector();
    document.addEventListener('mousedown', onDocumentMouseDown, false);

    moveHeli( map.getTile(0,0) );

    var theta = 0;
    function animate() {
        requestAnimationFrame( animate );

        theta+= 0.05;
        camera.position.z = Math.cos(theta)*0.005 + cameraCenter.z;
        camera.position.y = Math.sin(theta)*0.005 + cameraCenter.y;
        camera.position.x = Math.cos(theta)*0.005 + cameraCenter.x;

        rotor_mesh.rotation.z += 1;

        renderer.render( scene, camera );
        TWEEN.update();
    }

    animate();
});
