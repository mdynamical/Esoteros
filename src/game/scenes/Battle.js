import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import {SCREENWIDTH, SCREENHEIGHT } from '../elements';

class Battle extends Scene {
    constructor() {
        super("BattleScene");
        this.gameWidth = SCREENWIDTH;
        this.gameHeight = SCREENHEIGHT;
    }

    init(data) {
        this.actors = data.actors;
    }

    preload() {
        this.load.image('battleBackground', '/assets/textures/battle_background.png');

    }

    create() {
        this.add.image(0, 0, 'battleBackground').setOrigin(0, 0);
        
    }
}