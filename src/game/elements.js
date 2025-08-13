const TILESIZE = 32
const SCREENWIDTH = 1344
const SCREENHEIGHT = 768
const BATTLESIZE = 11 // In tiles. Should be an odd number

class Attributes {
    constructor() {
        undefined
    }
}

class Character {
    constructor(name, tilePos, textures={}, attr, layer=0, scene=null) {
        this.name = name; 
        this.tilePos = tilePos;
        this.textures = {
            sprite: '',
            portrait: '',
            icon: '',
        }
        this.attr = attr; 
        this.layer = layer;
        
        if (textures && typeof textures === 'object' && (textures.sprite || textures.portrait || textures.icon)) {
            this.textures = textures;
        }
        
        console.log(this.textures)
        this.scene = scene;
        if (this.scene != null) {
            this.setScene(this.scene, 'player');
        }

        this.moving = false
        this.speed = 2 
        this.nextTile = null
        this.curTile = null
    
        /* The offsets are applied from the Top(Y=0) left(X=0) position of the sprite and move the hitbox
        +1 tile for each bottom(+Y) right(+X) increment. Custom hitboxes are necessary because Phaser's
        sprite.body object is completely broken and should be avoided if you want a functional collision system */ 
        this.hitboxOffsetX = 0 
        this.hitboxOffsetY = 1
        this.hitbox = {
            'x': 0,
            'y': 0,
            'right': 0,
            'bottom': 0,
        }

        this.lightSource = null
        this.debug = false
    }

    collisionCheck(dir) {
        let movement = TILESIZE;
        let tile
        
        if (dir === 'W' || dir === 'A') {movement = -movement}

        if (dir === 'W' || dir === 'S') {tile = this.scene.layer1.getTileAtWorldXY(this.hitbox.x, this.hitbox.y + movement)}
        
        else if (dir === 'A' || dir === 'D') {tile = this.scene.layer1.getTileAtWorldXY(this.hitbox.x + movement, this.hitbox.y)}
        
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
        this.textures.sprite = this.scene.physics.add.sprite(this.tilePos.x * TILESIZE, this.tilePos.y * TILESIZE, spriteName) 
        this.textures.sprite.setOrigin(0, 0);

        // Offsets the hitbox relative to the sprite, based on previous input, I don't reccomend adding an X offset
        // as it isn't useful for anything and can mess up the collision system
        let yOffset = this.textures.sprite.height - (TILESIZE * this.hitboxOffsetY); 
        let xOffset = 0

        this.hitbox.x = this.textures.sprite.x + xOffset
        this.hitbox.y = this.textures.sprite.y + yOffset
        this.curTile = this.scene.layer1.getTileAtWorldXY(this.hitbox.x, this.hitbox.y)

        /* let hitbox = this.scene.layer1.getTileAtWorldXY(this.hitbox.x, this.hitbox.y)
        let sprite = this.scene.layer1.getTileAtWorldXY(this.tilePos.x * TILESIZE,  this.tilePos.y * TILESIZE)
        hitbox.tint = '0x000000'
        hitbox.tintFill = true
        sprite.tint = '0x880808'
        sprite.tintFill = true                           DEBUG                                                  */ 
    }

    setMove(dir) {
        if (this.moving || this.collisionCheck(dir)) return;
        if (dir === 'W') {this.nextTile = this.scene.layer1.getTileAtWorldXY(this.hitbox.x, this.hitbox.y-TILESIZE)}
        if (dir === 'A') {this.nextTile = this.scene.layer1.getTileAtWorldXY(this.hitbox.x-TILESIZE, this.hitbox.y)}
        if (dir === 'S') {this.nextTile = this.scene.layer1.getTileAtWorldXY(this.hitbox.x, this.hitbox.y+TILESIZE)}
        if (dir === 'D') {this.nextTile = this.scene.layer1.getTileAtWorldXY(this.hitbox.x +TILESIZE, this.hitbox.y)}

        this.moving = dir;
        this.move()
    }

