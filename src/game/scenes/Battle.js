import { EventBus } from '../EventBus';
import { Scene, Tilemaps } from 'phaser';
import {SCREENWIDTH, SCREENHEIGHT, TILESIZE , BATTLESIZE, Player, Enemy, pathToTile} from '../elements';

function equalArrays(a, b) {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}

class GridTile {
    constructor(scene, x, y, size, row, col) {
        this.scene = scene;
        this.row = row;
        this.col = col;
        this.style = scene.defaultStyles.defaultTile
        this.rect = scene.add.rectangle(x, y, size, size, this.style.tint, this.style.alpha)
        .setStrokeStyle(0.5, 0x000000).setOrigin(0).setInteractive();

        this.rect.on('pointerdown', () => {
            console.log(`Clicked tile at [${row}, ${col}]`);
            scene.select(this)
        });

    }
}

class Battle extends Scene {
    constructor() {
        super("BattleScene");
        this.gameWidth = SCREENWIDTH;
        this.gameHeight = SCREENHEIGHT;
        this.selectedParty = null;
        this.selectedEnemy = null
    }

    init(data) {
        this.actors = data.actors;
        this.player = this.actors[0]
        this.devil = this.actors[1]

        this.positions = []
        this.filledTiles = new Set()

        this.tiles = data.tiles


    }

    preload() {
        for (let actor of this.actors) {
            let path = `/assets/textures/${actor.name}`
 
            this.load.image(actor.name, path)
        }
        this.load.image('background', '/assets/interior2.png');
        this.load.image('spritesheet', '/assets/textures/testspritesheet1.png');



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
        const tileset = map.addTilesetImage('spritesheet');

        this.curLayer = map.createLayer(0, tileset, this.startX, this.startY);
        this.layer1 = this.curLayer

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
    }

    getActorsPos() {

    }

    renderPos () {

        /* for (let i=0; i<= this.actors.length-1; i++) {
            let actor = this.actors[i]
            let actorPos = this.positions[i]
            let xOffset = actor.hitboxOffsetX
            let yOffset = actor.hitboxOffsetY
            let originTile = this.grid[actorPos[1]-yOffset][actorPos[0]-xOffset] //[1][0] as col=x and row=y 
            
            this.add.image(originTile.rect.x, originTile.rect.y, actor.name)
            .setOrigin(0);
            
        }
        */
    }

    select(gridTile) {
        let tilePos = [gridTile.col, gridTile.row]
        let selectedActor = null

        let tile = this.gridTileConverter(tilePos)

        for (let actor of this.actors) {if (tile === actor.curTile){selectedActor=actor}}
        

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

    renderPathTiles() {
        
    }

    update() {

    }
}

export default Battle;