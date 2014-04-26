"use strict";
define([], function() {

    function randomFromArray( array ) {
        return array[ Math.floor( Math.random()*array.length) ];
    }

    //https://stackoverflow.com/a/6274381
    function shuffleArray(o){ 
        for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
    };

    return {
        randomFromArray: randomFromArray,
        shuffleArray:shuffleArray
    }
});
