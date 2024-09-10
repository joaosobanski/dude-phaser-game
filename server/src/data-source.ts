import "reflect-metadata"
import { DataSource } from "typeorm"

import * as dotenv from 'dotenv'
dotenv.config()

export const AppDataSource = new DataSource({
    type: "postgres",
    host:  `${process.env.BD_HOST}`,
    port: 5432,
    username: "postgres",
    password: `${process.env.BD_PASS}`,
    database: "dude-game2",
    synchronize: true,
    logging: false,
    entities: ['src/entity/*'],
    migrations: [],
    subscribers: [],
})
