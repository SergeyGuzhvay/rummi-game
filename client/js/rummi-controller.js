var rummi;
window.addEventListener('load', function () {
    var socket = io();

    ['create', 'join', 'start', 'players']
        .forEach(function (el) {
            window[el + 'El'] = document.getElementById(el + '-el');
            window[el + 'El'].onclick = function () {
                socket.emit(el);
            };
        });

    socket.on('number of players', function (number) {
        playersEl.innerHTML = number;
    });
    socket.on('game started', function () {
        socket.emit('get data on start');
    });
    socket.on('start data', function (data) {
        rummi.playerIndex = data.playerIndex;
        rummi.players = data.players;
        rummi.player = rummi.players[rummi.playerIndex];
        rummi.playerTiles = data.playerTiles;

        //rummi.sortPlayerTilesByColor();
        rummi.updateRack();
        desk.drawRack(rummi[2]);
    });
    socket.on('extra tile', function (newTile) {
        rummi.addExtraTile(newTile);
    });
    socket.on('move tile', function (tile) {
        rummi.addTileToDesk(tile);
    });

    rummi = {
        logs: {},
        players: [],
        player: {},
        playerIndex: null,
        playerTiles: [],
        // desk array
        1: (function () {
            var desk = [];
            for (var i = 0; i < config.rows; i++) {
                var rows = [];
                for (var j = 0; j < config.cols; j++) {
                    rows[j] = 0;
                }
                desk[i] = rows;
            }
            return desk;
        })(),
        // rack array
        2: (function () {
            var rack = [];
            for (var i = 0; i < config.rackRows; i++) {
                var rows = [];
                for (var j = 0; j < config.rackCols; j++) {
                    rows[j] = 0;
                }
                rack[i] = rows;
            }
            return rack;
        })(),
        //TODO: уточнить, может ли джокер идти перед 1 и после 13
        checkDesk: function () {
            desk.removeInvalidSets();
            var isValid = true;
            for (var r in this[1]) {
                var row = this[1][r];
                var sets = [];
                var i = 0;
                row.forEach(function (tile) {
                    if (tile) {
                        if (!Array.isArray(sets[i])) sets.push([]);
                        sets[i].push(tile);

                    }
                    else {
                        i = sets.length;
                    }
                });
                //console.log(sets);
                for (var n in sets) {
                    var set = sets[n];
                    console.log(set);
                    var isValidRun = true;
                    if (set.length < 3 || set.length > 13) {
    //					console.log('ERROR0: ' + (n + 1));
                        isValidRun = false;
                    }
                    // runs
                    var firstTile;
                    for (var i = 1; i < set.length; i++) {
                        var tile = set[i];
                        firstTile = firstTile ? firstTile : set[i - 1];
                        if (set[i - 1].number < i && set[i - 1].number !== 0) {
    //						console.log('ERROR1: ' + (n + 1));
                            isValidRun = false;
                            break;
                        }
                        if (!tile.number || !firstTile.number) {
                            continue;
                        }
                        if (tile.number === 13 && i !== set.length - 1) {
    //						console.log('ERROR2: ' + (n + 1));
                            isValidRun = false;
                            break;
                        }
                        if (!(firstTile.color === tile.color && firstTile.number + i === tile.number)) {
    //						console.log('ERROR3: ' + (n + 1));
                            isValidRun = false;
                            break;
                            //console.log(false);
                        }
                    }
                    var isValidGroup = true;
                    // groups
                    if (set.length > 4) {
    //					console.log('ERROR5: ' + (n + 1));
                        isValidGroup = false;
                    }
                    var colors = {
                        0: false,
                        1: false,
                        2: false,
                        3: false
                    };
                    var number;
                    for (var i = 0; i < set.length; i++) {
                        var tile = set[i];
                        if (!tile.number) {
                            colors[Object.keys(colors)] = true;
                            continue;
                        }
                        else {
                            colors[tile.color] = true;
                        }
                        number = number ? number : tile.number;
                        if (tile.number !== number) {
    //						console.log('ERROR6: ' + (n + 1));
                            isValidGroup = false;
                        }
                    }
                    var cnt = 0;
                    for (var c in colors) {
                        if (colors[c]) cnt++;
                    }
                    if (cnt < 3) {
    //					console.log('ERROR7: ' + (n + 1));
                        isValidGroup = false;
                    }

                    if (!isValidRun && !isValidGroup) {
                        isValid = false;
                        desk.showInvalidSet(set);
                    }
                }
            }
            return isValid;
        },
        //TODO: проверить ИД, когда перемещается группа на столе
        moveTile: function (row, col, location, id) {
            var tile = this.getTileById(id);
            if (!tile) {
                console.log(this.logs[id]);
                return;
            }
            try {
                this[location][row][col] = tile;
                if (this[location][row][col]) {
                    this[tile.location][tile.row][tile.col] = 0;
                    tile.row = row;
                    tile.col = col;
                    tile.location = location;
                    this.logs[id] = {
                        row: row,
                        col: col,
                        location: location
                    };
                }
                else {
                   console.log('ERROR: Tile #' + id + ' is not assigned');
                }
                //this[tile.location][tile.row][tile.col] = 0;
                //tile.row = row;
                //tile.col = col;
                //tile.location = location;
                //this[location][row][col] = tile;
                //this.logs[id] = {
                //    row: row,
                //    col: col,
                //    location: location
                //};
                desk.updateTile(tile);
                if (location === 1) {
                    socket.emit('move tile', tile);
                }
            } catch (e) {
                console.log('ERROR!');
                console.log(this.logs);
                console.log(e);
                console.log(tile);
            }
        },
        getTileById: function (id) {
            for (var row in rummi[2]) {
                for (var col in rummi[2][row]) {
                    var tile = rummi[2][row][col];
                    if (tile.id === id)
                       return tile;
                }
            }
            for (var row in rummi[1]) {
                for (var col in rummi[1][row]) {
                    var tile = rummi[1][row][col];
                    if (tile.id === id)
                        return tile;
                }
            }
            console.log('ID NOT FOUND: ' + id);
            console.log(this);
        },
        getExtraTile: function () {
            socket.emit('get extra tile');
        },
        addExtraTile: function (extraTile) {
            rummi.playerTiles.push(extraTile);
            for (var row in this[2]) {
                for (var col in this[2][row]) {
                    var tile = this[2][row][col];
                    if (!tile){
                        extraTile.row = row;
                        extraTile.col = col;
                        extraTile.location = 2;
                        this[2][row][col] = extraTile;
                        desk.drawTile(extraTile);
                        return;
                    }
                }
            }
        },
        addTileToDesk: function (tile) {
            desk.removeTile(tile.id);
            this[1][tile.row][tile.col] = tile;
            desk.drawTile(tile);
        },
        updateRack: function () {
            var row = 0;
            var col = 0;
            for (var i = 0; i < this.playerTiles.length; i++) {
                if (col >= config.rackCols) {
                    col = 0;
                    row++;
                    if (row >= config.rackRows)
                        break;
                }
                var tile = this.playerTiles[i];
                tile.row = row;
                tile.col = col;
                tile.location = 2;
                this[2][row][col] = tile;
                col++;
                //console.log(row, col);
            }
        },
        updatePlayerTiles: function () {
            var test = {};
            var playerTiles = [];
            this[2].forEach(function (row) {
                row.forEach(function (tile) {
                    if (tile) {
                        if (test[tile.id]) {
                            console.log(tile.id + ' AGAIN!');
                        }
                        test[tile.id] = true;
                        playerTiles.push(tile);
                    }
                });
            });
            this.playerTiles = playerTiles;
            //console.log(playerTiles.length);
            //console.log(playerTiles);
        },
        sortPlayerTilesByColor: function () {
            this.updatePlayerTiles();
            this.playerTiles.sort(function (tile1, tile2) {
                var result = tile1.color - tile2.color;
                return result === 0 ? tile1.number - tile2.number : result;
            });
            this.updateRack();
        },
        sortPlayerTilesByNumber: function () {
            this.updatePlayerTiles();
            this.playerTiles.sort(function (tile1, tile2) {
                var result = tile1.number - tile2.number;
                return result === 0 ? tile1.color - tile2.color : result;
            });
            this.updateRack();
        }
    };

});