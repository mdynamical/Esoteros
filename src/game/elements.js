const TILESIZE = 32
const SCREENWIDTH = 1344
const SCREENHEIGHT = 768
const BATTLESIZE = 21 // In tiles. Should be an odd number


function pathToTile(scene, startTile, targetTile) {
    // My goal here was to create an algorithm similar to A*, I decided to go with a greedy BFS search
    if (!targetTile) {return}

    const heuristic = (startTile, targetTile) => (Math.abs(targetTile.pixelX - startTile.pixelX) + Math.abs(targetTile.pixelY - startTile.pixelY)) / TILESIZE

    let discoveredTiles = new Set();
    discoveredTiles.add(startTile)

    let paths = [scene.curLayer.getTileAtWorldXY(startTile.pixelX+TILESIZE, startTile.pixelY),
                        scene.curLayer.getTileAtWorldXY(startTile.pixelX-TILESIZE, startTile.pixelY),
                        scene.curLayer.getTileAtWorldXY(startTile.pixelX, startTile.pixelY+TILESIZE),
                        scene.curLayer.getTileAtWorldXY(startTile.pixelX, startTile.pixelY-TILESIZE)
                ].filter((t) => t && !t.properties.collision).map(t => new Array(t));
    // (^) Add the initial walkable adjacent tiles to individual Sets() that are them added to the paths queue
    
    let correctPath = []           
    while (paths.length > 0) {
        //Orders the paths which are closer to the target to be searched first
        paths.sort((pathA, pathB) => {
        let headA = pathA[pathA.length - 1];
        let headB = pathB[pathB.length - 1];
        return heuristic(headA, targetTile) - heuristic(headB, targetTile);
        });

        let path = paths.shift()
        let head = path[path.length-1]
        //head.tint = "0x000000"
        //head.tintFill = true      DEBUG
        if (heuristic(head, targetTile) === 0) {correctPath = path; break} 
        if (discoveredTiles.has(head)) {continue} else {discoveredTiles.add(head)}
        
        let headAdjacent = [scene.curLayer.getTileAtWorldXY(head.pixelX+TILESIZE, head.pixelY),
                    scene.curLayer.getTileAtWorldXY(head.pixelX-TILESIZE, head.pixelY),
                    scene.curLayer.getTileAtWorldXY(head.pixelX, head.pixelY+TILESIZE),
                    scene.curLayer.getTileAtWorldXY(head.pixelX, head.pixelY-TILESIZE)
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

class Attributes {
    constructor() {
        undefined
    }
}

class Character {
    constructor(name, tilePos, attr, layer='layer1', scene=null) {
        this.name = name; 
        this.tilePos = tilePos;
        
        this.attr = attr; 
        this.layer = layer;
        this.scene = scene;
        this.textures = {sprite: '', portrait: ''}

        if (this.scene != null) {
            this.setScene(this.scene, this.name);
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

        if (dir === 'W' || dir === 'S') {tile = this.scene[this.layer].getTileAtWorldXY(this.hitbox.x, this.hitbox.y + movement)}
        
        else if (dir === 'A' || dir === 'D') {tile = this.scene[this.layer].getTileAtWorldXY(this.hitbox.x + movement, this.hitbox.y)}
        
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

    setScene(scene, spriteName, renderOffset= {x:0, y:0}) {
        //renderOffset is used when the layers do not start at 0, 0
        this.scene = scene;

        this.textures.sprite = this.scene.physics.add.sprite((this.tilePos.x * TILESIZE) + renderOffset.x,
        (this.tilePos.y * TILESIZE) + renderOffset.y, spriteName) 
        this.textures.sprite.setOrigin(0, 0);

        // Offsets the hitbox relative to the sprite, based on previous input, I don't reccomend adding an X offset
        // as it isn't useful for anything and can mess up the collision system
        let yOffset = this.textures.sprite.height - (TILESIZE * this.hitboxOffsetY); 
        let xOffset = 0

        this.hitbox.x = this.textures.sprite.x + xOffset
        this.hitbox.y = this.textures.sprite.y + yOffset
        this.curTile = this.scene[this.layer].getTileAtWorldXY(this.hitbox.x, this.hitbox.y)

        /* let hitbox = this.scene[this.layer].getTileAtWorldXY(this.hitbox.x, this.hitbox.y)
        let sprite = this.scene[this.layer].getTileAtWorldXY(this.tilePos.x * TILESIZE + renderOffset.x,
        this.tilePos.y * TILESIZE+renderOffset.y)
        hitbox.tint = '0x000000'
        hitbox.tintFill = true
        sprite.tint = '0x880808'
        sprite.tintFill = true
        */ // DEBUG                                                  

    }

    setMove(dir) {
        if (this.moving || this.collisionCheck(dir)) return;
        if (dir === 'W') {this.nextTile = this.scene[this.layer].getTileAtWorldXY(this.hitbox.x, this.hitbox.y-TILESIZE)}
        if (dir === 'A') {this.nextTile = this.scene[this.layer].getTileAtWorldXY(this.hitbox.x-TILESIZE, this.hitbox.y)}
        if (dir === 'S') {this.nextTile = this.scene[this.layer].getTileAtWorldXY(this.hitbox.x, this.hitbox.y+TILESIZE)}
        if (dir === 'D') {this.nextTile = this.scene[this.layer].getTileAtWorldXY(this.hitbox.x +TILESIZE, this.hitbox.y)}

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

    saveOverWorldPos () {
        this.overWorldPos = [this.hitbox.x, this.hitbox.y]
    }
}

class Player extends Character {
    constructor(name,  tilePos, scene=null, layer='layer1', attr=null, inv=null) {
        super(name, tilePos, scene, layer, attr, scene);
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
    constructor(name, tilePos, scene=null, layer='layer1', attr=null) {
        super(name, tilePos, attr, layer, scene);
        this.path = []
        this.tilePos = tilePos
        this.chase = false;
        this.target = null;
        this.speed = 5.5
    }

    setMove() {
        if (this.moving) {this.move(); return}
        if (!this.chase || !this.target) {return}

        this.path = pathToTile(this.scene, this.curTile, this.target.curTile)

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
        let player = actors[0]
        let midX = player.curTile.pixelX
        let midY = player.curTile.pixelY
        let gridStart = (BATTLESIZE-1)/2 
        let firstGid = scene.curLayer.tilemap.tilesets[0].firstgid;
        // (^) Used to fix unalignements between tilled tile indexes and phaser's makeTilledMap expected indexes

        let indexGrid = []
        let adjTiles = scene.curLayer.getTilesWithinWorldXY(midX-(TILESIZE*gridStart), midY-(TILESIZE*gridStart),
        TILESIZE * BATTLESIZE , TILESIZE * BATTLESIZE)

        for (let r = 0; r < BATTLESIZE; r++) {
            let row = adjTiles.slice(BATTLESIZE * r , BATTLESIZE*(r+1)).map(tile => tile.index - firstGid);
            indexGrid.push(row);
        }

        player.saveOverWorldPos()
        player.tilePos = {x: gridStart,
        y: gridStart - player.hitboxOffsetY} // gridStart is also the midTile of the grid

        for (let actor of actors.slice(1)) {
            actor.saveOverWorldPos()

            actor.tilePos = {x: gridStart + ((actor.curTile.pixelX - player.curTile.pixelX) / TILESIZE), y:
            gridStart-actor.hitboxOffsetY + ((actor.curTile.pixelY -  player.curTile.pixelY) / TILESIZE)}

            // (^) Sets up the actor position in tiles relative to the player
        }

        scene.scene.start('BattleScene', { actors: actors, tiles: indexGrid }); // Pass actors data

    }
}


export { Player, Enemy, Fight, TILESIZE, SCREENWIDTH, SCREENHEIGHT, BATTLESIZE, pathToTile};