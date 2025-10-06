// Modal para gerenciar horário do profissional
function showStaffScheduleModal(staff, dayOfWeek = null, date = null) {
    const t = getTranslations();
    const days = [
        'Domingo', 'Segunda', 'Terça', 'Quarta', 
        'Quinta', 'Sexta', 'Sábado'
    ];

    let modalTitle;
    let isException = false;

    if (date) {
        modalTitle = `Definir Horário: ${staff.name} - ${date.toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long'
        })}`;
        isException = true;
        dayOfWeek = date.getDay();
    } else {
        modalTitle = `Horário Padrão: ${staff.name} - ${days[dayOfWeek]}`;
    }

    showModal(`
        <div class="bg-[var(--bg-primary)] rounded-lg max-w-md w-full mx-4 border border-[var(--border-color)]">
            <div class="p-6">
                <h3 class="text-lg font-medium mb-4 text-[var(--text-primary)]">
                    ⏰ ${modalTitle}
                </h3>
                <form id="staffScheduleForm" class="space-y-4">
                    ${date ? `<input type="hidden" name="date" value="${getLocalDateString(date)}">` : ''}
                    <input type="hidden" name="dayOfWeek" value="${dayOfWeek}">

                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">Hora Início</label>
                            <input type="time" name="startTime" required
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">Hora Fim</label>
                            <input type="time" name="endTime" required
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                        </div>
                    </div>

                    <div class="border-t border-[var(--border-color)] pt-4">
                        <h4 class="font-medium text-[var(--text-primary)] mb-4">🍽️ Horário de Almoço</h4>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-[var(--text-secondary)]">Início Almoço</label>
                                <input type="time" name="lunchStart" required
                                    class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-[var(--text-secondary)]">Fim Almoço</label>
                                <input type="time" name="lunchEnd" required
                                    class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                            </div>
                        </div>
                    </div>

                    ${isException ? `
                        <div class="mt-4">
                            <button type="button" onclick="removeScheduleException('${staff.id}', '${getLocalDateString(date)}')"
                                class="w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200">
                                🔄 Voltar ao Horário Padrão
                            </button>
                        </div>
                    ` : ''}

                    <div class="flex justify-end space-x-3 pt-4">
                        <button type="button" onclick="hideModal()" 
                            class="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-md hover:bg-[var(--accent-light)] border border-[var(--border-color)]">
                            ${t.cancel}
                        </button>
                        <button type="submit" 
                            class="px-4 py-2 text-sm font-medium text-white bg-[var(--accent-primary)] rounded-md hover:bg-[var(--accent-secondary)]">
                            ${t.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `);

    // Carregar horário atual
    if (date) {
        // Carregar exceção se existir
        scheduleManager.getStaffSchedule(staff.id, getLocalDateString(date))
            .then(schedule => {
                document.querySelector('[name="startTime"]').value = schedule.start_time;
                document.querySelector('[name="endTime"]').value = schedule.end_time;
                document.querySelector('[name="lunchStart"]').value = schedule.lunch_start;
                document.querySelector('[name="lunchEnd"]').value = schedule.lunch_end;
            });
    } else {
        // Carregar horário padrão do dia
        scheduleManager.getDefaultSchedule(staff.id, dayOfWeek)
            .then(schedule => {
                if (schedule) {
                    document.querySelector('[name="startTime"]').value = schedule.start_time;
                    document.querySelector('[name="endTime"]').value = schedule.end_time;
                    document.querySelector('[name="lunchStart"]').value = schedule.lunch_start;
                    document.querySelector('[name="lunchEnd"]').value = schedule.lunch_end;
                } else {
                    // Valores padrão
                    document.querySelector('[name="startTime"]').value = '08:00';
                    document.querySelector('[name="endTime"]').value = '18:00';
                    document.querySelector('[name="lunchStart"]').value = '12:00';
                    document.querySelector('[name="lunchEnd"]').value = '13:00';
                }
            });
    }

    // Handler do formulário
    document.getElementById('staffScheduleForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            if (date) {
                // Salvar exceção
                await scheduleManager.setScheduleException(
                    staff.id,
                    formData.get('date'),
                    formData.get('startTime'),
                    formData.get('endTime'),
                    formData.get('lunchStart'),
                    formData.get('lunchEnd')
                );
            } else {
                // Salvar horário padrão
                await scheduleManager.setDefaultSchedule(
                    staff.id,
                    parseInt(formData.get('dayOfWeek')),
                    formData.get('startTime'),
                    formData.get('endTime'),
                    formData.get('lunchStart'),
                    formData.get('lunchEnd')
                );
            }

            showNotification('Horário salvo com sucesso!');
            hideModal();
            // Recarregar visão do dia se necessário
            if (typeof renderDayView === 'function') {
                renderDayView();
            }
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });
}

// Função para remover exceção de horário
async function removeScheduleException(staffId, date) {
    try {
        await scheduleManager.removeScheduleException(staffId, date);
        showNotification('Horário padrão restaurado com sucesso!');
        hideModal();
        // Recarregar visão do dia
        if (typeof renderDayView === 'function') {
            renderDayView();
        }
    } catch (error) {
        showNotification(error.message, 'error');
    }
}