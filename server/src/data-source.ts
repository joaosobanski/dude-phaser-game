import "reflect-metadata"
import { DataSource } from "typeorm"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "pwd",
    database: "dude-game",
    synchronize: true,
    logging: false,
    entities: ['src/entity/*'],
    migrations: [],
    subscribers: [],
})
