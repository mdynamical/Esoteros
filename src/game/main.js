import Phaser from 'phaser';
import { Player, Enemy} from './elements';
import OverworldScene from './scenes/Overworld';

const player = new Player('Dummy', [55, 35]);
const devil = new Enemy('Devil', [60, 40]);

const overworld = new OverworldScene([player])

function createGame (parentElement) {
    const config = {
        type: Phaser.AUTO,
        width: overworld.screenWidth,
        height: overworld.screenHeight,
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
    game.scene.start('OverworldScene', { actors: [player, devil] }); // Pass actors data
    return game
}

export {createGame};