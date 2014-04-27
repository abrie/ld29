"use strict";
require(['util','lib/three.min', 'lib/tween.min'], function(util) {
    var textures = {
        hole: new THREE.ImageUtils.loadTexture("assets/hole.png"),
        grass: new THREE.ImageUtils.loadTexture("assets/grass.png"),
        heli: new THREE.ImageUtils.loadTexture("assets/heli.png"),
        gopher: new THREE.ImageUtils.loadTexture("assets/gopher.png"),
        peekbelow: new THREE.ImageUtils.loadTexture("assets/peekbelow.png"),
        helipad: new THREE.ImageUtils.loadTexture("assets/helipad.png")
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

        var illustrations = [];
        function illustrateConnection(meshA, meshB) {
            var numPoints = 100;
            var m = illustrations.length+1;
            var spline = new THREE.SplineCurve3([
                meshA.position.clone().add( new THREE.Vector3(0,0,-0.02)),
                meshA.position.clone().add( new THREE.Vector3(0,0,-0.02-0.05*m)),
                meshB.position.clone().add( new THREE.Vector3(0,0,-0.02-0.05*m)),
                meshB.position.clone().add( new THREE.Vector3(0,0,-0.02)),
            ]);

            var material = new THREE.MeshLambertMaterial({color:0xFFFFFF, linewidth:10});
            var geometry = new THREE.TubeGeometry( spline, 50, 0.025, 12, false);
            var mesh = new THREE.Mesh(geometry, material);

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

            tileA.mesh.material.map = textures.hole;
            tileB.mesh.material.map = textures.hole;

            illustrateConnection(tileA.mesh, tileB.mesh);
        }

        var helipadTile = undefined;
        function setHelipad(x,y) {
            var tile = tiles[y*width+x];
            helipadTile = tile;
            tile.mesh.material.map = textures.helipad;
        }

        function makeLinks( linkCount, gopherCount ) {
            for(var i = 0; i < linkCount; i++) {
                linkTwoTiles();
            }
            for(var i = 0; i < gopherCount ; i++) {
                addGopher();
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
            getTilesWithGopher: getTilesWithGopher,
            findTileByMesh: findTileByMesh,
            getTile: getTile,
            setHelipad: setHelipad,
            getHelipad: getHelipad,
            tiles: tiles,
            illustrations: illustrations,
            makeLinks: makeLinks,
        }
    }

    var ButtonMesh = function(map) {
        var geometry = new THREE.PlaneGeometry(0.10, 0.05);
        var material = new THREE.MeshBasicMaterial( { map:map } );
        var mesh = new THREE.Mesh( geometry, material );
        mesh.rotation.x = Math.PI/2;
        return mesh;
    }

    var buttons = [];
    var peekButton = new ButtonMesh(textures.peekbelow);
    peekButton.position.x = -0.5;
    peekButton.position.y = -0.7;
    buttons.push(peekButton);
    scene.add( peekButton )

    var TileMesh = function(mapWidth, mapHeight) {
        var geometry = new THREE.BoxGeometry(1/mapWidth,1/mapHeight,0.01);
        var material = new THREE.MeshLambertMaterial( { map: textures.grass, transparent:true, side: THREE.DoubleSide } );
        var mesh = new THREE.Mesh( geometry, material );
        mesh.receiveShadow = true;
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
    map.setHelipad(0,0);
    map.makeLinks(1,1);

    var gopherScale = 2;
    function GopherMesh() {
        var geometry = new THREE.PlaneGeometry(1/map.width/gopherScale,1/map.height/gopherScale);
        var material = new THREE.MeshBasicMaterial( { map: textures.gopher, transparent:true, side: THREE.DoubleSide } );
        var mesh = new THREE.Mesh( geometry, material );
        mesh.rotation.x = Math.PI/2;
        mesh.receiveShadow = true;
        return mesh;
    }

    var Gopher = function(tile) {
        var mesh = new GopherMesh(); 
        mesh.position = map.localToModel(tile.x, tile.y, 1/map.height/gopherScale/2);

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
    function addGophersToContainer(theMap, theContainer) {
        theMap.getTilesWithGopher().forEach( function(tile) {
            var gopher = new Gopher(tile);
            gophers.push(gopher);
            theContainer.add( gopher.mesh );
        });
    }

    addGophersToContainer(map, container);

    function onVacuumActivated() {
        if( heli.tile.linkedTo ) {
            if( heli.tile.hasGopher ) {
                action_die();
            }
            else if( heli.tile.linkedTo.hasGopher ) {
                action_removeGopher( heli.tile.linkedTo );
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
    function action_removeGopher(tile) {
        var contained = gophers.filter( function(g) {
            return g.tile === tile;
        });

        var gopher = contained[0];

            var currentState = {
                z: gopher.mesh.position.z,
                scale: 1.0
            }

            var targetState = {
                z: -1/map.width/gopherScale/2,
                scale: 0.1,
            }

            var tween = new TWEEN.Tween( currentState )
                .to( targetState, 2000 )
                .easing( TWEEN.Easing.Circular.In )
                .onUpdate( function() {
                    gopher.mesh.position.z = currentState.z; 
                    gopher.mesh.scale.x = currentState.scale;
                    gopher.incRotationRate(0.01);
                })
                .onStart( function() {
                    gopherRemovalInProgress = true;
                })
                .onComplete( function() {
                    container.remove( gopher.mesh )
                    gophers = gophers.filter( function(g) { return g !== gopher; });
                    tile.hasGopher = false;
                    onGopherGone();
                    gopherRemovalInProgress = false;
                });
            console.log("test");

            tween.start();
    }

    function action_nothing() {
    }

    function onGopherGone() {
        if( gophers.length === 0) {
            proceedToNextLevel();
        }
        console.log("gopher eliminated");
    }

    function proceedToNextLevel() {
        var newMap = new Map(5, 5, Tile);
        newMap.setHelipad(0,0);
        newMap.makeLinks(2,2);

        var offset = 1.5;
        var newContainer = new THREE.Object3D();
        newContainer.position.x = offset;
        populateContainerWithTiles(newMap, newContainer);
        populateContainerWithIllustrations(newMap, newContainer);
        addGophersToContainer(newMap, newContainer);
        scene.add(newContainer);

        var current = {
            delta: 0,
        }

        var target = {
           delta: offset, 
        }

        var tween = new TWEEN.Tween(current)
            .to(target, 3000)
            .easing(TWEEN.Easing.Elastic.Out)
            .onUpdate( function() {
                container.position.x = -current.delta;
                newContainer.position.x = offset-current.delta;
            })
            .onComplete( function() {
                container.remove( heli.mesh );
                scene.remove( container );
                map = newMap;
                container = newContainer;
                container.add( heli.mesh );
                moveHeli( map.getTile(0,0) );
            });
        tween.start();
    }

    var heliScale = 1.5;
    function HeliMesh() {
        var geometry = new THREE.PlaneGeometry(1/map.width/heliScale,1/map.height/heliScale);
        var material = new THREE.MeshBasicMaterial( { map: textures.heli, transparent:true, side:THREE.DoubleSide } );
        var mesh = new THREE.Mesh( geometry, material );
        mesh.rotation.x = Math.PI/2;
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        return mesh;
    }

    function RotorMesh() {
        var geometry = new THREE.PlaneGeometry(1/map.width,1/map.height/15);
        var material = new THREE.MeshLambertMaterial( {color:0xFF00FF, side:THREE.DoubleSide} ); 
        var mesh = new THREE.Mesh( geometry, material );
        mesh.castShadow = true;
        return mesh;
    }

    var grabberScale = 25;
    function HeliGrabberMesh() {
        var length = 1/map.width/grabberScale*5;
        var geometry = new THREE.CylinderGeometry(1/map.width/grabberScale,1/map.width/grabberScale,length);
        geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0, -length/2, 0) );
        var material = new THREE.MeshPhongMaterial( { color:0xFFFFFF } );
        var mesh = new THREE.Mesh( geometry, material );
        mesh.rotation.z = Math.PI/2;

        return mesh;
    }

    var Heli = function() {
        var object = new THREE.Object3D();

        var heli_mesh = new HeliMesh();
        heli_mesh.position = new THREE.Vector3(0,0,0);
        object.add( heli_mesh );

        var rotor_mesh = new RotorMesh();
        rotor_mesh.position = new THREE.Vector3(-0.003,0,1/map.width/3.3);
        object.add( rotor_mesh );

        var heli_grabberMesh = new HeliGrabberMesh();
        heli_grabberMesh.position = new THREE.Vector3( 0,0,1/map.width/8.0 );
        object.add( heli_grabberMesh )

        function update() {
            rotor_mesh.rotation.z += 1.0;
        }

        var vacuumTween = undefined;

        function activateVacuum() {
            var currentState = {
                r: heli_grabberMesh.rotation.y,
            }

            var targetState = {
                r: Math.PI/2,
            }

            vacuumTween = new TWEEN.Tween( currentState )
            .to( targetState, 250 )
            .easing( TWEEN.Easing.Circular.InOut )
            .onUpdate( function() {
                heli_grabberMesh.rotation.y = currentState.r
                //object.rotation.y = currentState.r
            })
            .onComplete( function() {
                onVacuumActivated();
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
            })
            .onComplete( function() {
                console.log("rotation complete");
            })

            vacuumTween.start();
        }

        return {
            activateVacuum:activateVacuum,
            deactivateVacuum:deactivateVacuum,
            update: update,
            tile: undefined,
            mesh: object,
        }
    }

    var heli = new Heli();
    container.add( heli.mesh );

    var camera = new THREE.PerspectiveCamera( 15, window.innerWidth / window.innerHeight, 1, 10000 );
    var cameraCenter = {x:0, y:-3.0, z:1.0};
    camera.position.z = cameraCenter.z;
    camera.position.y = cameraCenter.y;
    camera.up = new THREE.Vector3(0,1,0);
    camera.lookAt( new THREE.Vector3(0,0,0));

    function populateContainerWithTiles(theMap, theContainer) {
        theMap.tiles.forEach( function( tile ) {
            theContainer.add( tile.mesh );
        })
    }

    populateContainerWithTiles(map, container);

    function populateContainerWithIllustrations(theMap, theContainer) {
        theMap.illustrations.forEach( function( illustration ) {
            theContainer.add( illustration );
        })
    }

    populateContainerWithIllustrations(map, container);

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
    function onDocumentMouseDown(e) {
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

        var intersects = ray.intersectObjects( map.targetMeshes )
        if( intersects.length > 0 ) {
            intersects.forEach( function( intersected ) {
                var tile = map.findTileByMesh( intersected.object );
                moveHeli( tile );
            })
        }
    }

    var heliTween = undefined;
    function moveHeli( tile ) {
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
                    heli.activateVacuum();
                }
                else {
                    heli.deactivateVacuum();
                }
            });

        heliTween.start();
    }

    function onHeliMoved( tile ) {
        console.log("Heli moved", tile);
    }

    function peekBelowTheSurface() {
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
            });

        tweenUp.chain( tweenDown );
        tweenUp.start();
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

        heli.update();
        gophers.forEach( function(gopher) {
            gopher.update();
        })

        renderer.render( scene, camera );
        TWEEN.update();
    }


    animate();
});