    move() {
        let movement = this.speed
        if (!this.moving) {return}
        if (this.running) {movement *= 1.5}

        if (this.moving === 'W') {
            this.hitbox.y -= movement
            if (this.hitbox.y <= this.nextTile.pixelY) {
                this.moving = false;
                this.hitbox.y = this.nextTile.pixelY
                this.curTile = this.nextTile
                if (this.path) {
                    if (this.path.length > 0) {
                        this.nextTile = this.path.shift()
                    }
                }

            }
        
        }
        else if (this.moving === 'A') {
            this.hitbox.x -= movement
            if (this.hitbox.x <= this.nextTile.pixelX) {
                this.moving = false;
                this.hitbox.x = this.nextTile.pixelX
                this.curTile = this.nextTile
                if (this.path) {
                    if (this.path.length > 0) {
                        this.nextTile = this.path.shift()
                    }
                }

            }
        }

        else if (this.moving === 'S') {
            this.hitbox.y += movement
            if (this.hitbox.y >= this.nextTile.pixelY) {
                this.moving = false;
                this.hitbox.y = this.nextTile.pixelY
                this.curTile = this.nextTile
                if (this.path) {
                    if (this.path.length > 0) {
                        this.nextTile = this.path.shift()
                    }
                }

            }
        }

        else if (this.moving === 'D') {
            this.hitbox.x += movement
            if (this.hitbox.x >= this.nextTile.pixelX ) {
                this.moving = false;
                this.hitbox.x = this.nextTile.pixelX
                this.curTile = this.nextTile
                if (this.path) {
                    if (this.path.length > 0) {
                        this.nextTile = this.path.shift()
                    }
                }
            }
        }
    }

    updateLight() {
        if (this.lightSource) {
            let offset = 16
            this.lightSource.x = this.hitbox.x + offset;
            this.lightSource.y = this.hitbox.y + offset;
        }
    }
    
    resetMovement() {
        // Used when encounters happen to prevent odd coordinates on the XY axis
        this.moving = null
        this.hitbox.x = this.curTile.pixelX
        this.hitbox.y = this.curTile.pixelY

    }

    updatePos() {
        this.textures.sprite.x = this.hitbox.x - (TILESIZE * this.hitboxOffsetX)
        this.textures.sprite.y = this.hitbox.y - (TILESIZE * this.hitboxOffsetY)
        
        this.updateLight()
    }
}

class Player extends Character {
    constructor(name,  tilePos, textures, scene=null, layer=0, attr=null, inv=null) {
        super(name, tilePos, textures, attr, layer, scene);
        this.inv = inv
        this.runStamina = 100000
        this.speed = 2.5
        this.running = false

    }

    run() {
        if (this.runStamina <= 0) {this.running = false; return}
        if  (!this.running) {this.running = true}
        --this.runStamina 
    }

    recover() {
        if (this.runStamina < 100 && !this.running) {this.runStamina += 0.4}
    }

    update() {
        this.move();
        this.recover();
        this.updatePos();

    }

}

class Enemy extends Character {
    constructor(name, tilePos, textures, scene=null, layer=0, attr=null) {
        super(name, tilePos, textures, attr, layer, scene);
        this.path = []
        this.tilePos = tilePos
        this.chase = false;
        this.target = null;
        this.speed = 5.5
    }

    pathToTile(targetTile) {
        // My goal here was to create an algorithm similar to A*, I decided to go with a greedy BFS search
        if (!targetTile) {return}
        
        const absDist = (curTile, targetTile) => (Math.abs(targetTile.pixelX - curTile.pixelX) + Math.abs(targetTile.pixelY - curTile.pixelY)) / TILESIZE

        let curTile = this.scene.layer1.getTileAtWorldXY(this.hitbox.x, this.hitbox.y);
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
    //     for (let tile of correctPath) {tile.tint = "0x011100"; tile.tintFill = true}
    //} DEBUG


    return correctPath

    }

    setMove() {
        if (this.moving) {this.move(); return}
        if (!this.chase || !this.target) {return}

        this.path = this.pathToTile(this.target.curTile)

        this.nextTile = this.path.shift()
        if (!this.nextTile) {return}

        let diffX = this.nextTile.pixelX - this.hitbox.x
        let diffY = this.nextTile.pixelY - this.hitbox.y
        if (diffY === -TILESIZE) {this.moving = 'W'}
        else if (diffX === -TILESIZE) {this.moving = 'A'}
        else if (diffY === TILESIZE) {this.moving = 'S'}
        else if (diffX === TILESIZE) {this.moving = 'D'}
    }

    update() {
        this.setMove()
        this.updatePos()
        
    }
}

class Fight {
    constructor(scene, actors) {
        scene.scene.start('BattleScene', { actors: actors }); // Pass actors data

    }
}


export { Player, Enemy, Fight, TILESIZE, SCREENWIDTH, SCREENHEIGHT, BATTLESIZE};