import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import {SCREENWIDTH, SCREENHEIGHT } from '../elements';


class OverworldScene extends Scene {
    constructor() {
        super("OverworldScene");
        //For a 32x32 tile size this is equal to a 42x24 grid
        this.gameWidth = SCREENWIDTH;
        this.gameHeight = SCREENHEIGHT;

    }

    init(data) {
        this.actors = data.actors;
    }

    preload() {
        this.load.image('spritesheet', '/assets/textures/testspritesheet1.png');
        this.load.image('player', '/assets/textures/elbert.png');
        this.load.tilemapTiledJSON('map', '/assets/maps/testmap1.json');
    }

    create() {
        //MAP
        const map = this.make.tilemap({ key: 'map' }); // Process map Json
        const tileset = map.addTilesetImage('testspritesheet1', 'spritesheet');
        this.physics.world.drawDebug = true;
        // (^Params) 1 -> spritesheet file name 2 -> spritesheet name defined in preload

        const getO1 = map.getObjectLayer('1')
        const objects1 = getO1.objects;

        //const layer0 = map.createLayer('0', tileset, 0, 0);
        const layer1 = map.createLayer('1', tileset, 0, 0);
        this.layer1 = layer1;

        
        //DEBUG COLLISION
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0xff0000, 1);

        for (const row of this.layer1.layer.data) {
            for (const tile of row) {
                if (tile.properties.collision) {
                    graphics.strokeRect(
                        tile.pixelX,
                        tile.pixelY,
                        tile.width,
                        tile.height
                    );
                }
            }
        }


        
        
        
        //ACTORS
        this.player = this.actors[0];
        
        this.player.setScene(this, 'player');
        
        //CAM
        const cam = this.cameras.main;
        cam.startFollow(this.player.sprite, true, 0.05, 0.05);
        cam.setBounds(0, 0, 9999999, 999999)
        
        //KEYS
        this.pressedKeys = new Set();
        this.input.keyboard.on('keydown', (event) => {
            this.pressedKeys.add(event.code);
        });

        this.input.keyboard.on('keyup', (event) => {
        this.pressedKeys.delete(event.code);
        });

        this.physics.world.setBounds(0, 0, 9999999, 999999);
        this.physics.world.createDebugGraphic()
        EventBus.emit('gameReady');

    }

    update() {
        this.player.update();
        for (const key of this.pressedKeys) {
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(key) && !this.player.moving) {
                if (key === 'KeyW') {
                    this.player.setMove('W');
                }
                else if (key === 'KeyA') {
                    this.player.setMove('A');
                }
                else if (key === 'KeyS') {
                    this.player.setMove('S');
                }
                else if (key === 'KeyD') {
                    this.player.setMove('D');
                }
            }
            // console.log(`Key is being held: ${key}`);

        }
        // console.log(`OBJ POS: ${this.player.pos}, SPRITE POS: ${this.player.sprite.x}, ${this.player.sprite.y}`);

    }
}

export default OverworldScene;