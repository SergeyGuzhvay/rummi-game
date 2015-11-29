var express = require('express');
var socket = require('socket.io');
var rummi = require('./rummi');
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
var roomId = 1;
var room;
io.sockets.on('connection', function (client) {
    console.log('user connected');
    client.on('nickname', function (name) {
        client.name = name;
    });
    client.on('create', function () {
        if (client.index !== undefined) return;
        room = {
            players: []
        };
        room.gameStarted = false;
        client.join(roomId);
        client.index = 0;
        room.players = [];
        room.players.push({
            id: players[client.index].id,
            name: players[client.index].name,
            avatar: players[client.index].avatar
        });
        if (client.name) {
            room.players[client.index].name = client.name;
        }
        rummi.createTilesBank();
        rummi.shuffleTilesBank();

        io.sockets.in(roomId).emit('number of players', room.players.length);
        console.log(room.players[client.index].name + ' created the game');
    });
    client.on('join', function () {
        if (!room.players.length || room.players.length > 3) return;
        if (client.index !== undefined) return;
        if (room.gameStarted) return;
        client.join(roomId);
        client.index = room.players.length;
        room.players.push({
            id: players[client.index].id,
            name: players[client.index].name,
            avatar: players[client.index].avatar
        });
        if (client.name) room.players[client.index].name = client.name;
        io.sockets.in(roomId).emit('number of players', room.players.length);
        console.log(room.players[client.index].name + ' joined to the game');
    });
    client.on('start', function () {
        if (room.gameStarted) return;
        //if (room.players.length < 2) return;
        room.gameStarted = true;
        io.sockets.in(roomId).emit('game started');
        console.log(room.players[client.index].name + ' started the game');
    });
    client.on('get data on start', function () {
        client.emit('start data', {
            index: client.index,
            players: room.players,
            playerTiles: rummi.dealtTiles()
        });
        room.playerTurn = Math.floor(Math.random() * room.players.length);
        io.sockets.in(roomId).emit('start turn', room.playerTurn);
        client.on('move tile', function (tile) {
            client.broadcast.to(roomId).emit('move tile', tile);
        });
        client.on('tiles number changed', function (tilesNumber) {
            client.broadcast.to(roomId).emit('new tiles number', {
                index: client.index,
                tilesNumber: tilesNumber
            });
        });
        client.on('get extra tile', function () {
            client.emit('extra tile', rummi.getExtraTile());
        });
        client.on('turn ended', function () {
            room.playerTurn = room.playerTurn === (room.players.length - 1) ? 0 : room.playerTurn + 1;
            io.sockets.in(roomId).emit('start turn', room.playerTurn);
        });
        client.on('save desk', function (data) {
            room.savedData = data;
        });
        client.on('load desk', function () {
            client.emit('saved data', room.savedData);
            client.broadcast.to(roomId).emit('saved desk', room.savedData[1]);
        });
        client.on('winner', function () {
            io.sockets.in(roomId).emit('game over', client.index);
            room.gameStarted = false;
            client.index = undefined;
        });
        //client.on('round data', function (data) {});
    });
    client.on('leave', function () {
        client.disconnect();
    });
    client.on('disconnect', function () {
        if (client.index !== undefined) {
            delete room.players[client.index];
            client.broadcast.to(roomId).emit('disconnected user', client.index);
        }
        console.log('user disconnected');
    });
});