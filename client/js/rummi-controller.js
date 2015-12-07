var rummi;
window.addEventListener('load', function () {
    socket.on('game started', function () {
        canvasInit();
        socket.emit('get data on start');
    });
    socket.on('start data', function (tiles) {
        rummi.playerTiles = tiles;

        rummi.updateRack();
        desk.drawRack(rummi[2]);
        desk.drawPlayers(rummi.players);
        //rummi.startTurn();
    });
    socket.on('extra tile', function (newTile) {
        rummi.addExtraTile(newTile);
    });
    socket.on('move tile', function (tile) {
        rummi.addTileToDesk(tile);
    });
    socket.on('new tiles number', function (data) {
        desk.set('tilesNumber', [data.index, data.tilesNumber]);
    });
    socket.on('start turn', function (playerTurn) {
        rummi.playerTurn = playerTurn;
        rummi.startTurn();
        desk.set('activePlayer', [playerTurn]);
    });
    socket.on('disconnected user', function (index) {
        delete rummi.players[index];
        var cnt = 0;
        for (var n in rummi.players) {
            if (rummi.players[n]) cnt++;
        }
        if (cnt < 2) {
            socket.emit('winner');
        }
    });
    socket.on('game over', function (index) {
        alert(rummi.players[index].name + ' has won!');
        rummi.index = null;
        rummi.players = [];
        rummi.player = {};
        rummi.playerTiles = [];
        rummi.history = [];
        rummi[1] = {};
        rummi[2] = {};
        desk.clearGameObjects();
        desk.clear();
    });
    //socket.on('saved data', function (savedData) {
    //     rummi[1] = savedData[1];
    //    rummi[2] = savedData[2];
    //    desk.drawDesk(rummi[1]);
    //    desk.drawRack(rummi[2]);
    //});
    //socket.on('saved desk', function (savedDesk) {
    //    rummi[1] = savedDesk;
    //    desk.drawDesk(rummi[1]);
    //});

    rummi = {
        players: [],
        player: {},
        index: null,
        playerTiles: [],
        history: [],
        beep: new Audio('sounds/beep.mp3'),
        // desk array
        1: {},
        // rack array
        2: {},
        savedTilesNumber: 0,
        save: function () {
            //socket.emit('save desk', {
            //    1: this[1],
            //    2: this[2]
            //});
            this.savedTilesNumber = this.getTilesNumber();
            this.history.push([]);
        },
        load: function () {
            //desk.removeActives();
            //socket.emit('load desk');
            var lastTurn = this.history[this.history.length - 1];
            for (var i = lastTurn.length; i > 0; i--) {
                var move = lastTurn[i - 1];
                if (move.from.location === 2 && move.to.location === 1) {
                    var tile = this[1][move.id] || this[2][move.id];
                    delete this[1][move.id];
                    delete this[2][move.id];
                    desk.removeTile(move.id);
                    this.addExtraTile(tile);
                    socket.emit('move tile', tile);
                }
                else if (move.from.location === 1 && move.to.location === 1) {
                    rummi.moveTile(move.from.row, move.from.col, move.from.location, move.id);
                    desk.removeTile(move.id);
                    desk.drawTile(this[move.from.location][move.id], {owner: rummi.index});
                }
            }
            this.history[this.history.length - 1] = [];
            desk.removeInvalidSets();
        },
        isMyTurn: function () {
            return this.index === this.playerTurn;
        },
        startTurn: function () {
            desk.startTimer();
            desk.lockDeskTiles();
            console.log('turn: ', this.index, this.playerTurn);
            if (this.isMyTurn()) {
                this.save();
                this.beep.play();
                console.log('my turn: ', this.isMyTurn());
            }
        },
        getTilesNumber: function () {
            return Object.keys(this[2]).length;
        },
        endTurn: function () {
            socket.emit('turn ended');
            if (this.getTilesNumber() === 0) {
                socket.emit('winner');
            }
        },
        checkDesk: function () {
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
                for (var n in sets) {
                    var set = sets[n];
                    var isValidRun = true;
                    if (set.length < 3 || set.length > 13) {
                        isValidRun = false;
                    }
                    // runs
                    var firstTile = null;
                    for (var j = 1; j < set.length; j++) {
                        var tile = set[j];
                        firstTile = firstTile ? firstTile : set[j - 1];
                        if (set[j - 1].number < j && set[j - 1].number !== 0) {
                            isValidRun = false;
                            break;
                        }
                        if (!tile.number || !firstTile.number) {
                            continue;
                        }
                        if (tile.number === 13 && j !== set.length - 1) {
                            isValidRun = false;
                            break;
                        }
                        if (!(firstTile.color === tile.color && firstTile.number + j === tile.number)) {
                            isValidRun = false;
                            break;
                        }
                    }
                    var isValidGroup = true;
                    // groups
                    if (set.length > 4) {
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
                            isValidGroup = false;
                        }
                    }
                    var cnt = 0;
                    for (var c in colors) {
                        if (colors[c] === 1) cnt++;
                    }
                    if (cnt < 3) {
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
        sendTilesNumber: function () {
            socket.emit('tiles number changed', rummi.getTilesNumber());
        },
        moveTile: function (row, col, location, id) {
            if (!this[location][id]) {
                var oldLocation = location === 1 ? 2 : 1;
                this[location][id] = this[oldLocation][id];
                delete this[oldLocation][id];
            }
            var tile = this[location][id];
            this.history[this.history.length - 1].push({
                from: {
                    row: tile.row,
                    col: tile.col,
                    location: tile.location
                },
                to: {
                    row: row,
                    col: col,
                    location: location
                },
                id: id
            });
            tile.row = row;
            tile.col = col;
            tile.location = location;
            desk.updateTile(tile);
            desk.set('tilesNumber', [rummi.index, rummi.getTilesNumber()]);
            rummi.sendTilesNumber();
            socket.emit('move tile', tile);
        },
        getExtraTile: function (n) {
            n = n ? n : 1;
            for (var i = 0; i < n; i++) {
                socket.emit('get extra tile');
            }
        },
        addExtraTile: function (extraTile) {
            if (!extraTile) return;
            rowLoop:
            for (var row = 0; row < config.rackRows; row++) {
                colLoop:
                for (var col = 0; col < config.rackCols; col++) {
                    for (var id in this[2]) {
                        var tile = this[2][id];
                        if (tile.col === col && tile.row === row) {
                            continue colLoop;
                        }
                    }
                    extraTile.row = row;
                    extraTile.col = col;
                    extraTile.location = 2;
                    this[2][extraTile.id] = extraTile;
                    desk.set('tilesNumber', [rummi.index, rummi.getTilesNumber()]);
                    rummi.sendTilesNumber();
                    desk.drawTile(extraTile, {owner: rummi.index});
                    return;
                }
            }
        },
        addTileToDesk: function (tile) {
            desk.removeTile(tile.id);
            if (tile.location === 2) {
                delete rummi[1][tile.id];
                return;
            }
            this[1][tile.id] = tile;
            desk.drawTile(tile, {isLocked: true});
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
            }
        },
        updatePlayerTiles: function () {
            var test = {};
            var playerTiles = [];
            for (var n in this[2]) {
                var tile = this[2][n];
                    if (tile) {
                        test[tile.id] = true;
                        playerTiles.push(tile);
                    }
            }
            this.playerTiles = playerTiles;
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
        },
        getRowByTileId: function (id) {
            var r = this[1][id].row;
            var row = [];
            for (var c = 0; c < config.cols; c++) {
                var item = 0;
                for (var n in this[1]) {
                    var tile = this[1][n];
                    if (tile.row === r && tile.col === c) {
                        item = tile;
                    }
                }
                row.push(item);
            }
            return row;
        }
    };

    //socket.emit('create');
    //socket.emit('start');

});