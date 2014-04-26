"use strict";
require(['lib/three.min'], function() {
    var camera = new THREE.PerspectiveCamera( 20, window.innerWidth / window.innerHeight, 1, 5 );
    camera.position.z = 2;
    camera.position.y = -3;
    camera.up = new THREE.Vector3(0,1,0);
    camera.lookAt( new THREE.Vector3(0,0,0));

    var geometry = new THREE.PlaneGeometry( 1,1 );
    var material = new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: false } );
    var mesh = new THREE.Mesh( geometry, material );

    var scene = new THREE.Scene();
    scene.add( mesh );

    var renderer = new THREE.CanvasRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );

    document.body.appendChild( renderer.domElement );

    function animate() {
        requestAnimationFrame( animate );

        mesh.rotation.z += 0.005;

        renderer.render( scene, camera );

    }

    animate();
});
