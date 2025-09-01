import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import {SCREENWIDTH, SCREENHEIGHT, TILESIZE, startFight, Body} from '../elements';


class OverworldScene extends Scene {
    constructor() {
        super("OverworldScene");
        //For a 32x32 tile size this is equal to a 42x24 grid
        this.screenWidth = SCREENWIDTH;
        this.screenHeight = SCREENHEIGHT;

    }

    checkEncounter() {
        let encounter = false
        this.enemies = this.actors.slice(1)

        for (let enemy of this.enemies) {
            if (enemy.nextTile === this.player.curTile || this.player.nextTile === enemy.curTile) {
                encounter = true
                this.player.resetMovement()
                enemy.resetMovement()
            }
            
            if (this.player.nextTile === enemy.nextTile) {
                this.player.moving = null
                this.player.resetMovement()
            }

            else if (enemy.nextTile === this.player.nextTile) {
                enemy.path = []
                enemy.resetMovement()
            }
            
        }

        return encounter
    }

    startEncounter() {
        startFight(this, this.actors)
        this.encounter = false
    }

    init(data) {
        this.actors = data.actors;
    }

    preload() {
        for (let actor of this.actors) {
            let path = `/assets/textures/${actor.name}.png`
            this.load.image(actor.name, path)
            // (^) Key, Path
        }
        this.load.image('spritesheet', '/assets/textures/testspritesheet1.png');
        this.load.tilemapTiledJSON('map', '/assets/maps/testmap1.json');
    }

    create() {
        //MAP
        this.type = 'overworld'
        const map = this.make.tilemap({ key: 'map' }); // Process map Json
        const tileset = map.addTilesetImage('testspritesheet1', 'spritesheet');
        // (^Params) 1 -> spritesheet file name 2 -> spritesheet name defined in preload
        // this.physics.world.drawDebug = true;
        
        this.objects1 = map.getObjectLayer('1').objects;

        map.layers.forEach((layerData, index) => { // Create layers
            this[`layer${index}`] = map.createLayer(layerData.name, tileset, 0, 0);
        });

        this.curLayer = this.layer1
        this.physics.world.setBounds(0, 0, 9999999, 999999);
        this.startX = 0
        this.startY = 0

        //DEBUG COLLISION
        /* const graphics = this.add.graphics();
        graphics.lineStyle(2, 0xff0000, 1);

        for (const row of this.curLayer.layer.data) {
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

        for (let actor of this.actors) {actor.setScene(this, actor.name)}
        this.actors[1].target = this.player

        // LIGHT
        this.lights.enable();
        this.lights.setAmbientColor(0x111111);
        this.curLayer.setPipeline('Light2D');

        for (let actor of this.actors) {actor.textures.sprite.setPipeline('Light2D')}

        this.player.lightSource = this.lights.addLight(
            this.player.textures.sprite.x,
            this.player.textures.sprite.y,
            150,         // radius
            0xffffff,    // light color
            1           // intensity
        );

        //CAM
        const cam = this.cameras.main;
        cam.startFollow(this.player.textures.sprite, true, 0.05, 0.05);
        cam.setBounds(0, 0, 9999999, 999999)
        cam.setZoom(1.6)
        
        //KEYS
        this.pressedKeys = new Set();
        this.pressedDirectionalKeys = new Set()
        this.releasedKeys = new Set();

        this.input.keyboard.on('keydown', (event) => {
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {this.pressedDirectionalKeys.add(event.code)}
            else {this.pressedKeys.add(event.code)};
        });

        this.input.keyboard.on('keyup', (event) => {
            if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {this.pressedDirectionalKeys.delete(event.code)}
            else {this.pressedKeys.delete(event.code)};
            this.releasedKeys.add(event.code);
        });

        EventBus.emit('gameReady');

    }

    update() {
        if (this.checkEncounter()) {this.startEncounter(); return}
        for (let actor of this.actors) {actor.update()}
        
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
            if (key === 'ShiftLeft') {
                    this.player.run()
                }
        }

        for (const key of this.releasedKeys) {
            if (key === 'KeyC') {
                this.devil.target = this.player
                if (this.devil.chase === false) {this.devil.chase = true}
                else {this.devil.chase = false}
                
            }
            if (key === 'ShiftLeft') {
                this.player.running = false
            }

            if (key === 'KeyP') {
                console.log((this.player.hitbox.x-this.devil.hitbox.x)/TILESIZE,
                (this.player.hitbox.y-this.devil.hitbox.y)/TILESIZE)

            }
        }

        this.releasedKeys.clear(); 
    }
}

export default OverworldScene;