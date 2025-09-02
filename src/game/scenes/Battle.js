import { EventBus } from '../EventBus';
import { Scene, Tilemaps } from 'phaser';
import {SCREENWIDTH, SCREENHEIGHT, TILESIZE , BATTLESIZE, Player, Enemy, pathToTile} from '../elements';
import {BattleGUI} from '../ui'

class GridTile {
    constructor(scene, x, y, size, row, col) {
        this.scene = scene;
        this.row = row;
        this.col = col;
        const style = scene.defaultStyles.defaultTile
        const borderStyle = scene.defaultStyles.defaultBorder
        this.rect = scene.add.rectangle(x, y, size, size, style.tint, style.alpha)
        .setStrokeStyle(borderStyle.size,borderStyle.tint).setOrigin(0).setInteractive();

        this.rect.on('pointerdown', () => {
            console.log(`Clicked tile at [${col}, ${row}]`);
            scene.select(this)
        });

        scene.rects.push(this.rect)
    }
}

class Battle extends Scene {
    constructor() {
        super("BattleScene");
        this.gameWidth = SCREENWIDTH;
        this.gameHeight = SCREENHEIGHT;
        this.selectedParty = null;
        this.selectedEnemy = null;
        this.rects = []

    }

    init(data) {
        this.actors = data.actors;
        this.player = this.actors[0]
        this.devil = this.actors[1]

        this.player.running = true

        this.positions = []
        this.filledTiles = new Set()

        this.tiles = data.tiles

    }

    preload() {
        for (let actor of this.actors) {
            let path = `/assets/textures/${actor.name}/${actor.name}`
            this.load.image(actor.name, path)

            if (actor instanceof Enemy) {
                for (let part in actor.body.parts) {
                    this.load.image(`${actor.name}_${part}`, `/assets/textures/${actor.name}/body/${part}.png`)
                }
            }
        }
        this.load.image('background', '/assets/images/interior2.png');
        this.load.image('spritesheet', '/assets/textures/testspritesheet1.png');
        this.load.tilemapTiledJSON('map', '/assets/maps/testmap1.json');
    }

    create() {
        this.add.image(0, 0, 'background').setOrigin(0, 0);

        this.defaultStyles = {
            defaultTile: {tint: 0x000000, alpha:0.1},
            defaultBorder: {tint: 0x000000, size:0.5},
            partyTileBorder: {tint:0x00008B, size:1},
            enemyTileBorder: {tint:0x8B0000, size:1},
            pathTileBorder: {tint:0x8B0000, size:1},
        }

        const gridSize = BATTLESIZE;
        this.cellSize = TILESIZE

        const gridWidth = gridSize * this.cellSize;
        const gridHeight = gridSize * this.cellSize;

        this.startX = Math.round(this.gameWidth * 1/4);
        this.startY = (this.gameHeight - gridHeight) / 2;

        const graphics = this.add.graphics();
        this.grid = []

        const map = this.make.tilemap({ data: this.tiles, tileWidth: TILESIZE, tileHeight: TILESIZE });
        const mapData = this.make.tilemap({key: 'map'});

        const tileset = map.addTilesetImage('spritesheet');

        this.curLayer = map.createLayer(0, tileset, this.startX, this.startY);
        this.layer1 = this.curLayer

        this.tilePropertySetter(mapData, this.layer1)

        for (let row = 0; row < gridSize; row++) {
            const rowArray = [];
            for (let col = 0; col < gridSize; col++) {
                const x = this.startX + col * this.cellSize;
                const y = this.startY + row * this.cellSize;

                const tile = new GridTile(this, x, y, this.cellSize, row, col);
                rowArray.push(tile);
            }
            this.grid.push(rowArray);
        }

        for (let actor of this.actors) {actor.setScene(this, actor.name, {x:this.startX, y:this.startY})}

        //KEYS
        this.pressedKeys = new Set();
        this.releasedKeys = new Set();

        this.input.keyboard.on('keydown', (event) => {
            this.pressedKeys.add(event.code)
        });

        this.input.keyboard.on('keyup', (event) => {
            this.pressedKeys.delete(event.code)
            this.releasedKeys.add(event.code);
        });

        this.gui = new BattleGUI(this)
    }

