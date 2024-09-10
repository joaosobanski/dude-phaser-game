import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm"
import { Match } from "./Match"

@Entity()
export class User {

    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ length: 200, unique: true })
    username: string

    @Column({ length: 400 })
    password: string

    @Column({ length: 400, nullable: true })
    colegio: string

    @Column({ length: 400, nullable: true })
    ano: string

    @Column({ length: 400, nullable: true })
    nome: string

    @Column({ length: 400, nullable: true })
    fone: string

    @Column({ default: new Date(Date.now()) })
    createdAt: Date

    @OneToMany(() => Match, ref => ref.user)
    matchs: Match[];
}
