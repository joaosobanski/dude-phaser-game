import { useEffect, useRef, useState } from 'react';
import { IRefPhaserGame, PhaserGame } from './game/PhaserGame';
import { disconnectSocket, initializeSocket, getSocket, setMatchId, matchId } from './socketService';
import { EventBus } from './game/EventBus';
import axios from 'axios';
import { url } from './App';

function GameApp() {
    // The sprite can only be moved in the MainMenu Scene
    const [canMoveSprite, setCanMoveSprite] = useState(true);

    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    const currentScene = (scene: Phaser.Scene) => {
        setCanMoveSprite(scene.scene.key !== 'GameScene');
    }

    const [logged, setLogged] = useState(false)
    const [die, setdie] = useState(false)

    useEffect(() => {
        const socket = initializeSocket(url, {
            token: sessionStorage.getItem('token')
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

        EventBus.on('die', async () => {
            if (die) {
                return
            }
            const v = await axios.get(`${url}/match/${matchId}`)
            setdie(true)
            if (v) {
                alert(`Foi de F\nRanking: ${v.data.position}`)
            }
            else alert('Foi de F')
            setMatchId(undefined)
        })

        return () => {
            disconnectSocket();
        };
    }, []);

    function novaPartida() {

        const socket = getSocket()
        setdie(false)

        socket.emit('match')
    }

    const [list, setList] = useState<any[]>([])

    useEffect(() => {
        fetch()
    }, [die])

    function fetch() {
        axios.get(`${url}/user/${sessionStorage.getItem('token')}`).then(e => {
            setList(e.data)
            console.log(e.data)
        })
    }

    return (
        <div id="app">
            {
                (!matchId || die) &&
                <div className='flex flex-col items-center gap-10'>
                    <div>
                        <button onClick={novaPartida}
                            className="text-white  bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        >
                            New Match
                        </button>
                    </div>

                    {
                        list.length > 0 &&
                        <div className='flex flex-col items-center mt-10'>
                            <span className="text-4xl underline">
                                My Point`s
                            </span>
                            <table className="w-full table-fixed flex-col">
                                <thead>
                                    <tr>
                                        <th>
                                            Position
                                        </th>
                                        <th>
                                            Username
                                        </th>
                                        <th>
                                            Points
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-center">
                                    {
                                        list.map(i =>
                                            <tr>
                                                <td>
                                                    {i.position}
                                                </td>
                                                <td>
                                                    {i.username}
                                                </td>
                                                <td>
                                                    {i.points}
                                                </td>
                                            </tr>
                                        )
                                    }
                                </tbody>
                            </table>
                        </div>
                    }
                </div>
            }
            {
                logged && !die &&
                <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
            }
        </div>
    )
}

export default GameApp
