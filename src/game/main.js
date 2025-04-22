import Phaser from 'phaser';
import OverworldScene from './scenes/Overworld';

const overworld = new OverworldScene()

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
                debug: false
            }
        },
    }

    const game = new Phaser.Game(config);
    return game
}

export default createGame;