    tilePropertySetter(mapData, layer) {
        const tileProperties = mapData.tilesets[0].tileProperties
        
        for (let y = 0; y < layer.height; y++) {
            for (let x = 0; x < layer.width; x++) {
                const tile = layer.getTileAt(x, y);
                if (tile && tile.index !== undefined) {
                    tile.properties = tileProperties[tile.index];
                }
            }
        }

    }

    select(gridTile) {
        let tilePos = [gridTile.col, gridTile.row]
        let selectedActor = null

        let tile = this.gridTileConverter(tilePos)
    
        for (let actor of this.actors) {if (tile === actor.curTile){selectedActor=actor}}

        if (this.selectedParty && (tile !== this.selectedParty.curTile)) {
            this.setPartyPath(tile)
        }

        if (selectedActor instanceof Player) {
            if (this.selectedParty) {
                this.selectedParty=null
                this.clearStyles()
            }
            else {
                this.selectedParty = selectedActor
                let style = this.defaultStyles.partyTileBorder
                gridTile = this.gridTileConverter(selectedActor.curTile)

                this.setStyle(gridTile, style)
            }
        }

        else if (selectedActor instanceof Enemy && this.selectedParty) {
            this.selectedEnemy = selectedActor
        }
    }

    setPartyPath(tile) {
        const path = pathToTile(this, this.selectedParty.curTile, tile, {x:this.startX, y:this.startY})

        if (!(tile === this.previousClickedTile)) {
            this.clearStyles()
            for (let tile of path) {
                let gridTile = this.gridTileConverter(tile)
                this.setStyle(gridTile, this.defaultStyles.pathTileBorder)
            }
            this.previousClickedTile = tile
        }
        else {
            this.selectedParty.path = path
            this.selectedParty = undefined
            this.previousClickedTile = undefined
            this.clearStyles()
        }

    }

    clearStyles() {
        let defaultGrid = this.defaultStyles.defaultBorder
        let defaultTile = this.defaultStyles.defaultTile
        for (let tile of this.filledTiles) {
            if (Array.isArray(tile)) {
                this.grid[tile[1]][tile[0]].rect.setStrokeStyle(defaultGrid.size, defaultGrid.tint)
            }
            else {tile.setFillStyle(defaultTile.tint, defaultTile.alpha)}
        }
        this.filledTiles.clear()
    }

    setStyle(tile, style) {
        if (Array.isArray(tile)) {
            this.grid[tile[1]][tile[0]].rect.setStrokeStyle(style.size, style.tint)

        }
        else {tile.setFillStyle(style.tint, style.alpha)}
        this.filledTiles.add(tile)
    }

    gridTileConverter(pos) {
        if (Array.isArray(pos)) {
            return this.curLayer.getTileAtWorldXY(this.startX+(pos[0]*TILESIZE),this.startY+(pos[1]*TILESIZE))
        }
        else {return [pos.pixelX/TILESIZE, pos.pixelY/TILESIZE]}
        
    }

    toggleMapActivation(active) {
        const toggleObject = (obj, active) => {
            obj.setVisible(active).setActive(active)
            if (obj.input) active ? obj.setInteractive() : obj.disableInteractive()
        }
        for (let rect of this.rects) toggleObject(rect, active)
        for (let actor of this.actors) toggleObject(actor.textures.sprite, active)
        this.curLayer.setVisible(active).setActive(active)
    }

    update() {
        for (let actor of this.actors) {actor.update()}

        for (const key of this.releasedKeys) {
            // console.log(key)
            if (key === 'KeyP') {this.gui.setState("fightMode")}
            else if (key === 'KeyO') {this.gui.setState("tacticalMap")}
        }
        this.releasedKeys.clear()
    }
}

export default Battle;