class StaffScheduleManager {
    constructor(db) {
        this.db = db;
    }

    // Pegar duração do slot baseado na role do profissional
    getSlotDurationByRole(role) {
        switch (role.toLowerCase()) {
            case 'cabelereira': return 45;
            case 'manicurist': return 30;
            default: return 30;
        }
    }

    // Buscar horário padrão do profissional para um dia específico
    async getStaffScheduleForDay(staffId, dayOfWeek) {
        const { data: schedules, error } = await this.db
            .from('staff_schedules')
            .select('*')
            .eq('staff_id', staffId)
            .eq('day_of_week', dayOfWeek)
            .limit(1);
            
        if (error) {
            console.error('Erro ao buscar horário:', error);
            return null;
        }

        return schedules && schedules.length > 0 ? schedules[0] : null;
    }

    // Buscar bloqueios de horário para uma data
    async getStaffBlockedSlots(staffId, date) {
        const { data: blocks, error } = await this.db
            .from('staff_blocked_slots')
            .select('*')
            .eq('staff_id', staffId)
            .eq('date', date);

        if (error) {
            console.error('Erro ao buscar bloqueios:', error);
            return [];
        }

        return blocks || [];
    }

    // Gerar slots disponíveis para um profissional em uma data
    async generateAvailableSlots(staffId, date) {
        try {
            // 1. Pegar informações do profissional
            const { data: staff } = await this.db
                .from('staff')
                .select('*')
                .eq('id', staffId)
                .limit(1);

            if (!staff || !staff.length) {
                throw new Error('Profissional não encontrado');
            }

            // 2. Pegar horário do dia
            const dayOfWeek = new Date(date).getDay(); // 0=Dom, 6=Sáb
            const schedule = await this.getStaffScheduleForDay(staffId, dayOfWeek);

            if (!schedule) {
                return []; // Profissional não trabalha neste dia
            }

            // 3. Pegar bloqueios do dia
            const blocks = await this.getStaffBlockedSlots(staffId, date);

            // 4. Gerar slots baseado na role
            const slotDuration = this.getSlotDurationByRole(staff[0].role);
            const slots = await this.generateTimeSlots(
                schedule.start_time,
                schedule.end_time,
                slotDuration
            );

            // 5. Remover slots bloqueados
            return slots.filter(slot => {
                // Converter slot para minutos para comparação
                const slotMinutes = timeToMinutes(slot.time);
                
                // Checar se o slot está dentro de algum bloqueio
                return !blocks.some(block => {
                    const blockStartMinutes = timeToMinutes(block.start_time);
                    const blockEndMinutes = timeToMinutes(block.end_time);
                    return slotMinutes >= blockStartMinutes && slotMinutes < blockEndMinutes;
                });
            });
        } catch (error) {
            console.error('Erro ao gerar slots:', error);
            return [];
        }
    }

    // Gerar slots de horário baseados em início, fim e duração
    generateTimeSlots(startTime, endTime, duration) {
        const slots = [];
        
        // Converter horários para minutos
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);
        
        let currentMinutes = startMinutes;
        
        while (currentMinutes < endMinutes) {
            slots.push({
                time: minutesToTime(currentMinutes),
                isBlocked: false
            });
            
            currentMinutes += duration;
        }
        
        return slots;
    }

    // Adicionar bloqueio de horário
    async addBlockedSlot(staffId, date, startTime, endTime, reason) {
        const { error } = await this.db
            .from('staff_blocked_slots')
            .insert([{
                staff_id: staffId,
                date,
                start_time: startTime,
                end_time: endTime,
                reason
            }]);

        if (error) {
            console.error('Erro ao adicionar bloqueio:', error);
            throw error;
        }

        return true;
    }

    // Remover bloqueio de horário
    async removeBlockedSlot(blockId) {
        const { error } = await this.db
            .from('staff_blocked_slots')
            .delete()
            .eq('id', blockId);

        if (error) {
            console.error('Erro ao remover bloqueio:', error);
            throw error;
        }

        return true;
    }

    // Definir horário padrão para um dia da semana
    async setStaffScheduleForDay(staffId, dayOfWeek, startTime, endTime) {
        // 1. Pegar role do profissional
        const { data: staff } = await this.db
            .from('staff')
            .select('role')
            .eq('id', staffId)
            .limit(1);

        if (!staff || !staff.length) {
            throw new Error('Profissional não encontrado');
        }

        const slotDuration = this.getSlotDurationByRole(staff[0].role);

        // 2. Tentar atualizar se já existe
        const { data, error: selectError } = await this.db
            .from('staff_schedules')
            .select('*')
            .eq('staff_id', staffId)
            .eq('day_of_week', dayOfWeek);

        if (selectError) {
            console.error('Erro ao buscar horário:', selectError);
            throw selectError;
        }

        if (data && data.length > 0) {
            // Atualizar existente
            const { error: updateError } = await this.db
                .from('staff_schedules')
                .update({
                    start_time: startTime,
                    end_time: endTime,
                    slot_duration: slotDuration,
                    updated_at: new Date().toISOString()
                })
                .eq('id', data[0].id);

            if (updateError) {
                console.error('Erro ao atualizar horário:', updateError);
                throw updateError;
            }
        } else {
            // Inserir novo
            const { error: insertError } = await this.db
                .from('staff_schedules')
                .insert([{
                    staff_id: staffId,
                    day_of_week: dayOfWeek,
                    start_time: startTime,
                    end_time: endTime,
                    slot_duration: slotDuration
                }]);

            if (insertError) {
                console.error('Erro ao inserir horário:', insertError);
                throw insertError;
            }
        }

        return true;
    }
}

// Exportar a classe
export const scheduleManager = new StaffScheduleManager(db);