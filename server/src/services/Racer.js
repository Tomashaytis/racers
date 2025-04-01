class Racer {
    constructor(name, color, bolidSize, velocityLimit, engineOnTtl, width, height, avoidedPoints = [], startPoint = null, startDirection = null) {
        // General params
        this._name = name;
        this._color = color;
        this._bolidSize = bolidSize;
        this._bolidRadius = this._bolidSize * 10;
        this._pickRadius = 10;
        this._score = 0;
        this._width = width;
        this._height = height;
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
        this._engineOnTtl = engineOnTtl;
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
        this._velocityLimit = velocityLimit;
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
        this._angularVelocityValue = 0.02;
        this._angularVelocityLimit = 0.1;

        // Collision params
        this._wallCollisionRadius = 3;
        this._collisionFading = 0.75;
        this._inertia = 1 / 12 * (4 * this._bolideHeadLength * this._bolideHeadLength + 4 * this._bolideMiddleWidth * this._bolideMiddleWidth);
        this._correctionFactor = 0.8;
    }

    get currentPoint() {
        return this._currentPoint;
    }

    get name() {
        return this._name;
    }

    get color() {
        return this._color;
    }

    generatePoints() {
        this._physicalPoints = [];

        this._physicalPoints.push({
            x: this._currentPoint.x + this._direction.x * this._bolideHeadLength, 
            y: this._currentPoint.y + this._direction.y * this._bolideHeadLength,
        });
        this._physicalPoints.push({
            x: this._currentPoint.x + this._direction.x * this._bolideFrontLength + this._normal.x * this._bolideFrontWidth, 
            y: this._currentPoint.y + this._direction.y * this._bolideFrontLength + this._normal.y * this._bolideFrontWidth,
        });
        this._physicalPoints.push({
            x: this._currentPoint.x - this._direction.x * this._bolideMiddleLength + this._normal.x * this._bolideMiddleWidth, 
            y: this._currentPoint.y - this._direction.y * this._bolideMiddleLength + this._normal.y * this._bolideMiddleWidth,
        });
        this._physicalPoints.push({
            x: this._currentPoint.x - this._direction.x * this._bolideBackLength + this._normal.x * this._bolideBackWidth, 
            y: this._currentPoint.y - this._direction.y * this._bolideBackLength + this._normal.y * this._bolideBackWidth,
        });
        this._physicalPoints.push({
            x: this._currentPoint.x - this._direction.x * this._bolideTailLength, 
            y: this._currentPoint.y - this._direction.y * this._bolideTailLength,
        });
        this._physicalPoints.push({
            x: this._currentPoint.x - this._direction.x * this._bolideBackLength - this._normal.x * this._bolideBackWidth, 
            y: this._currentPoint.y - this._direction.y * this._bolideBackLength - this._normal.y * this._bolideBackWidth,
        });
        this._physicalPoints.push({
            x: this._currentPoint.x - this._direction.x * this._bolideMiddleLength - this._normal.x * this._bolideMiddleWidth, 
            y: this._currentPoint.y - this._direction.y * this._bolideMiddleLength - this._normal.y * this._bolideMiddleWidth,
        });
        this._physicalPoints.push({
            x: this._currentPoint.x + this._direction.x * this._bolideFrontLength - this._normal.x * this._bolideFrontWidth, 
            y: this._currentPoint.y + this._direction.y * this._bolideFrontLength - this._normal.y * this._bolideFrontWidth,
        });

        this._physicalPoints.map((physicalPoint) => {
            physicalPoint = {
                x: Math.round(physicalPoint.x), 
                y: Math.round(physicalPoint.y),
            };
        });
    }

    setEngine(actions) {
        if (actions.forward) {
            this._forwardOnTtl = this._engineOnTtl;
        } else {
            this._forwardOnTtl = 0;
        }

        if (actions.backward) {
            this._backwardOnTtl = this._engineOnTtl;
        } else {
            this._backwardOnTtl = 0;
        }

        if (actions.left) {
            this._leftOnTtl = this._engineOnTtl;
        } else {
            this._leftOnTtl = 0;
        }

        if (actions.right) {
            this._rightOnTtl = this._engineOnTtl;
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
        } else {
            this._accelerationRel.lat = 0;
        }

        var sign = this.scalar(this._normal, this.project(this._velocity, this._normal));
        if (sign > 0.05) {
            this._accelerationRel.lat += this._accelerationRelOff.lat;
        } else if (sign < -0.05) {
            this._accelerationRel.lat -= this._accelerationRelOff.lat;
        } else {
            this._accelerationRel.lat = 0;
        }

        if (this._rightOnTtl > 0 && this._forwardOnTtl > 0 && this._backwardOnTtl === 0) {
            this._angularVelocity += this._angularVelocityValue;
            this._rightOnTtl -= 1
        }

        if (this._leftOnTtl > 0 && this._forwardOnTtl > 0 && this._backwardOnTtl === 0)  {
            this._angularVelocity -= this._angularVelocityValue;
            this._leftOnTtl -= 1
        }

        if (this._rightOnTtl > 0 && this._backwardOnTtl > 0 && this._forwardOnTtl === 0) {
            this._angularVelocity -= this._angularVelocityValue;
            this._rightOnTtl -= 1
        }

        if (this._leftOnTtl > 0 && this._backwardOnTtl > 0 && this._forwardOnTtl === 0)  {
            this._angularVelocity += this._angularVelocityValue;
            this._leftOnTtl -= 1
        }

        if (this._forwardOnTtl > 0) {
            this._accelerationRel.lon += this._accelerationForwardOn;
            this._forwardOnTtl -= 1;
        }

        if (this._backwardOnTtl > 0) {
            this._accelerationRel.lon -= this._accelerationBackwardOn;
            this._backwardOnTtl -= 1;
        }
    }

    move(star) {
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
        this._velocity = this.length(this._velocity) < 0.25 ? { x: 0, y: 0 } : this._velocity

        if (this.length(this._velocity) > this._velocityLimit) {
            const tmp = this.normilize(this._velocity);
            this._velocity = {
                x: tmp.x * this._velocityLimit,
                y: tmp.y * this._velocityLimit,
            };
        }

        this._angularVelocity = this._angularVelocity * this.length(this._velocity) / 10;
        if (this._angularVelocity > this._angularVelocityLimit) {
            this._angularVelocity = this._angularVelocityLimit;
        }
        const angle = this._angularVelocity * this._timeStep;
        this._direction = this.rotate(this._direction, angle);
        this._normal = this.normal(this._direction);

        if (this.distance(this._currentPoint, { x: this._currentPoint.x, y: 0 }) < this._bolidRadius) {
            let first = true;
            const corrections = [0];
            for(let point of this._physicalPoints) {
                if (this.distance(point, { x: point.x, y: 0 }) < this._wallCollisionRadius) {
                    if (first) {
                        this._velocity.x = this._velocity.x * this._collisionFading;
                        this._velocity.y = Math.abs(this._velocity.y) * this._collisionFading;
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
                if (this.distance(point, { x: point.x, y: this._height - 1 }) < this._wallCollisionRadius) {
                    if (first) {
                        this._velocity.x = this._velocity.x * this._collisionFading;
                        this._velocity.y = -Math.abs(this._velocity.y) * this._collisionFading;
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
                if (this.distance(point, { x: 0, y: point.y }) < this._wallCollisionRadius) {
                    if (first) {
                        this._velocity.x = Math.abs(this._velocity.x) * this._collisionFading;
                        this._velocity.y =  this._velocity.y * this._collisionFading;
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
                if (this.distance(point, { x: this._width - 1, y: point.y }) < this._wallCollisionRadius) {
                    if (first) {
                        this._velocity.x = -Math.abs(this._velocity.x) * this._collisionFading;
                        this._velocity.y =  this._velocity.y * this._collisionFading;
                        first = false;
                    }
                    corrections.push(this._width - 1 - point.x);
                }
            }
            this._currentPoint.x -= Math.max(...corrections);
        }

        this.generatePoints();

        if (this.distance(star, this._currentPoint) > this._bolidRadius) {
            return false;
        }
        for(let point of this._physicalPoints) {
            if (this.distance(star, point) < this._pickRadius) {
                this._score += 1;
                return true;
            }
        }
        return false;
    }

    static bolidCollisions(racers) {
        const processed = [];
        racers.forEach((racer1, id1) => {
            racers.forEach((racer2, id2) => {
                if (id1 === id2 || processed.includes(id2) || racer1.distance(racer1._currentPoint, racer2._currentPoint) > racer1._bolidRadius) {
                    return;
                }

                const collisionData = racer1.findCollisionData(racer1._physicalPoints, racer2._physicalPoints, racer1._currentPoint, racer2._currentPoint);
                if (collisionData == null) {
                    return;
                }
                const [collisionNormal, collisionOverlap] = collisionData;
                const collisionPoint = racer1.findCollisionPoint(racer1._physicalPoints, racer2._physicalPoints);
                
                const collisionVelocity1 = {
                    x: racer1._velocity.x + racer1._angularVelocity * (collisionPoint.x - racer1._currentPoint.x),
                    y: racer1._velocity.y + racer1._angularVelocity * (collisionPoint.y - racer1._currentPoint.y),
                };
                const collisionVelocity2 = {
                    x: racer2._velocity.x + racer2._angularVelocity * (collisionPoint.x - racer2._currentPoint.x),
                    y: racer2._velocity.y + racer2._angularVelocity * (collisionPoint.y - racer2._currentPoint.y),
                };
                
                const velocityRel = racer1.scalar(racer1.vectorSub(collisionVelocity1, collisionVelocity2), collisionNormal);
                if (velocityRel >= 0) {
                    return;
                }

                const moment1 = racer1.scalar(racer1.vectorSub(collisionPoint, racer1._currentPoint), collisionNormal);
                const moment2 = racer1.scalar(racer1.vectorSub(collisionPoint, racer2._currentPoint), collisionNormal);
                const impulse = -(1 + racer1._collisionFading) * velocityRel / (2 + moment1 * moment1 / racer1._inertia + moment2 * moment2 / racer2._inertia);

                racer1._velocity.x += impulse * collisionNormal.x;
                racer1._velocity.y += impulse * collisionNormal.y;
                racer2._velocity.x -= impulse * collisionNormal.x;
                racer2._velocity.y -= impulse * collisionNormal.y;

                racer1._angularVelocity += impulse * moment1 / racer1._inertia;
                racer2._angularVelocity -= impulse * moment2 / racer2._inertia;

                const correction = collisionOverlap * racer1._correctionFactor / (2);
            
                const correctionX = collisionNormal.x * correction;
                const correctionY = collisionNormal.y * correction;
            
                racer1._currentPoint.x += correctionX;
                racer1._currentPoint.y += correctionY;
                racer2._currentPoint.x -= correctionX;
                racer2._currentPoint.y -= correctionY;
            });
            processed.push(id1);
        });
    }

    toDto() {
        return {
            name: this._name,
            color: this._color,
            score: this._score,
            points: this._physicalPoints,
        };
    }

    vector(point1, point2) {
        return {
            x: point2.x - point1.x,
            y: point2.y - point1.y,
        };
    }

    vectorSum(vector1, vector2) {
        return {
            x: vector1.x + vector2.x,
            y: vector1.y + vector2.y,
        };
    }

    vectorSub(vector1, vector2) {
        return {
            x: vector1.x - vector2.x,
            y: vector1.y - vector2.y,
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

    projectPolygon(polygon, axis) {
        let min = Infinity, max = -Infinity;
        for (const point of polygon) {
            const proj = point.x * axis.x + point.y * axis.y;
            min = Math.min(min, proj);
            max = Math.max(max, proj);
        }
        return [min, max];
    }

    findCollisionData(polygon1, polygon2, cp1, cp2) {
        let minOverlap = Infinity;
        let collisionNormal = { 
            x: 0, 
            y: 0
        };
        
        const polygons = [polygon1, polygon2];
        for (let i = 0; i < polygons.length; i++) {
            const polygon = polygons[i];
            for (let j = 0; j < polygon.length; j++) {
                const point1 = polygon[j];
                const point2 = polygon[(j + 1) % polygon.length];
                const edge = this.vector(point1, point2);
                const normal = this.normilize({
                    x: -edge.x, 
                    y: edge.y
                });
            
                const [min1, max1] = this.projectPolygon(polygon1, normal);
                const [min2, max2] = this.projectPolygon(polygon2, normal);
                if (max1 < min2 || max2 < min1) {
                    return null;
                }

                const overlap = Math.min(max1, max2) - Math.max(min1, min2);
            
                if (overlap < minOverlap) {
                    minOverlap = overlap;
                    collisionNormal = normal;
                }
            }
        }
        
        const direction = this.vector(cp2, cp1);
        
        if (this.scalar(collisionNormal, direction) < 0) {
          collisionNormal.x *= -1;
          collisionNormal.y *= -1;
        }
        
        return [collisionNormal, minOverlap];
    }

    findCollisionPoint(polygon1, polygon2) {
        let minDist = Infinity;
        let nearestPoints = [];
        for (const point1 of polygon1) {
            for (const point2 of polygon2) {
                const dist = this.distance(point1, point2);
                if (dist < minDist) {
                    minDist = dist;
                    nearestPoints = [point1, point2];
                }
            }
        }
        return {
            x: (nearestPoints[0].x + nearestPoints[1].x) / 2,
            y: (nearestPoints[0].y + nearestPoints[1].y) / 2,
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

    generateStar() {
        return {
            x: this.getRandomInt(this._bolidRadius, this._width - this._bolidRadius), 
            y: this.getRandomInt(this._bolidRadius, this._height - this._bolidRadius),
        };
    }
}

module.exports = Racer;