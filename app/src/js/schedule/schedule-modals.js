// Modal para gerenciar horário padrão do profissional
function showStaffScheduleModal(staff, dayOfWeek = null) {
    const t = getTranslations();
    const days = [
        'Domingo', 'Segunda', 'Terça', 'Quarta', 
        'Quinta', 'Sexta', 'Sábado'
    ];

    const slotDuration = staff.role.toLowerCase() === 'cabelereira' ? 45 : 30;

    showModal(`
        <div class="bg-[var(--bg-primary)] rounded-lg max-w-md w-full mx-4 border border-[var(--border-color)]">
            <div class="p-6">
                <h3 class="text-lg font-medium mb-4 text-[var(--text-primary)]">
                    ⏰ Definir Horário: ${staff.name}
                </h3>
                <form id="staffScheduleForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-[var(--text-secondary)]">Dia da Semana</label>
                        <select name="dayOfWeek" required class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                            ${days.map((day, index) => `
                                <option value="${index}" ${dayOfWeek === index ? 'selected' : ''}>
                                    ${day}
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">Hora Início</label>
                            <input type="time" name="startTime" required
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                            <p class="text-xs text-[var(--text-secondary)] mt-1">
                                Slots de ${slotDuration} min
                            </p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">Hora Fim</label>
                            <input type="time" name="endTime" required
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                        </div>
                    </div>

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

    // Carregar horário existente
    scheduleManager.getStaffScheduleForDay(staff.id, dayOfWeek || 0)
        .then(schedule => {
            if (schedule) {
                document.querySelector('[name="startTime"]').value = schedule.start_time;
                document.querySelector('[name="endTime"]').value = schedule.end_time;
            }
        });

    // Handler do formulário
    document.getElementById('staffScheduleForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            await scheduleManager.setStaffScheduleForDay(
                staff.id,
                parseInt(formData.get('dayOfWeek')),
                formData.get('startTime'),
                formData.get('endTime')
            );

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

// Modal para bloquear horário
function showBlockSlotModal(staff, date, defaultStart = null, defaultEnd = null) {
    const t = getTranslations();
    const dateStr = date.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    showModal(`
        <div class="bg-[var(--bg-primary)] rounded-lg max-w-md w-full mx-4 border border-[var(--border-color)]">
            <div class="p-6">
                <h3 class="text-lg font-medium mb-4 text-[var(--text-primary)]">
                    🚫 Bloquear Horário
                </h3>
                <p class="text-sm text-[var(--text-secondary)] mb-4">
                    ${dateStr}
                </p>
                <form id="blockSlotForm" class="space-y-4">
                    <input type="hidden" name="date" value="${getLocalDateString(date)}">
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">Hora Início</label>
                            <input type="time" name="startTime" required value="${defaultStart || ''}"
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">Hora Fim</label>
                            <input type="time" name="endTime" required value="${defaultEnd || ''}"
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-[var(--text-secondary)]">Motivo</label>
                        <input type="text" name="reason" placeholder="Ex: Almoço, Folga, etc" required
                            class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                    </div>

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

    // Handler do formulário
    document.getElementById('blockSlotForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            await scheduleManager.addBlockedSlot(
                staff.id,
                formData.get('date'),
                formData.get('startTime'),
                formData.get('endTime'),
                formData.get('reason')
            );

            showNotification('Horário bloqueado com sucesso!');
            hideModal();
            // Recarregar visão do dia
            if (typeof renderDayView === 'function') {
                renderDayView();
            }
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });
}