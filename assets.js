"use strict";
define(['lib/three.min', 'lib/soundjs.min'], function() {
    var hud = document.getElementById("hud");
    hud.innerHTML = "loading assets";
    var textures = {};
    var textureManifest = [
        {id:'hole', src:"assets/hole.png"},
        {id:'circlehole', src:"assets/circlehole.png"},
        {id:'grass1', src: "assets/grass1.png"},
        {id:'grass2', src: "assets/grass2.png"},
        {id:'grass3', src: "assets/grass3.png"},
        {id:'heli', src: "assets/heli.png"},
        {id:'gopher', src: "assets/gopher.png"},
        {id:'peekbelow1', src: "assets/peekbelow.png"},
        {id:'peekbelow2', src: "assets/peekbelow2.png"},
        {id:'peekbelow3', src: "assets/peekbelow3.png"},
        {id:'peekbelow4', src: "assets/peekbelow4.png"},
        {id:'helipad', src: "assets/helipad.png"},
        {id:'c1', src: "assets/c1.png"},
        {id:'c2', src: "assets/c2.png"},
        {id:'right', src: "assets/right.png"},
        {id:'wrong', src: "assets/wrong.png"},
    ];

    var grassTextures = ["grass1","grass2","grass3"];

    function updateHud() {
        hud.innerHTML += "."; 
    }

    var textureLoadCount = 0;
    function onTextureLoaded() {
        updateHud();
        textureLoadCount++;
        if( textureLoadCount == textureManifest.length ) {
            texturesLoaded();
        }
    }

    var texturesReady = false;
    function texturesLoaded() {
        texturesReady = true;
        notify();
    }

    textureManifest.forEach( function(entry) {
        textures[entry.id] = THREE.ImageUtils.loadTexture(entry.src, THREE.UVMapping, onTextureLoaded);
    })

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
        {id:"peek", src:"peek.mp3"},
        {id:"nomorepeeks", src:"nomorepeeks.mp3"}
    ]

    var vacuumDrySounds = ["dry1","dry2","dry3"];
    var vacuumSounds = ["loop1","loop2","loop3"];
    var soundLoadCount = 0;
    function handleSoundLoad(event) {
        updateHud();
        soundLoadCount++;
        if( soundLoadCount == manifest.length ) {
            musicLoaded();
        }
    }

    createjs.Sound.addEventListener("fileload", handleSoundLoad);
    createjs.Sound.registerManifest(manifest, audioPath);

    var onAllLoaded = undefined;
    var musicReady = false;
    function musicLoaded() {
        musicReady = true;
        notify();
    }

    function setOnAllLoaded( func ) {
        onAllLoaded = func;
        notify();
    }

    function notify() {
        if( musicReady && texturesReady ) {
            onAllLoaded();
            hud.innerHTML = "";
        }
    }

    console.log("waiting");
    return {
        textures:textures,
        grassTextures:grassTextures,
        vacuumDrySounds:vacuumDrySounds,
        vacuumSounds:vacuumSounds,
        setOnAllLoaded:setOnAllLoaded
    }
});
