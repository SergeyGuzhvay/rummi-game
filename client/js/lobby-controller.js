var socket = io();
var lobby = {};
window.addEventListener('load', function () {
    socket.on('games list', function (list) {
        list.forEach(function (game) {
            lobby.addGame(game);
        });
    });
    socket.on('add game', function (game) {
        lobby.addGame(game);
    });
    socket.on('remove game', function (id) {
        lobby.removeGame(id);
        if (lobby.gameId == id)
            lobby.leave();
    });
    socket.on('update list game', function (game) {
        lobby.updateGame(game);
    });
    socket.on('update game', function (players) {
        for (var i = 0; i < 4; i++ ) {
            var name = players[i] ? players[i].name : '';
            $('#player-name-' + i).html(name);
        }
        //players.forEach(function (player, i) {
        //});
        rummi.players = players;
    });
    socket.on('connected', function (data) {
        $('#lobby-div').hide();
        $('#game-nav').show();
        $('#game-name').html(data.gameName);
        //console.log(data.players);
        for (var i = 0; i < 4; i++ ) {
            var name = data.players[i] ? data.players[i].name : '';
            $('#player-name-' + i).html(name);
        }

        rummi.index = data.index;
        rummi.players = data.players;
        rummi.player = rummi.players[rummi.index];
        console.log('connected');
    });
    //socket.on('disconnected', function () {
    //    console.log('disconnected');
    //
    //});

    var buttons = ['create', 'join', 'start', 'leave'];
    buttons.forEach(function (btn) {
        $('#' + btn + '-btn').click(function () {
            socket.emit(btn, lobby[btn]());
        });
    });

    $('#games-list').on('click', '.game-info', function () {
        $('.game-info').toggleClass('active', false);
        $(this).toggleClass('active', true);
        var private = $('#games-list .active').data('private');
        console.log(private);
        $('#join-password-wrap').toggle(private);
        $('#join-password-input').val('');
    });
    $('#private-checkbox').on('change', function () {
        $('#create-password-wrap').toggle($(this).is(':checked'));
    });
    $('.tabs').click(function (e) {
        $('.tabs').toggleClass('active', false);
        $(this).toggleClass('active', true);
        $('#create-div').toggle($('#create-tab').hasClass('active'));
        $('#join-div').toggle($('#join-tab').hasClass('active'));
    });

    lobby = {
        create: function () {
            //TODO: проверить сначала галочку "private" перед отсылкой пароля
            return {
                gameName: $('#game-name-input').val(),
                password: $('#create-password-input').val(),
                playerName: $('#name-input').val()
            };
        },
        join: function () {
            var playerName = $('#name-input');
            var selectedGame = $('.game-info.active');
            this.gameId = selectedGame.data('id');
            var password = $('#join-password-input');
            //playerName.toggleClass('notValid', !playerName.val());
            //password.toggleClass('notValid', !password.val());
            //if (selectedGame.data('private') && !password.val()) return;
            //if (!playerName.val()) return;
            return {
                id: selectedGame.data('id'),
                password: password.val(),
                playerName: playerName.val()
            };
        },
        leave: function () {
            $('#lobby-div').show();
            $('#game-nav').hide();
            if (desk) {
                desk.clearGameObjects();
                desk.clear();
            }
        },
        start: function () {
            return 3;
        },
        addGame: function (game) {
            var gamesList = $('#games-list');
            var span = game.password ? $('<span></span>').addClass('glyphicon glyphicon-lock') : $('<span></span>');
            var tr = $('<tr data-id="' + game.id + '" data-private="' + game.password + '"></tr>');
            gamesList.append(
                tr.addClass('game-info').append(
                    $('<td></td>').addClass('col-md-1').append(span),
                    $('<td></td>').addClass('col-md-2').html(game.playersNumber + '/4'),
                    $('<td></td>').addClass('col-md-9').html(game.gameName)
                )
            );
        },
        removeGame: function (id) {
            $('.game-info[data-id="' + id + '"]').remove();
        },
        updateGame: function (game) {
            $('.game-info[data-id="' + game.id + '"] td:nth-of-type(2)').html(game.playersNumber + '/4');
        }
    };
    //setTimeout(function () {
    //
    //}, 500);
});
//var nickname = prompt('Enter your name:');
//socket.emit('nickname', nickname);
//socket.on('number of players', function (number) {
//    playersEl.innerHTML = number;
//});
