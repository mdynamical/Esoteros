const TILESIZE = 32
const SCREENWIDTH = 1344
const SCREENHEIGHT = 768

class Attributes {
    constructor() {
        undefined
    }
}

class Character {
    constructor(name, pos, attr, layer=0, scene=null, sprite=null) {
        this.name = name; 
        this.attr = attr; 
        if (Array.isArray(pos)) {
            this.pos = [pos[0] * TILESIZE, pos[1] * TILESIZE];
        }

        this.layer = layer;
        this.sprite = sprite;

        this.scene = scene;
        if (this.scene != null) {
            this.setScene(this.scene, 'player');
        }
        this.moving = false
        this.speed = 2 // Speed should always be a factor of TILESIZE
        this.nextTile = null

        this.hitboxHeight = 1 // In tiles
        this.hitboxWidth = 1
        this.hitboxTiles = [] // Should be used if hitbox is more than a single tile, for calculating collisions

        this.lightSource = null
    }

    collisionCheck(dir) {
        // Always use getPos() instead of sprite.coord so the offset is automatically applied
        let xPos = this.getPosX()
        let yPos = this.getPosY()
        let movement = TILESIZE;
        let tile
        
        if (dir === 'W' || dir === 'A') {movement = -movement}

        if (dir === 'W' || dir === 'S') {tile = this.scene.layer1.getTileAtWorldXY(xPos, yPos + movement)}
        else if (dir === 'A' || dir === 'D') {tile = this.scene.layer1.getTileAtWorldXY(xPos + movement, yPos)}
        
        /* DEBUG
            if (tile.properties.collision) {
                console.log(tile)
                console.log(` POS[${this.sprite.x}, ${this.sprite.y}] ${dir} movement attempted,
                at ${this.sprite.x}, ${offsetY+movement}`)
                tile.tint = 0x000000;
                tile.tintFill = true;
            }
        */    

        return tile && tile.properties.collision;
    }
    setScene(scene, spriteName) {
        this.scene = scene;
        this.sprite = this.scene.physics.add.sprite(this.pos[0], this.pos[1], spriteName) 
        this.sprite.setOrigin(0, 0);
        this.hitboxWidth = this.sprite.width / TILESIZE; // recalculate hitbox if the sprite's width > TILESIZE

        /* These offsets are necessary to make the sprite's body collide with the tilemap correctly after scaling down 
        the hitbox, as Phaser draws the coordinates of a sprite's body starting from it's center rather than top left position.
        The offsets should always be SpriteCoord - (TILESIZE * hitboxSize) for X or Y coords, although scaling
        the X axis isn't usually necessary. Always apply the offsets to any position calculations if you scale down the
        hitbox, the X offset was not tested fully so only scale the X axis down only if you really need to                                        */
        this.yOffset = this.sprite.height - (TILESIZE * this.hitboxHeight); 
        this.xOffset = 0

        this.sprite.body.setSize(TILESIZE * this.hitboxWidth, TILESIZE  * this.hitboxHeight); // Scales the hitbox based on the chosen size
        this.sprite.body.setOffset(this.xOffset, this.yOffset); // Apply the offsets to hitbox
        
        this.sprite.setCollideWorldBounds(true)

    }

    setMove(dir) {
        if (this.moving || this.collisionCheck(dir)) return;
        if (dir === 'W') {this.nextTile = this.scene.layer1.getTileAtWorldXY(this.getPosX(), this.getPosY()-TILESIZE)}
        if (dir === 'A') {this.nextTile = this.scene.layer1.getTileAtWorldXY(this.getPosX()-TILESIZE, this.getPosY())}
        if (dir === 'S') {this.nextTile = this.scene.layer1.getTileAtWorldXY(this.getPosX(), this.getPosY()+TILESIZE)}
        if (dir === 'D') {this.nextTile = this.scene.layer1.getTileAtWorldXY(this.getPosX() +TILESIZE, this.getPosY())}

        this.moving = dir;
        this.move()
    }

    move() {
        let movement = this.speed
        if (this.moving === 'W' || this.moving === 'A') {movement = -this.speed} // For moving left or up, the movement is negative
        if (this.altSpeed) {movement *= 2}

        if (this.moving === 'W' || this.moving === 'S') {
            this.sprite.y += movement
            if (this.sprite.y % TILESIZE === 0) {
                this.moving = false;

            }
        
        }
        else if (this.moving === 'A' || this.moving === 'D') {
            this.sprite.x += movement
            if (this.sprite.x % TILESIZE === 0) {
                this.moving = false;

            }
        }
    }

    update() {
        if (this.moving) {this.move()}
        this.updateLight()
    }

    updateLight() {
        if (this.lightSource) {
            let offset = 16
            this.lightSource.x = this.getPosX() + offset;
            this.lightSource.y = this.getPosY()+ offset;
        }
    }

    getPosX() {
        return (this.sprite.x + this.xOffset)
    }
    // Always use these for collision calculations if you offset the hitbox
    getPosY() {
        return (this.sprite.y + this.yOffset)
    }
}

class Player extends Character {
    constructor(name,  pos=[0, 0], scene=null, layer=0, attr=null, inv=null) {
        super(name, pos, attr, layer, scene);
        this.inv = inv
        this.runStamina = 50
        this.altSpeed = 0

    }

