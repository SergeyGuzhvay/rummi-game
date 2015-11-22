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
        desk.drawPlayers(rummi.players);
        //desk.drawTileNumbers(rummi.players);
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
        1: {},
        // rack array
        2: {},
        endTurn: function () {
            socket.emit('turn ended');
        },
        checkDesk: function () {
            desk.removeInvalidSets();
            var isValid = true;
            for (var r = 0; r < config.rows; r++) {
                var row = [];
                for (var c = 0; c < config.cols; c++) {
                    var item = 0;
                    for (var id in this[1]) {
                        var tile = this[1][id];
                        if (tile.row === r && tile.col === c) {
                            item = tile;
                        }
                    }
                    row.push(item);
                }
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
                    var isValidRun = true;
                    if (set.length < 3 || set.length > 13) {
    					//console.log('ERROR0: ' + (n + 1));
                        isValidRun = false;
                    }
                    // runs
                    var firstTile = null;
                    //console.log(firstTile);
                    for (var j = 1; j < set.length; j++) {
                        var tile = set[j];
                        firstTile = firstTile ? firstTile : set[j - 1];
                        if (set[j - 1].number < j && set[j - 1].number !== 0) {
    						//console.log('ERROR1: ' + (n + 1));
                            isValidRun = false;
                            break;
                        }
                        if (!tile.number || !firstTile.number) {
                            continue;
                        }
                        if (tile.number === 13 && j !== set.length - 1) {
    						//console.log('ERROR2: ' + (n + 1));
                            isValidRun = false;
                            break;
                        }
                        if (!(firstTile.color === tile.color && firstTile.number + j === tile.number)) {
    						//console.log('ERROR3: ' + (n + 1));
                            //console.log(firstTile);
                            //console.log(tile);
                            //console.log(j);
                            isValidRun = false;
                            break;
                            //console.log(false);
                        }
                    }
                    var isValidGroup = true;
                    // groups
                    if (set.length > 4) {
    					//console.log('ERROR5: ' + (n + 1));
                        isValidGroup = false;
                    }
                    var colors = {
                        0: false,
                        1: false,
                        2: false,
                        3: false
                    };
                    var number = null;
                    for (var i = 0; i < set.length; i++) {
                        var tile = set[i];
                        if (!tile.number) {
                            colors[Object.keys(colors)] = 1;
                            continue;
                        }
                        else {
                            colors[tile.color] += 1;
                        }
                        number = number ? number : tile.number;
                        if (tile.number !== number) {
//						console.log('ERROR6: ' + (n + 1));
                            isValidGroup = false;
                        }
                    }
                    var cnt = 0;
                    for (var c in colors) {
                        if (colors[c] === 1) cnt++;
                    }
                    if (cnt < 3) {
    					//console.log('ERROR7: ' + (n + 1));
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
            //var tile = this.getTileById(id);
            //if (!tile) {
            //    console.log(this.logs[id]);
            //    return;
            //}
            var tile;
            try {
                //if (location === 1 && this[1][id])
                if (!this[location][id]) {
                    var oldLocation = location === 1 ? 2 : 1;
                    this[location][id] = this[oldLocation][id];
                    delete this[oldLocation][id];
                }
                tile = this[location][id];
                tile.row = row;
                tile.col = col;
                tile.location = location;
                //this.logs[id] = {
                //    row: row,
                //    col: col,
                //    location: location
                //};
                if (!tile) {
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
                socket.emit('move tile', tile);
            } catch (e) {
                console.log(e);
                console.log('ERROR: moveTile');
                console.log(tile);
                //console.log(this.logs);
            }
        },
        //getTileById: function (id) {
        //    for (var row in rummi[2]) {
        //        for (var col in rummi[2][row]) {
        //            var tile = rummi[2][row][col];
        //            if (tile.id === id)
        //               return tile;
        //        }
        //    }
        //    for (var row in rummi[1]) {
        //        for (var col in rummi[1][row]) {
        //            var tile = rummi[1][row][col];
        //            if (tile.id === id)
        //                return tile;
        //        }
        //    }
        //    console.log('ID NOT FOUND: ' + id);
        //    console.log(this);
        //},
        getExtraTile: function () {
            socket.emit('get extra tile');
        },
        addExtraTile: function (extraTile) {
            //rummi.playerTiles.push(extraTile);
            rowLoop:
            for (var row = 0; row < config.rackRows; row++) {
                colLoop:
                for (var col = 0; col < config.rackCols; col++) {
                    for (var id in this[2]) {
                        var tile = this[2][id];
                        if (tile.col === col && tile.row === row) {
                            continue colLoop;
                            //extraTile.row = row;
                            //extraTile.col = col;
                            //extraTile.location = 2;
                            //this[2][extraTile.id] = extraTile;
                            //desk.drawTile(extraTile);
                            //return;
                        }
                    }
                    extraTile.row = row;
                    extraTile.col = col;
                    extraTile.location = 2;
                    this[2][extraTile.id] = extraTile;
                    desk.drawTile(extraTile);
                    return;
                }
            }
            //for (var row in this[2]) {
            //    for (var col in this[2][row]) {
            //        var tile = this[2][row][col];
            //        if (!tile){
            //            extraTile.row = row;
            //            extraTile.col = col;
            //            extraTile.location = 2;
            //            this[2][row][col] = extraTile;
            //            desk.drawTile(extraTile);
            //            return;
            //        }
            //    }
            //}
        },
        addTileToDesk: function (tile) {
            desk.removeTile(tile.id);
            if (tile.location === 2) return;
            this[1][tile.id] = tile;
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
                this[2][tile.id] = tile;
                col++;
                //console.log(row, col);
            }
        },
        updatePlayerTiles: function () {
            var test = {};
            var playerTiles = [];
            for (var n in this[2]) {
                var tile = this[2][n];
                    if (tile) {
                        if (test[tile.id]) {
                            console.log(tile.id + ' AGAIN!');
                        }
                        test[tile.id] = true;
                        playerTiles.push(tile);
                    }
            }
            this.playerTiles = playerTiles;
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