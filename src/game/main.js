import Phaser from 'phaser';
import { Player, Enemy} from './elements';
import OverworldScene from './scenes/Overworld';
import Battle from './scenes/Battle';

const player = new Player('Dummy', {x: 54, y: 45}, {sprite: 'elbert', portrait: '', icon: 'elbertIcon'});
const devil = new Enemy('Devil', {x:59, y : 40}, {sprite: 'thefella', portrait: '', icon: 'thefellaIcon'});

const overworld = new OverworldScene([player])

function createGame (parentElement) {
    const config = {
        type: Phaser.AUTO,
        width: overworld.screenWidth,
        height: overworld.screenHeight,
        scene: [OverworldScene, Battle],
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