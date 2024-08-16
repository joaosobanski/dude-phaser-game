import { AppDataSource } from "./data-source";
import { Match } from "./entity/Match";
import { Points } from "./entity/Points";
import { User } from "./entity/User";


export const userRepository = AppDataSource.getRepository(User)
export const pointRepository = AppDataSource.getRepository(Points)
export const matchRepository = AppDataSource.getRepository(Match)