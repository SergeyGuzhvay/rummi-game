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
    //client.on('player name', function (name) {
    //    client.name = name;
    //});
    client.emit('rooms list', (function () {
        var roomsList = {};
        for (var id in rooms) {
            var room = rooms[id];
            roomsList[id] = {
                id: id,
                name: room.name,
                password: Boolean(room.password),
                players: room.players.length
            }
        }
        return roomsList;
    })());
    client.sendLog = function (log) {
        io.sockets.in(client.roomId).emit('add log', log);
    };
    client.updateRoom = function (id) {
        var room = rooms[id];
        if (!room) return;
        io.sockets.emit('update list room', {
            id: id,
            players: room.players.length
        });
        client.broadcast.to(id).emit('update room', room.players);
    };
    client.addRoom = function (id) {
        var room = rooms[id];
        io.sockets.emit('add room', {
            id: id,
            name: room.name,
            password: Boolean(room.password),
            players: room.players.length
        });
    };
    client.removeRoom = function (id) {
        delete rooms[id];
        io.sockets.emit('remove room', id);
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
    client.leave = function () {
        if (client.index !== undefined) {
            room.players.splice(client.index, 1);
            client.broadcast.to(client.roomId).emit('disconnected user', client.index);
            if (client.isHost) {
                client.removeRoom(client.roomId);
            }
            else {
                client.sendLog(String(client.player.name).bold() + ' has left the room');
                client.updateRoom(client.roomId);
            }
        }
    };
    client.on('create', function (data) {
        //if (client.index !== undefined) return;
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
        room.players.push({
            id: players[client.index].id,
            name: players[client.index].name,
            avatar: players[client.index].avatar
        });
        client.player = room.players[client.index];
        if (data.username) client.player.name = data.username.substring(0, 10);
        client.connected();
        client.addRoom(client.roomId);
        io.sockets.in(client.roomId).emit('number of players', room.players.length);
        console.log(client.player.name + ' created the game');
    });
    client.on('join', function (data) {
        //if (!room.players.length || room.players.length > 3) return;
        //if (client.index !== undefined) return;
        //if (room.gameStarted) return;
        if (!data.id) return;
        client.roomId = data.id;
        client.join(client.roomId);
        room = rooms[client.roomId];
        if (!room) return;
        if (room.password && room.password !== data.password) return;
        room.id = Number(client.roomId);
        for (var i = 0; i < 4; i++) {
            if (!room.players[i]) {
                console.log('leave test', i);
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
        io.sockets.in(client.roomId).emit('number of players', room.players.length);
        client.connected();
        client.updateRoom(client.roomId);
        console.log(client.player.name + ' joined to the game');
    });
    client.on('start', function () {
        if (!room || room.gameStarted) return;
        //if (room.players.length < 2) return;
        room.gameStarted = true;
        room.playerTurn = Math.floor(Math.random() * room.players.length);
        room.rummi = new Rummi();
        room.rummi.createTilesBank();
        room.rummi.shuffleTilesBank();
        io.sockets.in(client.roomId).emit('game started');
        client.sendLog(String(client.player.name).bold() + ' started the game');
        console.log(client.player.name + ' started the game');
    });
    client.on('stop', function () {
        room.gameStarted = false;
        io.sockets.in(client.roomId).emit('game stopped');
        client.sendLog(String(client.player.name).bold() + ' stopped the game');
    });
    client.on('get data on start', function () {
        client.emit('start data', room.rummi.dealtTiles());
        //TODO: отправлять номер хода только один раз
        client.emit('start turn', room.playerTurn);
        //io.sockets.in(client.roomId).emit('new tiles bank number', room.rummi.tilesBank.length);
        //client.on('round data', function (data) {});
    });
    client.on('update tiles bank number', function () {
        io.sockets.in(client.roomId).emit('new tiles bank number', room.rummi.tilesBank.length);
    });
    client.on('move tile', function (tile) {
        client.broadcast.to(client.roomId).emit('move tile', tile);
    });
    client.on('tiles number changed', function (tilesNumber) {
        client.broadcast.to(client.roomId).emit('new tiles number', {
            index: client.index,
            tilesNumber: tilesNumber
        });
    });
    //client.on('get tiles bank number', function () {
    //});
    client.on('get extra tile', function (swapTile) {
        if (swapTile) {
            delete swapTile.row;
            delete swapTile.col;
            delete swapTile.location;
            //console.log('swapTile: ', swapTile);
            //console.log('normalTile: ', room.rummi.getExtraTile());
            room.rummi.tilesBank.push(swapTile);
            room.rummi.shuffleTilesBank();
        }
        else {

        }
        console.log('swapTile: ', swapTile);
        var newTile = room.rummi.getExtraTile();
        console.log('newTile: ', newTile);
        client.emit('extra tile', newTile);
    });
    client.on('turn ended', function () {
        room.playerTurn = room.playerTurn === (room.players.length - 1) ? 0 : room.playerTurn + 1;
        //io.sockets.in(client.roomId).emit('new tiles bank number', room.rummi.tilesBank.length);
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
        //client.index = undefined;
    });
    client.on('leave', function () {
        client.leave();
    });
    client.on('disconnect', function () {
        client.leave();
        console.log('user disconnected');
    });
});