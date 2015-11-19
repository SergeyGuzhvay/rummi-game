module.exports = {
    Tile: function (id, color, number) {
        this.id = id;
        this.color = color;
        this.number = number;
        //this.location = '';
        //this.row = 0;
        //this.col = 0;
    },
    tilesBank: [],
    createTilesBank: function () {
        var tiles = [];
        var id = 0;
        // standard tiles
        for (var c = 0; c < 4; c++ ) {
            for (var n = 1; n <= 13; n++) {
                tiles.push(
                    new this.Tile(++id, c, n),
                    new this.Tile(++id, c, n)
                );
            }
        }
        // jokers 
        tiles.push(
            new this.Tile(++id, 0, 0),
            new this.Tile(++id, 2, 0)
        );
        this.tilesBank = tiles;
    },  
    shuffleTilesBank: function () {
        var counter = this.tilesBank.length, temp, index;
    
        // While there are elements in the this.tilesBank
        while (counter > 0) {
            // Pick a random index
            index = Math.floor(Math.random() * counter);
    
            // Decrease counter by 1
            counter--;
    
            // And swap the last element with it
            temp = this.tilesBank[counter];
            this.tilesBank[counter] = this.tilesBank[index];
            this.tilesBank[index] = temp;
        }
    },
    dealtTiles: function () {
        return this.tilesBank.splice(0, 28);
    },
    getExtraTile: function () {
        return this.tilesBank.splice(0, 1)[0];
    },
    getTile: function (id) {
        for (var i in this.tilesBank) {
            if (this.tilesBank[i].id === id)
                return this.tilesBank[i];
        }
    },
    removeTile: function (id) {
        for (var i in this.tilesBank) {
            if (this.tilesBank[i].id === id) {
                this.tilesBank.splice(i, 1);
                return;
            }
        }
    }
};