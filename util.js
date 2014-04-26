"use strict";
define([], function() {

    function randomFromArray( array ) {
        return array[ Math.floor( Math.random()*array.length) ];
    }

    return {
        randomFromArray: randomFromArray
    }
});
