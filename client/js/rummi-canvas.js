var config = {
    cols: 20,
    rows: 8,
    cellSize: 40,
    rackCols: 14,
    rackRows: 2,
    borderWidth: 3,
    colors: ['#000001', '#0000FE', '#FD0001', '#00FD01']
};

var desk = {};

window.addEventListener('load', function () {
    var canvas = new fabric.Canvas('canvas', {
        backgroundColor: '#CACACB',
        renderOnAddRemove: false
    });
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
        selectable: false
    });
    sortByColorBtn.left = rackRect.left - config.cellSize * 0.5 - sortByColorBtn.getFullWidth();

    var sortByNumberBtn = {};
    sortByNumberBtn.rect = new fabric.Rect({
        width: config.cellSize * 2,
        height: config.cellSize * 0.9,
        fill: '#FDFD01',
        stroke: 'black',
        strokeWidth: 1,
        rx: 10,
        ry: 10

    });
    sortByNumberBtn.text = new fabric.Text('5', {
        fontSize: config.cellSize / 1.6,
        //fontWeight: 'bold',
        fill: config.colors[1]
    });
    sortByNumberBtn.text.left = (sortByNumberBtn.rect.getInnerWidth() - sortByNumberBtn.text.getWidth()) / 2;
    sortByNumberBtn.text.top = (sortByNumberBtn.rect.getInnerHeight() - sortByNumberBtn.text.getHeight()) / 2 + 2;
    sortByNumberBtn.text2 = fabric.util.object.clone(sortByNumberBtn.text);
    sortByNumberBtn.text2.set({
        left: sortByNumberBtn.text.left - sortByNumberBtn.text.getWidth(),
        fill: config.colors[0]
    });
    sortByNumberBtn.text3 = fabric.util.object.clone(sortByNumberBtn.text);
    sortByNumberBtn.text3.set({
        left: sortByNumberBtn.text.left + sortByNumberBtn.text.getWidth(),
        fill: config.colors[2]
    });
    sortByNumberBtn = new fabric.Group(
        [
            sortByNumberBtn.rect,
            sortByNumberBtn.text,
            sortByNumberBtn.text2,
            sortByNumberBtn.text3
        ],
        {
            top: sortByColorBtn.top + sortByColorBtn.getFullHeight() + config.cellSize * 0.1,
            selectable: false
        }
    );
    sortByNumberBtn.left = sortByColorBtn.left;

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
        selectable: false
    });
    extraTileBtn.left = rackRect.left + rackRect.getFullWidth() + config.cellSize * 0.5;
    
    sortByColorBtn.action = function () {
        rummi.sortPlayerTilesByColor();
        rummi.updateRack();
        desk.rack(rummi.rack);
    };
    sortByNumberBtn.action = function () {
        rummi.sortPlayerTilesByNumber();
        rummi.updateRack();
        desk.rack(rummi.rack);
    };
    extraTileBtn.action = function () {
        rummi.getNewTile();
    };
    
    

    canvas.add(sortByColorBtn, sortByNumberBtn, extraTileBtn);

    // snap to grid
    canvas.on({
        'mouse:down': function (e) {
            var el = e.target;
            if (!el) return;
            if (el === sortByColorBtn || el === sortByNumberBtn || el === extraTileBtn) {
                el.item(0).prevColor = el.item(0).fill;
                el.item(0).fill = '#D1D102';
            }
            el.savePosition();
            canvas.renderAll();
        },
        'mouse:up': function (e) {
            var el = canvas.getActiveGroup() || e.target;
            if (!el) return;
            if (el === sortByColorBtn || el === sortByNumberBtn || el === extraTileBtn) {
                el.action();
                el.item(0).fill = el.item(0).prevColor;
            }
            canvas.forEachObject(function (obj) {
                if (obj === el) return;
                if (el.intersectsWithObject(obj) && obj.type === 'tile') {
                    el.restorePosition();
                }
            });
            if (!(el.isContainedWithinObject(deskRect) || el.isContainedWithinObject(rackRect))) {
                el.restorePosition();
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
        }
    });

    desk.addTile = function (row, col, location, tile) {
        var left, top;
        tile.location = location;
        tile.row = row;
        tile.col = col;
        if (location === 'desk') {
            top = deskRect.getTop();
            left = deskRect.getLeft();
        }
        else if (location === 'rack') {
            top = rackRect.getTop();
            left = rackRect.getLeft();
        }
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
            top: top + config.cellSize * --row + config.borderWidth + 0.4,
            left: left + config.cellSize * --col + config.borderWidth + 0.4,
            borderColor: 'yellow',
            hoverCursor: 'cursor',
            hasControls: false,
            tile: tile
        });
        canvas.add(group);
        canvas.renderAll();
    };
    //TODO: resolve object stacking
    desk.drawRack = function (rack) {
        desk.clearRack();
        for (var row in rack) {
            for (var col in rack[row]) {
                var tile = rack[row][col];
                if (tile)
                    desk.addTile (row, col, 'rack', tile);
            }
        }
        canvas.renderAll();
    };
    desk.clearRack = function () {
        canvas.forEachObject(function (obj) {
            if (obj.tile && obj.tile.location === 'rack')
                canvas.remove(obj);
        })
    };
    canvas.renderAll();
});