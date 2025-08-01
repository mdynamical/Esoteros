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
            this.pos = [pos[0] * TILESIZE, pos[1] * TILESIZE]; // Position in the game world
        }

        this.layer = layer;
        this.sprite = sprite;

        this.scene = scene;
        if (this.scene != null) {
            this.setScene(this.scene, 'player');
        }
        this.moving = false
        this.speed = 4 // SPEED SHOULD ALWAYS BE A FACTOR OF TILESIZE
    }

    collisionCheck(dir) {
        /* This offset is necessary here due to the weird way Phaser handles the previous sprite's Y body offset
        used in setScene()                                                                                                      */
        let offsetY = this.sprite.y + TILESIZE;
        let movement = TILESIZE;
        let tile
        
        if (dir === 'W' || dir === 'A') {movement = -movement}

        if (dir === 'W' || dir === 'S') {tile = this.scene.layer1.getTileAtWorldXY(this.sprite.x, offsetY + movement)}
        else if (dir === 'A' || dir === 'D') {tile = this.scene.layer1.getTileAtWorldXY(this.sprite.x + movement, offsetY)}
        
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

        this.sprite.body.setSize(32, 32);
        this.sprite.body.setOffset(0, 32); // Offset for the sprite body to occupy the only the bottom square

        this.sprite.setCollideWorldBounds(true)
    }

    setMove(dir) {
        if (this.moving || this.collisionCheck(dir)) return;
        this.moving = dir;
        this.move()
    }

    move() {
        let movement = this.speed
         if (this.moving === 'W' || this.moving === 'A') {movement = -this.speed}

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
    }

    updatePos(newPos) {
        this.pos = newPos;
        if (this.sprite) {
            this.sprite.setPosition(newPos[0], newPos[1]);
        }
    }
}

class Player extends Character {
    constructor(name,  pos=[0, 0], scene=null, layer=0, attr=null, inv=null) {
        super(name, pos, attr, layer, scene);
        this.inv = inv

    }
}

export { Player, TILESIZE, SCREENWIDTH, SCREENHEIGHT};
