import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export let matchId: undefined | string = undefined

export function setMatchId(id: undefined | string) {
    matchId = id
}

export const initializeSocket = (url: string, query: any) => {
    if (socket) {
        return socket;
    }
    socket = io(url, {
        query,
        transports: ['websocket'],
    });

    socket.on('connect', () => {
        console.log('Conectado ao servidor Socket.IO', socket?.id);
    });

    return socket;
};

export const getSocket = () => {
    if (!socket) {
        throw new Error('Socket não inicializado. Chame initializeSocket primeiro.');
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log('Desconectado do servidor Socket.IO');
    }
};