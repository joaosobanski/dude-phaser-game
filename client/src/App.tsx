import { useEffect, useRef, useState } from 'react';
import { IRefPhaserGame, PhaserGame } from './game/PhaserGame';
import { disconnectSocket, initializeSocket, getSocket, setMatchId, matchId } from './socketService';
import { EventBus } from './game/EventBus';

function App() {
    // The sprite can only be moved in the MainMenu Scene
    const [canMoveSprite, setCanMoveSprite] = useState(true);

    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    const currentScene = (scene: Phaser.Scene) => {
        setCanMoveSprite(scene.scene.key !== 'GameScene');
    }

    const [logged, setLogged] = useState(false)

    useEffect(() => {
        const socket = initializeSocket('http://localhost:4003', {
            token: "1b144c49-2d1d-46c7-8eee-a429aef93a06"
        });

        socket.on('message', (data) => {
            console.log('Recebido evento:', data);
        });
        socket.on('disconnect', (data) => {
            console.log('Recebido evento:', data);
            setLogged(false)

        });
        socket.on('connect', () => {
            console.log('Conectado ao servidor Socket.IO', socket?.id);
        });
        socket.on('new-match', (v: any) => {
            setMatchId(v.id)
            setLogged(true)
        });

        EventBus.on('die', () => {
            setMatchId(undefined)
        })

        return () => {
            disconnectSocket();
        };
    }, []);

    function novaPartida() {

        const socket = getSocket()


        socket.emit('match')
    }

    return (
        <div id="app">
          
            {
                // !matchId &&
                <button onClick={novaPartida}>New Match</button>
            }

            {
            logged &&
                <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
            }
        </div>
    )
}

export default App
