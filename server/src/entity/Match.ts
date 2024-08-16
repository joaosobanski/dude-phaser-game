import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm"
import { User } from "./User"
import { Points } from "./Points";

@Entity()
export class Match {

    @PrimaryGeneratedColumn("uuid")
    id: string

    @ManyToOne(() => User, user => user.matchs)
    user: User;

    @Column({ default: new Date(Date.now()) })
    createdAt: Date

    @Column({ nullable: true })
    dieAt: Date

    @OneToMany(() => Points, ref => ref.match)
    points: Points[];
}
