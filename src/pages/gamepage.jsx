import mapdata from "/src/maps/mapconfig.json"
import "../styles/gamepage.css"

{/*<pre>{JSON.stringify(mapdata, null, 2)}</pre> */}



function GamePage() {
    console.log(mapdata)
    return (
        <div className="game-background">
            <main className="game-grid">
                {mapdata.mapgrid && mapdata.mapgrid.flat().map((tile, tileIndex) => (
                    <div key={tileIndex} className={`tile tile-${tile}`}></div>
                ))}
            </main>
        </div>
    )
}

export default GamePage