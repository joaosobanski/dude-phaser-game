import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm"
import { Match } from "./Match";

@Entity()
export class Points {
    @PrimaryGeneratedColumn()
    id: string

    @ManyToOne(() => Match, ref => ref.points)
    match: Match;

    @Column({ default: new Date(Date.now()) })
    createdAt: Date

    @Column({ type: 'int' })
    point: number

}
