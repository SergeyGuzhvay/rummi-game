var config = {
    cols: 20,
    rows: 8,
    cellSize: 40,
    rackCols: 14,
    rackRows: 2,
    borderWidth: 3,
    colors: ['#000001', '#0000FE', '#FD0001', '#00FD01']
};

var desk;

window.addEventListener('load', function () {
    var tooltip = document.getElementById('rummiTooltip');
    var canvas = new fabric.Canvas('mainCanvas', {
        backgroundColor: '#CACACB',
        renderOnAddRemove: false
    });
    //var timerWrap = document.getElementById('timerWrap');
    //timerWrap.style.position = 'absolute';
    //timerWrap.style.border = '1px solid black';
    //timerWrap.style.top = 0;


    //var timer = new fabric.Canvas('timerCanvas', {
    //    backgroundColor: '#CACACB',
    //    renderOnAddRemove: false,
    //    width: 220,
    //    height: 137
    //});
    //timer.style.position = 'absolute';
    //var margin = {
    //    left: (canvas.width - (config.cols * config.cellSize)) / 2,
    //    top: (canvas.height - (config.rows * config.cellSize)) / 2
    //};
    //margin.handLeft = (canvas.width - (config.rackCols * config.cellSize)) / 2;
    //margin.handTop = (margin.top - config.rackRows * config.cellSize) / 2;
    fabric.Rect.prototype.strokeWidth = 0;
    fabric.Group.prototype.hasControls = false;
    fabric.Text.prototype.fontFamily = 'Arial';
    fabric.Text.prototype.fontWeight = 'bold';
    fabric.Circle.prototype.setEndAngle = function (angle) {
        this.endAngle = Math.PI / 180 * angle;
    };
    fabric.Object.prototype.savePosition = function () {
        this._savedPosition = {
            top: this.getTop(),
            left: this.getLeft()
        };
    };
    fabric.Object.prototype.restorePosition = function () {
        this.set({
            top: this._savedPosition.top,
            left: this._savedPosition.left
        });
        this.setCoords();
    };
    fabric.Object.prototype.getInnerTop = function () {
        return this.stroke ? this.top + this.strokeWidth : this.top;
    };
    fabric.Object.prototype.getInnerLeft = function () {
        return this.stroke ? this.left + this.strokeWidth : this.left;
    };
    fabric.Object.prototype.getFullWidth = function () {
        return this.stroke ? this.width + this.strokeWidth : this.width;
    };
    fabric.Object.prototype.getInnerWidth = function () {
        return this.stroke ? this.width - this.strokeWidth : this.width;
    };
    fabric.Object.prototype.getFullHeight = function () {
        return this.stroke ? this.height + this.strokeWidth : this.height;
    };
    fabric.Object.prototype.getInnerHeight = function () {
        return this.stroke ? this.height - this.strokeWidth : this.height;
    };
    // timer
    var tCircle = new fabric.Circle({
        originX: 'center',
        originY: 'center',
        radius: 50,
        top: 70,
        left: 110,
        angle: -90,
        startAngle: 0,
        stroke: 'red',
        strokeWidth: 7,
        fill: '',
        selectable: false
    });
    var tText = new fabric.Text('60 secs', {
        originX: 'center',
        originY: 'center',
        top: 70,
        left: 110,
        fontSize: 16,
        fill: 'black',
        selectable: false
    });
    //var tGroup = new fabric.Group([tCircle, tText]);

    //timer.add(tGroup);
    canvas.add(tCircle, tText);
    //tCircle.center();
    //tText.center();
    //tGroup.centerV();
    //tGroup.centerH();

    // desk
    var deskRect = new fabric.Rect({
        width: config.cols * config.cellSize + config.borderWidth,
        height: config.rows * config.cellSize + config.borderWidth,
        fill: '#989899',
        stroke: 'black',
        strokeWidth: config.borderWidth,
        rx: 10,
        ry: 10,
        selectable: false,
        evented: false
    });
    canvas.add(deskRect);
    deskRect.center();
    deskRect.setCoords();

    // desk grid
    for (var i = 1; i < config.cols; i++) {
        // vertical lines
        canvas.add(new fabric.Line(
            [
                i * config.cellSize + deskRect.left + config.borderWidth,
                deskRect.top + config.borderWidth,
                i * config.cellSize + deskRect.left + config.borderWidth,
                config.cellSize * config.rows + deskRect.top + config.borderWidth
            ],
            {
                stroke: '#656566',
                selectable: false
            }
        ));
        if (i >= config.rows) continue;
        // horizontal lines
        canvas.add(new fabric.Line(
            [
                deskRect.left + config.borderWidth,
                i * config.cellSize + deskRect.top + config.borderWidth,
                config.cellSize * config.cols + deskRect.left + config.borderWidth,
                i * config.cellSize + deskRect.top + config.borderWidth
            ],
            {
                stroke: '#656566',
                selectable: false
            }
        ));
    }

    var marginToprack = ((canvas.height - (deskRect.top + deskRect.height)) - config.rackRows * config.cellSize) / 2;
    // rack
    var rackRect = new fabric.Rect({
        top: deskRect.top + deskRect.height + marginToprack,
        width: config.rackCols * config.cellSize,
        height: config.rackRows * config.cellSize,
        fill: '#B4B4B5',
        selectable: false,
        evented: false
    });
    canvas.add(rackRect);
    rackRect.centerH();
    rackRect.setCoords();

    // rack grid
    for (var i = 0; i <= config.rackCols; i++) {
        // vertical lines
        canvas.add(new fabric.Line(
            [
                i * config.cellSize + rackRect.left,
                rackRect.top,
                i * config.cellSize + rackRect.left ,
                config.cellSize * config.rackRows + rackRect.top
            ],
            {
                stroke: '#656566',
                selectable: false
            }
        ));
        if (i > config.rackRows) continue;
        // horizontal lines
        canvas.add(new fabric.Line(
            [
                rackRect.left,
                i * config.cellSize + rackRect.top,
                config.cellSize * config.rackCols + rackRect.left,
                i * config.cellSize + rackRect.top
            ],
            {
                stroke: '#656566',
                selectable: false
            }
        ));
    }

    // buttons
    var sortByColorBtn = {};
    sortByColorBtn.rect = new fabric.Rect({
        width: config.cellSize * 2,
        height: config.cellSize * 0.9,
        fill: '#FDFD01',
        stroke: 'black',
        strokeWidth: 1,
        rx: 10,
        ry: 10

    });
    sortByColorBtn.text = new fabric.Text('123', {
        fontSize: config.cellSize / 1.6,
        //fontWeight: 'bold',
        fill: config.colors[0]
        //stroke: 'black',
        //strokeWidth: 2
    });
    sortByColorBtn.text.left = (sortByColorBtn.rect.getInnerWidth() - sortByColorBtn.text.getWidth()) / 2;
    sortByColorBtn.text.top = (sortByColorBtn.rect.getInnerHeight() - sortByColorBtn.text.getHeight()) / 2 + 2;
    sortByColorBtn = new fabric.Group([sortByColorBtn.rect, sortByColorBtn.text], {
        top: rackRect.top + config.cellSize * 0.05,
        type: 'button',
        selectable: false
    });
    sortByColorBtn.left = rackRect.left - config.cellSize * 0.5 - sortByColorBtn.getFullWidth();

    var sortByNumberBtn = fabric.util.object.clone(sortByColorBtn);
    sortByNumberBtn._objects = [
        fabric.util.object.clone(sortByColorBtn._objects[0]),
        fabric.util.object.clone(sortByColorBtn._objects[1]).set({
            text: '5'
        }),
        fabric.util.object.clone(sortByColorBtn._objects[1]).set({
            text: '5',
            fill: config.colors[1],
            left: sortByColorBtn._objects[1].getLeft() + sortByColorBtn._objects[1].getWidth() / 3
        }),
        fabric.util.object.clone(sortByColorBtn._objects[1]).set({
            text: '5',
            fill: config.colors[2],
            left: sortByColorBtn._objects[1].getLeft() + sortByColorBtn._objects[1].getWidth() / 3 * 2
        })
    ];
    sortByNumberBtn.top = sortByColorBtn.getTop() + sortByColorBtn.getFullHeight() + config.cellSize * 0.1;

    //TODO: сделать клон кнопки
    var extraTileBtn = {};
    extraTileBtn.rect = new fabric.Rect({
        width: config.cellSize,
        height: config.cellSize * 1.9,
        fill: '#FDFD01',
        stroke: 'black',
        strokeWidth: 1,
        rx: 10,
        ry: 10

    });
    extraTileBtn.text = new fabric.Text('+', {
        fontSize: config.cellSize,
        //fontWeight: 'bold',
        fill: config.colors[0]
        //stroke: 'black',
        //strokeWidth: 2
    });
    extraTileBtn.text.left = (extraTileBtn.rect.getInnerWidth() - extraTileBtn.text.getWidth()) / 2 + 0.5;
    extraTileBtn.text.top = (extraTileBtn.rect.getInnerHeight() - extraTileBtn.text.getHeight()) / 2 + 5.5;
    extraTileBtn = new fabric.Group([extraTileBtn.rect, extraTileBtn.text], {
        top: rackRect.top + config.cellSize * 0.05,
        type: 'button',
        selectable: false
    });
    extraTileBtn.left = rackRect.left + rackRect.getFullWidth() + config.cellSize * 0.5;

    var cancelDeskBtn = new fabric.Group(
        [
            fabric.util.object.clone(sortByColorBtn._objects[0]).set({
                width: config.cellSize * 0.9
            }),
            fabric.util.object.clone(sortByColorBtn._objects[1]).set({
                text: '✖',
                fill: 'red',
                fontSize: config.cellSize / 2,
                top: -11,
                left: -30.5
            })
        ],
        {
            top: rackRect.top + config.cellSize * 0.05,
            left: rackRect.left + rackRect.getFullWidth() + config.cellSize * 1.6,
            type: 'button',
            selectable: false
        }
    );

    var acceptDeskBtn = fabric.util.object.clone(cancelDeskBtn);
    acceptDeskBtn._objects = [
        fabric.util.object.clone(cancelDeskBtn._objects[0]),
        fabric.util.object.clone(cancelDeskBtn._objects[1]).set({
            text: '✔',
            fill: 'green'
        })
    ];
    acceptDeskBtn.top = cancelDeskBtn.getTop() + cancelDeskBtn.getFullHeight() + config.cellSize * 0.1;

    sortByColorBtn.action = function () {
        rummi.sortPlayerTilesByColor();
        desk.drawRack(rummi[2]);
    };
    sortByNumberBtn.action = function () {
        rummi.sortPlayerTilesByNumber();
        desk.drawRack(rummi[2]);
    };
    extraTileBtn.action = function () {
        rummi.getExtraTile();
    };
    cancelDeskBtn.action = function () {
        //rummi.cancelDesk();
    };
    acceptDeskBtn.action = function () {
        console.log(rummi.checkDesk());
    };

    sortByColorBtn.tooltip = 'Sort your tiles by color';
    sortByNumberBtn.tooltip = 'Sort your tiles by numbers';
    extraTileBtn.tooltip = 'Get extra tile and skip your turn';
    cancelDeskBtn.tooltip = 'Revert desk changes';
    acceptDeskBtn.tooltip = 'End your turn';
    
    canvas.add(sortByColorBtn, sortByNumberBtn, extraTileBtn, cancelDeskBtn, acceptDeskBtn);

    //TODO: цвет кнопок не меняется перед началом игры
    // canvas events
    var tooltipTimeout = 0;
    canvas.on({
        'mouse:move': function (e) {
            // tooltip
            clearTimeout(tooltipTimeout);
            tooltip.style.display = 'none';
            if (!e.target || e.target.type !== 'button') return;
            tooltipTimeout = setTimeout(function () {
                var x = e.e.clientX,
                    y = e.e.clientY;
                tooltip.innerHTML = e.target.tooltip;
                tooltip.style.top = (y - 30) + 'px';
                tooltip.style.left = (x + 10) + 'px';
                tooltip.style.display = 'block';
            }, 500);

        },
        'mouse:down': function (e) {
            var el = e.target;
            if (!el) return;
            if (el.type === 'button') {
                el.item(0).prevColor = el.item(0).fill;
                el.item(0).fill = '#D1D102';
            }
            el.savePosition();
            canvas.renderAll();
        },
        'mouse:up': function (e) {
            var el = canvas.getActiveGroup() || e.target;
            if (!el) return;
            if (el.type === 'button') {
                el.action();
                el.item(0).fill = el.item(0).prevColor;
            }
            canvas.renderAll();
        },
        'object:modified': function (e) {
            var el = canvas.getActiveGroup() || e.target;
            //canvas.forEachObject(function (obj) {
            //    if (obj === el) return;
            //    if (el.intersectsWithObject(obj) && obj.tileId) {
            //        el.restorePosition();
            //    }
            //});
            for (var i in canvas._objects) {
                var obj = canvas._objects[i];
                if (obj === el) continue;
                if (el.intersectsWithObject(obj) && obj.tileId) {
                    el.restorePosition();
                    return;
                }
            }
            if (!(el.isContainedWithinObject(deskRect) || el.isContainedWithinObject(rackRect))) {
                el.restorePosition();
            }
            else {
                //var group = canvas.getActiveGroup();
                if (el._objects[0] instanceof fabric.Group) {
                    //var newGroup = new fabric.Group();
                    //var objects = [];
                    canvas.discardActiveGroup();
                    el._objects.forEach(function (obj) {
                        //objects.push(desk.getTileById(obj.tileId));
                        obj = desk.getTileById(obj.tileId);
                        var pos = desk.getTilePosition(obj);
                        rummi.moveTile(pos.row, pos.col, pos.location, obj.tileId);
                        //if (i > 0) return;
                        //console.log(obj.originX, obj.originY);
                        //console.log(obj);
                        //var pos = desk.getTilePosition(obj);
                        //console.log(obj);
                        //console.log(pos);
                        //rummi.moveTile(pos.row, pos.col, pos.location, obj.tileId);
                    });
                    //objects.forEach(function (obj) {
                    //    var pos = desk.getTilePosition(obj);
                    //    rummi.moveTile(pos.row, pos.col, pos.location, obj.tileId);
                    //    //newGroup.add(obj);
                    //});

                    //canvas.add(newGroup);
                    //canvas.setActiveGroup(newGroup);
                    //canvas.renderAll();
                }
                else {
                    var pos = desk.getTilePosition(el);
                    //console.log(pos);
                    rummi.moveTile(pos.row, pos.col, pos.location, el.tileId);
                }
            }
            canvas.renderAll();
        },
        'object:moving': function (e) {
            var el = e.target;
            el.setCoords();
            if (el.isContainedWithinObject(deskRect)) {
                el.set({
                    left: Math.round((el.left - (deskRect.getInnerLeft() + 3.5)) / config.cellSize) * config.cellSize + deskRect.getInnerLeft() + 3.5,
                    top: Math.round((el.top - (deskRect.getInnerTop()) + 3.5) / config.cellSize) * config.cellSize + deskRect.getInnerTop() + 3.5
                });
            }
            else if (el.isContainedWithinObject(rackRect)) {
                el.set({
                    left: Math.round((el.left - (rackRect.getInnerLeft() + 3.5)) / config.cellSize) * config.cellSize + rackRect.getInnerLeft() + 3.5,
                    top: Math.round((el.top - (rackRect.getInnerTop()) + 3.5) / config.cellSize) * config.cellSize + rackRect.getInnerTop() + 3.5
                });
            }
            if (!canvas.getActiveGroup()) el.bringToFront();
            el.setCoords();
            canvas.renderAll();
            //canvas.add(el);
        },
        'object:selected': function (e) {
            desk.removeInvalidSets();
        }
    });

    desk = {
        tInterval: 0,
        players: 0,
        mText: new fabric.Text('Player 2 turn', {
            originY: 'center',
            top: 50,
            left: 650,
            fontSize: 16,
            fill: 'black',
            selectable: false
        }),
        startTimer: function () {
            clearInterval(this.tInterval);
            //var angle = 360;
            var secondsAngle = 360 / 60;
            var seconds = 4;
            this.tInterval = setInterval(function () {
                //angle -= secondsAngle;
                tCircle.setEndAngle(secondsAngle * seconds);
                if (seconds === 1)
                    tText.text = '1 sec';
                else if (seconds === 0) {
                    seconds = 60;
                    tCircle.setEndAngle(secondsAngle * seconds);
                    tText.text = 'Time out';
                    clearInterval(desk.tInterval);
                }
                else
                    tText.text = seconds + ' secs';
                canvas.renderAll();
                seconds--;
            }, 1000);
        },
        drawPlayers: function (players) {
            players.push(players[0]);
            players.push(players[0]);
            players.push(players[0]);
            players.forEach(function (player, i) {
                var shift = i * 100;
                var name = new fabric.Text(player.name, {
                    fontSize: 14,
                    //fontWeight: 'bold',
                    fill: 'black',
                    top: 110,
                    left: 220 + shift,
                    selectable: false
                });
                fabric.Image.fromURL(player.avatar, function (img) {
                    img.set({
                        originX: 'center',
                        originY: 'center',
                        width: 60,
                        height: 60,
                        top: 70,
                        left: 250 + shift,
                        shadow: 'rgba(0,0,0,0.3) 5px 5px 5px',
                        selectable: false
                    });
                    if (rummi.playerIndex === i) {
                        img.set({
                            stroke: '#4CD146',
                            strokeWidth: 2
                        });
                    }
                    //pText.set({
                    //    originX: 'center',
                    //    originY: 'center',
                    //    top: img.getTop() + img.getHeight(),
                    //    left: img.getLeft()
                    //});
                    canvas.add(img);
                    canvas.renderAll();
                });
                desk.drawTileNumbers(player, i);
                canvas.add(name);
            });
            canvas.renderAll();
        },
        drawTileNumbers: function (player, index) {
            var shift = index * 100;
            var tRect = new fabric.Rect({
                originX: 'center',
                originY: 'center',
                width: 30,
                height: 22,
                top: 20,
                left: 250 + shift,
                fill: 'white',
                stroke: 'black',
                //strokeWidth: 2,
                rx: 5,
                ry: 5,
                selectable: false
            });
            var tNumber =  new fabric.Text(String(player.tilesNumber), {
                originX: 'center',
                originY: 'center',
                fontSize: 12,
                //fontWeight: 'bold',
                fill: 'black',
                top: 22,
                left: 250 + shift,
                selectable: false
            });
            canvas.add(tRect, tNumber);
            canvas.renderAll();
        },
        drawTile: function (tile) {
            //tile.location = location;
            //tile.row = row;
            //tile.col = col;
            var top = tile.location === 1 ? deskRect.getInnerTop() : rackRect.getTop();
            var left = tile.location === 1 ? deskRect.getInnerLeft() : rackRect.getLeft();
            var rect = new fabric.Rect({
                width: 34,
                height: 34,
                stroke: 'black',
                strokeWidth: 0.4,
                fill: config.colors[tile.color]
            });
            var text = new fabric.Text(String(tile.number), {
                fill: 'white',
                fontSize: config.cellSize / 2.3
                //stroke: 'white'
            });
            text.left = (rect.getInnerWidth() - text.getWidth()) / 2;
            text.top = (rect.getFullHeight() - text.getHeight()) / 2 + 1;
            var group = new fabric.Group([rect, text], {
                top: top + config.cellSize * tile.row + (config.cellSize - rect.getInnerWidth()) / 2,
                left: left + config.cellSize * tile.col + (config.cellSize - rect.getInnerWidth()) / 2,
                borderColor: 'yellow',
                hoverCursor: 'cursor',
                hasControls: false,
                type: 'tile',
                tileId: tile.id
            });
            canvas.add(group);
            canvas.renderAll();
        },
        updateTile: function (tile) {
            //var group = canvas.getActiveGroup();
            var obj = this.getTileById(tile.id);
            var top = tile.location === 1 ? deskRect.getInnerTop() : rackRect.getTop();
            var left = tile.location === 1 ? deskRect.getInnerLeft() : rackRect.getLeft();
            //if (group) {
            //    tile = rummi.getTileById(group._objects[0].tileId);
            //    console.log(tile);
            //    group.top = top + config.cellSize * tile.row + (config.cellSize - obj._objects[0].getInnerWidth()) / 2;
            //    group.left = left + config.cellSize * tile.col + (config.cellSize - obj._objects[0].getInnerWidth()) / 2;
            //    group.setCoords();
            //}
            //else {
            obj.top = top + config.cellSize * tile.row + (config.cellSize - obj._objects[0].getInnerWidth()) / 2;
            obj.left = left + config.cellSize * tile.col + (config.cellSize - obj._objects[0].getInnerWidth()) / 2;
            obj.setCoords();
            //}
        },
        drawRack: function (rack) {
            desk.clearRack();
            for (var n in rack) {
                var tile = rack[n];
                    if (tile)
                        desk.drawTile(tile);
            }
            canvas.renderAll();
        },
        clearRack: function () {
            canvas.forEachObject(function (obj) {
                if (obj.tileId && obj.isContainedWithinObject(rackRect))
                    canvas.remove(obj);
            });
        },
        getTilePosition: function (tile) {
            var position = {};
            //var group = canvas.getActiveGroup();
            //if (group) {
            //    if (group.isContainedWithinObject(deskRect)) {
            //        position.location = 1;
            //        position.row = Math.floor((group.getTop() + tile.getTop() - deskRect.getInnerTop()) / config.cellSize);
            //        position.col = Math.floor((group.getLeft() + tile.getLeft() - deskRect.getInnerLeft()) / config.cellSize);
            //        //position.row = Math.floor((tile._originalTop - deskRect.getInnerTop()) / config.cellSize);
            //        //position.col = Math.floor((tile._originalLeft - deskRect.getInnerLeft()) / config.cellSize);
            //
            //    }
            //    else if (group.isContainedWithinObject(rackRect)) {
            //        position.location = 2;
            //        position.row = Math.floor((group.getTop() + tile.getTop() - rackRect.getTop()) / config.cellSize);
            //        position.col = Math.floor((group.getLeft() + tile.getLeft() - rackRect.getLeft()) / config.cellSize);
            //    }
            //}
            //else {
                if (tile.isContainedWithinObject(deskRect)) {
                    position.location = 1;
                    position.row = Math.floor((tile.getTop() - deskRect.getInnerTop()) / config.cellSize);
                    position.col = Math.floor((tile.getLeft() - deskRect.getInnerLeft()) / config.cellSize);
                }
                else if (tile.isContainedWithinObject(rackRect)) {
                    position.location = 2;
                    position.row = Math.floor((tile.getTop() - rackRect.getTop()) / config.cellSize);
                    position.col = Math.floor((tile.getLeft() - rackRect.getLeft()) / config.cellSize);
                }
            //}
            return position;
        },
        getTileById: function (id) {
            //var result;
            //canvas.forEachObject(function (obj) {
            //    if (obj.tileId === id)
            //        result = obj;
            //});
            //return result;
            for (var i in canvas._objects) {
                var obj = canvas._objects[i];
                if (obj.tileId === id)
                    return obj;
            }
        },
        removeTile: function (id) {
            var obj = this.getTileById(id);
            canvas.remove(obj);
            canvas.renderAll();
        },
        showInvalidSet: function (set) {
            var firstTile = this.getTileById(set[0].id);
            if (!firstTile) {
                console.log('ERROR: "showInvalidSet" firstTile not defined');
                console.log(set);
            }
            var invalidSet = new fabric.Rect({
                top: firstTile.getTop() - config.borderWidth,
                left: firstTile.getLeft() - config.borderWidth,
                width: config.cellSize * set.length - config.borderWidth,
                height: config.cellSize - config.borderWidth,
                fill: '',
                stroke: 'red',
                strokeWidth: config.borderWidth,
                selectable: false,
                evented: false,
                type: 'invalidSet'
            });
            canvas.add(invalidSet);
        },
        removeInvalidSets: function () {
            canvas.forEachObject(function (obj) {
                if (obj.type === 'invalidSet') {
                    canvas.remove(obj);
                }
            })
        }
        //moveTile: function (row, col, location, id) {
            //var obj = desk.getTileById(id);
            //canvas.remove(obj);
            //rummi.moveTile(row, col, location, id);
        //}
    };

    //desk.mText.text = 'test message';
    //desk.mText.set('fontSize', 14);
    var mText = desk.mText.text;
    var points = ['', '.', '..', '...'];
    var cnt = 0;
    //desk.mText.text = '';
    setInterval(function () {
        if (!desk.mText.text) return;
        cnt = cnt > 3 ? 0 : cnt;
        desk.mText.text = mText + points[cnt];
        canvas.renderAll();
        cnt++;
    }, 500);
    //var textAnimation = function () {
    //    desk.mText.animate('angle', 45, {
    //        //duration: 1000,
    //        onChange: canvas.renderAll.bind(canvas),
    //        onComplete: function () {
    //            desk.mText.animate('angle', -45, {
    //                duration: 1000,
    //                onChange: canvas.renderAll.bind(canvas),
    //                onComplete: textAnimation
    //            });
    //        }
    //    });
    //};
    //textAnimation();

    canvas.add(desk.mText);
    canvas.renderAll();

    window.addEventListener('keydown', function (e) {
        if (e.keyCode === 83) desk.startTimer();
        if (e.keyCode !== 32) return;
        console.log(canvas.getActiveObject());
    });
});