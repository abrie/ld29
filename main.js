"use strict";
require(['assets', 'game' ], function(assets, Game) {
    var instance = undefined;
    function onAllLoaded() {
        instance = new Game.Instance(assets);
        instance.go();
    }

    assets.setOnAllLoaded( onAllLoaded );
});
