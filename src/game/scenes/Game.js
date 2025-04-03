import { EventBus } from '../EventBus';
import { Scene } from 'phaser';


class GameScene extends Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.gameCanvas = null;
        this.gameWidth = 1200;
        this.gameHeight = 600;
    }

    preload() {
        // Load assets here
    }

    create() {
        // Initialize game objects and logic here
        EventBus.emit('gameReady');
    }

    update() {
        // Game loop logic here
    }
}

export default GameScene;