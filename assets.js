"use strict";
define(['lib/three.min', 'lib/soundjs.min'], function() {
    var textures = {
        hole: new THREE.ImageUtils.loadTexture("assets/hole.png"),
        circlehole: new THREE.ImageUtils.loadTexture("assets/circlehole.png"),
        grass: new THREE.ImageUtils.loadTexture("assets/grass.png"),
        heli: new THREE.ImageUtils.loadTexture("assets/heli.png"),
        gopher: new THREE.ImageUtils.loadTexture("assets/gopher.png"),
        peekbelow: new THREE.ImageUtils.loadTexture("assets/peekbelow.png"),
        helipad: new THREE.ImageUtils.loadTexture("assets/helipad.png"),
        c1: new THREE.ImageUtils.loadTexture("assets/c1.png"),
        c2: new THREE.ImageUtils.loadTexture("assets/c2.png"),
        right: new THREE.ImageUtils.loadTexture("assets/right.png"),
        wrong: new THREE.ImageUtils.loadTexture("assets/wrong.png"),
    }

    createjs.Sound.initializeDefaultPlugins();
    var audioPath = "assets/";
    var manifest = [
        {id:"loop1", src:"loop1.mp3"},
        {id:"loop2", src:"loop2.mp3"},
        {id:"loop3", src:"loop3.mp3"},
        {id:"right", src:"right.mp3"},
        {id:"wrong", src:"wrong.mp3"},
        {id:"dry1", src:"dry1.mp3"},
        {id:"dry2", src:"dry2.mp3"},
        {id:"dry3", src:"dry3.mp3"},
    ]

    var vacuumDrySounds = ["dry1","dry2","dry3"];
    var vacuumSounds = ["loop1","loop2","loop3"];
    var soundLoadCount = 0;
    function handleSoundLoad(event) {
        soundLoadCount++;
        if( soundLoadCount == manifest.length ) {
            musicLoaded();
        }
    }

    createjs.Sound.addEventListener("fileload", handleSoundLoad);
    createjs.Sound.registerManifest(manifest, audioPath);

    var onAllLoaded = undefined;
    function musicLoaded() {
        console.log("all sounds loaded.")
        onAllLoaded();
    }

    function setOnAllLoaded( func ) {
        onAllLoaded = func;
    }

    return {
        textures:textures,
        vacuumDrySounds:vacuumDrySounds,
        vacuumSounds:vacuumSounds,
        setOnAllLoaded:setOnAllLoaded
    }
});
