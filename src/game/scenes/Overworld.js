import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import mapGen from "/src/maps/mapgen";

class OverworldScene extends Scene {
    constructor() {
        super("OverworldScene");
        // for a 32x32 tile size this is equal to a 40x20 grid
        this.gameWidth = 1280;
        this.gameHeight = 640;
    }

    preload() {
        this.load.image('grass', '../assets/textures/grass.png');
        this.load.json('mapdata', '/src/maps/mapconfig.json');
        
    }

    create() {
        this.mapData = this.cache.json.get('mapdata');
        mapGen(this.mapData, this, [0, 0]);
        EventBus.emit('gameReady');
    }

    update() {
        // Game loop logic here
    }
}

export default OverworldScene;