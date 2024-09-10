import { useEffect, useRef, useState } from 'react';
import { IRefPhaserGame, PhaserGame } from './game/PhaserGame';
import { disconnectSocket, initializeSocket, getSocket, setMatchId, matchId } from './socketService';
import { EventBus } from './game/EventBus';
import axios from 'axios';
import { url } from './App';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

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
            token: localStorage.getItem('token')
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
    const [data, setdata] = useState<any[]>([])

    useEffect(() => {
        fetch()
    }, [die])

    function fetch() {
        axios.get(`${url}/user/${localStorage.getItem('token')}`).then(e => {
            setList(e.data)
            console.log(e.data)
        })
        axios.get(`${url}/details/${localStorage.getItem('token')}`).then(e => {
            setdata(e.data)
            console.log(e.data)
            reset(e.data)
        })
    }
    const { handleSubmit, register, reset } = useForm()


    async function submit(data: any) {
        console.log(data, localStorage.getItem('token'))
        axios.post(`${url}/update`, { ...data, id: localStorage.getItem('token') })
            .then(e => {
                console.log(e)
                if (e.data) {
                    novaPartida()
                    // localStorage.setItem('token', e.data.token)
                    // setGame(true)
                } else {
                    toast.error('Erro inesperado');
                }
            })
            .catch(e => {
                if (e.response) {
                    // Se o status for 400, captura o erro do body
                    if (e.response.status === 400) {
                        const errorMessage = e.response.data.message || 'Erro ao processar a requisição';
                        console.error('Erro:', errorMessage);
                        toast.error(errorMessage);
                    } else {
                        toast.error('Erro inesperado');
                    }
                } else {
                    console.error('Erro:', e.message);
                    toast.error('Erro de rede ou servidor não encontrado');
                }
            })
    }

    return (
        <div id="app">
            {
                (!matchId || die) &&
                <div className='flex flex-col items-center gap-10'>

                    <form className="flex flex-col gap-5" onSubmit={handleSubmit(submit)}>
                        <div>
                            <label htmlFor="first_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nome</label>
                            <input type="text" id="first_name"
                                {...register('nome', { required: true })}

                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="John" required />
                        </div>
                        <div>
                            <label htmlFor="first_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Fone</label>
                            <input type="" id="first_name"
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="fone"
                                {...register('fone', { required: true })}
                                required />
                        </div>
                        <div>
                            <label htmlFor="first_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Colegio</label>
                            <input type="colegio" id="first_name"
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="colegio"
                                {...register('colegio', { required: true })}
                                required />
                        </div>
                        <div>
                            <label htmlFor="first_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Ano</label>
                            <input type="ano" id="first_name"
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="ano"
                                {...register('ano', { required: true })}
                                required />
                        </div>
                        <div className="flex justify-between">
                            <button type="submit"
                                className="text-white  bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                            >
                                Entrar
                            </button>
                        </div>
                    </form>

                    {/* <div>
                        <button onClick={novaPartida}
                            className="text-white  bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        >
                            New Match
                        </button>
                    </div> */}

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
