import { AppDataSource } from "./data-source"
import { Server, Socket } from 'socket.io';
import http from 'http';
import bcrypt from 'bcrypt'
import express, { Request, Response } from 'express';
import { matchRepository, pointRepository, userRepository } from "./repository";
import { User } from "./entity/User";
import { Match } from "./entity/Match";
import { Points } from "./entity/Points";

const port = 4003;

const app = express();

app.use(express.json());

app.get('/test', (req: Request, res: Response) => {
    io.emit('test', 'test')
    res.json({ success: true })
})

app.post('/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body

        if (!username) {
            throw ('username não informado!')
        }

        if (!password)
            throw ('password não informado!')

        const user = await userRepository.findOneBy({
            username: username
        })


        if (user) {
            const valid = await bcrypt.compare(password, user.password)
            if (valid) {
                return res.json({
                    token: user.id
                })
            } else {
                throw ('password errada')
            }
        } else {
            const pwd = await bcrypt.hash(password, 10)

            let u = new User()
            u.password = pwd
            u.username = username
            u = await userRepository.save(u)

            return res.json({
                token: u.id
            })
        }
    } catch (e) {
        console.error(e)
        res.status(400).json(e)
    }
})

const server = http.createServer(app);

const io = new Server(server, {
    transports: ['websocket'],
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

var userMap = new Map<string, User>()

io.on('connection', async (socket: Socket) => {
    let { token } = socket.handshake.query as { token: string };

    const user = await userRepository.findOneBy({ id: token })

    if (!token || !user) {
        socket.disconnect();
        return;
    }

    userMap.set(socket.id, user)

    socket.on('disconnect', () => {
        console.log('user disconnected', socket.id);
        userMap.delete(socket.id)
    });

    socket.on('message', (msg: any) => {
        io.emit('messagesssssss', msg);
    });

    socket.on('match', async () => {
        matchRepository.findBy({
            dieAt: null,
            user: { id: userMap.get(socket.id).id }
        }).then(ret => {
            ret.map(match => {
                match.dieAt = new Date(Date.now())
                matchRepository.save(match)
            })
        })

        const m = new Match()
        m.user = userMap.get(socket.id)
        const mat = await matchRepository.save(m)
        io.emit('new-match', mat);
    });

    socket.on('die', async (id: string) => {
        const match = await matchRepository.findOneBy({ id })
        match.dieAt = new Date(Date.now())
        await matchRepository.save(match)
    });

    socket.on('gain-point', async (id: string) => {
        const match = await matchRepository.findOneBy({ id })
        const m = new Points()
        m.match = match
        m.point = 10
        const point = await pointRepository.save(m)
        io.emit('new-point', point);
    });
});

AppDataSource.initialize().then(async () => {
    server.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}).catch(error => console.log(error))
