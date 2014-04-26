"use strict";
require(['util','lib/three.min'], function(util) {
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

        var result = {
            width:width,
            height:height,
            localToModel:localToModel,
            targetMeshes:[],
            tiles: [],
        }


        function populate() {
            for( var x = 0; x < width; x++ ) {
                for( var y = 0; y < height; y++ ) {
                    var tile = new Generator(x, y, width, height)
                    tile.mesh.position = localToModel(x, y, 0.005);
                    result.tiles.push(tile);
                }
            }
        }

        populate();

        return result;
    }


    var Tile = function(x, y, mapWidth, mapHeight) {
        var geometry = new THREE.PlaneGeometry(1/mapWidth,1/mapHeight);
        var material = new THREE.MeshBasicMaterial( { map: textures.grass, wireframe: false } );
        var mesh = new THREE.Mesh( geometry, material );

        return {
            x:x,
            y:y,
            mesh:mesh,
            linkedTo:undefined,
        }
    }

    var map = new Map(5,5,Tile);

    function findUnlinkedTile() {
        while(true) {
            var tile = util.randomFromArray(map.tiles);
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

        map.targetMeshes.push(tileA.mesh);
        map.targetMeshes.push(tileB.mesh);

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

    var gopher_mesh = new GopherMesh(); 
    gopher_mesh.position = map.localToModel(gopherMound.x,gopherMound.y,0.0);
    scene.add( gopher_mesh );

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
