var rummi = {};
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
    socket.on('game started', function (data) {
        rummi.playerIndex = data.playerIndex;
        rummi.players = data.players;
        rummi.player = rummi.players[rummi.playerIndex];
        rummi.playerTiles = data.playerTiles;

        //rummi.sortPlayerTilesByColor();
        rummi.updateRack();
        desk.drawRack(rummi.rack);


    });
    socket.on('extra tile', function (newTile) {
        rummi.addNewTile(newTile);
    });

    rummi = {
        players: [],
        player: {},
        playerIndex: null,
        playerTiles: [],

        desk: (function () {
            var desk = {};
            for (var i = 1; i <= config.rows; i++) {
                var rows = {};
                for (var j = 1; j <= config.cols; j++) {
                    rows[j] = 0;
                }
                desk[i] = rows;
            }
            return desk;
        })(),
        rack: (function () {
            var rack = {};
            for (var i = 1; i <= config.rackRows; i++) {
                var rows = {};
                for (var j = 1; j <= config.rackCols; j++) {
                    rows[j] = 0;
                }
                rack[i] = rows;
            }
            return rack;
        })(),
        moveTile: function (row, col, location, tile) {

        },
        getTile: function (id) {
            for (var row in rummi.rack) {
                for (var col in rummi.rack[row]) {
                    var tile = rummi.rack[row][col];
                    if (tile.id === id)
                       return tile;
                }
            }
            for (var row in rummi.desk) {
                for (var col in rummi.desk[row]) {
                    var tile = rummi.rack[row][col];
                    if (tile.id === id)
                        return tile;
                }
            }
        },
        getNewTile: function () {
            socket.emit('get extra tile');
        },
        addNewTile: function (newTile) {
            rummi.playerTiles.push(newTile);
            for (var row in rummi.rack) {
                for (var col in rummi.rack[row]) {
                    var tile = rummi.rack[row][col];
                    if (!tile){
                        rummi.rack[row][col] = newTile;
                        desk.addTile(row, col, 'rack', newTile);
                        return;
                    }
                }
            }
        },
        updateRack: function () {
            var row = 1;
            var col = 1;
            for (var i = 0; i < this.playerTiles.length; i++) {
                if (col > config.rackCols) {
                    col = 1;
                    row++;
                    if (row > config.rackRows)
                        break;
                }
                this.rack[row][col] = this.playerTiles[i];
                col++;
            }
        },
        sortPlayerTilesByColor: function () {
            this.playerTiles.sort(function (tile1, tile2) {
                var result = tile1.color - tile2.color;
                return result === 0 ? tile1.number - tile2.number : result;
            });
            this.updateRack();
        },
        sortPlayerTilesByNumber: function () {
            this.playerTiles.sort(function (tile1, tile2) {
                var result = tile1.number - tile2.number;
                return result === 0 ? tile1.color - tile2.color : result;
            });
            this.updateRack();
        }
    };

});