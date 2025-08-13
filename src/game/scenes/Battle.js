import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import {SCREENWIDTH, SCREENHEIGHT, TILESIZE , BATTLESIZE, Player, Enemy} from '../elements';
import { act } from 'react';
import { ssrExportAllKey } from 'vite/runtime';


function equalArrays(a, b) {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}

class GridTile {
    constructor(scene, x, y, size, row, col) {
        this.scene = scene;
        this.row = row;
        this.col = col;

        this.rect = scene.add.rectangle(x, y, size, size, 0x000000, 0.3)
        .setStrokeStyle(2, 0xffffff).setOrigin(0).setInteractive();

        this.rect.on('pointerover', () => {
            this.rect.setFillStyle(0xaaaaaa, 0.4); 
        });

        this.rect.on('pointerout', () => {
            this.rect.setFillStyle(0x000000, 0.3); 
        });

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
        this.markedTiles = new Set()


    }

    preload() {
        for (let actor of this.actors) {
            let icon = actor.textures.icon
            let file = `/assets/textures/${icon}.png`
            console.log(file)
            this.load.image(icon, file)
        }
        this.load.image('background', '/assets/interior2.png');

    }

    create() {
        this.add.image(0, 0, 'background').setOrigin(0, 0);

        const gridSize = BATTLESIZE;
        const cellSize = TILESIZE * 2;
        const gridWidth = gridSize * cellSize;
        const gridHeight = gridSize * cellSize;

        this.startX = this.gameWidth - gridWidth - 25;
        this.startY = (this.gameHeight - gridHeight) / 2;

        const graphics = this.add.graphics();
        this.grid = []


        for (let row = 0; row < gridSize; row++) {
            const rowArray = [];
            for (let col = 0; col < gridSize; col++) {
                const x = this.startX + col * cellSize;
                const y = this.startY + row * cellSize;

                const tile = new GridTile(this, x, y, cellSize, row, col);
                rowArray.push(tile);
            }
            this.grid.push(rowArray);
        }

        this.getActorsPos()

        
    }

    getActorsPos() {
        let centerTile = (BATTLESIZE-1) / 2 
        this.positions.push([centerTile, centerTile]) // The Player always starts in the middle
        for (let i=1; i <= this.actors.length-1; i++) {
            let enemy = this.actors[i]

            let xDiff = ((enemy.hitbox.x - this.player.hitbox.x)  / TILESIZE)
            let yDiff = ((enemy.hitbox.y- this.player.hitbox.y)  / TILESIZE)

            this.positions.push([centerTile + xDiff, centerTile + yDiff]) // col row positions relative to the Player in the middle
        }
        this.renderPos()
    }

    renderPos () {
        let gridSize = TILESIZE * 2
        for (let i=0; i<= this.actors.length-1; i++) {
            let actorPos = this.positions[i]
            let tile = this.grid[actorPos[1]][actorPos[0]] //[1][0] as col=x and row=y 
            
            this.add.image(tile.rect.x, tile.rect.y, this.actors[i].textures.icon)
            .setDisplaySize(gridSize, gridSize).setOrigin(0);
            
        }

    }

    select(tile) {
        let tilePos = [tile.col, tile.row]
        let actor = null

        for (let i = 0; i <= this.positions.length-1; i++) {

            let pos = this.positions[i]
            if (equalArrays(tilePos, pos)) {
                actor = this.actors[i]
                break
            }

        }
        if (actor instanceof Player) {
            if (this.selectedParty) {
                this.selectedParty=null
                for (let tile of this.markedTiles) {
                    tile.rect.setFillStyle(0x000000, 0.3)
                }
                this.markedTiles.clear()
            }
            else {this.selectedParty = actor}
        }
        
        else if (actor instanceof Enemy && this.selectedParty) {
            if (this.selectedEnemy) {this.selectedEnemy=null}
            else {this.selectedEnemy = actor}
        }
        this.renderMovement()
    }

    renderMovement() {
        if (!this.selectedParty) {return}
        let actorPos = this.positions[this.actors.indexOf(this.selectedParty)]
        let charTile = this.grid[actorPos[1], actorPos[1]]

        let dirVector = {
            W: {x:0, y:-1},
            A: {x:-1, y:0},
            S: {x:0, y:+1},
            D: {x:1, y:0},
        }
        for (let key in dirVector) {
            let dir = dirVector[key]
            let adjTile = this.grid[actorPos[1]+dir.x][actorPos[0]+dir.y]
            adjTile.rect.setFillStyle(0xaaaaaa, 0.4)
            this.markedTiles.add(adjTile)
        }
    }

    update() {
        
    }
}

export default Battle;