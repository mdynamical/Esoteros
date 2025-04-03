import { Boot } from './scenes/Boot';
import { GameScene } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import Phaser from 'phaser';
import { Preloader } from './scenes/Preloader';

const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 600,
    canvas:gameCanvas,
    physics: {
       "default": "arcade",
         arcade: {
             gravity: { y: 0 },
             debug: false
         }
    },
    scene:{GameScene}
}
