const TILESIZE = 32
const SCREENWIDTH = 1344
const SCREENHEIGHT = 768
const BATTLESIZE = 21 // In tiles. Should be an odd number

class Character {
    constructor(name, tilePos, attr, layer='layer1', scene=null) {
        this.name = name; 
        this.tilePos = tilePos;
        
        this.attr = attr; 
        this.layer = layer;
        this.scene = scene;
        this.textures = {sprite: '', portrait: ''}

        this.moving = false
        this.speed = 2 
        this.nextTile = null
        this.curTile = null

        /* The offsets are applied from the Top(Y=0) left(X=0) position of the sprite and move the hitbox
        +1 tile for each bottom(+Y) right(+X) increment. Custom hitboxes are necessary because Phaser's
        sprite.body object is unpredictable and it's better to avoid it if you want a functional collision system */ 
        this.hitboxOffsetX = 0 
        this.hitboxOffsetY = 1
        this.hitbox = {
            'x': 0,
            'y': 0,
            'right': 0,
            'bottom': 0,
        }

        this.lightSource = null
        this.path = []
        this.debug = false

        if (this.scene != null) {
            this.setScene(this.scene, this.name);
        }
    }

    collisionCheck(dir) {
        let movement = TILESIZE;
        let tile
        
        if (dir === 'W' || dir === 'A') {movement = -movement}

        if (dir === 'A' || dir === 'D')
        {tile = this.scene[this.layer].getTileAtWorldXY(this.hitbox.x + movement, this.hitbox.y)}

        else if (dir === 'W' || dir === 'S')
        {tile = this.scene[this.layer].getTileAtWorldXY(this.hitbox.x, this.hitbox.y + movement)}

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

    pathMovement() {
        if (this.moving) {this.move(); return}

        if (this instanceof Enemy) {
            if (!this.chase || !this.target) {return}
            this.path = pathToTile(this.scene, this.curTile, this.target.curTile)
        }

        this.nextTile = this.path.shift()
        let occupiedTile = false
        for (let actor of this.scene.actors) {if (this.nextTile===actor.curTile) {occupiedTile=true; this.path=[]}}
        if (!this.nextTile || occupiedTile) {return}

        let diffX = this.nextTile.pixelX - this.hitbox.x + this.scene.startX
        let diffY = this.nextTile.pixelY - this.hitbox.y + this.scene.startY

        if (diffY === -TILESIZE) {this.moving = 'W'}
        else if (diffX === -TILESIZE) {this.moving = 'A'}
        else if (diffY === TILESIZE) {this.moving = 'S'}
        else if (diffX === TILESIZE) {this.moving = 'D'}
    }

    move() {
        let movement = this.speed

        if (!this.moving) {return}
        if (this.running) {movement *= 1.6}

        const stopMovement = () => {
            this.hitbox.y = this.nextTile.pixelY + this.scene.startY;
            this.hitbox.x = this.nextTile.pixelX + this.scene.startX;
            this.moving = false;
            this.curTile = this.nextTile;
        }

        const movementHandler = {
            'W': {x:0, y:-1, expr:() => this.hitbox.y <= this.nextTile.pixelY+this.scene.startY},
            'A': {x:-1, y:0, expr:() => this.hitbox.x<= this.nextTile.pixelX+this.scene.startX },
            'S': {x:0, y:1, expr:() => this.hitbox.y >= this.nextTile.pixelY+this.scene.startY},
            'D': {x:1, y:0, expr:() => this.hitbox.x >= this.nextTile.pixelX+this.scene.startX},
        }
        const dir = movementHandler[this.moving]

        if (dir) {
            this.hitbox.x += dir.x * movement
            this.hitbox.y += dir.y * movement
            if (dir.expr()) {stopMovement()}
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
        // Used when encounters happen to prevent unprecise coordinates on the XY axis
        this.moving = null
        this.hitbox.x = this.curTile.pixelX
        this.hitbox.y = this.curTile.pixelY

    }

    updateRenderPosition() {
        this.textures.sprite.x = this.hitbox.x - (TILESIZE * this.hitboxOffsetX)
        this.textures.sprite.y = this.hitbox.y - (TILESIZE * this.hitboxOffsetY)
        
        this.updateLight()
    }

    saveOverWorldPos() {
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

    setMove(dir) {
    if (this.moving || this.collisionCheck(dir)) return;
    if (dir === 'W') {this.nextTile = this.scene[this.layer].getTileAtWorldXY(this.hitbox.x, this.hitbox.y-TILESIZE)}
    if (dir === 'A') {this.nextTile = this.scene[this.layer].getTileAtWorldXY(this.hitbox.x-TILESIZE, this.hitbox.y)}
    if (dir === 'S') {this.nextTile = this.scene[this.layer].getTileAtWorldXY(this.hitbox.x, this.hitbox.y+TILESIZE)}
    if (dir === 'D') {this.nextTile = this.scene[this.layer].getTileAtWorldXY(this.hitbox.x +TILESIZE, this.hitbox.y)}

    this.moving = dir;
    this.move()
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
        if (this.path.length === 0 ){this.move()}
        else this.pathMovement()
        this.recover();
        this.updateRenderPosition();

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
        this.body = new Body(this)
    }

    update() {
        this.pathMovement()
        this.updateRenderPosition()
    }
}

class State {
    constructor() {

    }

}

class BodyPart {
    constructor(name, sprite, rect, adjacentParts=[], attr={}, skills=[], isVital=false) {
        this.name = name
        this.sprite = sprite
        this.rect = rect
        this.adjacentParts = adjacentParts
        this.attr = attr
        this.skills = skills
        this.isVital = isVital
        this.equipment = null
        this.hitbox=null
    }

    getAttributes() {
        return this.attr
    }
    
}

class Body {
    constructor(character) {
        this.character = character
        this.parts = {}
        this.sprites = []
        const path = `/assets/bodies/${character.name}.json`

        this.loadBodyParts(path)
    }

    async loadBodyParts(source) {
        let data = null
        let torso = null
        let bodyParts = []
        const bodyPartElements = ["RECTANGLE", "ELLIPSE"]

        try {
            const res = await fetch(source);
            if (!res.ok) {
                throw new Error('Network response was not ok');
            }

            data = await res.json();
            
        } 
        catch (error) {
            console.error('Error fetching file:', error);
            return
        }
        
        for (let element of data) {
            if (bodyPartElements.includes(element.type)) {
                if (element.name === "torso") {torso = element}
                if (element.name === "sprite") {continue}
                bodyParts.push(element)
            }
        }

        if (!torso) {console.log("Torso not found!"); return}

        for (let data of bodyParts) {
            const rect = {
                type: data.type,
                x: data.x - torso.x,
                y: data.y - torso.y,
                height: data.height,
                width: data.width
            }
            //X and Y are the relative position of the part compared to the torso
            const part = new BodyPart(data.name, null, rect)
            this.parts[part.name] = part
        }

    }

    activateBody(x, y) {
        if (!this.character.scene) {console.warn(`No scene for ${this.char.name}`); return}
        let rects = []

        const torso = this.parts['torso']
        const torsoX = x-(torso.rect.width/2)
        const torsoY = y-(torso.rect.height/2)
        const torsoRect = this.character.scene.add.rectangle(torsoX, torsoY, torso.rect.width, torso.rect.height,
        0xF9F6EE).setOrigin(0, 0).setVisible(false)

        const torsoSprite = this.character.scene.add.image(torsoX, torsoY,
            `${this.character.name}_torso`).setOrigin(0, 0)
        torso.hitbox = torsoRect
        torso.sprite = torsoSprite

        for (let key in this.parts) {
            if (this.parts[key].name === "torso") {continue}

            const part = this.parts[key].rect
            let element = null

            if (part.type == "RECTANGLE") {
                element = this.character.scene.add.rectangle(torsoX+part.x, torsoY+part.y,
                part.width, part.height, 0xF9F6EE).setOrigin(0,0).setVisible(false)
                
                if (part.rotation) {element.rotation = part.rotation}
            }
            else if (part.type==="ELLIPSE") {
                element = this.character.scene.add.circle(torsoX+part.x, torsoY+ part.y,
                part.height/2, 0xF9F6EE).setOrigin(0, 0).setVisible(false)
            }

            let sprite = this.character.scene.add.image(torsoX+part.x, torsoY+part.y,
            `${this.character.name}_${this.parts[key].name}`).setOrigin(0, 0)

            this.parts[key].sprite = sprite

            if (element) {this.parts[key].hitbox = element}
        }

    }
    
    loadPartsDefaultAttributes() {

    }

    setPartAttributes(partName, attr) {

    }

    disablePart(partName) {

    }
        
    checkActiveParts() {
        const search = () => {

        }

        for (let key in this.parts) {}
    }
    
    checkIfAlive() {
        let alive = false
        for (let key in this.parts) {if (this.parts[key].isVital) {alive = true; break}}
        return alive
    }

    checkCollision(input) {

    }

}

class Battle {
    constructor() {

    }
}


class Attributes {
    constructor() {
        //TODO
    }
}

function pathToTile(scene, startTile, targetTile, layerOrigin={x:0, y:0}) {
    // My goal here was to create an algorithm similar to A*, I decided to go with a greedy BFS search
    if (!targetTile) {return}

    const heuristic = (startTile, targetTile) => (Math.abs(targetTile.pixelX - startTile.pixelX) + Math.abs(targetTile.pixelY - startTile.pixelY)) / TILESIZE

    let discoveredTiles = new Set();
    discoveredTiles.add(startTile)

    let paths = [scene.curLayer.getTileAtWorldXY(startTile.pixelX+TILESIZE+layerOrigin.x, startTile.pixelY+layerOrigin.y),
                        scene.curLayer.getTileAtWorldXY(startTile.pixelX-TILESIZE+layerOrigin.x, startTile.pixelY+layerOrigin.y),
                        scene.curLayer.getTileAtWorldXY(startTile.pixelX+layerOrigin.x, startTile.pixelY+TILESIZE+layerOrigin.y),
                        scene.curLayer.getTileAtWorldXY(startTile.pixelX+layerOrigin.x, startTile.pixelY-TILESIZE+layerOrigin.y)
                ].filter((t) => t && !t.properties.collision).map(t => [t]);
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
        
        let headAdjacent = [scene.curLayer.getTileAtWorldXY(head.pixelX+TILESIZE+layerOrigin.x, head.pixelY+layerOrigin.y),
                    scene.curLayer.getTileAtWorldXY(head.pixelX-TILESIZE+layerOrigin.x, head.pixelY+layerOrigin.y),
                    scene.curLayer.getTileAtWorldXY(head.pixelX+layerOrigin.x, head.pixelY+TILESIZE+layerOrigin.y),
                    scene.curLayer.getTileAtWorldXY(head.pixelX+layerOrigin.x, head.pixelY-TILESIZE+layerOrigin.y)
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

function startFight(scene, actors) {
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
    player.tilePos = {x: gridStart, y: gridStart - player.hitboxOffsetY} // gridStart is also the midTile of the grid

    for (let actor of actors.slice(1)) {
        actor.saveOverWorldPos()

        actor.tilePos = {x: gridStart + ((actor.curTile.pixelX - player.curTile.pixelX) / TILESIZE), y:
        gridStart-actor.hitboxOffsetY + ((actor.curTile.pixelY -  player.curTile.pixelY) / TILESIZE)}
        // (^) Sets up the actor position in tiles relative to the player
    }

    scene.scene.start('BattleScene', { actors: actors, tiles: indexGrid });

}

export { Player, Enemy, startFight, TILESIZE, SCREENWIDTH, SCREENHEIGHT, BATTLESIZE, pathToTile, Body};