    run() {
        if (this.runStamina <= 0) {this.altSpeed = 0; return}
        if (this.moving) {return}
        this.altSpeed = 4
        --this.runStamina 
        console.log(this.runStamina)
    }

    recover() {
        if (this.runStamina < 100 && this.altSpeed === 0) {this.runStamina += 1}
    }

    update() {
        if (this.moving) {this.move()}
        this.updateLight()
        this.recover()
    }
}

class Enemy extends Character {
    constructor(name, pos=[0, 0], scene=null, layer=0, attr=null) {
        super(name, pos, attr, layer, scene);
        this.path = []
        this.chase = false;
        this.target = null;
        this.speed = 8
    }

    pathToTile(targetTile) {
        // My goal here was to create an algorithm similar to A*, I decided to go with a greedy BFS search
        if (!targetTile) {return}
        let xPos = this.getPosX()
        let yPos = this.getPosY()
        
        const absDist = (curTile, targetTile) => (Math.abs(targetTile.pixelX - curTile.pixelX) + Math.abs(targetTile.pixelY - curTile.pixelY)) / TILESIZE

        let curTile = this.scene.layer1.getTileAtWorldXY(xPos, yPos);
        if (!curTile || curTile == this.scene.layer1.getTileAtWorldXY(targetTile.pixelX, targetTile.pixelY)) return [];

        let discoveredTiles = new Set();
        discoveredTiles.add(curTile)

        let paths = [this.scene.layer1.getTileAtWorldXY(curTile.pixelX+TILESIZE, curTile.pixelY),
                            this.scene.layer1.getTileAtWorldXY(curTile.pixelX-TILESIZE, curTile.pixelY),
                            this.scene.layer1.getTileAtWorldXY(curTile.pixelX, curTile.pixelY+TILESIZE),
                            this.scene.layer1.getTileAtWorldXY(curTile.pixelX, curTile.pixelY-TILESIZE)
                    ].filter((t) => t && !t.properties.collision).map(t => new Array(t));
        // (^) Add the initial walkable adjacent tiles to individual Sets() that are them added to the paths queue
        
        let correctPath = []           
        while (paths.length > 0) {
            //Orders the paths which are closer to the target to be searched first
            paths.sort((pathA, pathB) => {
            let headA = pathA[pathA.length - 1];
            let headB = pathB[pathB.length - 1];
            return absDist(headA, targetTile) - absDist(headB, targetTile);
            });

            let path = paths.shift()
            let head = path[path.length-1]
            //head.tint = "0x000000"
            //head.tintFill = true      DEBUG
            if (absDist(head, targetTile) === 0) {correctPath = path; break} 
            if (discoveredTiles.has(head)) {continue} else {discoveredTiles.add(head)}
            
            let headAdjacent = [this.scene.layer1.getTileAtWorldXY(head.pixelX+TILESIZE, head.pixelY),
                        this.scene.layer1.getTileAtWorldXY(head.pixelX-TILESIZE, head.pixelY),
                        this.scene.layer1.getTileAtWorldXY(head.pixelX, head.pixelY+TILESIZE),
                        this.scene.layer1.getTileAtWorldXY(head.pixelX, head.pixelY-TILESIZE)
                        ].filter((t) => t && !t.properties.collision)


            for (let t of headAdjacent) {
                if (!discoveredTiles.has(t)) {
                   let newPath = [...path, t];
                    paths.push(newPath); 
                }
            }
        }
    
    //if (correctPath) {
    //     for (let tile of correctPath) {tile.tint = "0x000000"; tile.tintFill = true}
    //} DEBUG

    return correctPath

    }

    setMove() {
        if (this.moving) {this.move(); return}
        if (!this.chase || !this.target) {return}

        let targetTile = this.scene.layer1.getTileAtWorldXY(this.target.getPosX(), this.target.getPosY())
        if (this.target.moving) {targetTile = this.target.nextTile}
        this.path = this.pathToTile(targetTile)

        let nextTile = this.path.shift()
        if (!nextTile) {return}

        let diffX = nextTile.pixelX - this.getPosX()
        let diffY = nextTile.pixelY - this.getPosY()
        if (diffY === -TILESIZE) {this.moving = 'W'}
        else if (diffX === -TILESIZE) {this.moving = 'A'}
        else if (diffY === TILESIZE) {this.moving = 'S'}
        else if (diffX === TILESIZE) {this.moving = 'D'}    
    }

    move() {
        let movement = this.speed
         if (this.moving === 'W' || this.moving === 'A') {movement = -this.speed} // For moving left or up, the movement is negative

         if (this.moving === 'W' || this.moving === 'S') {
            this.sprite.y += movement
            
            if (this.sprite.y % TILESIZE === 0) {
                this.moving = false;

            }
        
        }
        else if (this.moving === 'A' || this.moving === 'D') {
            this.sprite.x += movement
            if (this.sprite.x % TILESIZE === 0) {
                this.moving = false;

            }
        }
        if (this.target) {

        }
    }

    checkEncounter() {
        if (!this.target) {return}
        if (this.scene.layer1.getTileAtWorldXY(this.getPosX(), this.getPosY()) == 
           this.scene.layer1.getTileAtWorldXY(this.target.getPosX(), this.target.getPosY())) {
           let fight = new Fight()
        }

    }

    update() {
        this.setMove()
        this.checkEncounter()
    }
}

class Fight {
    undefined
}


export { Player, Enemy, TILESIZE, SCREENWIDTH, SCREENHEIGHT};
