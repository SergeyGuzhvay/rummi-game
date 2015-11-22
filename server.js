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
var room = {
    players: []
};
io.sockets.on('connection', function (client) {
    console.log('user connected');
    client.on('create', function () {
        if (client.playerIndex !== undefined) return;
        client.join(roomId);
        client.playerIndex = 0;
        room.players = [];
        room.players.push(players[client.playerIndex]);

        rummi.createTilesBank();
        rummi.shuffleTilesBank();

        io.sockets.in(roomId).emit('number of players', room.players.length);
        console.log(room.players[client.playerIndex].name + ' created the game');
    });
    client.on('join', function () {
        if (!room.players.length || room.players.length > 3) return;
        if (client.playerIndex !== undefined) return;
        client.join(roomId);
        client.playerIndex = room.players.length;
        room.players.push(players[client.playerIndex]);
        io.sockets.in(roomId).emit('number of players', room.players.length);
        console.log(room.players[client.playerIndex].name + ' joined to the game');
    });
    client.on('start', function () {
        //if (room.players.length < 2) return;
        io.sockets.in(roomId).emit('game started');
        console.log(room.players[client.playerIndex].name + ' started the game');
    });
    client.on('get data on start', function () {
        var playerTiles = rummi.dealtTiles();
        room.players[client.playerIndex].tilesNumber = playerTiles.length;
        client.emit('start data', {
            playerIndex: client.playerIndex,
            players: room.players,
            playerTiles: playerTiles
        });
        client.on('move tile', function (tile) {
            client.broadcast.to(roomId).emit('move tile', tile);
        });
        client.on('get extra tile', function () {
            client.emit('extra tile', rummi.getExtraTile());
        });
        client.on('turn ended', function () {

        });
        client.on('round data', function (data) {});
    });
    client.on('leave', function () {});
    client.on('disconnect', function () {});
});