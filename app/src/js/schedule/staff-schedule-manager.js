import { supabase } from '../supabase-config.js';

// Classe para gerenciar horários dos profissionais
class StaffScheduleManager {
    constructor() {
        this.db = supabase;
    }

    // Buscar horário do profissional para uma data específica
    async getStaffSchedule(staffId, date) {
        try {
            const { data, error } = await this.db.rpc('get_staff_schedule', {
                p_staff_id: staffId,
                p_date: date
            });

            if (error) {
                console.error('Erro ao buscar horário:', error);
                throw error;
            }

            return data[0] || {
                start_time: '08:00',
                end_time: '18:00',
                lunch_start: '12:00',
                lunch_end: '13:00'
            };
        } catch (error) {
            console.error('Erro ao buscar horário:', error);
            return {
                start_time: '08:00',
                end_time: '18:00',
                lunch_start: '12:00',
                lunch_end: '13:00'
            };
        }
    }

    // Buscar horário padrão do profissional para um dia da semana
    async getDefaultSchedule(staffId, dayOfWeek) {
        const { data, error } = await this.db
            .from('staff_schedules')
            .select('*')
            .eq('staff_id', staffId)
            .eq('day_of_week', dayOfWeek)
            .single();

        if (error) {
            console.error('Erro ao buscar horário padrão:', error);
            return null;
        }

        return data;
    }

    // Definir horário padrão para um dia da semana
    async setDefaultSchedule(staffId, dayOfWeek, startTime, endTime, lunchStart, lunchEnd) {
        try {
            const { data: existing } = await this.db
                .from('staff_schedules')
                .select('id')
                .eq('staff_id', staffId)
                .eq('day_of_week', dayOfWeek)
                .single();

            if (existing) {
                // Atualizar existente
                const { error } = await this.db
                    .from('staff_schedules')
                    .update({
                        start_time: startTime,
                        end_time: endTime,
                        lunch_start: lunchStart,
                        lunch_end: lunchEnd
                    })
                    .eq('id', existing.id);

                if (error) throw error;
            } else {
                // Criar novo
                const { error } = await this.db
                    .from('staff_schedules')
                    .insert([{
                        staff_id: staffId,
                        day_of_week: dayOfWeek,
                        start_time: startTime,
                        end_time: endTime,
                        lunch_start: lunchStart,
                        lunch_end: lunchEnd
                    }]);

                if (error) throw error;
            }

            return true;
        } catch (error) {
            console.error('Erro ao salvar horário padrão:', error);
            throw error;
        }
    }

    // Definir exceção de horário para uma data específica
    async setScheduleException(staffId, date, startTime, endTime, lunchStart, lunchEnd) {
        try {
            const { data: existing } = await this.db
                .from('staff_schedule_exceptions')
                .select('id')
                .eq('staff_id', staffId)
                .eq('date', date)
                .single();

            if (existing) {
                // Atualizar existente
                const { error } = await this.db
                    .from('staff_schedule_exceptions')
                    .update({
                        start_time: startTime,
                        end_time: endTime,
                        lunch_start: lunchStart,
                        lunch_end: lunchEnd
                    })
                    .eq('id', existing.id);

                if (error) throw error;
            } else {
                // Criar novo
                const { error } = await this.db
                    .from('staff_schedule_exceptions')
                    .insert([{
                        staff_id: staffId,
                        date: date,
                        start_time: startTime,
                        end_time: endTime,
                        lunch_start: lunchStart,
                        lunch_end: lunchEnd
                    }]);

                if (error) throw error;
            }

            return true;
        } catch (error) {
            console.error('Erro ao salvar exceção de horário:', error);
            throw error;
        }
    }

    // Remover exceção de horário
    async removeScheduleException(staffId, date) {
        try {
            const { error } = await this.db
                .from('staff_schedule_exceptions')
                .delete()
                .eq('staff_id', staffId)
                .eq('date', date);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erro ao remover exceção:', error);
            throw error;
        }
    }
}

// Exportar uma instância única
export const scheduleManager = new StaffScheduleManager();