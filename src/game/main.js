import Phaser from 'phaser';
import { Player } from './elements';
import OverworldScene from './scenes/Overworld';

const player = new Player('Dummy', [20, 15]);

const overworld = new OverworldScene([player])

function createGame (parentElement) {
    const config = {
        type: Phaser.AUTO,
        width: overworld.gameWidth,
        height: overworld.gameHeight,
        scene: [OverworldScene],
        parent: parentElement,
        physics: {
        "default": "arcade",
            arcade: {
                gravity: { y: 0 },
                debug: true
            }
        },
    }

    const game = new Phaser.Game(config);
    game.scene.start('OverworldScene', { actors: [player] }); // Pass actors data
    return game
}

export {createGame};