import db from '../database/connection';
import ConvertHourToMinutes from '../utils/convertHourToMinutes';
import { Request, Response } from 'express';

interface scheduleItem {
    week_day: number;
    from: string;
    to: string
}
export default class ClassesController {
    async index(request: Request, response: Response) {
        const filters = request.query;

        if (!filters.subject || !filters.week_day || !filters.time) {
            return response.status(400).json({
                error: 'Missing filters to search classes'
            })
        }
        const timeInMinutes = ConvertHourToMinutes(filters.time as string);

        const classes = await db('classes')
            .whereExists(function () {
                this.select('classes_schedule.*').
                    from('classes_schedule')
                    .whereRaw('`class_schedule`. `class_id` = `classes`. `id`')
                    .whereRaw('`class_schedule`. `week_day`= ??', [Number(filters.week_day)])
                    .whereRaw('`class_schedule`. `from` <= ??', [timeInMinutes])
                    .whereRaw('`class_schedule`. `to` > ??', [timeInMinutes])
            })
            .where('classes.subject', '=', filters.subject as string)
            .join('users', 'classes.user_id', '=', 'user.id')
            .select(['classes.*', 'users.*']);
        return response.send();
    }
    async create(request: Request, response: Response) {
        const
            {
                name,
                avatar,
                whatsapp,
                bio,
                subject,
                cost,
                schedule
            } = request.body;

        const trx = await db.transaction();

        try {
            const insertedUsersIds = await trx('users').insert({
                name,
                avatar,
                whatsapp,
                bio
            });
            const user_id = insertedUsersIds[0];
            const insertedClassesID = await trx('classes').insert({
                subject,
                cost,
                user_id
            });

            const class_id = insertedClassesID[0];

            const class_schedule = schedule.map((ScheduleItem: scheduleItem) => {
                return {
                    class_id,
                    week_day: ScheduleItem.week_day,
                    from: ConvertHourToMinutes(ScheduleItem.from),
                    to: ConvertHourToMinutes(ScheduleItem.to),
                };
            });

            await trx('class_schedule').insert(class_schedule);

            await trx.commit();

            return response.status(201).send();
        } catch (err) {
            await trx.rollback();
            return response.status(400).json({
                error: 'error'
            })
        }
    }
}