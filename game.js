"use strict";
define(['util','lib/three.min', 'lib/tween.min', 'lib/soundjs.min'], function(util) {
    function Instance(asset) {

    function getGrassTexture() {
        return asset.textures[ util.randomFromArray(asset.grassTextures) ];
    }

    function playRandomSound() {
        createjs.Sound.play( util.randomFromArray(asset.vacuumSounds) );
    }

    function playEmptySound() {
        createjs.Sound.play( util.randomFromArray(asset.vacuumDrySounds) );
    }

    var gopherTypeCount = 3;
    function getTextureForGopherType(id) {
        switch(id) {
            case 0: return asset.textures.c1; break;
            case 1: return asset.textures.c2; break;
            case 2: return asset.textures.gopher; break;
            default: console.log("unknown gopher type"); return undefined; break;
        }
    }

    var scene = new THREE.Scene();
    var container = new THREE.Object3D();

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

        function hideHighlights() {
            tiles.forEach( function(tile) { 
                tile.highlight(false);
            });
        }

        function populate() {
            for( var x = 0; x < width; x++ ) {
                for( var y = 0; y < height; y++ ) {
                    var tile = new Generator(x, y, width, height)
                    tile.mesh.position = localToModel(x, y, 0.005);
                    tile.highlightMesh.position = localToModel(x, y, 0.015);
                    tiles.push(tile);
                    targetMeshes.push(tile.mesh);
                }
            }
        }

        var illustrations = [];
        function illustrateConnection(meshA, meshB) {
            var numPoints = 100;
            var m = illustrations.length+1;
            var spline = new THREE.SplineCurve3([
                meshA.position.clone().add( new THREE.Vector3(0,0,-0.02) ),
                meshA.position.clone().add( new THREE.Vector3(0,0,-0.02-0.05*m) ),
                meshB.position.clone().add( new THREE.Vector3(0,0,-0.02-0.05*m) ),
                meshB.position.clone().add( new THREE.Vector3(0,0,-0.02) ),
            ]);

            var material = new THREE.MeshLambertMaterial( { color:0xFFFFFF } );
            var geometry = new THREE.TubeGeometry( spline, 50, 0.025, 12, false );
            var mesh = new THREE.Mesh( geometry, material );

            illustrations.push(mesh);
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
                return tile.linkedTo === undefined && tile !== helipadTile;
            });
        }

        function linkTwoTiles() {
            var unlinkedTiles = getUnlinkedTiles();
            util.shuffleArray( unlinkedTiles );
            var tileA = unlinkedTiles.pop(); 
            var tileB = unlinkedTiles.pop();

            tileA.linkedTo = tileB;
            tileB.linkedTo = tileA;

            tileA.mesh.material.map = asset.textures.hole;
            tileA.mesh.material.bmap = asset.textures.hole;
            tileB.mesh.material.bmap = asset.textures.hole;
            tileB.mesh.material.map = asset.textures.hole;

            illustrateConnection(tileA.mesh, tileB.mesh);
        }

        var helipadTile = undefined;
        function setHelipad(x,y) {
            var tile = tiles[y*width+x];
            helipadTile = tile;
            tile.mesh.material.map = asset.textures.helipad;
        }

        function makeLinks( linkCount, gopherCount ) {
            for(var i = 0; i < linkCount; i++) {
                linkTwoTiles();
            }
            for(var i = 0; i < gopherCount ; i++) {
                addGopher( i % gopherTypeCount );
            }
        }

        function getHelipad() {
            return helipadTile;
        }

        function getUnoccupiedGopherMounds() {
            return tiles.filter( function(tile) {
                return (tile.linkedTo !== undefined && tile.hasGopher !== true &&
                   tile.linkedTo.hasGopher !== true );
            })
        }

        function addGopher(type) {
            var available = getUnoccupiedGopherMounds();
            if( available.length > 0) {
                var tile = util.randomFromArray(available);
                tile.hasGopher = true;
                tile.gopherType = type;
                tile.linkedTo.mesh.material.map = asset.textures.circlehole;
                expectedGopherSequence.push(type);
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
            getTilesWithGopher: getTilesWithGopher,
            findTileByMesh: findTileByMesh,
            getTile: getTile,
            setHelipad: setHelipad,
            getHelipad: getHelipad,
            tiles: tiles,
            illustrations: illustrations,
            makeLinks: makeLinks,
            hideHighlights: hideHighlights,
        }
    }

    var ButtonMesh = function(map) {
        var geometry = new THREE.PlaneGeometry(0.25, 0.125);
        var material = new THREE.MeshBasicMaterial( { map:map, transparent:true } );
        var mesh = new THREE.Mesh( geometry, material );
        mesh.rotation.x = Math.PI/2;
        return mesh;
    }

    var buttons = [];
    var peekCount = 0;
    var peekButtonTextures = ["peekbelow1","peekbelow2","peekbelow3","peekbelow4"];
    var peekButton = new ButtonMesh( asset.textures[peekButtonTextures[peekCount]]);
    peekButton.position.x = -0.5;
    peekButton.position.y = -0.7;
    buttons.push(peekButton);
    scene.add( peekButton )


    function resetPeeks() {
        peekCount = 0;
        peekButton.material.map = asset.textures[peekButtonTextures[peekCount]];
    }

    var TileMesh = function(mapWidth, mapHeight) {
        var geometry = new THREE.BoxGeometry(1/mapWidth,1/mapHeight,0.01);
        var material = new THREE.MeshLambertMaterial( { map: getGrassTexture(), transparent:true, side: THREE.DoubleSide } );
        var mesh = new THREE.Mesh( geometry, material );
        mesh.receiveShadow = true;
        return mesh;
    }

    var TileHighlightMesh = function(mapWidth, mapHeight) {
        var geometry = new THREE.PlaneGeometry(1/mapWidth/1.01,1/mapHeight/1.01);
        var material = new THREE.MeshLambertMaterial( { color:0xFFFF11, opacity:0.30, transparent:true });
        var mesh = new THREE.Mesh( geometry, material );
        mesh.receiveShadow = true;
        return mesh;
    }

    var Tile = function(x, y, mapWidth, mapHeight) {
        var highlightMesh = new TileHighlightMesh(mapWidth, mapHeight);

        function highlight(state) { 
            highlightMesh.visible = state;
        }

        return {
            x:x,
            y:y,
            mesh: new TileMesh(mapWidth, mapHeight),
            highlightMesh: highlightMesh,
            highlight: highlight,
            linkedTo:undefined,
        }
    }


    var gopherScale = 2;
    function GopherMesh(theMap) {
        var geometry = new THREE.PlaneGeometry(1/theMap.width/gopherScale,1/theMap.height/gopherScale);
        var material = new THREE.MeshBasicMaterial( { map: asset.textures.gopher, transparent:true, side: THREE.DoubleSide } );
        var mesh = new THREE.Mesh( geometry, material );
        mesh.rotation.x = Math.PI/2;
        mesh.receiveShadow = true;
        return mesh;
    }

    var Gopher = function(theMap, tile) {
        var mesh = new GopherMesh(theMap); 
        mesh.material.map = getTextureForGopherType(tile.gopherType); 
        mesh.position = theMap.localToModel(tile.x, tile.y, 1/theMap.height/gopherScale/2);

        var rotationRate = 0;
        function incRotationRate(delta) {
            rotationRate += delta;
        }

        function resetRotation() {
            rotationRate = 0;
            mesh.rotation.y = 0;
        }

        function update() {
            mesh.rotation.y += rotationRate;
        }

        return {
            tile: tile,
            mesh: mesh,
            update: update,
            incRotationRate: incRotationRate,
            resetRotation: resetRotation,
        }
    }

    var gophers = [];
    function populateContainerWithGophers(theMap, theContainer) {
        gophers.length = 0;
        theMap.getTilesWithGopher().forEach( function(tile) {
            var gopher = new Gopher( theMap, tile );
            gophers.push( gopher );
            theContainer.add( gopher.mesh );
        });
    }

    function onVacuumActivated( theMap ) {
        if( heli.tile.linkedTo ) {
            if( heli.tile.hasGopher ) {
                action_die();
            }
            else if( heli.tile.linkedTo.hasGopher ) {
                action_removeGopher( theMap, heli.tile.linkedTo );
            }
            else {
                action_nothing();
            }
        }
    }

    function action_die() {
        console.log("die");
    }

    var gopherRemovalInProgress = false;
    function action_removeGopher(theMap, tile) {
        var contained = gophers.filter( function(g) {
            return g.tile === tile;
        });

        var gopher = contained[0];

            var currentState = {
                z: gopher.mesh.position.z, 
                scale: 1.0
            }

            var targetState = {
                z: -0.05,
                scale: 0.05,
            }

            var tween = new TWEEN.Tween( currentState )
                .to( targetState, 2000 )
                .easing( TWEEN.Easing.Circular.In )
                .onUpdate( function() {
                    gopher.mesh.position.z = currentState.z;
                    gopher.mesh.scale.x = currentState.scale;
                    gopher.mesh.scale.y = currentState.scale;
                    gopher.incRotationRate(0.01);
                })
                .onStart( function() {
                    gopherRemovalInProgress = true;
                })
                .onComplete( function() {
                    container.remove( gopher.mesh )
                    gophers = gophers.filter( function(g) { return g !== gopher; });
                    onGopherGone(theMap, tile.gopherType);
                    tile.hasGopher = false;
                    tile.gopherType = undefined;
                    tile.mesh.material.map = asset.textures.circlehole;
                    gopherRemovalInProgress = false;
                    heli.takeoff();
                });

            tween.start();
    }

    function action_nothing() {
    }

    var trophyContainer = new THREE.Object3D();
    var trophyMeshes = [];
    var trophyExpectedMeshes = [];
    var trophyPosition = new THREE.Vector3(0.55,-0.6,0.10);
    function initializeTrophyContainer() {
        trophyContainer.position = trophyPosition.clone();
        trophyContainer.scale.x = 0.75;
        trophyContainer.scale.y = 0.75;
        trophyContainer.scale.z = 0.75;
        scene.add( trophyContainer );
    }

    function vanishTrophyContainer() {
        var tween = new TWEEN.Tween({a:trophyPosition.z})
            .to({a:-3},1000)
            .easing(TWEEN.Easing.Linear.None)
            .onUpdate( function() {
                trophyContainer.position.z = this.a;
            });
            tween.start();
    }

    function showTrophyContainer() {
        var tween = new TWEEN.Tween({a:1})
            .to({a:trophyPosition.z},1000)
            .easing(TWEEN.Easing.Elastic.Out)
            .onUpdate( function() {
                trophyContainer.position.z = this.a;
            });
            tween.start();
    }

    var expectedGopherSequence = [];
    var actualGopherSequence = [];
    function clearTrophies() {
        expectedGopherSequence.length = 0;
        actualGopherSequence.length = 0;

        trophyMeshes.forEach( function(mesh) {
            trophyContainer.remove(mesh);
        })

        trophyExpectedMeshes.forEach( function(mesh) {
            trophyContainer.remove(mesh);
        })

        trophyMeshes.length = 0;
        trophyExpectedMeshes.length = 0;
    }

    function MedalMesh(theMap, isCorrect) {
        var geometry = new THREE.PlaneGeometry(1/theMap.width/gopherScale/3,1/theMap.height/gopherScale/3);
        var material = new THREE.MeshBasicMaterial( { transparent:true, side: THREE.DoubleSide } );
        material.map = isCorrect ? asset.textures.right : asset.textures.wrong
        var mesh = new THREE.Mesh( geometry, material );
        mesh.rotation.x = Math.PI/2;
        return mesh;
    }

    function addTrophy( theMap, mesh, isCorrect ) {
        var trophy = new THREE.Object3D();
        trophy.add( mesh )
        trophyMeshes.push( trophy );
        trophy.position.z = 0 + 1/theMap.width/2*(trophyMeshes.length-1);
        var medalMesh = new MedalMesh(theMap, isCorrect);
        medalMesh.position.y = -1/theMap.width/14;
        medalMesh.position.x = 1/theMap.width/10;
        trophyContainer.add( trophy );

        medalMesh.scale.x = 0;
        medalMesh.scale.y = 0;
        medalMesh.scale.z = 0;
        trophy.add( medalMesh );

        var upScale = new TWEEN.Tween({scale:0.01,angle:0})
            .to({scale:2.5,angle:Math.PI*8},1000)
            .easing(TWEEN.Easing.Circular.In)
            .onUpdate( function() {
                medalMesh.scale.x = this.scale;
                medalMesh.scale.y = this.scale;
                medalMesh.scale.z = this.scale;
                medalMesh.rotation.y = this.angle;
                })
            .onComplete( function() {
                createjs.Sound.play( isCorrect ? "right" : "wrong", {volume:0.2});
                });

        var downScale = new TWEEN.Tween({scale:2.5})
            .to({scale:1},1000)
            .easing(TWEEN.Easing.Circular.InOut)
            .onUpdate( function() {
                medalMesh.scale.x = this.scale;
                medalMesh.scale.y = this.scale;
                medalMesh.scale.z = this.scale;
                });

        upScale.chain( downScale );
        upScale.start();
    }

    function showLevelConditions(theMap) {
        expectedGopherSequence.forEach( function( id, index ) {
            var mesh = new GopherMesh(theMap);
            mesh.material.map = getTextureForGopherType(id); 
            mesh.material.opacity = 0.5;
            mesh.position.z = 0 + 1/theMap.width/2*index;
            mesh.position.y = 0.01;
            trophyExpectedMeshes.push( mesh );
            trophyContainer.add( mesh );
        });
    }

    function updateLevelConditions(gopherTypeId) {
        actualGopherSequence.push(gopherTypeId);
        if( expectedGopherSequence[actualGopherSequence.length-1] === gopherTypeId ) {
            return true;
        }
        else {
            return false;
        }
    }

    function canLevelUp() {
        if( actualGopherSequence.length !== expectedGopherSequence.length )
            return false;

        for( var index = 0; index <actualGopherSequence.length; index++) {
            if(actualGopherSequence[index] !== expectedGopherSequence[index]) {
                return false;
            }
        }

        return true;
    }

    function onGopherGone( theMap, gopherType ) {
        var trophyMesh = new GopherMesh(theMap);
        trophyMesh.material.map = getTextureForGopherType(gopherType);
        var isCorrect = updateLevelConditions(gopherType);
        addTrophy( theMap, trophyMesh, isCorrect );

        if( gophers.length === 0) {
            var progressTween = new TWEEN.Tween({x:0})
                .to({x:Math.PI},2000)
                .easing(TWEEN.Easing.Linear.None)
                .onUpdate( function() {
                    trophyMeshes.forEach( function(mesh){
                        mesh.rotation.z += 0.01*Math.random();
                    });
                })
                .onComplete( function() {
                    var shouldLevelUp = canLevelUp();
                    clearTrophies();
                    proceedToNextLevel(shouldLevelUp);
                });

            progressTween.start();
        }
    }

    var levelCount = 0;
    function proceedToNextLevel(shouldLevelUp) {
        if( shouldLevelUp ) {
            console.log("leveling up");
            levelCount++;
        }
        else {
            console.log("staying at same level");
        }
        var newMap = new Map(3+levelCount, 3+levelCount, Tile);
        newMap.setHelipad(0,0);
        newMap.makeLinks(1+levelCount,1+levelCount);
        showLevelConditions(newMap);

        var newContainer = new THREE.Object3D();
        populateContainerWithTiles(newMap, newContainer);
        populateContainerWithIllustrations(newMap, newContainer);
        populateContainerWithGophers(newMap, newContainer);
        scene.add(newContainer);

        resetPeeks();

        var offset = 1.7;
        var current = {
            delta: 0,
        }

        var target = {
           delta: offset, 
        }

        var tween = new TWEEN.Tween(current)
            .to(target, 2000)
            .easing(TWEEN.Easing.Cubic.Out)
            .onUpdate( function() {
                container.position.x = -current.delta;
                newContainer.position.x = offset-current.delta;
            })
            .onStart( function() {
                vanishTrophyContainer();
            })
            .onComplete( function() {
                container.remove( heli.mesh );
                var worldCoordinates = container.localToWorld( heli.mesh.position );
                scene.remove( container );
                map = newMap;
                heli = new Heli(newMap); // ugly fix to force heli size
                container = newContainer;
                container.add( heli.mesh );
                heli.mesh.position = container.worldToLocal( worldCoordinates );
                moveHeli( map, map.getTile(0,0) );
                showTrophyContainer();
            });

        tween.start();
    }

    var heliScale = 1.5;
    function HeliMesh(theMap) {
        var geometry = new THREE.PlaneGeometry(1/theMap.width/heliScale,1/theMap.height/heliScale/2);
        var material = new THREE.MeshBasicMaterial( { map: asset.textures.heli, transparent:true, side:THREE.DoubleSide } );
        var mesh = new THREE.Mesh( geometry, material );
        mesh.rotation.x = Math.PI/2;
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        return mesh;
    }

    function RotorMesh(theMap) {
        var geometry = new THREE.PlaneGeometry(1/theMap.width,1/theMap.height/15);
        var material = new THREE.MeshLambertMaterial( {color:0xAAAAAA, side:THREE.DoubleSide} ); 
        var mesh = new THREE.Mesh( geometry, material );
        mesh.castShadow = true;
        return mesh;
    }

    var grabberScale = 25;
    function HeliGrabberMesh(theMap) {
        var object = new THREE.Object3D();

        var length = 1/theMap.width/grabberScale*6;
        var geometry = new THREE.CylinderGeometry(1/theMap.width/grabberScale,1/theMap.width/grabberScale,length);
        var material = new THREE.MeshPhongMaterial( { color:0xFFFFFF } );
        var mesh = new THREE.Mesh( geometry, material );

        var g2 = new THREE.CylinderGeometry(1/theMap.width/grabberScale,1/theMap.width/grabberScale*3,length);
        var m2 = new THREE.Mesh( g2, material );
        m2.position.y = -length/2;

        object.add(mesh);
        object.add(m2);
        object.applyMatrix( new THREE.Matrix4().makeTranslation(0, -length/2, 0) );
        object.rotation.z = Math.PI/2;

        return object;
    }

    var Heli = function(theMap) {
        var object = new THREE.Object3D();

        var heli_mesh = new HeliMesh(theMap);
        heli_mesh.position = new THREE.Vector3(0,0,0);
        object.add( heli_mesh );

        var rotor_mesh = new RotorMesh(theMap);
        rotor_mesh.position = new THREE.Vector3(-1/map.width/15,0,1/map.width/6);
        object.add( rotor_mesh );

        var heli_grabberMesh = new HeliGrabberMesh(theMap);
        heli_grabberMesh.position = new THREE.Vector3( 0,0,0 );
        object.add( heli_grabberMesh )

        function update() {
            rotor_mesh.rotation.z += 1.0;
        }

        var vacuumTween = undefined;

        function takeoff() {
            var currentState = {
                z: object.position.z,
            }

            var targetState = {
                z: 1/map.height/heliScale,
                r: Math.PI/2,
            }

            var tween = new TWEEN.Tween( currentState )
            .to( targetState, 250 )
            .easing( TWEEN.Easing.Circular.InOut )
            .onUpdate( function() {
                object.position.z = currentState.z;
            })
            .onComplete( function() {
                deactivateVacuum();
            })

            tween.start();
        }

        var landingHeight = 0.07;
        function activateDryVacuum(theMap) {
            var currentState = {
                z: object.position.z,
                r: heli_grabberMesh.rotation.y,
            }

            var targetState = {
                z: landingHeight,
                r: Math.PI/2,
            }

            vacuumTween = new TWEEN.Tween( currentState )
            .to( targetState, 250 )
            .easing( TWEEN.Easing.Circular.InOut )
            .onUpdate( function() {
                object.position.z = currentState.z;
                heli_grabberMesh.rotation.y = currentState.r;
            })
            .onStart( function() {
                playEmptySound();
            })
            .onComplete( function() {
                deactivateVacuum();
                heli.takeoff();
            });

            vacuumTween.start();
        }

        function activateVacuum(theMap) {
            var currentState = {
                z: object.position.z,
                r: heli_grabberMesh.rotation.y,
            }

            var targetState = {
                z: landingHeight,
                r: Math.PI/2,
            }

            vacuumTween = new TWEEN.Tween( currentState )
            .to( targetState, 250 )
            .easing( TWEEN.Easing.Circular.InOut )
            .onUpdate( function() {
                object.position.z = currentState.z;
                heli_grabberMesh.rotation.y = currentState.r;
            })
            .onStart( function() {
                playRandomSound();
            })
            .onComplete( function() {
                onVacuumActivated(theMap);
            })


            vacuumTween.start();
        }

        function deactivateVacuum() {
            var currentState = {
                r: heli_grabberMesh.rotation.y,
            }

            var targetState = {
                r: 0,
            }

            vacuumTween = new TWEEN.Tween( currentState )
            .to( targetState, 500 )
            .easing( TWEEN.Easing.Circular.InOut )
            .onUpdate( function() {
                heli_grabberMesh.rotation.y = currentState.r
            });

            vacuumTween.start();
        }

        return {
            activateVacuum:activateVacuum,
            activateDryVacuum:activateDryVacuum,
            deactivateVacuum:deactivateVacuum,
            takeoff:takeoff,
            update: update,
            tile: undefined,
            mesh: object,
        }
    }


    var camera = new THREE.PerspectiveCamera( 15, window.innerWidth / window.innerHeight, 1, 10000 );
    var cameraCenter = {x:0, y:-3.0, z:1.0};
    camera.position.z = cameraCenter.z;
    camera.position.y = cameraCenter.y;
    camera.up = new THREE.Vector3(0,1,0);
    camera.lookAt( new THREE.Vector3(0,0,0));

    function populateContainerWithTiles(theMap, theContainer) {
        theMap.tiles.forEach( function( tile ) {
            theContainer.add( tile.mesh );
            theContainer.add( tile.highlightMesh );
            tile.highlight(false);
        })
    }


    function populateContainerWithIllustrations(theMap, theContainer) {
        theMap.illustrations.forEach( function( illustration ) {
            theContainer.add( illustration );
        })
    }


    function ShadowLight(color, intensity) {
        var light = new THREE.SpotLight( color, intensity);
        light.shadowMapWidth = 128;
        light.shadowMapHeight = 128;
        var d = 0.1;
        light.shadowCameraLeft = -d;
        light.shadowCameraRight = d;
        light.shadowCameraTop = d;
        light.shadowCameraBottom = -d;
        light.shadowCameraNear = 1.5; 
        light.shadowCameraFar = 2.1;
        light.shadowCameraFov = 30;
        light.shadowDarkness = 0.25;
        light.castShadow = true;

        return light;
    }

    var ambientLight = new THREE.AmbientLight(0x0A0A0A);
    scene.add(ambientLight);

    var sun = new ShadowLight(0xFFFFFF,1);
    //sun.shadowCameraVisible = true;
    sun.position = new THREE.Vector3(0,0,2);
    scene.add( sun );

    var sublight = new ShadowLight(0xFF0000,1.0);
    //sublight.shadowCameraVisible = true;
    sublight.shadowCameraNear = 0.10;
    sublight.shadowCameraFar = 1.3;
    sublight.position.x = peekButton.position.x-0.01; 
    sublight.position.y = peekButton.position.y; 
    sublight.position.z = peekButton.position.z; 
    sublight.intensity = 0;
    scene.add(sublight);

    scene.add( container );

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMapEnabled = true;
    renderer.shadowMapType = THREE.PCFShadowMap;
    renderer.shadowMapSoft = true;

    document.body.appendChild( renderer.domElement );

    var mouse = {x:0,y:0};
    function onDocumentMouseMove(event) {
        map.hideHighlights();
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

        var vector = new THREE.Vector3( mouse.x, mouse.y, 1);
        projector.unprojectVector(vector, camera);

        var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

        var intersects = ray.intersectObjects( map.targetMeshes )
        if( intersects.length > 0 ) {
            var tile = map.findTileByMesh( intersects[0].object );
            tile.highlight(true);
        }
    }

    function onDocumentMouseDown(event) {
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

        if( gopherRemovalInProgress ) {
            return;
        }

        var vector = new THREE.Vector3( mouse.x, mouse.y, 1);
        projector.unprojectVector(vector, camera);

        var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

        var controlsIntersection = ray.intersectObjects( buttons );
        if( controlsIntersection.length > 0 ) {
           peekBelowTheSurface(); 
        }
        else {
            var intersects = ray.intersectObjects( map.targetMeshes )
            if( intersects.length > 0 ) {
                var tile = map.findTileByMesh( intersects[0].object );
                moveHeli( map, tile );
            }
        }
    }

    var heliTween = undefined;
    function moveHeli( theMap, tile ) {
        heli.tile = tile;
        var currentPosition = {
            x: heli.mesh.position.x,
            y: heli.mesh.position.y,
        }

        var modelCoordinates = map.localToModel(tile.x, tile.y, 0.05);
        var targetPosition = {
            x: modelCoordinates.x,
            y: modelCoordinates.y,
        }

        heliTween = new TWEEN.Tween( currentPosition )
            .to( targetPosition, 500 )
            .easing( TWEEN.Easing.Circular.InOut )
            .onUpdate( function() {
                heli.mesh.position.x = currentPosition.x;
                heli.mesh.position.y = currentPosition.y;
                heli.mesh.position.z = 1/map.height/heliScale;
            })
            .onComplete( function() {
                onHeliMoved(tile); 
                if( tile.linkedTo ) {
                    if( tile.linkedTo.hasGopher ) {
                        heli.activateVacuum( theMap );
                    }
                    else if(!tile.hasGopher) {
                        heli.activateDryVacuum( theMap );
                    }
                }
                else {
                    heli.deactivateVacuum( theMap );
                }
            });

        heliTween.start();
    }

    function onHeliMoved( tile ) {
    }

    function failPeek() {
        var current = {
            r: 0,
        };

        var target = {
            r: Math.PI/10,
        }

        var downTarget = {
            r: 0,
        }
        var tweenUp = new TWEEN.Tween( current )
            .to( target, 1500 )
            .easing( TWEEN.Easing.Back.Out )
            .onStart( function() {
                currentlyPeeking = true;
                createjs.Sound.play( 'nomorepeeks', {volume:0.1} );
            })
            .onUpdate( function() {
                container.rotation.x = current.r;
            })
            .onComplete( function(){
            });

        var tweenDown = new TWEEN.Tween( current )
            .to( downTarget, 1000 )
            .easing( TWEEN.Easing.Back.In )
            .onUpdate( function() {
                container.rotation.x = current.r;
            })
            .onComplete( function() {
                currentlyPeeking = false;
            });

        tweenUp.chain( tweenDown );
        tweenUp.start();
    }

    var currentlyPeeking = false;
    function peekBelowTheSurface() {
        if( currentlyPeeking ) {
            return;
        }
        if( peekCount >= 3) {
            failPeek();
            return;
        }
        var current = {
            r: 0,
        };

        var target = {
            r: -Math.PI/5,
        }

        var downTarget = {
            r: 0,
        }

        sublight.intensity = 1;
        var tweenUp = new TWEEN.Tween( current )
            .to( target, 3000 )
            .easing( TWEEN.Easing.Back.Out )
            .onStart( function() {
                currentlyPeeking = true;
                createjs.Sound.play( 'peek' );
            })
            .onUpdate( function() {
                container.rotation.x = current.r;
            });

        var tweenDown = new TWEEN.Tween( current )
            .to( downTarget, 1000 )
            .easing( TWEEN.Easing.Back.In )
            .onUpdate( function() {
                container.rotation.x = current.r;
            })
            .onComplete( function() {
                sublight.intensity = 0;
                currentlyPeeking = false;
                peekCount++;
                peekButton.material.map = asset.textures[peekButtonTextures[peekCount]];
            });

        tweenUp.chain( tweenDown );
        tweenUp.start();
    }

    var projector = new THREE.Projector();
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('mousemove', onDocumentMouseMove, false);

    var map = new Map(3, 3, Tile);
    map.setHelipad(0,0);
    map.makeLinks(1,1);
    showLevelConditions(map);

    var heli = new Heli(map);
    container.add( heli.mesh );

    moveHeli( map, map.getTile(0,0) );
    initializeTrophyContainer();
    populateContainerWithGophers(map, container);
    populateContainerWithTiles(map, container);
    populateContainerWithIllustrations(map, container);

    var theta = 0;
    function animate() {
        requestAnimationFrame( animate );

        theta+= 0.05;
        camera.position.z = Math.cos(theta)*0.005 + cameraCenter.z;
        camera.position.y = Math.sin(theta)*0.005 + cameraCenter.y;
        camera.position.x = Math.cos(theta)*0.005 + cameraCenter.x;

        heli.update();
        gophers.forEach( function(gopher) {
            gopher.update();
        })

        trophyMeshes.forEach( function(trophyMesh, index) {
            trophyMesh.rotation.z = Math.sin(theta)/2;
        })

        renderer.render( scene, camera );
        TWEEN.update();
    }


    return {
        go:animate
    }
    }

    return {
        Instance:Instance
    }
});
