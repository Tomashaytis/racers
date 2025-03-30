class Racer {
    constructor(name, color, bolidSize, width, height, avoidedPoints = [], startPoint = null, startDirection = null) {
        // General params
        this._name = name;
        this._color = color;
        this._bolidSize = bolidSize;
        this._bolidRadius = this._bolidSize * 10;
        this._score = 0;
        this._width = width;
        this._height = height;
        this._cornerPoints = [];
        this._physicalPoints = [];
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
                x: 1, 
                y: 0,
            };
            const turnAngle = this.getRandomDouble(-Math.PI, Math.PI);
            this._direction = this.rotate(this._direction, turnAngle);
        } else {
            this._direction = startPoint;
        }
        this._normal = this.normal(this._direction);
        this.generatePoints();

        // Shape params
        this._bolideHeadLength = this._bolidSize * 8;
        this._bolideFrontLength = this._bolidSize * 6;
        this._bolideMiddleLength = this._bolidSize * 2;
        this._bolideBackLength = this._bolidSize * 8;
        this._bolideTailLength = this._bolidSize * 6;
        this._bolideFrontWidth = this._bolidSize * 2;
        this._bolideMiddleWidth = this._bolidSize * 4;
        this._bolideBackWidth = this._bolidSize * 3;

        // General move params
        this._engineOnTtlMax = 15;
        this._forwardOnTtl = 0;
        this._backwardOnTtl = 0;
        this._leftOnTtl = 0;
        this._rightOnTtl = 0;
        this._timeStep = 1;

        // Move params
        this._velocity = {
            x: 0,
            y: 0,
        };
        this._velocityLimit = 8;
        this._acceleration = {
            x: 0,
            y: 0,
        };
        this._accelerationRel = {
            lon: 0,
            lat: 0,
        };
        this._accelerationRelOff = {
            lon: -0.4,
            lat: -0.3,
        };
        this._accelerationForwardOn = 2;
        this._accelerationBackwardOn = 1;

        // Rotation params
        this._angularVelocity = 0;
        this._angularVelocityValue = 0.1;

        // Collision params
        this._collisionRadius = 3;
        this.collisionFading = 0.75;
    }

    get currentPoint() {
        return this._currentPoint;
    }

    generatePoints() {
        this._cornerPoints = [];
        this._physicalPoints = [];

        this._cornerPoints.push({
            x: this._currentPoint.x + this._direction.x * this._bolideHeadLength, 
            y: this._currentPoint.y + this._direction.y * this._bolideHeadLength,
        });
        this._cornerPoints.push({
            x: this._currentPoint.x + this._direction.x * this._bolideFrontLength + this._normal.x * this._bolideFrontWidth, 
            y: this._currentPoint.y + this._direction.y * this._bolideFrontLength + this._normal.y * this._bolideFrontWidth,
        });
        this._cornerPoints.push({
            x: this._currentPoint.x - this._direction.x * this._bolideMiddleLength + this._normal.x * this._bolideMiddleWidth, 
            y: this._currentPoint.y - this._direction.y * this._bolideMiddleLength + this._normal.y * this._bolideMiddleWidth,
        });
        this._cornerPoints.push({
            x: this._currentPoint.x - this._direction.x * this._bolideBackLength + this._normal.x * this._bolideBackWidth, 
            y: this._currentPoint.y - this._direction.y * this._bolideBackLength + this._normal.y * this._bolideBackWidth,
        });
        this._cornerPoints.push({
            x: this._currentPoint.x - this._direction.x * this._bolideTailLength, 
            y: this._currentPoint.y - this._direction.y * this._bolideTailLength,
        });
        this._cornerPoints.push({
            x: this._currentPoint.x - this._direction.x * this._bolideBackLength - this._normal.x * this._bolideBackWidth, 
            y: this._currentPoint.y - this._direction.y * this._bolideBackLength - this._normal.y * this._bolideBackWidth,
        });
        this._cornerPoints.push({
            x: this._currentPoint.x - this._direction.x * this._bolideMiddleLength - this._normal.x * this._bolideMiddleWidth, 
            y: this._currentPoint.y - this._direction.y * this._bolideMiddleLength - this._normal.y * this._bolideMiddleWidth,
        });
        this._cornerPoints.push({
            x: this._currentPoint.x + this._direction.x * this._bolideFrontLength - this._normal.x * this._bolideFrontWidth, 
            y: this._currentPoint.y + this._direction.y * this._bolideFrontLength - this._normal.y * this._bolideFrontWidth,
        });

        for(let i = 0; i < 2 * this._cornerPoints.length; i++) {
            if (i % 2 == 0) {
                this._physicalPoints.push(this._cornerPoints[i / 2]);
            } else {
                this._physicalPoints.push(this.findMidpoint(this._cornerPoints[(i - 1) / 2], this._cornerPoints[((i + 1) / 2) % this._cornerPoints.length]));
            }
        }

        this._cornerPoints.map((physicalPoint) => {
            physicalPoint = {
                x: Math.round(physicalPoint.x), 
                y: Math.round(physicalPoint.y),
            };
        });
    }

    setEngine(actions) {
        if (actions.forward) {
            this._forwardOnTtl = this._engineOnTtlMax;
        } else {
            this._forwardOnTtl = 0;
        }

        if (actions.backward) {
            this._backwardOnTtl = this._engineOnTtlMax;
        } else {
            this._backwardOnTtl = 0;
        }

        if (actions.left) {
            this._leftOnTtl = this._engineOnTtlMax;
        } else {
            this._leftOnTtl = 0;
        }

        if (actions.right) {
            this._rightOnTtl = this._engineOnTtlMax;
        } else {
            this._rightOnTtl = 0;
        }
    }

    useEngine() {
        this._accelerationRel = {
            lon: 0,
            lat: 0,
        }

        var sign = this.scalar(this._direction, this.project(this._velocity, this._direction));
        if (sign > 0.05) {
            this._accelerationRel.lon += this._accelerationRelOff.lon;
        } else if (sign < -0.05) {
            this._accelerationRel.lon -= this._accelerationRelOff.lon;
        }

        var sign = this.scalar(this._normal, this.project(this._velocity, this._normal));
        if (sign > 0.05) {
            this._accelerationRel.lat += this._accelerationRelOff.lat;
        } else if (sign < -0.05) {
            this._accelerationRel.lat -= this._accelerationRelOff.lat;
        }

        if (this._forwardOnTtl > 0) {
            this._accelerationRel.lon += this._accelerationForwardOn;
            this._forwardOnTtl -= 1;
        }

        if (this._backwardOnTtl > 0) {
            this._accelerationRel.lon -= this._accelerationBackwardOn;
            this._backwardOnTtl -= 1;
        }

        if (this._rightOnTtl > 0) {
            this._angularVelocity = this._angularVelocityValue;
            this._rightOnTtl -= 1
        }

        if (this._leftOnTtl > 0) {
            this._angularVelocity = -this._angularVelocityValue;
            this._leftOnTtl -= 1
        }
    }

    move() {
        this.useEngine();

        this._acceleration = this.reproject(this._accelerationRel, this._direction);
        this._currentPoint = {
            x: this._currentPoint.x + this._velocity.x * this._timeStep + this._acceleration.x * this._timeStep * this._timeStep / 2,
            y: this._currentPoint.y + this._velocity.y * this._timeStep + this._acceleration.y * this._timeStep * this._timeStep / 2,
        };
        this._velocity = {
            x: this._velocity.x + this._acceleration.x * this._timeStep,
            y: this._velocity.y + this._acceleration.y * this._timeStep,
        };
        if (this.length(this._velocity) > this._velocityLimit) {
            const tmp = this.normilize(this._velocity);
            this._velocity = {
                x: tmp.x * this._velocityLimit,
                y: tmp.y * this._velocityLimit,
            };
        }

        this._angularVelocity = this._angularVelocity * this.length(this._velocity) / 10;
        const angle = this._angularVelocity * this._timeStep;
        this._direction = this.rotate(this._direction, angle);
        this._normal = this.normal(this._direction);

        if (this.distance(this._currentPoint, { x: this._currentPoint.x, y: 0 }) < this._bolidRadius) {
            let first = true;
            const corrections = [0];
            for(let point of this._physicalPoints) {
                if (this.distance(point, { x: point.x, y: 0 }) < this._collisionRadius) {
                    if (first) {
                        this._velocity.x = this._velocity.x * this.collisionFading;
                        this._velocity.y = Math.abs(this._velocity.y) * this.collisionFading;
                        first = false;
                    }
                    corrections.push(-point.y);
                }
            }
            this._currentPoint.y += Math.max(...corrections);
        }
        if (this.distance(this._currentPoint, { x: this._currentPoint.x, y: this._height - 1 }) < this._bolidRadius) {
            let first = true;
            const corrections = [0];
            for(let point of this._physicalPoints) {
                if (this.distance(point, { x: point.x, y: this._height - 1 }) < this._collisionRadius) {
                    if (first) {
                        this._velocity.x = this._velocity.x * this.collisionFading;
                        this._velocity.y = -Math.abs(this._velocity.y) * this.collisionFading;
                        first = false;
                    }
                    corrections.push(this._height - 1 - point.y);
                }
            }
            this._currentPoint.y -= Math.max(...corrections);
        }
        if (this.distance(this._currentPoint, { x: 0, y: this._currentPoint.y }) < this._bolidRadius) {
            let first = true;
            const corrections = [0];
            for(let point of this._physicalPoints) {
                if (this.distance(point, { x: 0, y: point.y }) < this._collisionRadius) {
                    if (first) {
                        this._velocity.x = Math.abs(this._velocity.x) * this.collisionFading;
                        this._velocity.y =  this._velocity.y * this.collisionFading;
                        first = false;
                    }
                    corrections.push(-point.x);
                }
            }
            this._currentPoint.x += Math.max(...corrections);
        }
        if (this.distance(this._currentPoint, { x: this._width, y: this._currentPoint.y }) < this._bolidRadius) {
            let first = true;
            const corrections = [0];
            for(let point of this._physicalPoints) {
                if (this.distance(point, { x: this._width - 1, y: point.y }) < this._collisionRadius) {
                    if (first) {
                        this._velocity.x = -Math.abs(this._velocity.x) * this.collisionFading;
                        this._velocity.y =  this._velocity.y * this.collisionFading;
                        first = false;
                    }
                    corrections.push(this._width - 1 - point.x);
                }
            }
            this._currentPoint.x -= Math.max(...corrections);
        }

        this.generatePoints();
    }

    toDto() {
        return {
            name: this._name,
            color: this._color,
            score: this._score,
            points: this._cornerPoints,
        };
    }

    normal(vector) {
        return {
            x: vector.y, 
            y: -vector.x,
        };
    }

    distance(point1, point2) {
        return Math.sqrt((point2.x - point1.x) * (point2.x - point1.x) + (point2.y - point1.y) * (point2.y - point1.y));
    }

    length(vector) {
        return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    }

    normilize(vector) {
        const length = this.length(vector);
        return {
            x: vector.x / length, 
            y: vector.y / length,
        };
    }

    findMidpoint(point1, point2) {
        return {
            x: Math.round((point1.x + point2.x) / 2), 
            y: Math.round((point1.y + point2.y) / 2),
        }
    }

    rotate(vector, angle) {
        return {
            x: vector.x * Math.cos(angle) - vector.y * Math.sin(angle),
            y: vector.x * Math.sin(angle) + vector.y * Math.cos(angle),
        };
    }

    scalar(vector1, vector2) {
        return vector1.x * vector2.x + vector1.y * vector2.y;
    }

    angle(vector1, vector2) {
        return Math.acos(this.scalar(vector1, vector2) / (this.length(vector1) * this.length(vector2)));
    }

    project(vector, axis) {
        const k = this.scalar(vector, axis) / this.scalar(axis, axis);
        return {
            x: k * axis.x,
            y: k * axis.y,
        };
    }

    reproject(vector, basis) {
        const normal = this.normal(basis);
        return {
            x: vector.lon * basis.x + vector.lat * normal.x,
            y: vector.lon * basis.y + vector.lat * normal.y,
        };
    }

    getRandomInt(min, max) {
        const minCeiled = Math.ceil(min);
        const maxFloored = Math.floor(max);
        return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
    }

    getRandomDouble(min, max) {
        return Math.random() * (max - min) + min;
    }
}

module.exports = Racer;