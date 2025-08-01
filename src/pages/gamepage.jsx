import PropTypes from 'prop-types';
import { forwardRef, useEffect, useLayoutEffect, useRef } from 'react';
import {createGame} from '../game/main';
import { EventBus } from '../game/EventBus';
import "../styles/gamepage.css"

/*<pre>{JSON.stringify(mapdata, null, 2)}</pre> */

function GamePage() {
    const gameContainerRef = useRef(null);
    
    useEffect(() => {
        if (gameContainerRef.current) {
          const game = createGame(gameContainerRef.current);
    
          return () => {
            game.destroy(true);
          };
        }
      }, []);
    
    return (
        <div className="game-background" ref={gameContainerRef}/>
    )
}

export default GamePage