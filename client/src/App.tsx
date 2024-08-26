'use client'
import { useEffect, useState } from "react";
import GameApp from "./Game";
import { useForm } from 'react-hook-form';
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const url = 'http://localhost:4003'

export default function App() {

    const [game, setGame] = useState(false)

    const { handleSubmit, register } = useForm()

    async function submit(data: any) {
        axios.post(`${url}/login`, data)
            .then(e => {
                console.log(e)
                if (e.data) {
                    sessionStorage.setItem('token', e.data.token)
                    setGame(true)
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

    const [ranking, setRanking] = useState<any[]>([])

    useEffect(() => {
        fetch()
    }, [])

    function fetch() {
        axios.get(`${url}/rank`).then(e => {
            setRanking(e.data)
        })
    }

    return (
        <div className="flex  justify-center">
            <ToastContainer />

            {
                game ?
                    <GameApp />
                    :
                    <div className="flex flex-col items-center">
                        <form className="flex flex-col gap-5" onSubmit={handleSubmit(submit)}>
                            <div>
                                <label htmlFor="first_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Username</label>
                                <input type="text" id="first_name"
                                    {...register('username', { required: true })}

                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="John" required />
                            </div>
                            <div>
                                <label htmlFor="first_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                                <input type="password" id="first_name"
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="****"
                                    {...register('password', { required: true })}
                                    required />
                            </div>
                            <div className="flex justify-between">
                                <button type="submit"
                                    className="text-white  bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                                >
                                    Entrar
                                </button>
                                <a
                                    onClick={fetch}
                                    className="text-white cursor-pointer bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                                >
                                    Atualizar
                                </a>
                            </div>
                        </form>

                        {
                            ranking.length == 0
                                ?
                                <span>Erro de conexao</span>
                                :
                                <div className=" flex flex-col items-center mt-15 ">
                                    <span className="text-4xl underline">
                                        Ranking
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
                                                ranking.map(i =>
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

        </div>
    )
}