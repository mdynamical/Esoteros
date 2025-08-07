import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import {SCREENWIDTH, SCREENHEIGHT } from '../elements';


class OverworldScene extends Scene {
    constructor() {
        super("OverworldScene");
        //For a 32x32 tile size this is equal to a 42x24 grid
        this.screenWidth = SCREENWIDTH;
        this.screenHeight = SCREENHEIGHT;

    }

    init(data) {
        this.actors = data.actors;
    }

    preload() {
        this.load.image('spritesheet', '/assets/textures/testspritesheet1.png');
        this.load.image('player', '/assets/textures/elbert.png');
        this.load.image('devil', '/assets/textures/Thefella.png');
        this.load.tilemapTiledJSON('map', '/assets/maps/testmap1.json');
    }

    create() {
        //MAP
        const map = this.make.tilemap({ key: 'map' }); // Process map Json
        const tileset = map.addTilesetImage('testspritesheet1', 'spritesheet');
        // (^Params) 1 -> spritesheet file name 2 -> spritesheet name defined in preload
        // this.physics.world.drawDebug = true;
        

        const getO1 = map.getObjectLayer('1')
        const objects1 = getO1.objects;

        //const layer0 = map.createLayer('0', tileset, 0, 0);
        const layer1 = map.createLayer('1', tileset, 0, 0);
        this.layer1 = layer1;

        
        //DEBUG COLLISION
        /* const graphics = this.add.graphics();
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
        } */

        

        
        //ACTORS
        this.player = this.actors[0];
        this.devil = this.actors[1];
        this.player.setScene(this, 'player');
        this.devil.setScene(this, 'devil');

        /*LIGHT
        this.lights.enable();
        this.lights.setAmbientColor(0x111111);
        layer1.setPipeline('Light2D');

        this.player.sprite.setPipeline('Light2D');
        this.devil.sprite.setPipeline('Light2D');

        this.playerLight = this.lights.addLight(
            this.player.sprite.x,
            this.player.sprite.y,
            75,         // radius
            0xffffff,    // light color
            1           // intensity
        );
        this.player.lightSource = this.playerLight */

        
        //CAM
        const cam = this.cameras.main;
        cam.startFollow(this.player.sprite, true, 0.05, 0.05);
        cam.setBounds(0, 0, 9999999, 999999)
        cam.setZoom(1.6)
        
        //KEYS
        this.pressedKeys = new Set();
        this.pressedDirectionalKeys = new Set()

        this.input.keyboard.on('keydown', (event) => {
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {this.pressedDirectionalKeys.add(event.code)}
            else {this.pressedKeys.add(event.code)};
        });

        this.input.keyboard.on('keyup', (event) => {
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {this.pressedDirectionalKeys.delete(event.code)}
            else {this.pressedKeys.delete(event.code)};
        });

        //
        this.releasedKeys = new Set();
        this.input.keyboard.on('keyup', (event) => {
        this.releasedKeys.add(event.code);
        });

        this.physics.world.setBounds(0, 0, 9999999, 999999);
        this.physics.world.drawDebug = false;

        EventBus.emit('gameReady');

    }

    update() {
        this.player.update();
        this.devil.update();

        if (this.pressedDirectionalKeys && !this.player.moving) {
            let lastKey  = [...this.pressedDirectionalKeys][this.pressedDirectionalKeys.size - 1];
            if (lastKey === 'KeyW') {
                    this.player.setMove('W');     
                }
                else if (lastKey === 'KeyA') {
                    this.player.setMove('A');
                }
                else if (lastKey === 'KeyS') {
                    this.player.setMove('S');

                }
                else if (lastKey === 'KeyD') {
                    this.player.setMove('D');
                }
        }


        for (const key of this.pressedKeys) {
            // console.log(`Key is being held: ${key}`);
            if (key === 'ShiftLeft') {
                    this.player.run()
                }
        }
        for (const key of this.releasedKeys) {
            if (key === 'KeyC') {
                this.devil.target = this.player
                if (this.devil.chase === false) {this.devil.chase = true}
                else {this.devil.chase = false}
                console.log(this.devil.chase)
                
            }
            if (key === 'ShiftLeft') {
                this.player.altSpeed = 0
            }
        }

        this.releasedKeys.clear(); 
        // console.log(`OBJ POS: ${this.player.pos}, SPRITE POS: ${this.player.sprite.x}, ${this.player.sprite.y}`);

    }
}

export default OverworldScene;