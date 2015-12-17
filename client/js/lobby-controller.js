var socket = io();
var lobby = {};
(function () {
    angular.module('lobby', []).controller('LobbyController', function ($scope, $sce) {
        lobby = this;
        lobby.tab = 'join';
        lobby.selectedRoom = {};
        lobby.logs = [];
        lobby.rooms = {};
        lobby.form = {};

        lobby.createRoom = function () {
            //TODO: проверить заполнение форм
            socket.emit('create', {
                username: lobby.form.username,
                name: lobby.form.name,
                password: lobby.form.isPrivate ? lobby.form.password : ''
            })
        };
        lobby.joinRoom = function () {
            socket.emit('join', {
                username: lobby.form.username,
                id: lobby.selectedRoom.id,
                password: lobby.form.password
            })
        };
        lobby.leaveRoom = function () {
            delete lobby.room;
            lobby.gameStarted = false;
            rummiRemove();
            if (desk) {
                desk.clearGameObjects();
            }
            socket.emit('leave');
        };
        lobby.startGame = function () {
            //TODO: старт только для хоста
            lobby.gameStarted = true;
            socket.emit('start');
        };
        lobby.stopGame = function () {
            lobby.gameStarted = false;
            socket.emit('stop');
        };
        lobby.isSelected = function (tab) {
            return lobby.tab === tab;
        };
        lobby.selectTab = function (tab) {
            delete lobby.form.name;
            delete lobby.form.password;
            lobby.tab = tab;
        };
        lobby.addLog = function (log) {
            var d = new Date();
            lobby.logs.push(
                $sce.trustAsHtml('[' + d.getTime() + '] ' + log)
            );
        };

        socket.on('rooms list', function (rooms) {
            lobby.rooms = rooms;
            $scope.$apply();
        });
        socket.on('add room', function (room) {
            lobby.rooms[room.id] = room;
            $scope.$apply();
        });
        socket.on('remove room', function (id) {
            if (lobby.room && lobby.room.id === id) {
                lobby.leaveRoom();
            }
            delete lobby.rooms[id];
            $scope.$apply();
        });
        socket.on('connected', function (room) {
            lobby.room = room;
            lobby.logs = [];
            $scope.$apply();
        });
        socket.on('update list room', function (room) {
            lobby.rooms[room.id].players = room.players;
            lobby.rooms[room.id].gameStarted = room.gameStarted;
            $scope.$apply();
        });
        socket.on('update room', function (players) {
            if (lobby.room) {
                lobby.room.players = players;
                $scope.$apply();
            }
        });
        socket.on('add log', function (log) {
            lobby.addLog(log);
            $scope.$apply();
            var logsDiv = document.getElementById('logs-div');
            logsDiv.scrollTop = logsDiv.scrollHeight;
        });
        socket.on('game started', function () {
            lobby.gameStarted = true;
            rummiInit();
            socket.emit('get data on start');
            $scope.$apply();
        });
        socket.on('game stopped', function () {
            lobby.gameStarted = false;
            rummiRemove();
            if (desk) {
                desk.clearGameObjects();
            }
            $scope.$apply();
        });
        socket.on('game over', function (index) {
            lobby.stopGame();
            //alert(rummi.players[index].name + ' has won!');
        });
        socket.on('alert', function (alert) {
            lobby.alert = alert;
            $scope.$apply();
            $('#myModal').modal();
        });
        socket.on('reconnect', function () {
            //alert('SERVER RESTARTED');
            location.reload(true);
        });
        //window.onkeydown = function (e) {
        //    if (e.keyCode === 32) {
        //       $('#myModal').modal();
        //    }
        //}
    });
})();
Date.prototype.getTime = function () {
    var t = {
        h: this.getHours() < 10 ? '0' + this.getHours() : this.getHours(),
        m: this.getMinutes() < 10 ? '0' + this.getMinutes() : this.getMinutes(),
        s: this.getSeconds() < 10 ? '0' + this.getSeconds() : this.getSeconds()
    };
    return t.h + ':' + t.m + ':' + t.s;
};