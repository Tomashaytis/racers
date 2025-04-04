const Random = require('./Random');

/**
 * Class Racer for implementation player movement physics
 */
class Racer {
    /**
     * Constructor for Racer object
     * @param {string} name - racer name
     * @param {string} color - racer color
     * @param {number} bolideSize - size of bolide
     * @param {number} velocityLimit - limit for velocity of bolide
     * @param {number} engineOnTtl - time to live of forward or backward acceleration/left or right angular velocity
     * @param {boolean} isBot - is racer bot
     * @param {number} width - width of game field
     * @param {number} height - heigth of game field
     * @param {Array} avoidedPoints - centers of other racers
     * @param {object} startPoint - start position for racer (if null then random)
     * @param {object} startDirection - start direction of racer (if null then random)
     */
    constructor(name, color, bolideSize, velocityLimit, engineOnTtl, isBot, width, height, avoidedPoints = [], startPoint = null, startDirection = null) {
        // General params
        this._name = name;
        this._color = color;
        this._bolideSize = bolideSize;
        this._bolideRadius = this._bolideSize * 10;
        this._pickRadius = 10;
        this._score = 0;
        this._isBot = isBot;
        this._width = width;
        this._height = height;
        this._physicalPoints = [];
        if (startPoint == null) {
            while (true) {
                this._position = {
                    x: Random.getRandomInt(this._bolideRadius, width - this._bolideRadius), 
                    y: Random.getRandomInt(this._bolideRadius, height - this._bolideRadius),
                };
                let success = true
                for (const point of avoidedPoints) {
                    if (Racer.distance(point, this._position) < this._bolideRadius) {
                        success = false;
                        break;
                    }
                }
                if (success) {
                    break;
                }   
            }
        } else {
            this._position = startPoint;
        }
        if (startDirection == null) {
            this._direction = {
                x: 1, 
                y: 0,
            };
            const turnAngle = Random.getRandomDouble(-Math.PI, Math.PI);
            this._direction = Racer.rotate(this._direction, turnAngle);
        } else {
            this._direction = startDirection;
        }
        this._normal = Racer.normal(this._direction);
        this.generatePoints();

        // Shape params
        this._bolideHeadLength = this._bolideSize * 8;
        this._bolideFrontLength = this._bolideSize * 6;
        this._bolideMiddleLength = this._bolideSize * 2;
        this._bolideBackLength = this._bolideSize * 8;
        this._bolideTailLength = this._bolideSize * 6;
        this._bolideFrontWidth = this._bolideSize * 2;
        this._bolideMiddleWidth = this._bolideSize * 4;
        this._bolideBackWidth = this._bolideSize * 3;

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

        // Auto params
        this._brakingRadius = 50;
        this._brakingValue = 3;
        this._moveMode = 'forward';
        this._backwardMoveCounterMax = 10;
        this._backwardMoveCounter = 0;
        this._stopCounter = 0;
        this._stopCounterMax = 3;
        this._prevPosition = this._position;
        this._noMoveDistance = 10;
    }

    /**
     * Getter for racer position
     */
    get position() {
        return this._position;
    }

    /**
     * Getter for racer name
     */
    get name() {
        return this._name;
    }

    /**
     * Getter for racer color
     */
    get color() {
        return this._color;
    }

    /**
     * Getter for racer racer type (bot or not)
     */
    get isBot() {
        return this._isBot;
    }

