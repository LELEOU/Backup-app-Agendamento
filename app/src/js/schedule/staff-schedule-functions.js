// Funções globais para gerenciar horários dos funcionários
window.updateStaffSchedule = async function(staffId, field, value) {
    try {
        const staff = appState.staff.find(s => s.id === staffId);
        if (!staff) return;

        // Inicializar defaultSchedule se não existir
        if (!staff.defaultSchedule) {
            staff.defaultSchedule = await window.StaffScheduleManager.getDefaultSchedule(staffId);
        }

        // Atualizar o campo específico
        const updates = {
            [field]: value
        };

        // Atualizar no banco de dados
        await window.StaffScheduleManager.updateDefaultSchedule(staffId, updates);

        // Atualizar no estado local
        staff.defaultSchedule = {
            ...staff.defaultSchedule,
            ...updates
        };

        showNotification('Horário atualizado com sucesso!');
        
        // Recarregar a visualização
        refreshCurrentView();
    } catch (error) {
        console.error('Erro ao atualizar horário:', error);
        showNotification('Erro ao atualizar horário', 'error');
    }
};

window.toggleWorkingDay = async function(staffId, dayIndex, enabled) {
    try {
        const staff = appState.staff.find(s => s.id === staffId);
        if (!staff) return;

        // Inicializar defaultSchedule se não existir
        if (!staff.defaultSchedule) {
            staff.defaultSchedule = await window.StaffScheduleManager.getDefaultSchedule(staffId);
        }

        // Atualizar working_days
        let workingDays = staff.defaultSchedule.working_days || [];
        if (enabled && !workingDays.includes(dayIndex)) {
            workingDays.push(dayIndex);
        } else if (!enabled) {
            workingDays = workingDays.filter(d => d !== dayIndex);
        }

        // Atualizar no banco de dados
        await window.StaffScheduleManager.updateDefaultSchedule(staffId, {
            working_days: workingDays
        });

        // Atualizar no estado local
        staff.defaultSchedule.working_days = workingDays;

        showNotification('Dias de trabalho atualizados com sucesso!');
        
        // Recarregar a visualização
        refreshCurrentView();
    } catch (error) {
        console.error('Erro ao atualizar dias de trabalho:', error);
        showNotification('Erro ao atualizar dias de trabalho', 'error');
    }
};

// Carregar horários dos funcionários ao inicializar
window.loadStaffSchedules = async function() {
    try {
        for (const staff of appState.staff) {
            staff.defaultSchedule = await window.StaffScheduleManager.getDefaultSchedule(staff.id);
        }
    } catch (error) {
        console.error('Erro ao carregar horários dos funcionários:', error);
    }
};