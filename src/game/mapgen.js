function MapGenTest(mapGrid, scene) {
    console.log('this is the mapgrid: ', mapGrid)
    let tileWidth = mapGrid.tiles.tileWidth
    let tileMap = mapGrid.mapgrid

    for (let i = 0; i < tileMap.length; i++) {
        for (let j = 0; j < tileMap[i].length; j++) {
            let xStartPos = j * tileWidth
            let yStartPos = i * tileWidth
            let index = tileMap[i][j].toString()
            let block = mapGrid.tiles[index]
            let texture = block.name
            
            scene.add.image(xStartPos, yStartPos, `${texture}`)
                .setOrigin(0, 0)
                .setScale(1)
                .setDepth(1)
            console.log(`x: ${xStartPos}, y: ${yStartPos}, texture: ${texture}`)
        }

    }
}

function MapGen(spriteSheet, spriteData, tileData, scene) {
    
}

export default MapGen