    /**
     * Generating corner points that define a shape of bolide
     */
    generatePoints() {
        this._physicalPoints = [];

        this._physicalPoints.push({
            x: this._position.x + this._direction.x * this._bolideHeadLength, 
            y: this._position.y + this._direction.y * this._bolideHeadLength,
        });
        this._physicalPoints.push({
            x: this._position.x + this._direction.x * this._bolideFrontLength + this._normal.x * this._bolideFrontWidth, 
            y: this._position.y + this._direction.y * this._bolideFrontLength + this._normal.y * this._bolideFrontWidth,
        });
        this._physicalPoints.push({
            x: this._position.x - this._direction.x * this._bolideMiddleLength + this._normal.x * this._bolideMiddleWidth, 
            y: this._position.y - this._direction.y * this._bolideMiddleLength + this._normal.y * this._bolideMiddleWidth,
        });
        this._physicalPoints.push({
            x: this._position.x - this._direction.x * this._bolideBackLength + this._normal.x * this._bolideBackWidth, 
            y: this._position.y - this._direction.y * this._bolideBackLength + this._normal.y * this._bolideBackWidth,
        });
        this._physicalPoints.push({
            x: this._position.x - this._direction.x * this._bolideTailLength, 
            y: this._position.y - this._direction.y * this._bolideTailLength,
        });
        this._physicalPoints.push({
            x: this._position.x - this._direction.x * this._bolideBackLength - this._normal.x * this._bolideBackWidth, 
            y: this._position.y - this._direction.y * this._bolideBackLength - this._normal.y * this._bolideBackWidth,
        });
        this._physicalPoints.push({
            x: this._position.x - this._direction.x * this._bolideMiddleLength - this._normal.x * this._bolideMiddleWidth, 
            y: this._position.y - this._direction.y * this._bolideMiddleLength - this._normal.y * this._bolideMiddleWidth,
        });
        this._physicalPoints.push({
            x: this._position.x + this._direction.x * this._bolideFrontLength - this._normal.x * this._bolideFrontWidth, 
            y: this._position.y + this._direction.y * this._bolideFrontLength - this._normal.y * this._bolideFrontWidth,
        });

        this._physicalPoints.map((physicalPoint) => {
            physicalPoint = {
                x: Math.round(physicalPoint.x), 
                y: Math.round(physicalPoint.y),
            };
        });
    }

    /**
     * Setting engine based on player actions
     * @param {object} actions - player actions
     */
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

    /**
     * Setting engine based on bot actions
     * @param {object} star - coordinates of star
     */
    AutoEngine(star) {
        const target = Racer.normalize(Racer.vector(this._position, star));
        const angle = Racer.angleSign(this._direction, target) * Racer.angle(this._direction, target);
        if (angle < 0.1) {
            this._rightOnTtl = this._engineOnTtl;
            this._leftOnTtl = 0;
        } else if (angle > 0.1) {
            this._rightOnTtl = 0;
            this._leftOnTtl = this._engineOnTtl;
        }

        if (Racer.distance(this._prevPosition, this._position) < this._noMoveDistance) {
            this._stopCounter += 1;
        } else if (this._stopCounter > 0 && Random.getRandomInt(0, 4) === 0){
            this._stopCounter -= 1;
        }

        if (this._moveMode === 'backward' && this._backwardMoveCounter < this._backwardMoveCounterMax) {
            this._backwardMoveCounter += 1;
        } else if (this._moveMode === 'backward') {
            this._moveMode = 'forward';
            this._backwardMoveCounter = 0;
        }

        if (this._stopCounter >= this._stopCounterMax) {
            this._moveMode = 'backward';
            this._backwardMoveCounter = 0;
            this._stopCounter = 0;
        }

        if (this._moveMode === 'forward') {
            if (Racer.distance(this._position, star) > this._brakingRadius) {
                this._forwardOnTtl = this._engineOnTtl;
            } else if (Random.getRandomInt(0, this._brakingValue) === 1) {
                this._forwardOnTtl = this._engineOnTtl;
            }
        } else {
            if (Racer.distance(this._position, star) > this._brakingRadius) {
                this._backwardOnTtl = this._engineOnTtl;
            } else if (Random.getRandomInt(0, this._brakingValue) === 1) {
                this._backwardOnTtl = this._engineOnTtl;
            }
        }
        this._prevPosition = this._position;
    }

