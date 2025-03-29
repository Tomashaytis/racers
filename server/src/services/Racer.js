class Racer {
    constructor(name, color, width, height, avoidedPoints = [], startPoint = null, startDirection = null) {
        this._name = name;
        this._color = color;
        this._score = 0;
        this._width = width;
        this._height = height;
        this._physicalPoints = [];
        
        this._bolidSize = 4;
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
                this._currentPoint = [this.getRandomInt(this._bolidRadius, width - this._bolidRadius), this.getRandomInt(this._bolidRadius, height - this._bolidRadius)];
                success = true
                for (let point of avoidedPoints) {
                    if (distance(point, this._currentPoint) < this._bolidRadius) {
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
            this._direction = [Math.random() - 0.5, Math.random() - 0.5];
        } else {
            this._direction = startPoint;
        }

        this.normilizeDirection();
        this.generatePhysicalPoints();
    }

    normilizeDirection() {
        const length = length(this._direction);
        this._direction = [this._direction[0] / length, this._direction[1] / length];
    }

    generatePhysicalPoints() {
        const directionNormal = [this._direction[1], -this._direction[0]];
        this._physicalPoints = [];
        console.log(this._physicalPoints);

        this._physicalPoints.push([
            this._currentPoint[0] + this._direction[0] * this._bolideHeadLength, 
            this._currentPoint[1] + this._direction[1] * this._bolideHeadLength
        ]);
        console.log(this._currentPoint, this._direction, this._bolideHeadLength);
        this._physicalPoints.push([
            this._currentPoint[0] + this._direction[0] * this._bolideFrontLength + directionNormal[0] * this._bolideFrontWidth, 
            this._currentPoint[1] + this._direction[1] * this._bolideFrontLength + directionNormal[1] * this._bolideFrontWidth
        ]);
        this._physicalPoints.push([
            this._currentPoint[0] - this._direction[0] * this._bolideMiddleLength + directionNormal[0] * this._bolideMiddleWidth, 
            this._currentPoint[1] - this._direction[1] * this._bolideMiddleLength + directionNormal[1] * this._bolideMiddleWidth
        ]);
        this._physicalPoints.push([
            this._currentPoint[0] - this._direction[0] * this._bolideBackLength + directionNormal[0] * this._bolideBackWidth, 
            this._currentPoint[1] - this._direction[1] * this._bolideBackLength + directionNormal[1] * this._bolideBackWidth
        ]);
        this._physicalPoints.push([
            this._currentPoint[0] - this._direction[0] * this._bolideTailLength, 
            this._currentPoint[1] - this._direction[1] * this._bolideTailLength
        ]);
        this._physicalPoints.push([
            this._currentPoint[0] - this._direction[0] * this._bolideBackLength - directionNormal[0] * this._bolideBackWidth, 
            this._currentPoint[1] - this._direction[1] * this._bolideBackLength - directionNormal[1] * this._bolideBackWidth
        ]);
        this._physicalPoints.push([
            this._currentPoint[0] - this._direction[0] * this._bolideMiddleLength - directionNormal[0] * this._bolideMiddleWidth, 
            this._currentPoint[1] - this._direction[1] * this._bolideMiddleLength - directionNormal[1] * this._bolideMiddleWidth
        ]);
        this._physicalPoints.push([
            this._currentPoint[0] + this._direction[0] * this._bolideFrontLength - directionNormal[0] * this._bolideFrontWidth, 
            this._currentPoint[1] + this._direction[1] * this._bolideFrontLength - directionNormal[1] * this._bolideFrontWidth
        ]);

        this._physicalPoints.map((physicalPoint) => {
            physicalPoint = [Math.round(physicalPoint[0]), Math.round(physicalPoint[1])];
        });
    }

    toDto() {
        return {
            name: this._name,
            color: this._color,
            score: this._score,
            physicalPoints: this._physicalPoints,
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
        return Math.sqrt((point2[0] - point1[0]) * (point2[0] - point1[0]) + (point2[1] - point1[1]) * (point2[1] - point1[1]));
    }

    length(vector) {
        return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
    }
}

module.exports = Racer;