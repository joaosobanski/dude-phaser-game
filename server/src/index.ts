import { AppDataSource } from "./data-source"
import { Server, Socket } from 'socket.io';
import http from 'http';
import bcrypt from 'bcrypt'
import express, { Request, Response } from 'express';
import { matchRepository, pointRepository, userRepository } from "./repository";
import { User } from "./entity/User";
import { Match } from "./entity/Match";
import { Points } from "./entity/Points";
import cors from 'cors'
//dude-api.onblocklabs.com
const port = 5007;

const app = express();

app.use(cors());
app.use(express.json());


async function getPointsWithRanking(): Promise<any[]> {

    const query = `
        select 
            points, 
            "matchId",  
            RANK() OVER (ORDER BY points DESC) AS position, 
            "username"

            from ( 
                select sum(a."point") as points, a."matchId", u.username  from "points" as a
                join "match" m on m.id = a."matchId" 
                join "user" u on u.id = m."userId"
                group by a."matchId" , u.username
            )
        order by points desc
    `;

    try {
        const result = await AppDataSource.query(query);
        return result;
    } catch (error) {
        console.error('Error executing query', error);
        throw new Error('Failed to retrieve data');
    }
}

async function getPointsWithRankingById(id: string): Promise<any> {
    const query = `
        select 
        points,  "matchId",  position ,  "username"
        from
        (
            select points, "matchId",  
            RANK() OVER (ORDER BY points DESC) AS position, "username"
            from ( 
                select sum(a."point") as points, a."matchId", u.username  from "points" as a
                join "match" m on m.id = a."matchId" 
                join "user" u on u.id = m."userId"
                group by a."matchId" , u.username
            )
        order by points desc
        )
        where  "matchId" = '${id}'
    `;

    try {
        const result = await AppDataSource.query(query);
        if (result.length > 0)
            return result[0];
        return result
    } catch (error) {
        console.error('Error executing query', error);
        throw new Error('Failed to retrieve data');
    }
}

async function getPointsWithRankingByUserId(id: string): Promise<any> {
    const query = `
       
        select 
        points,  "matchId",  position ,  "username", "userId"
        from
        (
            select points, "matchId",  
            RANK() OVER (ORDER BY points DESC) AS position, "username", "userId"
            from ( 
                select sum(a."point") as points, a."matchId", u.username, u.id as "userId" from "points" as a
                join "match" m on m.id = a."matchId" 
                join "user" u on u.id = m."userId"
                group by a."matchId" , u.username, u.id
            )
            order by points desc
        )
        where  "userId" = '${id}'
    `;

    try {
        const result = await AppDataSource.query(query);
        return result
    } catch (error) {
        console.error('Error executing query', error);
        throw new Error('Failed to retrieve data');
    }
}

app.get('/test', (req: Request, res: Response) => {
    io.emit('test', 'test')
    res.json({ success: true })
})


app.get('/rank', async (req: Request, res: Response) => {
    const vals = await getPointsWithRanking()
    res.json(vals)
})

app.get('/match/:id', async (req: Request, res: Response) => {
    if (req.params.id) {
        const vals = await getPointsWithRankingById(req.params.id as string)
        res.json(vals)
    }
    else {
        res.status(400).json({ error: true })
    }
})

app.get('/user/:id', async (req: Request, res: Response) => {
    if (req.params.id) {
        const vals = await getPointsWithRankingByUserId(req.params.id as string)
        res.json(vals)
    }
    else {
        res.status(400).json({ error: true })
    }
})


app.get('/details/:id', async (req: Request, res: Response) => {
    if (req.params.id) {
        const vals = await userRepository.findOneBy({
            id: req.params.id
        })
        res.json(vals)
    }
    else {
        res.status(400).json({ error: true })
    }
})

app.post('/update', async (req: Request, res: Response) => {
    try {
        const { id, colegio, fone, nome, ano } = req.body

        if (!id) {
            throw ('usuario não informado!')
        }

        if (!colegio) {
            throw ('colegio não informado!')
        }

        if (!fone)
            throw ('fone não informado!')

        if (!nome)
            throw ('nome não informado!')

        if (!ano)
            throw ('ano não informado!')

        let user = await userRepository.findOneBy({
            id
        })

        if (user) {
            user.ano = ano
            user.colegio = colegio
            user.fone = fone
            user.nome = nome

            user = await userRepository.save(user)

            return res.json({
                token: user.id
            })

        } else {
            throw ('usuario não informado!')
        }
    } catch (e) {
        console.error(e)
        res.status(400).json(e)
    }
})

app.post('/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body

        if (!username) {
            throw ('Email não informado!')
        }
        if (!username.includes('@')) {
            throw ('Email não informado!')
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
                    token: user.id,
                    ...user
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
                token: u.id,
                ...user
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
