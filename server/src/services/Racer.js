class Racer {
    constructor(id, name, color, startPoint = null) {
        this._id = id;
        this._name = name;
        this._color = color;
        this._currentPoint = (0, 0);
        this._direction = (1, 0);
        this._physicalPoints = [];
    }
}

module.exports = Racer;