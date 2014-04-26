"use strict";
require(['lib/three.min'], function() {
    var textures = {
        hole: new THREE.ImageUtils.loadTexture("assets/hole.png"),
        grass: new THREE.ImageUtils.loadTexture("assets/grass.png"),
        heli: new THREE.ImageUtils.loadTexture("assets/heli.png"),
    }

    //var jsonLoader = new THREE.JSONLoader();
    //jsonLoader.load('models/schuh.js', addModelToScene);
        
    var scene = new THREE.Scene();

    var WIDTH = 5;
    var HEIGHT = 5;
    var TileColors = [0xff0000,0x00ff00,0x0000ff]; 

    function randomFromArray( array ) {
        return array[ Math.floor( Math.random()*array.length) ];
    }

    function localToModel(x,y,z) {
        return new THREE.Vector3(
            -0.5+1/WIDTH*x+1/WIDTH/2,
            -0.5+1/HEIGHT*y+1/WIDTH/2,
            z
        ); 
    }

    var Tile = function(x,y,z) {
        var geometry = new THREE.PlaneGeometry(1/WIDTH,1/HEIGHT);
        var material = new THREE.MeshBasicMaterial( { map: textures.grass, wireframe: false } );
        var mesh = new THREE.Mesh( geometry, material );
        mesh.position = localToModel(x, y, 0.005);

        return {
            x:x,
            y:y,
            mesh:mesh,
            linkedTo:undefined,
        }
    }

    var tiles = [];
    for( var x = 0; x < WIDTH; x++ ) {
        for( var y = 0; y < HEIGHT; y++ ) {
            var tile = new Tile(x,y,0.005)
            tiles.push(tile);
        }
    }

    function findUnlinkedTile() {
        while(true) {
            var tile = randomFromArray(tiles);
            if( tile.linkedTo )
                continue;
            else
                return tile;
        }
    }

    function linkTwoTiles() {
        var tileA = findUnlinkedTile();
        var tileB = findUnlinkedTile();
        tileA.linkedTo = tileB;
        tileB.linkedTo = tileA;
        tileA.mesh.material.map = textures.hole;
        tileB.mesh.material.map = textures.hole;
    }

    linkTwoTiles();

    var heli_geometry = new THREE.PlaneGeometry(1/WIDTH,1/HEIGHT);
    var heli_material = new THREE.MeshBasicMaterial( { map: textures.heli, transparent:true, wireframe: false } );
    var heli_mesh = new THREE.Mesh( heli_geometry, heli_material );
    heli_mesh.rotation.x = Math.PI/2;
    heli_mesh.position = localToModel(0,0,0.1);
    scene.add( heli_mesh );

    var camera = new THREE.PerspectiveCamera( 15, window.innerWidth / window.innerHeight, 1, 10000 );
    var cameraCenter = {x:0, y:-3, z:2};
    camera.position.z = cameraCenter.z;
    camera.position.y = cameraCenter.y;
    camera.up = new THREE.Vector3(0,1,0);
    camera.lookAt( new THREE.Vector3(0,0,0));

    var geometry = new THREE.PlaneGeometry( 1,1 );
    var material = new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: false } );
    var mesh = new THREE.Mesh( geometry, material );

    scene.add( mesh );

    tiles.forEach( function( tile ) {
        scene.add( tile.mesh );
    })

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );

    document.body.appendChild( renderer.domElement );

    var theta = 0;
    function animate() {
        requestAnimationFrame( animate );

        theta+= 0.005;
        camera.position.z = Math.cos(theta)*0.005 + cameraCenter.z;
        camera.position.y = Math.cos(theta)*0.005 + cameraCenter.y;
        camera.position.x = Math.cos(theta)*0.005 + cameraCenter.x;

        renderer.render( scene, camera );

    }

    animate();
});