    /**
     * Convertation of engine parameters to acceleration and angular velocity values
     */
    useEngine() {
        this._accelerationRel = {
            lon: 0,
            lat: 0,
        }

        var sign = Racer.scalar(this._direction, Racer.project(this._velocity, this._direction));
        if (sign > 0.05) {
            this._accelerationRel.lon += this._accelerationRelOff.lon;
        } else if (sign < -0.05) {
            this._accelerationRel.lon -= this._accelerationRelOff.lon;
        } else {
            this._accelerationRel.lat = 0;
        }

        var sign = Racer.scalar(this._normal, Racer.project(this._velocity, this._normal));
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
    
    /**
     * Bolide moving accross the game field and calculating collisions with borders 
     * @param {object} star - coordinates of star
     * @returns true if star is picked and false otherwise
     */
    move(star) {
        this.useEngine();

        this._acceleration = Racer.reproject(this._accelerationRel, this._direction);
        this._position = {
            x: this._position.x + this._velocity.x * this._timeStep + this._acceleration.x * this._timeStep * this._timeStep / 2,
            y: this._position.y + this._velocity.y * this._timeStep + this._acceleration.y * this._timeStep * this._timeStep / 2,
        };
        this._velocity = {
            x: this._velocity.x + this._acceleration.x * this._timeStep,
            y: this._velocity.y + this._acceleration.y * this._timeStep,
        };
        this._velocity = Racer.length(this._velocity) < 0.25 ? { x: 0, y: 0 } : this._velocity

        if (Racer.length(this._velocity) > this._velocityLimit) {
            const tmp = Racer.normalize(this._velocity);
            this._velocity = {
                x: tmp.x * this._velocityLimit,
                y: tmp.y * this._velocityLimit,
            };
        }

        this._angularVelocity = this._angularVelocity * Racer.length(this._velocity) / 10;
        if (this._angularVelocity > this._angularVelocityLimit) {
            this._angularVelocity = this._angularVelocityLimit;
        }
        const angle = this._angularVelocity * this._timeStep;
        this._direction = Racer.rotate(this._direction, angle);
        this._normal = Racer.normal(this._direction);

        if (Racer.distance(this._position, { x: this._position.x, y: 0 }) < this._bolideRadius) {
            let first = true;
            const corrections = [0];
            for(let point of this._physicalPoints) {
                if (Racer.distance(point, { x: point.x, y: 0 }) < this._wallCollisionRadius) {
                    if (first) {
                        this._velocity.x = this._velocity.x * this._collisionFading;
                        this._velocity.y = Math.abs(this._velocity.y) * this._collisionFading;
                        first = false;
                    }
                    corrections.push(-point.y);
                }
            }
            this._position.y += Math.max(...corrections);
        }
        if (Racer.distance(this._position, { x: this._position.x, y: this._height - 1 }) < this._bolideRadius) {
            let first = true;
            const corrections = [0];
            for(let point of this._physicalPoints) {
                if (Racer.distance(point, { x: point.x, y: this._height - 1 }) < this._wallCollisionRadius) {
                    if (first) {
                        this._velocity.x = this._velocity.x * this._collisionFading;
                        this._velocity.y = -Math.abs(this._velocity.y) * this._collisionFading;
                        first = false;
                    }
                    corrections.push(this._height - 1 - point.y);
                }
            }
            this._position.y -= Math.max(...corrections);
        }
        if (Racer.distance(this._position, { x: 0, y: this._position.y }) < this._bolideRadius) {
            let first = true;
            const corrections = [0];
            for(let point of this._physicalPoints) {
                if (Racer.distance(point, { x: 0, y: point.y }) < this._wallCollisionRadius) {
                    if (first) {
                        this._velocity.x = Math.abs(this._velocity.x) * this._collisionFading;
                        this._velocity.y =  this._velocity.y * this._collisionFading;
                        first = false;
                    }
                    corrections.push(-point.x);
                }
            }
            this._position.x += Math.max(...corrections);
        }
        if (Racer.distance(this._position, { x: this._width, y: this._position.y }) < this._bolideRadius) {
            let first = true;
            const corrections = [0];
            for(let point of this._physicalPoints) {
                if (Racer.distance(point, { x: this._width - 1, y: point.y }) < this._wallCollisionRadius) {
                    if (first) {
                        this._velocity.x = -Math.abs(this._velocity.x) * this._collisionFading;
                        this._velocity.y =  this._velocity.y * this._collisionFading;
                        first = false;
                    }
                    corrections.push(this._width - 1 - point.x);
                }
            }
            this._position.x -= Math.max(...corrections);
        }

        this.generatePoints();

        if (Racer.distance(star, this._position) > this._bolideRadius) {
            return false;
        }
        for(let point of this._physicalPoints) {
            if (Racer.distance(star, point) < this._pickRadius) {
                this._score += 1;
                return true;
            }
        }
        return false;
    }

    /**
     * Convertation of racer object to DTO
     * @returns DTO
     */
    toDto() {
        return {
            name: this._name,
            color: this._color,
            score: this._score,
            isBot: this._isBot, 
            points: this._physicalPoints,
        };
    }

    /**
     * Generation random star position on the game field 
     * @returns random star position on the game field 
     */
    generateStar() {
        return {
            x: Random.getRandomInt(this._bolideRadius, this._width - this._bolideRadius), 
            y: Random.getRandomInt(this._bolideRadius, this._height - this._bolideRadius),
        };
    }

    /**
     * Calculating vector coordinates from two points
     * @param {object} point1 - start vector point
     * @param {object} point2 - end vector point
     * @returns vector coordinates
     */
    static vector(point1, point2) {
        return {
            x: point2.x - point1.x,
            y: point2.y - point1.y,
        };
    }

    /**
     * Calculating summation of two vectors
     * @param {object} vector1 - first vector
     * @param {object} vector2 - second vector
     * @returns summation of two vectors
     */
    static vectorSum(vector1, vector2) {
        return {
            x: vector1.x + vector2.x,
            y: vector1.y + vector2.y,
        };
    }

    /**
     * Calculating substraction of two vectors
     * @param {object} vector1 - first vector
     * @param {object} vector2 - second vector
     * @returns substraction of two vectors
     */
    static vectorSub(vector1, vector2) {
        return {
            x: vector1.x - vector2.x,
            y: vector1.y - vector2.y,
        };
    }

    /**
     * Calculating normal for vector
     * @param {object} vector - vector
     * @returns normal for vector (not normalized)
     */
    static normal(vector, invertFirst=false) {
        if (invertFirst) {
            return {
                x: -vector.y, 
                y: vector.x,
            };
        }
        return {
            x: vector.y, 
            y: -vector.x,
        };
    }
    
    /**
     * Calculating distance between two points
     * @param {object} point1 - first point
     * @param {object} point2 - second point
     * @returns distance between two points
     */
    static distance(point1, point2) {
        return Math.sqrt((point2.x - point1.x) * (point2.x - point1.x) + (point2.y - point1.y) * (point2.y - point1.y));
    }

    /**
     * Calculating vector length
     * @param {object} vector - vector
     * @returns vector length
     */
    static length(vector) {
        return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    }

    /**
     * Normalizing vector
     * @param {object} vector - vector
     * @returns normalized vector
     */
    static normalize(vector) {
        const length = Racer.length(vector);
        return {
            x: vector.x / length, 
            y: vector.y / length,
        };
    }

    /**
     * Vector rotation for some angle
     * @param {object} vector - vector
     * @param {number} angle - turn angle
     * @returns rotated vector
     */
    static rotate(vector, angle) {
        return {
            x: vector.x * Math.cos(angle) - vector.y * Math.sin(angle),
            y: vector.x * Math.sin(angle) + vector.y * Math.cos(angle),
        };
    }

    /**
     * Calculating scalar multiplication of two vectors
     * @param {object} vector1 - first vector
     * @param {object} vector2 - second vector
     * @returns scalar multiplication of two vectors
     */
    static scalar(vector1, vector2) {
        return vector1.x * vector2.x + vector1.y * vector2.y;
    }

    /**
     * Calculating angle between two vectors in range [0, PI]
     * @param {object} vector1 - first vector
     * @param {object} vector2 - second vector
     * @returns angle between two vectors in range [0, PI]
     */
    static angle(vector1, vector2) {
        return Math.acos(Racer.scalar(vector1, vector2) / (Racer.length(vector1) * Racer.length(vector2)));
    }

    /**
     * Calculating angle sign between two vectors
     * @param {object} vector1 - first vector
     * @param {object} vector2 - second vector
     * @returns angle sign between two vectors
     */
    static angleSign(vector1, vector2) {
        return (vector1.x * vector2.y - vector2.x * vector1.y) < 0 ? 1 : -1;
    }

    /**
     * Projection of vector on some axis
     * @param {object} vector - vector
     * @param {object} axis - axis
     * @returns vector projection on some axis
     */
    static project(vector, axis) {
        const k = Racer.scalar(vector, axis) / Racer.scalar(axis, axis);
        return {
            x: k * axis.x,
            y: k * axis.y,
        };
    }

    /**
     * Convertation of coordinate system (lat, lon) to coordinate system (x, y)
     * @param {object} vector - vector in coordinate system (lat, lon)
     * @param {object} basis - basis vector in coordinate system (x, y)
     * @returns vector in coordinate system (x, y)
     */
    static reproject(vector, basis) {
        const normal = Racer.normal(basis);
        return {
            x: vector.lon * basis.x + vector.lat * normal.x,
            y: vector.lon * basis.y + vector.lat * normal.y,
        };
    }

    /**
     * Projection of polygon to some axis
     * @param {Array} polygon - polygon
     * @param {object} axis - axis
     * @returns - polygon projection for mtv algorithm
     */
    static projectPolygon(polygon, axis) {
        let min = Infinity, max = -Infinity;
        for (const point of polygon) {
            const proj = point.x * axis.x + point.y * axis.y;
            min = Math.min(min, proj);
            max = Math.max(max, proj);
        }
        return [min, max];
    }

    /**
     * Implementation of MTV algorithm (detects collision, finds collision normal and overlap for two polygons)
     * @param {Array} polygon1 - first polygon
     * @param {Array} polygon2 - second polygon
     * @param {object} center1 - center of first polygon
     * @param {object} center2 - center of second polygon
     * @returns null if collision not detected and collision normal with overlap otherwise
     */
    static findCollisionData(polygon1, polygon2, center1, center2) {
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
                const edge = Racer.vector(point1, point2);
                const normal = Racer.normalize(Racer.normal(edge, true));
            
                const [min1, max1] = Racer.projectPolygon(polygon1, normal);
                const [min2, max2] = Racer.projectPolygon(polygon2, normal);
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
        
        const direction = Racer.vector(center2, center1);
        
        if (Racer.scalar(collisionNormal, direction) < 0) {
          collisionNormal.x *= -1;
          collisionNormal.y *= -1;
        }
        
        return [collisionNormal, minOverlap];
    }

    /**
     * Calculating collision point for two polygons
     * @param {Array} polygon1 - first polygon
     * @param {Array} polygon2 - second polygon
     * @returns collision point for two polygons
     */
    static findCollisionPoint(polygon1, polygon2) {
        let minDist = Infinity;
        let nearestPoints = [];
        for (const point1 of polygon1) {
            for (const point2 of polygon2) {
                const dist = Racer.distance(point1, point2);
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

    /**
     * Processing bolide collisions with each other
     * @param {Map} racers - racers
     */
    static bolideCollisions(racers) {
        const processed = [];
        racers.forEach((racer1, id1) => {
            racers.forEach((racer2, id2) => {
                if (id1 === id2 || processed.includes(id2) || Racer.distance(racer1._position, racer2._position) > racer1._bolidRadius) {
                    return;
                }

                const collisionData = Racer.findCollisionData(racer1._physicalPoints, racer2._physicalPoints, racer1._position, racer2._position);
                if (collisionData == null) {
                    return;
                }
                const [collisionNormal, collisionOverlap] = collisionData;
                const collisionPoint = Racer.findCollisionPoint(racer1._physicalPoints, racer2._physicalPoints);
                
                const collisionVelocity1 = {
                    x: racer1._velocity.x + racer1._angularVelocity * (collisionPoint.x - racer1._position.x),
                    y: racer1._velocity.y + racer1._angularVelocity * (collisionPoint.y - racer1._position.y),
                };
                const collisionVelocity2 = {
                    x: racer2._velocity.x + racer2._angularVelocity * (collisionPoint.x - racer2._position.x),
                    y: racer2._velocity.y + racer2._angularVelocity * (collisionPoint.y - racer2._position.y),
                };
                
                const velocityRel = Racer.scalar(Racer.vectorSub(collisionVelocity1, collisionVelocity2), collisionNormal);
                if (velocityRel >= 0) {
                    return;
                }

                const moment1 = Racer.scalar(Racer.vectorSub(collisionPoint, racer1._position), collisionNormal);
                const moment2 = Racer.scalar(Racer.vectorSub(collisionPoint, racer2._position), collisionNormal);
                const impulse = -(1 + racer1._collisionFading) * velocityRel / (2 + moment1 * moment1 / racer1._inertia + moment2 * moment2 / racer2._inertia);

                racer1._velocity.x += impulse * collisionNormal.x;
                racer1._velocity.y += impulse * collisionNormal.y;
                racer2._velocity.x -= impulse * collisionNormal.x;
                racer2._velocity.y -= impulse * collisionNormal.y;

                racer1._angularVelocity += impulse * moment1 / racer1._inertia;
                racer2._angularVelocity -= impulse * moment2 / racer2._inertia;

                const correction = collisionOverlap * racer1._correctionFactor / 2;
            
                const positionCorrection = {
                    x: collisionNormal.x * correction,
                    y: collisionNormal.y * correction,
                };
            
                racer1._position.x += positionCorrection.x;
                racer1._position.y += positionCorrection.y;
                racer2._position.x -= positionCorrection.x;
                racer2._position.y -= positionCorrection.y;
            });
            processed.push(id1);
        });
    }
}

module.exports = Racer;