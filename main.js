"use strict";
require(['lib/three.min'], function() {
        
    var WIDTH = 10;
    var HEIGHT = 10;
    var TileColors = [0xff0000,0x00ff00,0x0000ff]; 
    function randomFromArray( array ) {
        return array[ Math.floor( Math.random()*array.length) ];
    }

    var meshes = [];
    for( var x = 0; x < WIDTH; x++ ) {
        for( var y = 0; y < HEIGHT; y++ ) {
            var geometry = new THREE.PlaneGeometry(1/WIDTH,1/HEIGHT);
            var material = new THREE.MeshBasicMaterial( { color: randomFromArray(TileColors), wireframe: false } );
            var mesh = new THREE.Mesh( geometry, material );
            mesh.position.x = 1/WIDTH*x - 0.5 + 1/WIDTH/2;
            mesh.position.y = 1/HEIGHT*y - 0.5 + 1/HEIGHT/2;
            mesh.position.z = 0.005;
            meshes.push(mesh);
        }
    }

    var camera = new THREE.PerspectiveCamera( 15, window.innerWidth / window.innerHeight, 1, 10000 );
    var cameraCenter = {x:0, y:-3, z:2};
    camera.position.z = cameraCenter.z;
    camera.position.y = cameraCenter.y;
    camera.up = new THREE.Vector3(0,1,0);
    camera.lookAt( new THREE.Vector3(0,0,0));

    var geometry = new THREE.PlaneGeometry( 1,1 );
    var material = new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: false } );
    var mesh = new THREE.Mesh( geometry, material );

    var scene = new THREE.Scene();
    scene.add( mesh );
    meshes.forEach( function(m) {
        scene.add( m );
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
