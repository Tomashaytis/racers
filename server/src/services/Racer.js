class Racer {
    constructor(name, color, bolidSize, width, height, avoidedPoints = [], startPoint = null, startDirection = null) {
        this._name = name;
        this._color = color;
        this._bolidSize = bolidSize;
        this._score = 0;
        this._width = width;
        this._height = height;
        this._physicalPoints = [];
        
        this._bolideHeadLength = this._bolidSize * 8;
        this._bolideFrontLength = this._bolidSize * 6;
        this._bolideMiddleLength = this._bolidSize * 2;
        this._bolideBackLength = this._bolidSize * 8;
        this._bolideTailLength = this._bolidSize * 6;
        this._bolideFrontWidth = this._bolidSize * 2;
        this._bolideMiddleWidth = this._bolidSize * 4;
        this._bolideBackWidth = this._bolidSize * 3;

        this._bolidRadius = this._bolidSize * 10;

        if (startPoint == null) {
            while (true) {
                this._currentPoint = {
                    x: this.getRandomInt(this._bolidRadius, width - this._bolidRadius), 
                    y: this.getRandomInt(this._bolidRadius, height - this._bolidRadius),
                };
                let success = true
                for (let point of avoidedPoints) {
                    if (this.distance(point, this._currentPoint) < this._bolidRadius) {
                        success = false;
                        break;
                    }
                }
                if (success) {
                    break;
                }   
            }
        } else {
            this._currentPoint = startPoint;
        }

        if (startDirection == null) {
            this._direction = {
                x: Math.random() - 0.5, 
                y: Math.random() - 0.5,
            };
        } else {
            this._direction = startPoint;
        }

        this.normilizeDirection();
        this.generatePhysicalPoints();
    }

    normilizeDirection() {
        const length = this.length(this._direction);
        this._direction = {
            x: this._direction.x / length, 
            y: this._direction.y / length,
        };
    }

    generatePhysicalPoints() {
        const directionNormal = {
            x: this._direction.y, 
            y: -this._direction.x,
        };
        this._physicalPoints = [];

        this._physicalPoints.push({
            x: this._currentPoint.x + this._direction.x * this._bolideHeadLength, 
            y: this._currentPoint.y + this._direction.y * this._bolideHeadLength,
        });
        this._physicalPoints.push({
            x: this._currentPoint.x + this._direction.x * this._bolideFrontLength + directionNormal.x * this._bolideFrontWidth, 
            y: this._currentPoint.y + this._direction.y * this._bolideFrontLength + directionNormal.y * this._bolideFrontWidth,
        });
        this._physicalPoints.push({
            x: this._currentPoint.x - this._direction.x * this._bolideMiddleLength + directionNormal.x * this._bolideMiddleWidth, 
            y: this._currentPoint.y - this._direction.y * this._bolideMiddleLength + directionNormal.y * this._bolideMiddleWidth,
        });
        this._physicalPoints.push({
            x: this._currentPoint.x - this._direction.x * this._bolideBackLength + directionNormal.x * this._bolideBackWidth, 
            y: this._currentPoint.y - this._direction.y * this._bolideBackLength + directionNormal.y * this._bolideBackWidth,
        });
        this._physicalPoints.push({
            x: this._currentPoint.x - this._direction.x * this._bolideTailLength, 
            y: this._currentPoint.y - this._direction.y * this._bolideTailLength,
        });
        this._physicalPoints.push({
            x: this._currentPoint.x - this._direction.x * this._bolideBackLength - directionNormal.x * this._bolideBackWidth, 
            y: this._currentPoint.y - this._direction.y * this._bolideBackLength - directionNormal.y * this._bolideBackWidth,
        });
        this._physicalPoints.push({
            x: this._currentPoint.x - this._direction.x * this._bolideMiddleLength - directionNormal.x * this._bolideMiddleWidth, 
            y: this._currentPoint.y - this._direction.y * this._bolideMiddleLength - directionNormal.y * this._bolideMiddleWidth,
        });
        this._physicalPoints.push({
            x: this._currentPoint.x + this._direction.x * this._bolideFrontLength - directionNormal.x * this._bolideFrontWidth, 
            y: this._currentPoint.y + this._direction.y * this._bolideFrontLength - directionNormal.y * this._bolideFrontWidth,
        });

        this._physicalPoints.map((physicalPoint) => {
            physicalPoint = {
                x: Math.round(physicalPoint.x), 
                y: Math.round(physicalPoint.y),
            };
        });
    }

    toDto() {
        return {
            name: this._name,
            color: this._color,
            score: this._score,
            points: this._physicalPoints,
        }
    }

    getRandomInt(min, max) {
        const minCeiled = Math.ceil(min);
        const maxFloored = Math.floor(max);
        return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
    }

    get currentPoint() {
        return this._currentPoint;
    }

    distance(point1, point2) {
        return Math.sqrt((point2.x - point1.x) * (point2.x - point1.x) + (point2.y - point1.y) * (point2.y - point1.y));
    }

    length(vector) {
        return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    }
}

module.exports = Racer;