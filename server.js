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
    var room;
    var rummi;
    console.log('user connected');
    //client.on('player name', function (name) {
    //    client.name = name;
    //});
    client.emit('games list', (function () {
        var games = [];
        for (var id in rooms) {
            var room = rooms[id];
            games.push({
                id: id,
                gameName: room.gameName,
                playersNumber: room.players.length,
                password: Boolean(room.password)
            });
        }
        return games;
    })());
    client.updateGame = function (id) {
        var room = rooms[id];
        if (!room) return;
        io.sockets.emit('update list game', {
            id: id,
            playersNumber: room.players.length
        });
        client.broadcast.to(id).emit('update game', room.players);
    };
    client.addGame = function (id) {
        var room = rooms[id];
        io.sockets.emit('add game', {
            id: id,
            gameName: room.gameName,
            playersNumber: room.players.length,
            password: Boolean(room.password)
        });
    };
    client.removeGame = function (id) {
        io.sockets.emit('remove game', id);
    };
    client.connected = function () {
        client.emit('connected', {
            id: room.id,
            gameName: room.gameName,
            index: client.index,
            players: room.players
        });
        client.updateGame(client.roomId);
    };
    client.leave = function () {
        if (client.index !== undefined) {
            delete room.players[client.index];
            client.broadcast.to(client.roomId).emit('disconnected user', client.index);
            if (client.isHost) {
                delete rooms[client.roomId];
                client.removeGame(client.roomId);
            }
            else {
                client.updateGame(client.roomId);
            }
        }
    };
    client.on('create', function (data) {
        //if (client.index !== undefined) return;
        console.log('create data: ', data);
        if (!data) return;
        id++;
        rooms[id] = {
            gameName: data.gameName,
            password: data.password || null,
            players: []
        };
        client.roomId = id;
        room = rooms[client.roomId];
        client.isHost = true;
        client.join(client.roomId);
        client.index = 0;
        room.players.push({
            id: players[client.index].id,
            name: players[client.index].name,
            avatar: players[client.index].avatar
        });
        if (data.playerName) {
            room.players[client.index].name = data.playerName;
        }
        room.rummi = new Rummi();
        room.rummi.createTilesBank();
        room.rummi.shuffleTilesBank();

        client.connected();
        client.addGame(client.roomId);
        io.sockets.in(client.roomId).emit('number of players', room.players.length);
        console.log(room.players[client.index].name + ' created the game');
    });
    client.on('join', function (data) {
        //if (!room.players.length || room.players.length > 3) return;
        //if (client.index !== undefined) return;
        //if (room.gameStarted) return;
        if (!data) return;
        console.log('join data: ', data);
        client.roomId = data.id;
        client.join(client.roomId);
        room = rooms[client.roomId];
        if (room.password && room.password !== data.password) return;
        console.log('password');
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
        if (data.playerName) room.players[client.index].name = data.playerName;
        io.sockets.in(client.roomId).emit('number of players', room.players.length);
        client.connected();
        console.log(room.players[client.index].name + ' joined to the game');
    });
    client.on('start', function () {
        if (!room || room.gameStarted) return;
        //if (room.players.length < 2) return;
        room.gameStarted = true;
        io.sockets.in(client.roomId).emit('game started');
        console.log(room.players[client.index].name + ' started the game');
    });
    client.on('get data on start', function () {
        client.emit('start data', room.rummi.dealtTiles());
        room.playerTurn = Math.floor(Math.random() * room.players.length);
        io.sockets.in(client.roomId).emit('start turn', room.playerTurn);
        client.on('move tile', function (tile) {
            client.broadcast.to(client.roomId).emit('move tile', tile);
        });
        client.on('tiles number changed', function (tilesNumber) {
            client.broadcast.to(client.roomId).emit('new tiles number', {
                index: client.index,
                tilesNumber: tilesNumber
            });
        });
        client.on('get extra tile', function () {
            client.emit('extra tile', room.rummi.getExtraTile());
        });
        client.on('turn ended', function () {
            room.playerTurn = room.playerTurn === (room.players.length - 1) ? 0 : room.playerTurn + 1;
            io.sockets.in(client.roomId).emit('start turn', room.playerTurn);
        });
        //client.on('save desk', function (data) {
        //    room.savedData = data;
        //});
        //client.on('load desk', function () {
        //    client.emit('saved data', room.savedData);
        //    client.broadcast.to(client.roomId).emit('saved desk', room.savedData[1]);
        //});
        client.on('winner', function () {
            io.sockets.in(client.roomId).emit('game over', client.index);
            room.gameStarted = false;
            client.index = undefined;
        });
        //client.on('round data', function (data) {});
    });
    client.on('leave', function () {
        client.leave();
    });
    client.on('disconnect', function () {
        client.leave();
        console.log('user disconnected');
    });
});