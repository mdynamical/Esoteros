import mapdata from "/src/maps/mapconfig.json"
import "../styles/gamepage.css"

{/*<pre>{JSON.stringify(mapdata, null, 2)}</pre> */}



function GamePage() {
    console.log(mapdata)
    return (
        <div className="game-background">
            <canvas id="gameCanvas" className="game-canvas"></canvas>
        </div>
    )
}

export default GamePage