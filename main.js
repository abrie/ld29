"use strict";
require(['util','lib/three.min'], function(util) {
    var textures = {
        hole: new THREE.ImageUtils.loadTexture("assets/hole.png"),
        grass: new THREE.ImageUtils.loadTexture("assets/grass.png"),
        heli: new THREE.ImageUtils.loadTexture("assets/heli.png"),
        gopher: new THREE.ImageUtils.loadTexture("assets/gopher.png")
    }

    var targetMeshes = [];

    var scene = new THREE.Scene();

    var MAP_WIDTH = 5;
    var MAP_HEIGHT = 5;
    var TileColors = [0xff0000,0x00ff00,0x0000ff]; 

    function localToModel(x,y,z) {
        return new THREE.Vector3(
            -0.5+1/MAP_WIDTH*x+1/MAP_WIDTH/2,
            -0.5+1/MAP_HEIGHT*y+1/MAP_WIDTH/2,
            z
        ); 
    }

    var Tile = function(x,y,z) {
        var geometry = new THREE.PlaneGeometry(1/MAP_WIDTH,1/MAP_HEIGHT);
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
    for( var x = 0; x < MAP_WIDTH; x++ ) {
        for( var y = 0; y < MAP_HEIGHT; y++ ) {
            var tile = new Tile(x,y,0.005)
            tiles.push(tile);
        }
    }

    function findUnlinkedTile() {
        while(true) {
            var tile = util.randomFromArray(tiles);
            if( tile.linkedTo )
                continue;
            else
                return tile;
        }
    }

    var gopherMounds = [];
    function linkTwoTiles() {
        var tileA = findUnlinkedTile();
        var tileB = findUnlinkedTile();
        tileA.linkedTo = tileB;
        tileB.linkedTo = tileA;
        tileA.mesh.material.map = textures.hole;
        tileB.mesh.material.map = textures.hole;

        targetMeshes.push(tileA.mesh);
        targetMeshes.push(tileB.mesh);

        gopherMounds.push(tileA);
        gopherMounds.push(tileB);
    }

    function getUnoccupiedGopherMound() {
        while(true) {
            var tile = util.randomFromArray(gopherMounds);
            if( tile.hasGopher )
                continue;
            else
                return tile;
        }
    }

    linkTwoTiles();
    var gopherMound = getUnoccupiedGopherMound();
    gopherMound.hasGopher = true;

    var rotor_geometry = new THREE.PlaneGeometry(1/MAP_WIDTH,1/MAP_HEIGHT/15);
    var rotor_material = new THREE.MeshBasicMaterial( {color:0xFF00FF, wireframe: false} ); 
    var rotor_mesh = new THREE.Mesh( rotor_geometry, rotor_material );
    rotor_mesh.position = localToModel(0,0,0.2);
    scene.add( rotor_mesh );

    var gopher_geometry = new THREE.PlaneGeometry(1/MAP_WIDTH,1/MAP_HEIGHT);
    var gopher_material = new THREE.MeshBasicMaterial( { map: textures.gopher, transparent:true, wireframe: false } );
    var gopher_mesh = new THREE.Mesh( gopher_geometry, gopher_material );
    gopher_mesh.rotation.x = Math.PI/2;
    gopher_mesh.position = localToModel(gopherMound.x,gopherMound.y,0.0);
    scene.add( gopher_mesh );

    var heli_geometry = new THREE.PlaneGeometry(1/MAP_WIDTH,1/MAP_HEIGHT);
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

    tiles.forEach( function( tile ) {
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

        var intersects = ray.intersectObjects( targetMeshes )
        if( intersects.length > 0 ) {
            console.log("intersection detected");
        }
    }

    var projector = new THREE.Projector();
    document.addEventListener('mousedown', onDocumentMouseDown, false);

    var theta = 0;
    function animate() {
        requestAnimationFrame( animate );

        theta+= 0.05;
        camera.position.z = Math.cos(theta)*0.005 + cameraCenter.z;
        camera.position.y = Math.sin(theta)*0.005 + cameraCenter.y;
        camera.position.x = Math.cos(theta)*0.005 + cameraCenter.x;

        rotor_mesh.rotation.z += 1;

        renderer.render( scene, camera );
    }

    animate();
});
