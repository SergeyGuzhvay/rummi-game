var express = require('express');
var socket = require('socket.io');
var Rummi = require('./rummi');
var port = (process.env.PORT) ? process.env.PORT : 80;
var app = express();
var io = socket.listen(app.listen(port));

app.use(express.static(__dirname + '/client'));
console.log('Server running on port ' + port);

var players = [
    {
        id: 1,
        name: 'Player 1',
        avatar: '/images/avatar1.jpg'
    },
    {
        id: 2,
        name: 'Player 2',
        avatar: '/images/avatar2.jpg'
    },
    {
        id: 3,
        name: 'Player 3',
        avatar: '/images/avatar3.jpg'
    },
    {
        id: 4,
        name: 'Player 4',
        avatar: '/images/avatar4.jpg'
    }
];
var rooms = {};
var id = 0;
io.sockets.on('connection', function (client) {
    client.emit('test emit', 200);
    var room;
    console.log('user connected');
    client.emit('rooms list', (function () {
        var roomsList = {};
        for (var id in rooms) {
            var room = rooms[id];
            roomsList[id] = {
                id: id,
                name: room.name,
                password: Boolean(room.password),
                players: getLength(room.players),
                gameStarted: room.gameStarted
            }
        }
        return roomsList;
    })());
    client.sendLog = function (log) {
        io.sockets.in(client.roomId).emit('add log', log);
    };
    client.updateRoom = function (id, leave) {
        console.log('update room');
        var room = rooms[id];
        if (!room) return;
        io.sockets.emit('update list room', {
            id: id,
            players: getLength(room.players),
            gameStarted: room.gameStarted
        });
        //if (leave)
        //    client.broadcast.to(id).emit('update room', room.players);
        //else
        console.log('client index: ', client.index);
            io.sockets.in(id).emit('update room', room.players);
    };
    client.addRoom = function (id) {
        var room = rooms[id];
        io.sockets.emit('add room', {
            id: id,
            name: room.name,
            password: Boolean(room.password),
            players: getLength(room.players)
        });
    };
    client.removeRoom = function (id) {
        delete rooms[id];
        io.sockets.emit('remove room', id);
        client.sendAlert('Host has left the room', 'room broadcast');
    };
    client.connected = function () {
        client.emit('connected', {
            id: room.id,
            name: room.name,
            index: client.index,
            players: room.players
        });
        if (client.isHost) client.sendLog(String(client.player.name).bold() + ' has created the room');
        else client.sendLog(String(client.player.name).bold() + ' has joined');
    };
    client.updatePlayersInRoom = function () {
        console.log('update players');
        var players = [];
        var clientIds = Object.keys(io.sockets.adapter.rooms[client.roomId]);
        clientIds.forEach(function (id, i) {
            console.log('update players', i);
            var roomClient = io.sockets.connected[id];
            roomClient.index = i;
            players[i] = roomClient.player;
        });
        room.players = players;
    };
    client.stopGame = function () {
        room.gameStarted = false;
        client.updatePlayersInRoom();
        client.updateRoom(client.roomId);
        io.sockets.in(client.roomId).emit('game stopped');
        //client.sendLog(String(client.player.name).bold() + ' stopped the game');
    };
    client.gameOver = function () {
        client.stopGame();
        io.sockets.in(client.roomId).emit('game over');
    };
    client.leaveRoom = function () {
        if (client.index !== undefined) {
            //client.stopGame();
            //room.players.splice([client.index], 1);
            delete room.players[client.index];
            if (getLength(room.players) == 0) {
                client.removeRoom(client.roomId);
                return;
            }
            client.broadcast.to(client.roomId).emit('disconnected user', client.index);
            //if (client.isHost) {
            //    client.removeRoom(client.roomId);
            //}
            client.sendLog(String(client.player.name).bold() + ' has left the room');
            //var clientIds = Object.keys(io.sockets.adapter.rooms[client.roomId]);
            //clientIds.forEach(function (id) {
            //    var roomClient = io.sockets.connected[id];
            //    if (roomClient.index > client.index) {
            //        //if (roomClient.player.name === 'Player ' + roomClient.player.id) {
            //        //    roomClient.player.name = 'Player ' + (roomClient.player.id - 1);
            //        //}
            //        roomClient.index--;
            //        roomClient.player.id--;
            //    }
            //});
            client.leave(client.roomId);
            if (room.gameStarted) {
                for (var id in client.playerTiles) {
                    room.rummi.tilesBank.push(client.playerTiles[id]);
                }
                io.sockets.in(client.roomId).emit('new tiles bank number', room.rummi.tilesBank.length);
                if (room.playerTurn === client.index) {
                    client.endTurn();
                }
                if (getLength(room.players) < 2) {
                    for (var i in room.players) {
                        if (room.players[i]){
                            client.sendAlert(room.players[i].name + ' has won the game', 'room');
                        }
                    }
                    client.gameOver();
                }
            }
            //client.updatePlayersInRoom();
            //client.updateRoom(client.roomId);
        }
    };
    client.sendAlert = function (m, target) {
        switch (target) {
            case 'room':
                io.sockets.in(client.roomId).emit('alert', m);
                break;
            case 'room broadcast':
                client.broadcast.to(client.roomId).emit('alert', m);
                break;
            case 'all':
                io.sockets.emit('alert', m);
                break;
            default:
                client.emit('alert', m);
                break;
        }
    };
    client.endTurn = function () {
        if (Object.keys(client.playerTiles).length <= 0) {
            console.log('winner 55555555');
            client.sendAlert(client.player.name + ' has won the game', 'room');
            client.gameOver();
            return;
        }
        do {
            room.playerTurn = room.playerTurn === (room.players.length - 1) ? 0 : room.playerTurn + 1;
        } while (!room.players[room.playerTurn]);
        io.sockets.in(client.roomId).emit('start turn', room.playerTurn);
    };
    client.on('create', function (data) {
        console.log('create data: ', data);
        if (!data) return;
        id++;
        rooms[id] = {
            name: data.name ? data.name.substring(0, 10) : 'Room ' + id,
            password: data.password || null,
            players: []
        };
        client.roomId = id;
        room = rooms[client.roomId];
        room.id = client.roomId;
        client.isHost = true;
        client.join(client.roomId);
        client.index = 0;
        room.players[client.index] = {
            id: players[client.index].id,
            name: players[client.index].name,
            avatar: players[client.index].avatar
        };
        client.player = room.players[client.index];
        if (data.username) client.player.name = data.username.substring(0, 10);
        client.connected();
        client.addRoom(client.roomId);
        io.sockets.in(client.roomId).emit('number of players', getLength(room.players));
        console.log(client.player.name + ' created the game');
    });
    client.on('join', function (data) {
        if (!data.id) return;
        client.roomId = data.id;
        client.join(client.roomId);
        room = rooms[client.roomId];
        if (!room) return;
        if (room.password && room.password !== data.password) {
            client.leave(client.roomId);
            client.sendAlert('Wrong password');
            return;
        }
        if (room.gameStarted) {
            client.leave(client.roomId);
            client.sendAlert('Game is already started');
            return;
        }
        if (getLength(room.players) >= 4) {
            client.leave(client.roomId);
            client.sendAlert('Room is full');
            return;
        }
        room.id = Number(client.roomId);
        for (var i = 0; i < 4; i++) {
            if (!room.players[i]) {
                client.index = i;
                room.players[i] = {
                    id: players[client.index].id,
                    name: players[client.index].name,
                    avatar: players[client.index].avatar
                };
                break;
            }
        }
        client.player = room.players[client.index];
        if (data.username) client.player.name = data.username.substring(0, 10);
        io.sockets.in(client.roomId).emit('number of players', getLength(room.players));
        client.connected();
        client.updateRoom(client.roomId);
        console.log(client.player.name + ' joined to the game');
    });
    client.on('start', function () {
        if (!room || room.gameStarted) return;
        room.gameStarted = true;
        client.updateRoom(client.roomId);
        room.playerTurn = Math.floor(Math.random() * getLength(room.players));
        room.rummi = new Rummi();
        room.rummi.createTilesBank();
        room.rummi.shuffleTilesBank();
        room.rummi.players = [];
        room.players.forEach(function (player) {
            if (player) room.rummi.players.push(player);
        });
        //for (var i in room.players) {
        //    if (!room.players[i]) {
        //        continue;
        //    }
        //    room.rummi.players[i] = {};
        //    for (var prop in room.players[i]) {
        //        room.rummi.players[i][prop] = room.players[i][prop];
        //    }
        //}
        io.sockets.in(client.roomId).emit('game started');
        client.sendLog(String(client.player.name).bold() + ' started the game');
        console.log(client.player.name + ' started the game');
    });
    client.on('stop', function () {
       client.stopGame();
    });
    client.on('get data on start', function () {
        //client.emit('start data', room.rummi.dealtTiles());
        var playerTiles = room.rummi.dealtTiles();
        client.playerTiles = {};
        playerTiles.forEach(function (tile) {
            client.playerTiles[tile.id] = tile;
        });
        console.log ('player index: ', client.index);
        console.log ('players: ', room.players);
        client.emit('start data', {
            playerTiles: playerTiles,
            players: room.players,
            playerIndex: client.index
        });
        client.emit('start turn', room.playerTurn);
    });
    client.on('update tiles bank number', function () {
        io.sockets.in(client.roomId).emit('new tiles bank number', room.rummi.tilesBank.length);
    });
    client.on('move tile', function (tile) {
        if (tile.location === 2) {
            client.playerTiles[tile.id] = tile;
        }
        else {
            delete client.playerTiles[tile.id];
        }
        client.broadcast.to(client.roomId).emit('move tile', tile);
    });
    client.on('tiles number changed', function (tilesNumber) {
        client.broadcast.to(client.roomId).emit('new tiles number', {
            index: client.index,
            tilesNumber: tilesNumber
        });
    });
    client.on('get extra tile', function (swapTile) {
        if (swapTile) {
            delete swapTile.row;
            delete swapTile.col;
            delete swapTile.location;
            room.rummi.tilesBank.push(swapTile);
            room.rummi.shuffleTilesBank();
            delete client.playerTiles[swapTile.id];
        }
        var newTile = room.rummi.getExtraTile();
        if (!newTile) {
            return;
        }
        client.playerTiles[newTile.id] = newTile;
        client.emit('extra tile', newTile);
    });
    client.on('turn ended', function () {
        client.endTurn();
    });
    //client.on('winner', function () {
    //    return;
    //});
    client.on('leave', function () {
        client.leaveRoom();
    });
    client.on('disconnect', function () {
        client.leaveRoom();
        console.log('user disconnected');
    });
});

var getLength = function (arr) {
    var cnt = 0;
    arr.forEach(function (el) {
        if (el) cnt++;
    });
    return cnt;
};