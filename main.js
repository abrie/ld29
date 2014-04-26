"use strict";
require(['lib/three.min'], function() {
    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 5 );
    camera.position.z = 2;

    var geometry = new THREE.CubeGeometry( 1,1,1 );
    var material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } );
    var mesh = new THREE.Mesh( geometry, material );

    var scene = new THREE.Scene();
    scene.add( mesh );

    var renderer = new THREE.CanvasRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );

    document.body.appendChild( renderer.domElement );

    function animate() {
        requestAnimationFrame( animate );

        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.02;

        renderer.render( scene, camera );

    }

    animate();
});
