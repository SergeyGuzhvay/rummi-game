module.exports = function () {
    this.Tile = function (id, color, number) {
        this.id = id;
        this.color = color;
        this.number = number;
        //this.location = '';
        //this.row = 0;
        //this.col = 0;
    };
    this.tilesBank = [];
    this.createTilesBank = function () {
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
    };
    this.shuffleTilesBank = function () {
        var counter = this.tilesBank.length, temp, index;
        while (counter > 0) {
            index = Math.floor(Math.random() * counter);
            counter--;
            temp = this.tilesBank[counter];
            this.tilesBank[counter] = this.tilesBank[index];
            this.tilesBank[index] = temp;
        }
    };
    this.dealtTiles = function () {
        return this.tilesBank.splice(0, 26);
    };
    this.getExtraTile = function () {
        return this.tilesBank.splice(0, 1)[0];
    };
    this.getTile = function (id) {
        for (var i in this.tilesBank) {
            if (this.tilesBank[i].id === id)
                return this.tilesBank[i];
        }
    };
    this.removeTile = function (id) {
        for (var i in this.tilesBank) {
            if (this.tilesBank[i].id === id) {
                this.tilesBank.splice(i, 1);
                return;
            }
        }
    }
};