// Gerenciador de horários dos funcionários
const StaffScheduleManager = {
    // Buscar horário padrão de um funcionário
    async getDefaultSchedule(staffId) {
        const { data, error } = await window.supabase
            .from('staff_schedules')
            .select('*')
            .eq('staff_id', staffId);

        if (error) throw error;

        return data[0] || {
            start_time: '08:00',
            end_time: '18:00',
            lunch_start: '12:00',
            lunch_end: '13:00',
            working_days: [1, 2, 3, 4, 5, 6]
        };
    },

    // Buscar exceção de horário para uma data específica
    async getScheduleException(staffId, date) {
        const { data, error } = await window.supabase
            .from('staff_schedule_exceptions')
            .select('*')
            .eq('staff_id', staffId)
            .eq('date', date)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    // Atualizar horário padrão
    async updateDefaultSchedule(staffId, updates) {
        const { data, error } = await window.supabase
            .from('staff_schedules')
            .upsert([{
                staff_id: staffId,
                ...updates
            }]);

        if (error) throw error;
        return data;
    },

    // Criar/atualizar exceção de horário
    async upsertScheduleException(staffId, date, schedule) {
        const { data, error } = await window.supabase
            .from('staff_schedule_exceptions')
            .upsert([{
                staff_id: staffId,
                date,
                ...schedule
            }]);

        if (error) throw error;
        return data;
    },

    // Remover exceção de horário
    async removeScheduleException(staffId, date) {
        const { error } = await window.supabase
            .from('staff_schedule_exceptions')
            .delete()
            .eq('staff_id', staffId)
            .eq('date', date);

        if (error) throw error;
    },

    // Buscar horário de um profissional para uma data específica
    async getStaffSchedule(staffId, date) {
        // Primeiro tenta buscar exceção
        const exception = await this.getScheduleException(staffId, date);
        if (exception) return exception;

        // Se não encontrar exceção, retorna horário padrão
        return await this.getDefaultSchedule(staffId);
    }
};

// Expor para uso global
window.StaffScheduleManager = StaffScheduleManager;