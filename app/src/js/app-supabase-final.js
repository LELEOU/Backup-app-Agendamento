document.addEventListener('DOMContentLoaded', async () => {
    // Verifica se o Supabase foi carregado
    if (!window.supabase) {
        console.error('Supabase não foi carregado! Verifique se supabase-config.js foi carregado corretamente.');
        return;
    }

    // 🚀 INICIALIZAR RECURSOS NATIVOS DO CAPACITOR
    if (window.initCapacitorFeatures) {
        try {
            window.initCapacitorFeatures();
            console.log('[APP] ✅ Recursos nativos inicializados');
        } catch (error) {
            console.log('[APP] ℹ️ Recursos nativos não disponíveis (modo web)');
        }
    }

    // Funções utilitárias
    function getLocalDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getTranslation(key) {
        return window.getTranslation(key, appState.settings.language);
    }

    function getTranslations() {
        return window.translations[appState.settings.language] || window.translations['pt-BR'] || {};
    }

    function formatTime(timeString) {
        // Converte "08:00:00" para "08:00"
        if (timeString && timeString.includes(':')) {
            return timeString.substring(0, 5);
        }
        return timeString;
    }

    function isDateInPast(dateStr) {
        // Função utilitária para verificar se uma data está no passado
        // Garante comparação consistente apenas de datas (sem horário)
        const checkDate = new Date(dateStr + 'T00:00:00');
        const today = new Date();
        
        // Normalizar ambas as datas para meia-noite
        const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const checkDateNormalized = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
        
        return checkDateNormalized < todayNormalized;
    }

    function updateCurrentDate() {
        if (dom.currentDateDisplay) {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            dom.currentDateDisplay.textContent = appState.currentDate.toLocaleDateString('pt-BR', options);
        }
    }

    function updateAllTranslations() {
        // Atualizar elementos com data-translate
        const translatableElements = document.querySelectorAll('[data-translate]');
        translatableElements.forEach(element => {
            const key = element.getAttribute('data-translate');
            if (key) {
                element.textContent = getTranslation(key);
            }
        });
        
        const searchInput = document.getElementById('clientSearch');
        if (searchInput) {
            searchInput.placeholder = getTranslation('searchClientPlaceholder');
        }
        
        const newClientBtn = document.getElementById('newClientBtn');
        if (newClientBtn) {
            newClientBtn.textContent = getTranslation('newClient');
        }
        
        const newServiceBtn = document.getElementById('newServiceBtn');
        if (newServiceBtn) {
            newServiceBtn.textContent = getTranslation('newService');
        }
        
        const newAppointmentBtn = document.getElementById('newAppointmentBtn');
        if (newAppointmentBtn) {
            newAppointmentBtn.textContent = getTranslation('newAppointment');
        }
    }

    function handleClientSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        const filteredClients = appState.clients.filter(client =>
            client.name.toLowerCase().includes(searchTerm) ||
            (client.phone && client.phone.includes(searchTerm)) ||
            (client.email && client.email.toLowerCase().includes(searchTerm))
        );
        
        renderFilteredClients(filteredClients);
    }

    function renderFilteredClients(clients) {
        const t = getTranslations();
        if (!clients.length) {
            dom.clientList.innerHTML = `<li class="p-4 text-center text-[var(--text-secondary)]">${t.noClientsFound}</li>`;
            return;
        }

        dom.clientList.innerHTML = clients.map(client => {
            // Format birthday if available
            let birthdayText = '';
            if (client.birthday_day && client.birthday_month) {
                const monthNames = [
                    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                ];
                birthdayText = ` • Aniversário: ${client.birthday_day}/${monthNames[client.birthday_month - 1]}`;
            }
            
            return `
            <li class="p-4 hover:bg-[var(--accent-light)] flex justify-between items-center border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <div>
                    <div class="font-medium text-[var(--text-primary)]">${client.name}</div>
                    <div class="text-sm text-[var(--text-secondary)]">${client.phone || ''} ${client.email || ''}${birthdayText}</div>
                </div>
                <div class="flex space-x-2">
                    <button onclick="editClient('${client.id}')" class="text-[var(--accent-primary)] hover:text-[var(--accent-secondary)]">${t.edit}</button>
                    <button onclick="deleteClient('${client.id}')" class="text-red-600 hover:text-red-800">${t.delete}</button>
                </div>
            </li>`;
        }).join('');
    }

    // Função para adicionar filtros de staff (manicure e cabeleireira) lado a lado
    function addStaffFilters() {
        // Staff não precisa do filtro, pois só vê seus próprios agendamentos
        if (isManicurist() || isHairdresser()) return;
        
        const t = getTranslations();
        const manicurists = appState.staff.filter(s => s.role === 'manicurist');
        const hairdressers = appState.staff.filter(s => s.role === 'hairdresser');
        
        // Se não há nenhum staff, não mostra filtros
        if (manicurists.length === 0 && hairdressers.length === 0) return;
        
        let filtersHtml = '<div class="mb-4 p-4 bg-[var(--bg-secondary)] rounded-lg"><div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
        
        // Filtro de Manicures
        if (manicurists.length > 0) {
            filtersHtml += `
                <div>
                    <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        💅 ${t.filterByManicurist || 'Filtrar por Manicure'}:
                    </label>
                    <select id="manicuristFilter" class="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] transition-all" onchange="filterByManicurist(this.value)">
                        <option value="all">${t.allManicurists || 'Todas as Manicures'}</option>
                        ${manicurists.map(m => `
                            <option value="${m.id}" ${appState.selectedManicuristId === m.id ? 'selected' : ''}>
                                ${m.name} (⏱️ 45min)
                            </option>
                        `).join('')}
                    </select>
                </div>
            `;
        }
        
        // Filtro de Cabeleireiras
        if (hairdressers.length > 0) {
            filtersHtml += `
                <div>
                    <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        ✂️ ${t.filterByHairdresser || 'Filtrar por Cabeleireira'}:
                    </label>
                    <select id="hairdresserFilter" class="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] transition-all" onchange="filterByHairdresser(this.value)">
                        <option value="all">${t.allHairdressers || 'Todas as Cabeleireiras'}</option>
                        ${hairdressers.map(h => `
                            <option value="${h.id}" ${appState.selectedHairdresserId === h.id ? 'selected' : ''}>
                                ${h.name} (⏱️ 30min)
                            </option>
                        `).join('')}
                    </select>
                </div>
            `;
        }
        
        filtersHtml += '</div></div>';
        
        // Adicionar o filtro antes do calendário
        const calendarContainer = dom.calendarContainer;
        if (!document.getElementById('manicuristFilter') && !document.getElementById('hairdresserFilter')) {
            calendarContainer.insertAdjacentHTML('beforebegin', filtersHtml);
        }
    }

    // Função global para filtrar por manicure
    window.filterByManicurist = function(manicuristId) {
        appState.selectedManicuristId = manicuristId === 'all' ? null : manicuristId;
        appState.selectedHairdresserId = null; // Limpar filtro de cabeleireira
        
        // Atualizar visualmente o outro select
        const hairdresserFilter = document.getElementById('hairdresserFilter');
        if (hairdresserFilter) {
            hairdresserFilter.value = 'all';
        }
        
        renderCalendar();
    };

    // Função global para filtrar por cabeleireira
    window.filterByHairdresser = function(hairdresserId) {
        appState.selectedHairdresserId = hairdresserId === 'all' ? null : hairdresserId;
        appState.selectedManicuristId = null; // Limpar filtro de manicure
        
        // Atualizar visualmente o outro select
        const manicuristFilter = document.getElementById('manicuristFilter');
        if (manicuristFilter) {
            manicuristFilter.value = 'all';
        }
        
        renderCalendar();
    };

    // Funções antigas mantidas para compatibilidade (deprecated)
    function addManicuristFilter() {
        // Deprecated: usar addStaffFilters() ao invés
    }

    function addHairdresserFilter() {
        // Deprecated: usar addStaffFilters() ao invés
    }

    // Função para adicionar botão de solicitação de fechamento para manicuristas
    // Função de notificação simples
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white z-50 transition-all duration-300 ${
            type === 'error' ? 'bg-red-500' : 'bg-green-500'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Função de confirmação customizada (substitui confirm() nativo)
    function showConfirm(message, title = 'Confirmar', options = {}) {
        return new Promise((resolve) => {
            const {
                confirmText = 'Confirmar',
                cancelText = 'Cancelar',
                type = 'warning', // warning, danger, info
                icon = '⚠️'
            } = options;
            
            const colorClasses = {
                warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                danger: 'bg-red-100 text-red-800 border-red-300',
                info: 'bg-blue-100 text-blue-800 border-blue-300'
            };
            
            const buttonColors = {
                warning: 'bg-yellow-600 hover:bg-yellow-700',
                danger: 'bg-red-600 hover:bg-red-700',
                info: 'bg-blue-600 hover:bg-blue-700'
            };
            
            const modalHtml = `
                <div id="custom-confirm-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
                    <div class="bg-[var(--bg-primary)] rounded-lg max-w-md w-full mx-4 border border-[var(--border-color)] shadow-2xl animate-scale-in">
                        <div class="p-6">
                            <div class="flex items-start space-x-4">
                                <div class="flex-shrink-0">
                                    <div class="w-12 h-12 rounded-full ${colorClasses[type]} flex items-center justify-center text-2xl">
                                        ${icon}
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-2">
                                        ${title}
                                    </h3>
                                    <p class="text-sm text-[var(--text-secondary)] whitespace-pre-line">
                                        ${message}
                                    </p>
                                </div>
                            </div>
                            
                            <div class="flex justify-end space-x-3 mt-6">
                                <button 
                                    id="confirm-cancel-btn"
                                    class="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-lg hover:bg-[var(--accent-light)] border border-[var(--border-color)] transition-colors">
                                    ${cancelText}
                                </button>
                                <button 
                                    id="confirm-ok-btn"
                                    class="px-4 py-2 text-sm font-medium text-white ${buttonColors[type]} rounded-lg transition-colors">
                                    ${confirmText}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            const modal = document.getElementById('custom-confirm-modal');
            const okBtn = document.getElementById('confirm-ok-btn');
            const cancelBtn = document.getElementById('confirm-cancel-btn');
            
            const cleanup = () => {
                modal.remove();
            };
            
            okBtn.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });
            
            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });
            
            // Fechar ao clicar fora
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    cleanup();
                    resolve(false);
                }
            });
            
            // ESC para cancelar
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    resolve(false);
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);
        });
    }

    window.editClient = function(clientId) {
        if (!canEditClients()) {
            showNotification('Você não tem permissão para editar clientes', 'error');
            return;
        }
        const client = appState.clients.find(c => c.id === clientId);
        if (client) showClientModal(client);
    };

    window.deleteClient = async function(clientId) {
        if (!canEditClients()) {
            showNotification('Você não tem permissão para excluir clientes', 'error');
            return;
        }
        const confirmed = await showConfirm(
            'Este cliente será excluído permanentemente do sistema.',
            'Excluir Cliente',
            {
                confirmText: 'Excluir',
                cancelText: 'Cancelar',
                type: 'danger',
                icon: '🗑️'
            }
        );
        
        if (confirmed) {
            try {
                await db.deleteClient(clientId);
                appState.clients = appState.clients.filter(c => c.id !== clientId);
                renderClients();
                showNotification('Cliente excluído com sucesso!');
            } catch (error) {
                console.error('Erro ao excluir cliente:', error);
                showNotification('Erro ao excluir cliente', 'error');
            }
        }
    };

    window.showClientHistory = async function(clientId) {
        const client = appState.clients.find(c => c.id === clientId);
        if (!client) {
            showNotification('Cliente não encontrado');
            return;
        }

        const t = getTranslations();
        
        try {
            const history = await db.getClientHistory(clientId);
            
            // Calcular estatísticas
            const totalVisits = history.length;
            const totalSpent = history.reduce((sum, item) => sum + parseFloat(item.total_value || 0), 0);
            const lastVisit = history.length > 0 ? history[0] : null;
            const lastVisitDate = lastVisit ? new Date(lastVisit.service_date).toLocaleDateString('pt-BR') : 'Nunca';
            const avgTicket = totalVisits > 0 ? totalSpent / totalVisits : 0;
            
            showModal(`
                <div class="bg-[var(--bg-primary)] rounded-lg max-w-5xl w-full mx-4 border border-[var(--border-color)] max-h-[90vh] overflow-y-auto">
                    <div class="p-6">
                        <!-- Header -->
                        <div class="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border-color)]">
                            <div>
                                <h3 class="text-2xl font-bold text-[var(--text-primary)]">📊 Histórico de ${client.name}</h3>
                                <p class="text-sm text-[var(--text-secondary)] mt-1">${client.phone || client.email || ''}</p>
                            </div>
                            <button onclick="hideModal()" class="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-3xl leading-none">&times;</button>
                        </div>

                        <!-- Estatísticas Gerais -->
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div class="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg text-white">
                                <p class="text-xs opacity-90 mb-1">Total de Visitas</p>
                                <p class="text-3xl font-bold">${totalVisits}</p>
                            </div>
                            <div class="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-lg text-white">
                                <p class="text-xs opacity-90 mb-1">Total Gasto</p>
                                <p class="text-2xl font-bold">R$ ${totalSpent.toFixed(2)}</p>
                            </div>
                            <div class="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-lg text-white">
                                <p class="text-xs opacity-90 mb-1">Ticket Médio</p>
                                <p class="text-2xl font-bold">R$ ${avgTicket.toFixed(2)}</p>
                            </div>
                            <div class="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-lg text-white">
                                <p class="text-xs opacity-90 mb-1">Última Visita</p>
                                <p class="text-lg font-bold">${lastVisitDate}</p>
                            </div>
                        </div>

                        <!-- Lista de Atendimentos -->
                        <div class="space-y-4">
                            <h4 class="font-semibold text-[var(--text-primary)] text-lg mb-3">📋 Atendimentos Realizados</h4>
                            ${history.length === 0 ? `
                                <div class="text-center py-12 bg-[var(--bg-secondary)] rounded-lg border-2 border-dashed border-[var(--border-color)]">
                                    <div class="text-6xl mb-4">📋</div>
                                    <p class="text-lg text-[var(--text-secondary)] font-medium">Nenhum atendimento realizado</p>
                                    <p class="text-sm text-[var(--text-tertiary)] mt-2">Os atendimentos concluídos aparecerão aqui automaticamente</p>
                                </div>
                            ` : history.map((item, index) => {
                                const date = new Date(item.service_date);
                                const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
                                const time = item.service_time.substring(0, 5);
                                
                                return `
                                    <div class="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-4 hover:shadow-lg transition-all">
                                        <div class="flex justify-between items-start mb-3">
                                            <div class="flex-1">
                                                <div class="flex items-center gap-2 mb-2">
                                                    <span class="text-2xl">💅</span>
                                                    <h5 class="font-bold text-[var(--text-primary)] text-lg">${item.services_performed}</h5>
                                                </div>
                                                <div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                                    <div class="flex items-center gap-2 text-[var(--text-secondary)]">
                                                        <span>📅</span>
                                                        <span>${formattedDate}</span>
                                                    </div>
                                                    <div class="flex items-center gap-2 text-[var(--text-secondary)]">
                                                        <span>⏰</span>
                                                        <span>${time}</span>
                                                    </div>
                                                    <div class="flex items-center gap-2 text-[var(--text-secondary)]">
                                                        <span>�</span>
                                                        <span>${item.staff_name}</span>
                                                    </div>
                                                </div>
                                                ${item.notes ? `
                                                    <div class="mt-2 text-sm text-[var(--text-secondary)] italic pl-8">
                                                        💬 "${item.notes}"
                                                    </div>
                                                ` : ''}
                                            </div>
                                            <div class="text-right ml-4">
                                                <div class="text-2xl font-bold text-green-600">R$ ${parseFloat(item.total_value).toFixed(2)}</div>
                                                ${item.payment_method ? `<div class="text-xs text-[var(--text-secondary)] mt-1">💳 ${item.payment_method}</div>` : ''}
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>

                        <!-- Botão Fechar -->
                        <div class="mt-6 pt-4 border-t border-[var(--border-color)] flex justify-end">
                            <button onclick="hideModal()" 
                                class="px-6 py-2.5 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] transition-colors font-medium">
                                ✓ Fechar
                            </button>
                        </div>
                    </div>
                </div>
            `);
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            showNotification('❌ Erro ao carregar histórico do cliente', 'error');
        }
    };

    window.editService = function(serviceId) {
        if (!canEditServices()) {
            showNotification('Você não tem permissão para editar serviços', 'error');
            return;
        }
        const service = appState.services.find(s => s.id === serviceId);
        if (service) showServiceModal(service);
    };

    window.deleteService = async function(serviceId) {
        if (!canEditServices()) {
            showNotification('Você não tem permissão para excluir serviços', 'error');
            return;
        }
        const confirmed = await showConfirm(
            'Este serviço será excluído permanentemente do sistema.',
            'Excluir Serviço',
            {
                confirmText: 'Excluir',
                cancelText: 'Cancelar',
                type: 'danger',
                icon: '🗑️'
            }
        );
        
        if (confirmed) {
            try {
                await db.deleteService(serviceId);
                appState.services = appState.services.filter(s => s.id !== serviceId);
                renderServices();
                showNotification('Serviço excluído com sucesso!');
            } catch (error) {
                console.error('Erro ao excluir serviço:', error);
                showNotification('Erro ao excluir serviço');
            }
        }
    };

    window.editStaff = function(staffId) {
        if (!canEditStaff()) {
            showNotification('Você não tem permissão para editar funcionários', 'error');
            return;
        }
        const staff = appState.staff.find(s => s.id === staffId);
        if (staff) showStaffModal(staff);
    };

    window.deleteStaff = async function(staffId) {
        if (!canEditStaff()) {
            showNotification('Você não tem permissão para excluir funcionários', 'error');
            return;
        }
        const confirmed = await showConfirm(
            'Este funcionário será excluído permanentemente do sistema.',
            'Excluir Funcionário',
            {
                confirmText: 'Excluir',
                cancelText: 'Cancelar',
                type: 'danger',
                icon: '🗑️'
            }
        );
        
        if (confirmed) {
            try {
                await db.deleteStaff(staffId);
                appState.staff = appState.staff.filter(s => s.id !== staffId);
                renderStaff();
                showNotification('Funcionário excluído com sucesso!');
            } catch (error) {
                console.error('Erro ao excluir funcionário:', error);
                showNotification('Erro ao excluir funcionário', 'error');
            }
        }
    };

    window.editProduct = function(productId) {
        const product = appState.products.find(p => p.id === productId);
        if (product) showProductModal(product);
    };

    window.deleteProduct = async function(productId) {
        const t = getTranslations();
        const confirmed = await showConfirm(
            'Este produto será excluído permanentemente do sistema.',
            'Excluir Produto',
            {
                confirmText: 'Excluir',
                cancelText: 'Cancelar',
                type: 'danger',
                icon: '🗑️'
            }
        );
        
        if (confirmed) {
            try {
                await db.deleteProduct(productId);
                appState.products = appState.products.filter(p => p.id !== productId);
                renderProducts();
                showNotification('Produto excluído com sucesso!');
            } catch (error) {
                console.error('Erro ao excluir produto:', error);
                showNotification('Erro ao excluir produto', 'error');
            }
        }
    };

    window.editAppointment = function(appointmentId) {
        const appointment = appState.appointments.find(a => a.id === appointmentId);
        if (appointment) {
            // Verificar se o agendamento pode ser editado usando a função utilitária
            if (isDateInPast(appointment.date)) {
                alert('⚠️ Agendamentos de datas passadas não podem ser editados para evitar fraudes.');
                return;
            }
            
            showAppointmentModal(appointment);
        }
    };

    window.hideModal = hideModal;

    // Funções globais para solicitações de fechamento de agenda
    window.requestScheduleBlock = async function(date, reason) {
        const { currentUser, staff } = appState;
        const manicurist = staff.find(s => s.user_id === currentUser?.id || s.email === currentUser?.email);
        
        if (!manicurist || manicurist.role !== 'manicurist') {
            showNotification('Apenas manicures podem solicitar fechamento de agenda', 'error');
            return;
        }

        try {
            const request = {
                staff_id: manicurist.id,
                date: date,
                reason: reason,
                status: 'pending',
                created_at: new Date().toISOString()
            };

            const newRequest = await db.addScheduleRequest(request);
            appState.scheduleRequests.push(newRequest);
            showNotification('Solicitação enviada com sucesso!');
            hideModal();
        } catch (error) {
            console.error('Erro ao criar solicitação:', error);
            showNotification('Erro ao enviar solicitação', 'error');
        }
    };

    window.approveScheduleRequest = async function(requestId) {
        try {
            await db.updateScheduleRequest(requestId, { 
                status: 'approved',
                approved_at: new Date().toISOString()
            });
            
            // Atualizar no estado local
            const requestIndex = appState.scheduleRequests.findIndex(r => r.id === requestId);
            if (requestIndex !== -1) {
                appState.scheduleRequests[requestIndex].status = 'approved';
                appState.scheduleRequests[requestIndex].approved_at = new Date().toISOString();
            }
            
            showNotification('Solicitação aprovada!');
            renderScheduleRequests();
        } catch (error) {
            console.error('Erro ao aprovar solicitação:', error);
            showNotification('Erro ao aprovar solicitação', 'error');
        }
    };

    window.rejectScheduleRequest = async function(requestId) {
        try {
            await db.updateScheduleRequest(requestId, { 
                status: 'rejected',
                rejected_at: new Date().toISOString()
            });
            
            // Atualizar no estado local
            const requestIndex = appState.scheduleRequests.findIndex(r => r.id === requestId);
            if (requestIndex !== -1) {
                appState.scheduleRequests[requestIndex].status = 'rejected';
                appState.scheduleRequests[requestIndex].rejected_at = new Date().toISOString();
            }
            
            showNotification('Solicitação rejeitada');
            renderScheduleRequests();
        } catch (error) {
            console.error('Erro ao rejeitar solicitação:', error);
            showNotification('Erro ao rejeitar solicitação', 'error');
        }
    };

    // Função para salvar apenas horário de trabalho (sem almoço)
    window.saveMyDefaultWorkHours = async function(staffId) {
        try {
            const startTime = document.getElementById('defaultStartTime').value;
            const endTime = document.getElementById('defaultEndTime').value;

            if (!startTime || !endTime) {
                showNotification('Preencha os horários de início e fim do expediente', 'error');
                return;
            }

            if (startTime >= endTime) {
                showNotification('O horário de início deve ser antes do horário de fim', 'error');
                return;
            }

            const staff = appState.staff.find(s => s.id === staffId);
            if (!staff) {
                showNotification('Funcionário não encontrado', 'error');
                return;
            }

            // Atualizar apenas colunas de horário de trabalho
            await db.updateStaff(staffId, { 
                default_start_time: startTime,
                default_end_time: endTime
            });

            const staffIndex = appState.staff.findIndex(s => s.id === staffId);
            if (staffIndex !== -1) {
                appState.staff[staffIndex].default_start_time = startTime;
                appState.staff[staffIndex].default_end_time = endTime;
            }

            showNotification('✅ Horário de trabalho salvo com sucesso!');
            await renderMySchedule();
        } catch (error) {
            console.error('Erro ao salvar horário:', error);
            showNotification('❌ Erro ao salvar horário. Tente novamente.', 'error');
        }
    };

    // Função para salvar apenas horário de almoço
    window.saveMyLunchHours = async function(staffId) {
        try {
            const lunchStart = document.getElementById('defaultLunchStart').value;
            const lunchEnd = document.getElementById('defaultLunchEnd').value;

            if (!lunchStart || !lunchEnd) {
                showNotification('Preencha os horários de início e fim do almoço', 'error');
                return;
            }

            if (lunchStart >= lunchEnd) {
                showNotification('O horário de início do almoço deve ser antes do horário de fim', 'error');
                return;
            }

            const staff = appState.staff.find(s => s.id === staffId);
            if (!staff) {
                showNotification('Funcionário não encontrado', 'error');
                return;
            }

            // Atualizar apenas colunas de horário de almoço
            await db.updateStaff(staffId, { 
                default_lunch_start: lunchStart,
                default_lunch_end: lunchEnd
            });

            const staffIndex = appState.staff.findIndex(s => s.id === staffId);
            if (staffIndex !== -1) {
                appState.staff[staffIndex].default_lunch_start = lunchStart;
                appState.staff[staffIndex].default_lunch_end = lunchEnd;
            }

            showNotification('✅ Horário de almoço salvo com sucesso!');
            await renderMySchedule();
        } catch (error) {
            console.error('Erro ao salvar horário de almoço:', error);
            showNotification('❌ Erro ao salvar horário. Tente novamente.', 'error');
        }
    };

    // Função antiga mantida para compatibilidade (não usar mais)
    window.saveMyDefaultSchedule = async function(staffId) {
        try {
            const startTime = document.getElementById('defaultStartTime').value;
            const endTime = document.getElementById('defaultEndTime').value;
            const lunchStart = document.getElementById('defaultLunchStart')?.value;
            const lunchEnd = document.getElementById('defaultLunchEnd')?.value;
            
            // Buscar o funcionário para obter o role
            const staff = appState.staff.find(s => s.id === staffId);
            if (!staff) {
                showNotification('Funcionário não encontrado', 'error');
                return;
            }
            
            // Calcular duração automática baseada no role
            let slotDuration = 45; // Padrão
            if (staff.role === 'manicurist') {
                slotDuration = 45;
            } else if (staff.role === 'hairdresser') {
                slotDuration = 30;
            }

            // Validações básicas
            if (!startTime || !endTime) {
                showNotification('Preencha os horários de início e fim do expediente', 'error');
                return;
            }

            // Validar se horário de início é antes do fim
            if (startTime >= endTime) {
                showNotification('O horário de início deve ser antes do horário de fim', 'error');
                return;
            }

            // Validar horário de almoço
            if (lunchStart && lunchEnd && lunchStart >= lunchEnd) {
                showNotification('O horário de início do almoço deve ser antes do horário de fim', 'error');
                return;
            }

            // Criar objeto do horário padrão (sem working_days - assume todos os dias)
            const scheduleData = {
                start_time: startTime,
                end_time: endTime,
                slot_duration: slotDuration,
                lunch_start: lunchStart,
                lunch_end: lunchEnd
            };

            // Atualizar no banco de dados
            await db.updateStaff(staffId, {
                defaultSchedule: scheduleData
            });

            // Atualizar no estado local
            const staffIndex = appState.staff.findIndex(s => s.id === staffId);
            if (staffIndex !== -1) {
                appState.staff[staffIndex].defaultSchedule = scheduleData;
            }

            // Se o toggle de pular almoço hoje estiver ativado, criar um horário customizado para hoje
            if (skipLunchToday && lunchStart && lunchEnd) {
                const today = new Date().toISOString().split('T')[0];
                
                // Criar horário customizado sem almoço para hoje
                const customScheduleData = {
                    date: today,
                    staff_id: staffId,
                    start_time: startTime,
                    end_time: endTime,
                    lunch_start: null,
                    lunch_end: null,
                    is_day_off: false,
                    notes: skipLunch ? 'Sem almoço hoje' : null
                };

                try {
                    // Verificar se já existe um horário customizado para hoje
                    const { data: existingSchedule, error: selectError } = await supabase
                        .from('staff_daily_schedule')
                        .select('*')
                        .eq('staff_id', staffId)
                        .eq('date', today)
                        .maybeSingle();

                    // Ignorar erros 406 (tabela pode não existir ainda)
                    if (selectError && selectError.code !== 'PGRST116') {
                        console.warn('Erro ao verificar horário:', selectError);
                    }

                    if (existingSchedule) {
                        // Atualizar horário existente
                        const { error: updateError } = await supabase
                            .from('staff_daily_schedule')
                            .update({
                                lunch_start: null,
                                lunch_end: null
                            })
                            .eq('staff_id', staffId)
                            .eq('date', today);
                        
                        if (updateError && updateError.code !== 'PGRST116') {
                            console.warn('Erro ao atualizar horário:', updateError);
                        }
                    } else {
                        // Criar novo horário customizado
                        const { error: insertError } = await supabase
                            .from('staff_daily_schedule')
                            .insert([customScheduleData]);
                        
                        if (insertError && insertError.code !== 'PGRST116') {
                            console.warn('Erro ao inserir horário:', insertError);
                        }
                    }
                } catch (err) {
                    // Silenciar erros de tabela não existente
                    console.log('ℹ️ Tabela staff_daily_schedule não configurada (funcionalidade futura)');
                }

                showNotification('✅ Horário padrão salvo! Almoço pulado para hoje.');
            } else {
                showNotification('✅ Horário padrão salvo com sucesso!');
            }

            // Recarregar a visualização para refletir as mudanças
            if (appState.currentView === 'mySchedule') {
                renderMySchedule();
            } else if (appState.currentView === 'calendar') {
                renderCalendar();
            }
            
        } catch (error) {
            console.error('Erro ao salvar horário:', error);
            showNotification('❌ Erro ao salvar horário. Tente novamente.', 'error');
        }
    };

    window.showScheduleRequestModal = function(selectedDate = null) {
        const t = getTranslations();
        const { currentUser, staff, scheduleRequests } = appState;
        
        // Verificar se é manicure
        const manicurist = staff.find(s => s.user_id === currentUser?.id || s.email === currentUser?.email);
        if (!manicurist || manicurist.role !== 'manicurist') {
            showNotification('Apenas manicures podem solicitar fechamento de agenda', 'error');
            return;
        }

        // Verificar se já existe uma solicitação pendente ou aprovada para hoje
        const today = new Date().toDateString();
        const todayRequests = scheduleRequests.filter(r => 
            r.staff_id === manicurist.id && 
            new Date(r.created_at).toDateString() === today &&
            (r.status === 'pending' || r.status === 'approved')
        );

        if (todayRequests.length > 0) {
            const status = todayRequests[0].status === 'pending' ? 'pendente' : 'aprovada';
            showNotification(`Você já possui uma solicitação ${status} para hoje. Aguarde ou tente novamente amanhã.`, 'error');
            return;
        }

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const minDate = getLocalDateString(tomorrow);
        
        const defaultDate = selectedDate || minDate;
        
        const modalHtml = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="event.target === event.currentTarget && hideModal()">
                <div class="bg-[var(--bg-primary)] rounded-lg p-6 w-full max-w-md mx-4 border border-[var(--border-color)]" onclick="event.stopPropagation()">
                    <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">
                        ${t.requestScheduleBlock || 'Solicitar Fechamento de Agenda'}
                    </h3>
                    
                    <div class="mb-4 p-3 bg-[var(--accent-light)] border border-[var(--border-color)] rounded-lg">
                        <p class="text-sm text-[var(--text-primary)]">
                            <strong>⚠️ Importante:</strong> Só é possível enviar 1 solicitação por dia. Use com responsabilidade.
                        </p>
                    </div>

                    <form id="scheduleRequestForm" onsubmit="submitScheduleRequest(event)">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                ${t.date || 'Data'}:
                            </label>
                            <input type="date" id="requestDate" min="${minDate}" value="${defaultDate}" 
                                class="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]" required>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                ${t.reason || 'Motivo'}:
                            </label>
                            <textarea id="requestReason" rows="3" placeholder="${t.scheduleRequestReason || 'Ex: Consulta médica, compromisso pessoal...'}"
                                class="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]" required></textarea>
                        </div>
                        <div class="flex space-x-3">
                            <button type="button" onclick="hideModal()" 
                                class="flex-1 px-4 py-2 text-[var(--text-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--accent-light)] transition-colors">
                                ${t.cancel || 'Cancelar'}
                            </button>
                            <button type="submit" 
                                class="flex-1 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] transition-colors">
                                ${t.sendRequest || 'Enviar Solicitação'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Mostrar modal corretamente
        dom.modalContainer.innerHTML = modalHtml;
        dom.modalContainer.classList.remove('hidden');
    };

    window.submitScheduleRequest = function(event) {
        event.preventDefault();
        const date = document.getElementById('requestDate').value;
        const reason = document.getElementById('requestReason').value;
        
        if (date && reason) {
            requestScheduleBlock(date, reason);
        }
    };

    const appState = {
        currentDate: new Date(),
        currentView: 'calendarView',
        currentUser: null,
        appointments: [],
        clients: [],
        services: [],
        staff: [],
        products: [], // Para produtos/estoque
        scheduleRequests: [], // Para solicitações de fechamento de agenda
        selectedManicuristId: null, // Para filtrar por manicure específica
        selectedHairdresserId: null, // Para filtrar por cabeleireira específica
        settings: {
            theme: 'light-mode',
            language: 'pt-BR',
            businessName: 'Agenda de Salão',
            businessPhone: '(11) 99999-9999',
            appointmentDuration: 45,
            workingHours: { start: '08:00', end: '18:00' },
            workDays: [1, 2, 3, 4, 5, 6],
            lateToleranceInMinutes: 10,
            commissionRate: 0.5
        },
        calendarViewType: 'month'
    };

    // Funções para salvar/carregar configurações do localStorage
    function loadUserSettings() {
        try {
            const savedSettings = localStorage.getItem('salao-settings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                appState.settings = { ...appState.settings, ...parsed };
                // Aplicar tema salvo
                document.body.className = appState.settings.theme;
                // Atualizar configurações globais para o sistema de traduções
                window.appSettings = { ...window.appSettings, ...appState.settings };
                
                console.log('⚙️ Configurações carregadas:', appState.settings);
                console.log('🌐 Traduções globais disponíveis:', Object.keys(window.translations || {}));
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        }
    }

    function saveUserSettings() {
        try {
            localStorage.setItem('salao-settings', JSON.stringify(appState.settings));
            // Atualizar configurações globais para o sistema de traduções
            window.appSettings = { ...window.appSettings, ...appState.settings };
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
        }
    }

    // Função utilitária para verificar permissões do usuário
    function getUserRole() {
        const { currentUser, staff } = appState;
        const userStaff = staff.find(s => s.user_id === currentUser?.id || s.email === currentUser?.email);

        // Verificar por múltiplas formas
        if (currentUser?.user_metadata?.role === 'admin' || 
            userStaff?.role === 'admin' || 
            currentUser?.email === 'admin@supabase.io' ||
            currentUser?.email === 'admin@example.com') {
            return 'admin';
        }
        
        if (currentUser?.user_metadata?.role === 'receptionist' || userStaff?.role === 'receptionist') {
            return 'receptionist';
        }
        
        if (currentUser?.user_metadata?.role === 'manicurist' || userStaff?.role === 'manicurist') {
            return 'manicurist';
        }
        
        if (currentUser?.user_metadata?.role === 'hairdresser' || userStaff?.role === 'hairdresser') {
            return 'hairdresser';
        }
        
        // Se não encontrou nenhum cargo, retornar null (usuário sem permissões)
        return null;
    }

    function isAdmin() {
        return getUserRole() === 'admin';
    }

    function isManicurist() {
        return getUserRole() === 'manicurist';
    }
    
    function isHairdresser() {
        return getUserRole() === 'hairdresser';
    }
    
    function isReceptionist() {
        return getUserRole() === 'receptionist';
    }

    // Para recepcionistas: podem ver todas as manicures e agendar para elas
    function canManageAllAppointments() {
        return isAdmin() || isReceptionist();
    }

    // Verifica se pode ver todos os agendamentos (admin e recepcionista)
    function canViewAllAppointments() {
        return isAdmin() || isReceptionist();
    }

    // Verifica se pode editar/criar (admin tem acesso total, recepcionista pode criar e editar clientes)
    function canEditClients() {
        return isAdmin() || isReceptionist();
    }

    function canEditServices() {
        return isAdmin(); // APENAS admin pode editar serviços
    }

    function canEditStaff() {
        return isAdmin(); // APENAS admin pode editar funcionários
    }

    // Verifica se pode criar novos agendamentos (apenas admin e recepcionista)
    function canCreateAppointments() {
        return isAdmin() || isReceptionist();
    }

    // TODOS podem ver clientes (mas apenas admin/recepcionista podem editar)
    function canViewClients() {
        return true; // Todos os cargos podem visualizar clientes
    }

    // TODOS podem ver lista de serviços (mas apenas admin pode editar)
    function canViewServices() {
        return true; // Todos os cargos podem visualizar serviços
    }

    // Admin e recepcionista podem ver lista de funcionários
    // TODOS podem ver lista de funcionários (mas apenas admin pode editar)
    function canViewStaff() {
        return true; // TODOS podem ver
    }

    // Admin e recepcionista podem acessar vendas
    function canAccessSales() {
        return isAdmin() || isReceptionist();
    }

    // TODOS podem acessar relatórios (visualização)
    function canAccessReports() {
        return true; // Todos os cargos podem visualizar relatórios
    }

    // Verifica se é funcionário (manicure ou cabeleireira) - sem permissões administrativas
    function isStaffMember() {
        const role = getUserRole();
        return role === 'manicurist' || role === 'hairdresser';
    }

    // Função para obter a duração automática de atendimento baseada no role
    function getStaffSlotDuration(staff) {
        if (!staff) return 45; // Padrão
        
        // SEMPRE calcular baseado no role primeiro (prioridade)
        if (staff.role === 'manicurist') {
            return 45; // Manicure: 45 minutos
        } else if (staff.role === 'hairdresser') {
            return 30; // Cabeleireira: 30 minutos
        }
        
        // Se o role não for reconhecido, usar slot_duration do banco se existir
        if (staff.slot_duration) {
            return staff.slot_duration;
        }
        
        return 45; // Padrão final
    }

    // Função para verificar se o almoço está ativo para um staff hoje
    function isLunchActiveToday(staff) {
        if (!staff) return true;
        
        // Admin e recepcionista não têm horário de almoço
        if (staff.role === 'admin' || staff.role === 'receptionist') {
            return false;
        }
        
        // PRIORIDADE 1: Verificar se tem lunch_disabled_date no staff (do banco)
        if (staff.lunch_disabled_date) {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0]; // 'YYYY-MM-DD'
            const disabledDateStr = staff.lunch_disabled_date; // Já vem como 'YYYY-MM-DD'
            
            // Se a data salva é hoje, o almoço está desativado
            if (disabledDateStr === todayStr) {
                return false;
            }
        }
        
        // FALLBACK: Verificar localStorage (para compatibilidade)
        const lunchDisabledUntil = localStorage.getItem('lunchDisabledUntil_' + staff.id);
        
        if (lunchDisabledUntil) {
            const disabledDate = new Date(lunchDisabledUntil);
            const today = new Date();
            const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const savedDay = new Date(disabledDate.getFullYear(), disabledDate.getMonth(), disabledDate.getDate());
            
            // Se a data salva é hoje, o almoço está desativado
            if (todayNormalized.getTime() === savedDay.getTime()) {
                return false;
            }
        }
        
        return true; // Almoço ativo por padrão
    }

    // Função para obter manicures que o usuário atual pode ver
    function getVisibleManicurists() {
        const { currentUser, staff } = appState;
        
        if (canViewAllAppointments()) {
            // Admin e recepcionista veem todas as manicures
            return staff.filter(s => s.role === 'manicurist');
        } else if (isManicurist()) {
            // Manicure só vê a si mesma
            const currentStaff = staff.find(s => s.user_id === currentUser?.id || s.email === currentUser?.email);
            return currentStaff ? [currentStaff] : [];
        }
        
        return [];
    }

    // Função para obter staff disponível para agendamento (manicure + cabeleireira)
    function getVisibleStaffForBooking() {
        const { currentUser, staff } = appState;
        
        if (canViewAllAppointments()) {
            // Admin e recepcionista veem todos os staff (manicure + cabeleireira)
            return staff.filter(s => s.role === 'manicurist' || s.role === 'hairdresser');
        } else {
            // Staff vê apenas a si mesmo
            const currentStaff = staff.find(s => s.user_id === currentUser?.id || s.email === currentUser?.email);
            return currentStaff ? [currentStaff] : [];
        }
    }

    // Função para filtrar agendamentos baseado nas permissões
    function getVisibleAppointments(appointments = appState.appointments) {
        const { currentUser, staff, selectedManicuristId, selectedHairdresserId } = appState;
        
        if (canViewAllAppointments()) {
            // Admin e recepcionista veem todos os agendamentos
            let visibleAppointments = appointments;
            
            // Se houver uma manicure selecionada no filtro, mostrar apenas dela
            if (selectedManicuristId && selectedManicuristId !== 'all') {
                visibleAppointments = appointments.filter(app => app.staff_id === selectedManicuristId);
            }
            // Se houver uma cabeleireira selecionada no filtro, mostrar apenas dela
            else if (selectedHairdresserId && selectedHairdresserId !== 'all') {
                visibleAppointments = appointments.filter(app => app.staff_id === selectedHairdresserId);
            }
            
            return visibleAppointments;
        } else if (isManicurist()) {
            // Manicure só vê seus próprios agendamentos
            const currentStaff = staff.find(s => s.user_id === currentUser?.id || s.email === currentUser?.email);
            if (currentStaff) {
                return appointments.filter(app => app.staff_id === currentStaff.id);
            }
        } else if (isHairdresser()) {
            // Cabeleireira só vê seus próprios agendamentos
            const currentStaff = staff.find(s => s.user_id === currentUser?.id || s.email === currentUser?.email);
            if (currentStaff) {
                return appointments.filter(app => app.staff_id === currentStaff.id);
            }
        }
        
        return [];
    }

    // Funções do Supabase
    const auth = {
        async signUp(email, password, userData = {}) {
            try {
                const { data, error } = await window.supabase.auth.signUp({
                    email,
                    password,
                    options: { data: userData }
                });
                if (error) throw error;
                return { user: data.user, session: data.session };
            } catch (error) {
                console.error('Erro no cadastro:', error);
                throw error;
            }
        },

        async signIn(email, password) {
            try {
                const { data, error } = await window.supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) throw error;
                return { user: data.user, session: data.session };
            } catch (error) {
                console.error('Erro no login:', error);
                throw error;
            }
        },

        async signOut() {
            try {
                const { error } = await window.supabase.auth.signOut();
                if (error) throw error;
            } catch (error) {
                console.error('Erro no logout:', error);
                throw error;
            }
        },

        async resetPassword(email) {
            try {
                const { data, error } = await window.supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`
                });
                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Erro ao enviar reset de senha:', error);
                throw error;
            }
        },

        async updatePassword(newPassword) {
            try {
                const { data, error } = await window.supabase.auth.updateUser({
                    password: newPassword
                });
                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Erro ao atualizar senha:', error);
                throw error;
            }
        },

        async getUser() {
            try {
                const { data: { user }, error } = await window.supabase.auth.getUser();
                if (error) throw error;
                return user;
            } catch (error) {
                console.error('Erro ao obter usuário:', error);
                return null;
            }
        },

        onAuthStateChange(callback) {
            return window.supabase.auth.onAuthStateChange(callback);
        }
    };

    const db = {
        async getClients() {
            try {
                const { data, error } = await window.supabase
                    .from('clients')
                    .select('*')
                    .order('name');
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Erro ao buscar clientes:', error);
                return [];
            }
        },

        async addClient(client) {
            try {
                const { data, error } = await window.supabase
                    .from('clients')
                    .insert([client])
                    .select();
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao adicionar cliente:', error);
                throw error;
            }
        },

        async updateClient(id, updates) {
            try {
                const { data, error } = await window.supabase
                    .from('clients')
                    .update(updates)
                    .eq('id', id)
                    .select();
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao atualizar cliente:', error);
                throw error;
            }
        },

        async deleteClient(id) {
            try {
                const { error } = await window.supabase
                    .from('clients')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            } catch (error) {
                console.error('Erro ao excluir cliente:', error);
                throw error;
            }
        },

        async getServices() {
            try {
                const { data, error } = await window.supabase
                    .from('services')
                    .select('*')
                    .order('name');
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Erro ao buscar serviços:', error);
                return [];
            }
        },

        async addService(service) {
            try {
                const { data, error } = await window.supabase
                    .from('services')
                    .insert([service])
                    .select();
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao adicionar serviço:', error);
                throw error;
            }
        },

        async updateService(id, updates) {
            try {
                const { data, error } = await window.supabase
                    .from('services')
                    .update(updates)
                    .eq('id', id)
                    .select();
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao atualizar serviço:', error);
                throw error;
            }
        },

        async deleteService(id) {
            try {
                const { error } = await window.supabase
                    .from('services')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            } catch (error) {
                console.error('Erro ao excluir serviço:', error);
                throw error;
            }
        },

        async getStaff() {
            try {
                const { data, error } = await window.supabase
                    .from('staff')
                    .select('*')
                    .order('name');
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Erro ao buscar funcionários:', error);
                return [];
            }
        },

        async addStaff(staff) {
            try {
                const { data, error } = await window.supabase
                    .from('staff')
                    .insert([staff])
                    .select();
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao adicionar funcionário:', error);
                throw error;
            }
        },

        async updateStaff(id, updates) {
            try {
                const { data, error } = await window.supabase
                    .from('staff')
                    .update(updates)
                    .eq('id', id)
                    .select();
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao atualizar funcionário:', error);
                throw error;
            }
        },

        async deleteStaff(id) {
            try {
                const { error } = await window.supabase
                    .from('staff')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            } catch (error) {
                console.error('Erro ao excluir funcionário:', error);
                throw error;
            }
        },

        async getAppointments(date = null) {
            try {
                let query = window.supabase
                    .from('appointments')
                    .select(`
                        *,
                        clients(*),
                        services(*),
                        staff(*),
                        appointment_services(
                            *,
                            services(*)
                        )
                    `);
                
                if (date) {
                    query = query.eq('date', date);
                }
                
                const { data, error } = await query.order('date').order('time');
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Erro ao buscar agendamentos:', error);
                return [];
            }
        },

        async addAppointment(appointment) {
            try {
                const { data, error } = await window.supabase
                    .from('appointments')
                    .insert([appointment])
                    .select(`
                        *,
                        clients(*),
                        services(*),
                        staff(*)
                    `);
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao adicionar agendamento:', error);
                throw error;
            }
        },

        async updateAppointment(id, updates) {
            try {
                const { data, error } = await window.supabase
                    .from('appointments')
                    .update(updates)
                    .eq('id', id)
                    .select(`
                        *,
                        clients(*),
                        services(*),
                        staff(*)
                    `);
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao atualizar agendamento:', error);
                throw error;
            }
        },

        async deleteAppointment(id) {
            try {
                const { error } = await window.supabase
                    .from('appointments')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            } catch (error) {
                console.error('Erro ao excluir agendamento:', error);
                throw error;
            }
        },

        // Funções para solicitações de fechamento de agenda
        async getScheduleRequests() {
            try {
                const { data, error } = await window.supabase
                    .from('schedule_requests')
                    .select(`
                        *,
                        staff:staff_id (name)
                    `)
                    .order('created_at', { ascending: false });
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Erro ao buscar solicitações:', error);
                return [];
            }
        },

        async addScheduleRequest(request) {
            try {
                const { data, error } = await window.supabase
                    .from('schedule_requests')
                    .insert([request])
                    .select();
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao criar solicitação:', error);
                throw error;
            }
        },

        async updateScheduleRequest(id, updates) {
            try {
                const { data, error } = await window.supabase
                    .from('schedule_requests')
                    .update(updates)
                    .eq('id', id)
                    .select();
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao atualizar solicitação:', error);
                throw error;
            }
        },

        async deleteScheduleRequest(id) {
            try {
                const { error } = await window.supabase
                    .from('schedule_requests')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            } catch (error) {
                console.error('Erro ao excluir solicitação:', error);
                throw error;
            }
        },

        // Funções para serviços realizados em agendamentos
        async getAppointmentServices(appointmentId) {
            try {
                const { data, error } = await window.supabase
                    .from('appointment_services')
                    .select(`
                        *,
                        services(*)
                    `)
                    .eq('appointment_id', appointmentId)
                    .order('created_at');
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Erro ao buscar serviços do agendamento:', error);
                return [];
            }
        },

        async addAppointmentService(appointmentService) {
            try {
                const { data, error } = await window.supabase
                    .from('appointment_services')
                    .insert([appointmentService])
                    .select(`
                        *,
                        services(*)
                    `);
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao adicionar serviço ao agendamento:', error);
                throw error;
            }
        },

        async updateAppointmentService(id, updates) {
            try {
                const { data, error } = await window.supabase
                    .from('appointment_services')
                    .update(updates)
                    .eq('id', id)
                    .select(`
                        *,
                        services(*)
                    `);
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao atualizar serviço do agendamento:', error);
                throw error;
            }
        },

        async deleteAppointmentService(id) {
            try {
                const { error } = await window.supabase
                    .from('appointment_services')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            } catch (error) {
                console.error('Erro ao remover serviço do agendamento:', error);
                throw error;
            }
        },

        // Funções para histórico de atendimento do cliente
        async getClientHistory(clientId) {
            try {
                const { data, error } = await window.supabase
                    .from('client_service_history')
                    .select(`
                        *,
                        staff:staff_id(name),
                        services:services_performed
                    `)
                    .eq('client_id', clientId)
                    .order('service_date', { ascending: false })
                    .order('service_time', { ascending: false });
                if (error) throw error;
                
                // Formatar os dados para o formato esperado pela UI
                const formattedData = (data || []).map(item => ({
                    ...item,
                    service_name: item.services_performed, // Nome dos serviços já vem formatado
                    staff_name: item.staff?.name || 'Não informado',
                    price_charged: item.total_value, // Para compatibilidade
                    quantity: 1 // Histórico não tem quantidade separada
                }));
                
                return formattedData;
            } catch (error) {
                console.error('Erro ao buscar histórico do cliente:', error);
                return [];
            }
        },

        async addClientHistory(historyData) {
            try {
                const { data, error } = await window.supabase
                    .from('client_service_history')
                    .insert([historyData])
                    .select();
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao adicionar histórico:', error);
                throw error;
            }
        },

        async getClientStats(clientId) {
            try {
                const { data, error } = await window.supabase
                    .from('client_service_history')
                    .select('total_value, service_date')
                    .eq('client_id', clientId);
                
                if (error) throw error;
                
                const history = data || [];
                const totalSpent = history.reduce((sum, item) => sum + parseFloat(item.total_value || 0), 0);
                const totalVisits = history.length;
                const lastVisit = history.length > 0 ? history[0].service_date : null;
                
                return {
                    totalSpent,
                    totalVisits,
                    lastVisit
                };
            } catch (error) {
                console.error('Erro ao buscar estatísticas do cliente:', error);
                return { totalSpent: 0, totalVisits: 0, lastVisit: null };
            }
        },

        // Funções para appointment_services (serviços de um agendamento)
        async addAppointmentService(serviceData) {
            try {
                const { data, error} = await window.supabase
                    .from('appointment_services')
                    .insert([serviceData])
                    .select();
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao adicionar serviço ao agendamento:', error);
                throw error;
            }
        },

        async deleteAppointmentServices(appointmentId) {
            try {
                const { error } = await window.supabase
                    .from('appointment_services')
                    .delete()
                    .eq('appointment_id', appointmentId);
                if (error) throw error;
                return true;
            } catch (error) {
                console.error('Erro ao deletar serviços do agendamento:', error);
                throw error;
            }
        },

        async getAppointmentServices(appointmentId) {
            try {
                const { data, error } = await window.supabase
                    .from('appointment_services')
                    .select('*, services(*)')
                    .eq('appointment_id', appointmentId);
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Erro ao buscar serviços do agendamento:', error);
                return [];
            }
        },

        // 🔄 Funções para appointment_handoffs (pausas/transferências temporárias)
        async addAppointmentHandoff(handoffData) {
            try {
                const { data, error } = await window.supabase
                    .from('appointment_handoffs')
                    .insert([handoffData])
                    .select();
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao adicionar handoff:', error);
                throw error;
            }
        },

        async getAppointmentHandoffs(appointmentId) {
            try {
                const { data, error } = await window.supabase
                    .from('appointment_handoffs')
                    .select('*, staff:handoff_staff_id(*), services:service_id(*)')
                    .eq('appointment_id', appointmentId)
                    .order('start_time');
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Erro ao buscar handoffs do agendamento:', error);
                return [];
            }
        },

        async updateAppointmentHandoff(id, updates) {
            try {
                const { data, error } = await window.supabase
                    .from('appointment_handoffs')
                    .update(updates)
                    .eq('id', id)
                    .select();
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao atualizar handoff:', error);
                throw error;
            }
        },

        async deleteAppointmentHandoff(id) {
            try {
                const { error } = await window.supabase
                    .from('appointment_handoffs')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
                return true;
            } catch (error) {
                console.error('Erro ao deletar handoff:', error);
                throw error;
            }
        },

        async deleteAppointmentHandoffs(appointmentId) {
            try {
                const { error } = await window.supabase
                    .from('appointment_handoffs')
                    .delete()
                    .eq('appointment_id', appointmentId);
                if (error) throw error;
                return true;
            } catch (error) {
                console.error('Erro ao deletar handoffs do agendamento:', error);
                throw error;
            }
        },

        // Funções para produtos
        async getProducts() {
            try {
                const { data, error } = await window.supabase
                    .from('products')
                    .select('*')
                    .order('name');
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Erro ao buscar produtos:', error);
                return [];
            }
        },

        async addProduct(product) {
            try {
                const { data, error } = await window.supabase
                    .from('products')
                    .insert([product])
                    .select();
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao adicionar produto:', error);
                throw error;
            }
        },

        async updateProduct(id, updates) {
            try {
                const { data, error } = await window.supabase
                    .from('products')
                    .update(updates)
                    .eq('id', id)
                    .select();
                if (error) throw error;
                return data[0];
            } catch (error) {
                console.error('Erro ao atualizar produto:', error);
                throw error;
            }
        },

        async deleteProduct(id) {
            try {
                const { error } = await window.supabase
                    .from('products')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            } catch (error) {
                console.error('Erro ao excluir produto:', error);
                throw error;
            }
        },

        // Funções para horários customizados por dia
        async getDailySchedule(staffId, date) {
            try {
                const { data, error } = await window.supabase
                    .from('staff_daily_schedule')
                    .select('*')
                    .eq('staff_id', staffId)
                    .eq('date', date)
                    .single();
                if (error && error.code !== 'PGRST116') throw error; // PGRST116 = não encontrado
                return data;
            } catch (error) {
                console.error('Erro ao buscar horário do dia:', error);
                return null;
            }
        },

        async setDailySchedule(scheduleData) {
            try {
                // Verificar se já existe um horário para este dia
                const existing = await this.getDailySchedule(scheduleData.staff_id, scheduleData.date);
                
                if (existing) {
                    // Atualizar existente
                    const { data, error } = await window.supabase
                        .from('staff_daily_schedule')
                        .update(scheduleData)
                        .eq('id', existing.id)
                        .select();
                    if (error) throw error;
                    return data[0];
                } else {
                    // Criar novo
                    const { data, error } = await window.supabase
                        .from('staff_daily_schedule')
                        .insert([scheduleData])
                        .select();
                    if (error) throw error;
                    return data[0];
                }
            } catch (error) {
                console.error('Erro ao salvar horário do dia:', error);
                throw error;
            }
        },

        async deleteDailySchedule(staffId, date) {
            try {
                const { error } = await window.supabase
                    .from('staff_daily_schedule')
                    .delete()
                    .eq('staff_id', staffId)
                    .eq('date', date);
                if (error) throw error;
            } catch (error) {
                console.error('Erro ao excluir horário do dia:', error);
                throw error;
            }
        },

        async getStaffScheduleForMonth(staffId, year, month) {
            try {
                const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
                const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
                
                const { data, error } = await window.supabase
                    .from('staff_daily_schedule')
                    .select('*')
                    .eq('staff_id', staffId)
                    .gte('date', startDate)
                    .lte('date', endDate)
                    .order('date');
                    
                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Erro ao buscar horários do mês:', error);
                return [];
            }
        }
    };

    let dom = {};

    function init() {
        dom = {
            app: document.getElementById('app'),
            loginView: document.getElementById('login-view'),
            sidebarLinks: document.querySelectorAll('nav a'),
            mainContent: document.getElementById('mainContent'),
            headerTitle: document.querySelector('header h2'),
            currentDateDisplay: document.getElementById('currentDate'),
            modalContainer: document.getElementById('modal-container'),
            newClientBtn: document.getElementById('newClientBtn'),
            clientList: document.getElementById('clientList'),
            clientSearch: document.getElementById('clientSearch'),
            calendarContainer: document.getElementById('calendarContainer'),
            prevPeriodBtn: document.getElementById('prevPeriodBtn'),
            nextPeriodBtn: document.getElementById('nextPeriodBtn'),
            todayBtn: document.getElementById('todayBtn'),
            calendarViewToggles: document.querySelectorAll('.calendar-view-toggle'),
            newServiceBtn: document.getElementById('newServiceBtn'),
            serviceList: document.getElementById('serviceList'),
            staffList: document.getElementById('staffList'),
            newAppointmentBtn: document.getElementById('newAppointmentBtn'),
            settingsLink: document.getElementById('settingsLink'),
            logoutBtn: document.getElementById('logoutBtn')
        };

        setupEventListeners();
        loadUserSettings(); // Carregar configurações salvas
        checkAuthStatus();
        updateCurrentDate();
        
        // Atualizar contador de notificações
        setTimeout(() => updateNotificationBellCount(), 1000);
        
        // Adicionar listener para mudanças de idioma
        document.addEventListener('languageChanged', (e) => {
            console.log('🌐 Sistema de Tradução: Idioma alterado para:', e.detail.language);
            console.log('🌐 Traduções disponíveis:', Object.keys(window.translations || {}));
            console.log('🌐 Testando tradução "calendar":', getTranslation('calendar'));
            
            // Atualizar todos os elementos com tradução
            updateAllTranslations();
        });
    }

    async function checkAuthStatus() {
        try {
            const { data: { user }, error } = await window.supabase.auth.getUser();
            if (error) throw error;
            
            if (user) {
                appState.currentUser = user;
                showApp();
                await loadInitialData();
                showView('calendarView');
            } else {
                showLogin();
            }
        } catch (error) {
            console.error('Erro ao verificar status de autenticação:', error);
            showLogin();
        }
    }

    function showApp() {
        dom.loginView.style.display = 'none';
        dom.app.classList.remove('hidden');
    }

    function showLogin() {
        dom.app.classList.add('hidden');
        dom.loginView.style.display = 'block';
        
        // Verificar se há parâmetros de reset de senha na URL
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const type = urlParams.get('type');
        
        if (accessToken && type === 'recovery') {
            showResetPasswordForm();
        } else {
            renderLoginForm();
        }
    }

    function renderLoginForm() {
        const t = getTranslations();
        dom.loginView.innerHTML = `
            <div class="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 overflow-hidden">
                <!-- Background decorativo animado -->
                <div class="absolute inset-0 overflow-hidden">
                    <div class="absolute top-1/4 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                    <div class="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl animate-bounce"></div>
                    <div class="absolute bottom-1/4 left-1/3 w-80 h-80 bg-blue-300/15 rounded-full blur-3xl animate-pulse"></div>
                </div>
                
                <!-- Container principal com animação de entrada -->
                <div class="max-w-md w-full space-y-8 relative z-10 px-4 animate-fade-in">
                    <div class="text-center">
                        <div class="mb-6">
                            <div class="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30 p-2">
                                <img src="./assets/imgs/icone-de-login.png" alt="Login Icon" class="w-12 h-12 object-contain">
                            </div>
                        </div>
                        <h2 class="text-4xl font-bold text-white mb-2">${t.appName}</h2>
                        <p class="text-white/80 text-lg">${t.appSubtitle}</p>
                    </div>
                    
                    <!-- Card de login com efeito de vidro -->
                    <div class="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-8 border border-white/20 transform transition-all duration-300 hover:shadow-3xl">
                        <form id="loginForm" class="space-y-6">
                            <div>
                                <label for="email" class="block text-sm font-medium text-gray-700 mb-2">${t.email}</label>
                                <div class="relative">
                                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">📧</span>
                                    <input id="email" name="email" type="email" required 
                                        class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                                        placeholder="seu@email.com">
                                </div>
                            </div>
                            <div>
                                <label for="password" class="block text-sm font-medium text-gray-700 mb-2">${t.password}</label>
                                <div class="relative">
                                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔒</span>
                                    <input id="password" name="password" type="password" required 
                                        class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                                        placeholder="••••••••">
                                </div>
                            </div>
                            <div>
                                <button type="submit" 
                                    class="w-full py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform transition-all duration-200 hover:scale-105 active:scale-95">
                                    ${t.login} ✨
                                </button>
                            </div>
                            <div class="flex items-center justify-between text-sm">
                                <a href="#" id="createAccountLink" class="font-medium text-purple-600 hover:text-purple-700 transition-colors duration-200">
                                    ${t.createAccount} 🌟
                                </a>
                                <a href="#" id="forgotPasswordLink" class="font-medium text-purple-600 hover:text-purple-700 transition-colors duration-200">
                                    ${t.forgotPassword} 🔑
                                </a>
                            </div>
                        </form>
                        <div id="loginError" class="mt-4 text-red-600 text-sm hidden p-3 bg-red-50 rounded-lg border border-red-200"></div>
                    </div>
                </div>
            </div>
            
            <style>
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out;
                }
                
                .shadow-3xl {
                    box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
                }
            </style>
        `;

        document.getElementById('loginForm').addEventListener('submit', handleLogin);
        document.getElementById('createAccountLink').addEventListener('click', showCreateAccount);
        document.getElementById('forgotPasswordLink').addEventListener('click', showForgotPassword);
    }

    async function handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            const { data, error } = await window.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;
            
            appState.currentUser = data.user;
            showApp();
            await loadInitialData();
            showView('calendarView');
        } catch (error) {
            const errorDiv = document.getElementById('loginError');
            errorDiv.textContent = getTranslation("loginError");
            errorDiv.classList.remove('hidden');
        }
    }

    function showCreateAccount() {
        const t = getTranslations();
        
        // Adicionar animação de saída
        const currentContent = dom.loginView.querySelector('.animate-fade-in');
        if (currentContent) {
            currentContent.style.opacity = '0';
            currentContent.style.transform = 'translateX(-20px)';
            currentContent.style.transition = 'all 0.3s ease-out';
        }
        
        setTimeout(() => {
            dom.loginView.innerHTML = `
                <div class="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 overflow-hidden">
                    <!-- Background decorativo animado -->
                    <div class="absolute inset-0 overflow-hidden">
                        <div class="absolute top-1/4 right-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                        <div class="absolute bottom-3/4 left-1/4 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl animate-bounce"></div>
                        <div class="absolute top-1/4 left-1/3 w-80 h-80 bg-purple-300/15 rounded-full blur-3xl animate-pulse"></div>
                    </div>
                    
                    <!-- Container principal com animação de entrada -->
                    <div class="max-w-md w-full space-y-8 relative z-10 px-4 animate-slide-in">
                        <div class="text-center">
                            <div class="mb-6">
                                <div class="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
                                    <span class="text-3xl">🌟</span>
                                </div>
                            </div>
                            <h2 class="text-4xl font-bold text-white mb-2">${t.createAccount}</h2>
                            <p class="text-white/80 text-lg">Bem-vindo ao futuro do seu salão!</p>
                        </div>
                        
                        <!-- Card de registro com efeito de vidro -->
                        <div class="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-8 border border-white/20 transform transition-all duration-300 hover:shadow-3xl">
                            <form id="signupForm" class="space-y-6">
                                <div>
                                    <label for="name" class="block text-sm font-medium text-gray-700 mb-2">${t.name}</label>
                                    <div class="relative">
                                        <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">👤</span>
                                        <input id="name" name="name" type="text" required 
                                            class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                                            placeholder="Seu nome completo">
                                    </div>
                                </div>
                                <div>
                                    <label for="email" class="block text-sm font-medium text-gray-700 mb-2">${t.email}</label>
                                    <div class="relative">
                                        <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">📧</span>
                                        <input id="email" name="email" type="email" required 
                                            class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                                            placeholder="seu@email.com">
                                    </div>
                                </div>
                                <div>
                                    <label for="password" class="block text-sm font-medium text-gray-700 mb-2">${t.password}</label>
                                    <div class="relative">
                                        <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔒</span>
                                        <input id="password" name="password" type="password" required minlength="6"
                                            class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                                            placeholder="Mínimo 6 caracteres">
                                    </div>
                                </div>
                                <div>
                                    <button type="submit" 
                                        class="w-full py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform transition-all duration-200 hover:scale-105 active:scale-95">
                                        ${t.createAccount} 🚀
                                    </button>
                                </div>
                                <div class="text-sm text-center">
                                    <a href="#" id="backToLoginLink" class="font-medium text-purple-600 hover:text-purple-700 transition-colors duration-200">
                                        ← ${t.login}
                                    </a>
                                </div>
                            </form>
                            <div id="signupError" class="mt-4 text-red-600 text-sm hidden p-3 bg-red-50 rounded-lg border border-red-200"></div>
                        </div>
                    </div>
                </div>
                
                <style>
                    @keyframes slide-in {
                        from { opacity: 0; transform: translateX(20px); }
                        to { opacity: 1; transform: translateX(0); }
                    }
                    
                    .animate-slide-in {
                        animation: slide-in 0.6s ease-out;
                    }
                </style>
            `;
            
            document.getElementById('signupForm').addEventListener('submit', handleSignup);
            document.getElementById('backToLoginLink').addEventListener('click', (e) => {
                e.preventDefault();
                
                // Animação de saída
                const currentContent = dom.loginView.querySelector('.animate-slide-in');
                if (currentContent) {
                    currentContent.style.opacity = '0';
                    currentContent.style.transform = 'translateX(20px)';
                    currentContent.style.transition = 'all 0.3s ease-out';
                }
                
                setTimeout(() => {
                    renderLoginForm();
                }, 300);
            });
        }, 300);
    }

    async function handleSignup(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            const { user, session } = await auth.signUp(email, password, { name });
            
            if (user) {
                // Verificar se precisa de confirmação de email
                if (!session) {
                    // Email precisa ser confirmado
                    showEmailConfirmationMessage(email);
                    return;
                }
                
                // Se o usuário está logado, adicionar ao staff como manicurist (padrão)
                await db.addStaff({
                    name,
                    email,
                    role: 'manicurist', // Padrão para novos usuários
                    user_id: user.id
                });

                appState.currentUser = user;
                showApp();
                await loadInitialData();
                showView('calendarView');
            }
        } catch (error) {
            const errorDiv = document.getElementById('signupError');
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('hidden');
        }
    }

    function showEmailConfirmationMessage(email) {
        const t = getTranslations();
        
        dom.loginView.innerHTML = `
            <div class="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 overflow-hidden">
                <!-- Background decorativo animado -->
                <div class="absolute inset-0 overflow-hidden">
                    <div class="absolute top-1/4 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                    <div class="absolute top-3/4 right-1/4 w-96 h-96 bg-green-300/20 rounded-full blur-3xl animate-bounce"></div>
                    <div class="absolute bottom-1/4 left-1/3 w-80 h-80 bg-blue-300/15 rounded-full blur-3xl animate-pulse"></div>
                </div>
                
                <!-- Container principal -->
                <div class="max-w-md w-full space-y-8 relative z-10 px-4 animate-fade-in">
                    <div class="text-center">
                        <div class="mb-6">
                            <div class="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
                                <span class="text-3xl">📧</span>
                            </div>
                        </div>
                        <h2 class="text-4xl font-bold text-white mb-2">Confirme seu Email</h2>
                        <p class="text-white/80 text-lg">Quase pronto!</p>
                    </div>
                    
                    <!-- Card de confirmação -->
                    <div class="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-8 border border-white/20">
                        <div class="text-center space-y-4">
                            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span class="text-2xl">✉️</span>
                            </div>
                            
                            <h3 class="text-xl font-bold text-gray-800 mb-4">
                                Verifique seu Email
                            </h3>
                            
                            <p class="text-gray-600 mb-6">
                                Enviamos um link de confirmação para:
                                <br><strong class="text-blue-600">${email}</strong>
                            </p>
                            
                            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <p class="text-sm text-blue-800">
                                    <strong>📋 O que fazer agora:</strong><br>
                                    1. Abra seu email<br>
                                    2. Procure por uma mensagem do sistema<br>
                                    3. Clique no link "Confirmar Email"<br>
                                    4. Volte aqui e faça login
                                </p>
                            </div>
                            
                            <div class="space-y-3">
                                <button id="resendEmailBtn" 
                                    class="w-full py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-200 hover:scale-105">
                                    📨 Reenviar Email de Confirmação
                                </button>
                                
                                <button id="backToLoginFromConfirm" 
                                    class="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
                                    ← Voltar ao Login
                                </button>
                            </div>
                        </div>
                        
                        <div id="resendMessage" class="mt-4 text-sm hidden p-3 rounded-lg border"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Event listeners
        document.getElementById('resendEmailBtn').addEventListener('click', async () => {
            const btn = document.getElementById('resendEmailBtn');
            const messageDiv = document.getElementById('resendMessage');
            
            btn.disabled = true;
            btn.textContent = '📨 Enviando...';
            
            try {
                const { error } = await window.supabase.auth.resend({
                    type: 'signup',
                    email: email
                });
                
                if (error) throw error;
                
                messageDiv.className = 'mt-4 text-sm p-3 bg-green-50 rounded-lg border border-green-200 text-green-800';
                messageDiv.textContent = '✅ Email reenviado com sucesso! Verifique sua caixa de entrada.';
                messageDiv.classList.remove('hidden');
                
            } catch (error) {
                messageDiv.className = 'mt-4 text-sm p-3 bg-red-50 rounded-lg border border-red-200 text-red-800';
                messageDiv.textContent = '❌ Erro ao reenviar email: ' + error.message;
                messageDiv.classList.remove('hidden');
            }
            
            btn.disabled = false;
            btn.textContent = '📨 Reenviar Email de Confirmação';
        });
        
        document.getElementById('backToLoginFromConfirm').addEventListener('click', () => {
            renderLoginForm();
        });
    }

    function showForgotPassword() {
        const t = getTranslations();
        
        // Animação de saída para a tela atual
        const currentContent = dom.loginView.querySelector('.animate-fade-in');
        if (currentContent) {
            currentContent.style.opacity = '0';
            currentContent.style.transform = 'translateY(-20px)';
            currentContent.style.transition = 'all 0.3s ease-out';
        }
        
        setTimeout(() => {
            dom.loginView.innerHTML = `
                <div class="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-orange-600 via-red-600 to-pink-700 overflow-hidden">
                    <!-- Background decorativo animado -->
                    <div class="absolute inset-0 overflow-hidden">
                        <div class="absolute top-1/4 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                        <div class="absolute top-3/4 right-1/4 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl animate-bounce"></div>
                        <div class="absolute bottom-1/4 left-1/3 w-80 h-80 bg-red-300/15 rounded-full blur-3xl animate-pulse"></div>
                    </div>
                    
                    <!-- Container principal com animação de entrada -->
                    <div class="max-w-md w-full space-y-8 relative z-10 px-4 animate-slide-down">
                        <div class="text-center">
                            <div class="mb-6">
                                <div class="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
                                    <span class="text-3xl">🔑</span>
                                </div>
                            </div>
                            <h2 class="text-4xl font-bold text-white mb-2">${t.resetPassword}</h2>
                            <p class="text-white/80 text-lg">Vamos ajudar você a recuperar sua conta!</p>
                        </div>
                        
                        <!-- Card de reset com efeito de vidro -->
                        <div class="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-8 border border-white/20 transform transition-all duration-300 hover:shadow-3xl">
                            <form id="resetPasswordForm" class="space-y-6">
                                <div>
                                    <label for="resetEmail" class="block text-sm font-medium text-gray-700 mb-2">${t.email}</label>
                                    <div class="relative">
                                        <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">📧</span>
                                        <input id="resetEmail" name="email" type="email" required 
                                            class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                                            placeholder="Digite seu e-mail cadastrado">
                                    </div>
                                    <p class="mt-2 text-sm text-gray-600">Enviaremos um link para redefinir sua senha.</p>
                                </div>
                                <div>
                                    <button type="submit" 
                                        class="w-full py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transform transition-all duration-200 hover:scale-105 active:scale-95">
                                        ${t.sendResetEmail} 📨
                                    </button>
                                </div>
                                <div class="text-sm text-center">
                                    <a href="#" id="backToLoginFromReset" class="font-medium text-orange-600 hover:text-orange-700 transition-colors duration-200">
                                        ← ${t.backToLogin}
                                    </a>
                                </div>
                            </form>
                            <div id="resetMessage" class="mt-4 text-sm hidden p-3 rounded-lg border"></div>
                        </div>
                    </div>
                </div>
                
                <style>
                    @keyframes slide-down {
                        from { opacity: 0; transform: translateY(-20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    
                    .animate-slide-down {
                        animation: slide-down 0.6s ease-out;
                    }
                </style>
            `;
            
            document.getElementById('resetPasswordForm').addEventListener('submit', handlePasswordReset);
            document.getElementById('backToLoginFromReset').addEventListener('click', (e) => {
                e.preventDefault();
                
                // Animação de saída
                const currentContent = dom.loginView.querySelector('.animate-slide-down');
                if (currentContent) {
                    currentContent.style.opacity = '0';
                    currentContent.style.transform = 'translateY(-20px)';
                    currentContent.style.transition = 'all 0.3s ease-out';
                }
                
                setTimeout(() => {
                    renderLoginForm();
                }, 300);
            });
        }, 300);
    }

    async function handlePasswordReset(e) {
        e.preventDefault();
        const t = getTranslations();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const messageDiv = document.getElementById('resetMessage');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        submitBtn.disabled = true;
        submitBtn.textContent = '📨 Enviando...';

        try {
            await auth.resetPassword(email);
            
            messageDiv.className = 'mt-4 text-sm p-3 bg-green-50 rounded-lg border border-green-200 text-green-800';
            messageDiv.textContent = `✅ ${t.resetEmailSent}`;
            messageDiv.classList.remove('hidden');
            
            // Limpar o formulário
            e.target.reset();
            
        } catch (error) {
            console.error('Erro ao enviar reset:', error);
            messageDiv.className = 'mt-4 text-sm p-3 bg-red-50 rounded-lg border border-red-200 text-red-800';
            messageDiv.textContent = `❌ ${t.resetEmailError}`;
            messageDiv.classList.remove('hidden');
        }

        submitBtn.disabled = false;
        submitBtn.textContent = `${t.sendResetEmail} 📨`;
    }

    function showResetPasswordForm() {
        const t = getTranslations();
        
        dom.loginView.innerHTML = `
            <div class="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-green-600 via-teal-600 to-blue-700 overflow-hidden">
                <!-- Background decorativo animado -->
                <div class="absolute inset-0 overflow-hidden">
                    <div class="absolute top-1/4 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                    <div class="absolute top-3/4 right-1/4 w-96 h-96 bg-green-300/20 rounded-full blur-3xl animate-bounce"></div>
                    <div class="absolute bottom-1/4 left-1/3 w-80 h-80 bg-teal-300/15 rounded-full blur-3xl animate-pulse"></div>
                </div>
                
                <!-- Container principal com animação de entrada -->
                <div class="max-w-md w-full space-y-8 relative z-10 px-4 animate-fade-in">
                    <div class="text-center">
                        <div class="mb-6">
                            <div class="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
                                <span class="text-3xl">🔐</span>
                            </div>
                        </div>
                        <h2 class="text-4xl font-bold text-white mb-2">${t.resetPassword}</h2>
                        <p class="text-white/80 text-lg">Digite sua nova senha</p>
                    </div>
                    
                    <!-- Card de nova senha com efeito de vidro -->
                    <div class="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-8 border border-white/20 transform transition-all duration-300 hover:shadow-3xl">
                        <form id="newPasswordForm" class="space-y-6">
                            <div>
                                <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-2">${t.newPasswordLabel}</label>
                                <div class="relative">
                                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔒</span>
                                    <input id="newPassword" name="newPassword" type="password" required minlength="6"
                                        class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                        placeholder="Digite sua nova senha">
                                </div>
                            </div>
                            <div>
                                <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">${t.confirmNewPassword}</label>
                                <div class="relative">
                                    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔒</span>
                                    <input id="confirmPassword" name="confirmPassword" type="password" required minlength="6"
                                        class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                        placeholder="Confirme sua nova senha">
                                </div>
                            </div>
                            <div>
                                <button type="submit" 
                                    class="w-full py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transform transition-all duration-200 hover:scale-105 active:scale-95">
                                    ${t.updatePassword} 🔐
                                </button>
                            </div>
                        </form>
                        <div id="newPasswordMessage" class="mt-4 text-sm hidden p-3 rounded-lg border"></div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('newPasswordForm').addEventListener('submit', handleNewPassword);
    }

    async function handleNewPassword(e) {
        e.preventDefault();
        const t = getTranslations();
        const formData = new FormData(e.target);
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');
        const messageDiv = document.getElementById('newPasswordMessage');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        // Verificar se as senhas coincidem
        if (newPassword !== confirmPassword) {
            messageDiv.className = 'mt-4 text-sm p-3 bg-red-50 rounded-lg border border-red-200 text-red-800';
            messageDiv.textContent = `❌ ${t.passwordsNoMatch}`;
            messageDiv.classList.remove('hidden');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = '🔐 Atualizando...';

        try {
            await auth.updatePassword(newPassword);
            
            messageDiv.className = 'mt-4 text-sm p-3 bg-green-50 rounded-lg border border-green-200 text-green-800';
            messageDiv.textContent = `✅ ${t.passwordUpdated}`;
            messageDiv.classList.remove('hidden');
            
            // Limpar parâmetros da URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Redirecionar para o login após alguns segundos
            setTimeout(() => {
                renderLoginForm();
            }, 2000);
            
        } catch (error) {
            console.error('Erro ao atualizar senha:', error);
            messageDiv.className = 'mt-4 text-sm p-3 bg-red-50 rounded-lg border border-red-200 text-red-800';
            messageDiv.textContent = `❌ Erro ao atualizar senha: ${error.message}`;
            messageDiv.classList.remove('hidden');
        }

        submitBtn.disabled = false;
        submitBtn.textContent = `${t.updatePassword} 🔐`;
    }

    async function loadInitialData() {
        try {
            // Carregar dados do Supabase
            appState.clients = await db.getClients();
            appState.services = await db.getServices();
            appState.staff = await db.getStaff();
            appState.appointments = await db.getAppointments();
            
            // Tentar carregar solicitações - se a tabela não existir, apenas avisar no console
            try {
                appState.scheduleRequests = await db.getScheduleRequests();
                console.log('Solicitações carregadas:', appState.scheduleRequests.length);
            } catch (error) {
                console.warn('Tabela schedule_requests não encontrada. Execute o SQL em add-schedule-requests-table.sql para habilitar esta funcionalidade.');
                appState.scheduleRequests = [];
            }
            
            appState.products = await db.getProducts();
            
            console.log('Agendamentos carregados:', appState.appointments.length);
            console.log('Produtos carregados:', appState.products.length);
            
            // Se não houver dados, criar dados padrão
            if (appState.services.length === 0) {
                const defaultServices = [
                    { name: 'Manicure', duration: 30, price: 25.00 },
                    { name: 'Pedicure', duration: 45, price: 35.00 },
                    { name: 'Esmaltação', duration: 20, price: 15.00 }
                ];
                
                for (const service of defaultServices) {
                    try {
                        const newService = await db.addService(service);
                        appState.services.push(newService);
                    } catch (error) {
                        console.error('Erro ao criar serviço padrão:', error);
                    }
                }
            }
            
            // Inicializar melhorias após carregar dados
            initializeEnhancements();
            
            // Se não houver nenhum staff E o usuário atual não existe na tabela staff,
            // criar o primeiro usuário como admin (fundador do sistema)
            const currentUserInStaff = appState.staff.find(s => 
                s.user_id === appState.currentUser?.id || s.email === appState.currentUser?.email
            );
            
            if (appState.staff.length === 0 && appState.currentUser && !currentUserInStaff) {
                // Primeiro usuário do sistema será admin
                const adminStaff = {
                    name: appState.currentUser.user_metadata?.name || 
                          appState.currentUser.email?.split('@')[0] || 'Admin',
                    email: appState.currentUser.email,
                    role: 'admin',
                    user_id: appState.currentUser.id
                };
                
                try {
                    const newStaff = await db.addStaff(adminStaff);
                    appState.staff.push(newStaff);
                    console.log('Primeiro usuário criado como admin:', newStaff);
                } catch (error) {
                    console.error('Erro ao criar staff admin:', error);
                }
            } else if (appState.currentUser && !currentUserInStaff) {
                // Usuários subsequentes serão manicurists por padrão
                const manicuristStaff = {
                    name: appState.currentUser.user_metadata?.name || 
                          appState.currentUser.email?.split('@')[0] || 'Usuário',
                    email: appState.currentUser.email,
                    role: 'manicurist',
                    user_id: appState.currentUser.id
                };
                
                try {
                    const newStaff = await db.addStaff(manicuristStaff);
                    appState.staff.push(newStaff);
                    console.log('Novo usuário criado como manicurist:', newStaff);
                } catch (error) {
                    console.error('Erro ao criar staff manicurist:', error);
                }
            }
            
            // Processar agendamentos atrasados automaticamente
            await processOverdueAppointments();
            
            // Atualizar header com informações do funcionário
            updateHeaderStaffInfo();
            
            // Configurar verificação periódica (a cada 5 minutos)
            setInterval(async () => {
                await processOverdueAppointments();
                // Re-renderizar a view atual se for o calendário
                if (appState.currentView === 'calendarView') {
                    renderCalendar();
                }
            }, 5 * 60 * 1000); // 5 minutos
            
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
        }
    }

    function updateHeaderStaffInfo() {
        const t = getTranslations();
        const currentStaff = appState.staff.find(s => 
            s.user_id === appState.currentUser?.id || 
            s.email === appState.currentUser?.email
        );

        if (!currentStaff) return;

        // Atualizar avatar na sidebar (rodapé)
        const userAvatar = document.getElementById('userAvatarSidebar');
        if (userAvatar) {
            if (currentStaff.photo_url) {
                userAvatar.innerHTML = `<img src="${currentStaff.photo_url}" alt="${currentStaff.name}" class="w-full h-full object-cover">`;
                userAvatar.className = "w-12 h-12 rounded-full overflow-hidden mr-3 border-2 border-[var(--accent-primary)]";
            } else {
                const initial = currentStaff.name?.charAt(0).toUpperCase() || 'U';
                userAvatar.textContent = initial;
                userAvatar.className = "w-12 h-12 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white font-bold text-lg mr-3 overflow-hidden border-2 border-[var(--accent-primary)]";
            }
        }

        // Atualizar nome na sidebar
        const userName = document.getElementById('userNameSidebar');
        if (userName) {
            userName.textContent = currentStaff.name || 'Usuário';
        }

        // Atualizar cargo na sidebar
        const userRole = document.getElementById('userRoleSidebar');
        if (userRole) {
            const roleText = t[currentStaff.role] || currentStaff.role;
            userRole.textContent = roleText;
        }
        
        // Ocultar menu "Vendas" para manicures e cabeleireiras
        const productsNavItem = document.getElementById('productsNavItem');
        if (productsNavItem) {
            const canSeeProducts = isAdmin() || isReceptionist();
            productsNavItem.style.display = canSeeProducts ? 'block' : 'none';
        }

        // Ocultar menu "Meus Horários" para admin e recepcionista
        const myScheduleMenuItem = document.getElementById('myScheduleMenuItem');
        if (myScheduleMenuItem) {
            const canSeeMySchedule = !isAdmin() && !isReceptionist();
            myScheduleMenuItem.style.display = canSeeMySchedule ? 'block' : 'none';
        }
    }
    // Função para configurar permissões da interface baseado no cargo do usuário
    function setupUIPermissions() {
        const role = getUserRole();
        
        console.log('🔧 setupUIPermissions chamado');
        console.log('Role detectado:', role);
        console.log('isAdmin():', isAdmin());
        
        // ========== MENU SOLICITAÇÕES - APENAS ADMIN ==========
        const scheduleRequestsNavItem = document.getElementById('scheduleRequestsNavItem');
        console.log('📋 scheduleRequestsNavItem encontrado:', !!scheduleRequestsNavItem);
        
        if (scheduleRequestsNavItem) {
            if (isAdmin()) {
                console.log('✅ Admin detectado - mostrando menu Solicitações');
                scheduleRequestsNavItem.style.display = 'block';
                scheduleRequestsNavItem.style.visibility = 'visible';
                scheduleRequestsNavItem.classList.remove('hidden');
            } else {
                console.log('❌ Não é admin - ocultando menu Solicitações');
                scheduleRequestsNavItem.style.display = 'none';
                scheduleRequestsNavItem.style.visibility = 'hidden';
                scheduleRequestsNavItem.classList.add('hidden');
            }
        } else {
            console.error('❌ Elemento scheduleRequestsNavItem NÃO encontrado no HTML!');
        }
        
        // ========== MENU VENDAS - ADMIN E RECEPCIONISTA ==========
        const productsNavItem = document.getElementById('productsNavItem');
        if (productsNavItem) {
            if (isAdmin() || isReceptionist()) {
                productsNavItem.style.display = 'block';
            } else {
                productsNavItem.style.display = 'none';
            }
        }
        
        // ========== MENU RELATÓRIOS - ADMIN, MANICURE E CABELEIREIRA ==========
        const reportsNavItem = document.getElementById('reportsNavItem');
        if (reportsNavItem) {
            if (isAdmin() || isManicurist() || isHairdresser()) {
                reportsNavItem.style.display = 'block';
            } else {
                reportsNavItem.style.display = 'none';
            }
        }
        
        // ========== MENU FUNCIONÁRIOS - TODOS VEEM ==========
        const staffNavItem = document.getElementById('staffNavItem');
        if (staffNavItem) {
            staffNavItem.style.display = 'block'; // TODOS podem ver
        }
        
        // ========== MENU MEUS HORÁRIOS - MANICURE E CABELEIREIRA ==========
        const myScheduleMenuItem = document.getElementById('myScheduleMenuItem');
        if (myScheduleMenuItem) {
            if (isManicurist() || isHairdresser()) {
                myScheduleMenuItem.style.display = 'block';
            } else {
                myScheduleMenuItem.style.display = 'none';
                console.log('❌ Menu Meus Horários: ESCONDIDO');
            }
        }

        // ========== BOTÕES DE AÇÃO ==========
        const newClientBtn = document.getElementById('newClientBtn');
        if (newClientBtn) {
            newClientBtn.classList.toggle('hidden', !canEditClients());
        }

        const newServiceBtn = document.getElementById('newServiceBtn');
        if (newServiceBtn) {
            newServiceBtn.classList.toggle('hidden', !canEditServices());
        }

        const newAppointmentBtn = document.getElementById('newAppointmentBtn');
        if (newAppointmentBtn) {
            newAppointmentBtn.classList.toggle('hidden', !canCreateAppointments());
        }

        const newProductBtn = document.getElementById('newProductBtn');
        if (newProductBtn) {
            newProductBtn.classList.toggle('hidden', !isAdmin());
        }

        const newStaffBtn = document.getElementById('newStaffBtn');
        if (newStaffBtn) {
            newStaffBtn.classList.toggle('hidden', !canEditStaff());
        }

        // ========== BLOQUEIO DE ACESSO DIRETO ==========
        if (appState.currentView === 'scheduleRequestsView' && !isAdmin()) {
            showView('calendarView');
        }
    }

    function setupEventListeners() {
        dom.sidebarLinks.forEach(link => {
            link.addEventListener('click', handleNavigation);
        });

        // Adicionar event listener específico para o link de configurações
        const settingsLink = document.getElementById('settingsLink');
        if (settingsLink) {
            settingsLink.addEventListener('click', handleNavigation);
        }

        dom.newClientBtn.addEventListener('click', () => showClientModal());
        dom.newServiceBtn.addEventListener('click', () => showServiceModal());
        dom.newAppointmentBtn.addEventListener('click', () => showAppointmentModal());
        
        // Event listener para o botão de novo produto
        const newProductBtn = document.getElementById('newProductBtn');
        if (newProductBtn) {
            newProductBtn.addEventListener('click', () => showProductModal());
        }
        
        dom.logoutBtn.addEventListener('click', handleLogout);
        dom.clientSearch.addEventListener('input', handleClientSearch);

        auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                appState.currentUser = null;
                showLogin();
            }
        });
    }

    async function handleLogout() {
        try {
            await auth.signOut();
            showLogin();
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    }

    async function handleNavigation(e) {
        e.preventDefault();
        const viewName = e.target.closest('a').dataset.view;
        console.log('Navegando para:', viewName); // Debug
        if (viewName) {
            await showView(viewName);
        }
    }

    async function showView(viewName) {
        const views = ['calendarView', 'clientsView', 'servicesView', 'staffView', 'reportsView', 'productsView', 'scheduleRequestsView', 'settingsView', 'myScheduleView'];
        views.forEach(view => {
            const element = document.getElementById(view);
            if (element) element.classList.add('hidden');
        });

        const selectedView = document.getElementById(viewName);
        if (selectedView) {
            selectedView.classList.remove('hidden');
            appState.currentView = viewName;
        }

        // Atualizar links da sidebar
        dom.sidebarLinks.forEach(link => {
            link.classList.remove('bg-[var(--accent-light)]', 'text-[var(--accent-primary)]');
            if (link.dataset.view === viewName) {
                link.classList.add('bg-[var(--accent-light)]', 'text-[var(--accent-primary)]');
            }
        });

        // Também verificar o link de configurações separadamente
        const settingsLink = document.getElementById('settingsLink');
        if (settingsLink) {
            if (viewName === 'settingsView') {
                settingsLink.classList.add('bg-[var(--accent-light)]', 'text-[var(--accent-primary)]');
            } else {
                settingsLink.classList.remove('bg-[var(--accent-light)]', 'text-[var(--accent-primary)]');
            }
        }

        // Renderizar o conteúdo da view
        await renderViewContent(viewName);
        
        // Atualizar permissões da interface
        setupUIPermissions();
    }

    async function refreshCurrentView() {
        if (appState.currentView) {
            await renderViewContent(appState.currentView);
        }
    }

    async function renderViewContent(viewName) {
        switch (viewName) {
            case 'calendarView':
                renderCalendar();
                break;
            case 'clientsView':
                // Todos podem ver clientes (mas apenas admin/recepcionista podem editar)
                renderClients();
                break;
            case 'servicesView':
                // Todos podem ver serviços (mas apenas admin pode editar)
                renderServices();
                break;
            case 'staffView':
                // TODOS podem ver funcionários (mas apenas admin pode editar)
                renderStaff();
                break;
            case 'reportsView':
                // Apenas admin, manicure e cabeleireira podem ver relatórios
                if (!isAdmin() && !isManicurist() && !isHairdresser()) {
                    showNotification('Você não tem permissão para acessar esta seção', 'error');
                    showView('calendarView');
                    return;
                }
                await renderReports();
                break;
            case 'productsView':
                if (!canAccessSales()) {
                    showNotification('Você não tem permissão para acessar esta seção', 'error');
                    showView('calendarView');
                    return;
                }
                renderProducts();
                break;
            case 'scheduleRequestsView':
                // Apenas admin pode ver solicitações
                if (!isAdmin()) {
                    showNotification('Você não tem permissão para acessar esta seção', 'error');
                    showView('calendarView');
                    return;
                }
                renderScheduleRequests();
                break;
            case 'settingsView':
                renderSettings();
                break;
            case 'myScheduleView':
                renderMySchedule();
                break;
        }
    }

    function renderClients() {
        const t = getTranslations();
        const clientsView = document.getElementById('clientsView');
        
        if (!clientsView) return;

        // Calcular aniversariantes usando birthday_day e birthday_month
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth() + 1; // getMonth() retorna 0-11, mas salvamos 1-12
        
        const todayBirthdays = appState.clients.filter(c => {
            if (!c.birthday_day || !c.birthday_month) return false;
            return c.birthday_month === currentMonth && c.birthday_day === currentDay;
        });

        // Adicionar notificações para aniversariantes de hoje
        if (todayBirthdays.length > 0 && !window.birthdayNotificationsShown) {
            todayBirthdays.forEach(client => {
                window.addNotification(
                    `🎂 Aniversário de ${client.name}!`,
                    `Hoje é aniversário de ${client.name}. Que tal enviar uma mensagem especial?`,
                    '🎉',
                    'birthday'
                );
            });
            window.birthdayNotificationsShown = true;
        }

        const thisMonthBirthdays = appState.clients.filter(c => {
            if (!c.birthday_day || !c.birthday_month) return false;
            return c.birthday_month === currentMonth;
        }).sort((a, b) => a.birthday_day - b.birthday_day); // Ordenar por dia do mês

        // Seção de aniversariantes
        const birthdaysSection = `
            <div class="birthdays-section bg-[var(--bg-primary)] rounded-lg p-4 mb-6 border border-[var(--border-color)]">
                <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">🎂 ${t.birthdays || 'Aniversariantes'}</h3>
                
                ${todayBirthdays.length > 0 ? `
                    <div class="mb-4">
                        <h4 class="font-medium text-[var(--text-primary)] mb-2">🎉 ${t.todayBirthdays || 'Hoje'}:</h4>
                        <div class="space-y-2">
                            ${todayBirthdays.map(client => `
                                <div class="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border-l-4 border-yellow-400">
                                    <div class="flex items-center">
                                        <span class="text-2xl mr-3">🎂</span>
                                        <div>
                                            <span class="font-semibold text-[var(--text-primary)]">${client.name}</span>
                                            <p class="text-xs text-[var(--text-secondary)]">🎉 Parabéns! Hoje é aniversário!</p>
                                        </div>
                                    </div>
                                    <span class="text-sm text-[var(--text-secondary)]">${client.phone || client.email}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="mb-4 p-3 bg-[var(--bg-secondary)] rounded-lg text-center border border-[var(--border-color)]">
                        <p class="text-[var(--text-secondary)] text-sm">🎂 Nenhum aniversariante hoje</p>
                    </div>
                `}

                ${thisMonthBirthdays.length > 0 ? `
                    <div>
                        <h4 class="font-medium text-[var(--text-primary)] mb-2">📅 ${t.thisMonthBirthdays || 'Este Mês'}:</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                            ${thisMonthBirthdays.slice(0, 8).map(client => `
                                <div class="flex items-center justify-between p-2 bg-[var(--accent-light)] rounded text-sm border border-[var(--border-color)]">
                                    <span class="text-[var(--text-primary)]">${client.name}</span>
                                    <span class="text-[var(--text-secondary)]">Dia ${client.birthday_day}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="p-3 bg-[var(--bg-secondary)] rounded-lg text-center border border-[var(--border-color)]">
                        <p class="text-[var(--text-secondary)] text-sm">📅 Nenhum aniversariante este mês</p>
                        <p class="text-xs text-[var(--text-secondary)] mt-1">💡 Cadastre aniversários dos clientes para ver os alertas aqui</p>
                    </div>
                `}
            </div>
        `;

        // Remover seção de aniversariantes existente para evitar duplicação
        const existingBirthdaysSection = clientsView.querySelector('.birthdays-section');
        if (existingBirthdaysSection) {
            existingBirthdaysSection.remove();
        }
        
        // Encontrar o local correto para inserir a seção de aniversariantes
        const clientsContainer = clientsView.querySelector('.bg-\\[var\\(--bg-secondary\\)\\]');
        if (clientsContainer) {
            // Inserir antes do container da lista de clientes
            clientsContainer.insertAdjacentHTML('beforebegin', birthdaysSection);
        }
        
        if (!appState.clients.length) {
            dom.clientList.innerHTML = `<li class="p-4 text-center text-[var(--text-secondary)]">${t.noClientsFound}</li>`;
            return;
        }

        const canEdit = canEditClients();
        
        dom.clientList.innerHTML = appState.clients.map(client => {
            // Format birthday if available
            let birthdayText = '';
            if (client.birthday_day && client.birthday_month) {
                const monthNames = [
                    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                ];
                birthdayText = ` • Aniversário: ${client.birthday_day}/${monthNames[client.birthday_month - 1]}`;
            }
            
            return `
            <li class="p-4 hover:bg-[var(--accent-light)] flex justify-between items-center border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <div class="flex-1">
                    <div class="font-medium text-[var(--text-primary)]">${client.name}</div>
                    <div class="text-sm text-[var(--text-secondary)]">${client.phone || ''} ${client.email || ''}${birthdayText}</div>
                </div>
                <div class="flex space-x-2">
                    <button onclick="showClientHistory('${client.id}')" 
                        class="px-3 py-1 text-sm bg-[var(--accent-light)] text-[var(--accent-primary)] rounded hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] transition-colors"
                        title="Ver histórico de atendimentos">
                        📊 Histórico
                    </button>
                    ${canEdit ? `
                        <button onclick="editClient('${client.id}')" class="text-[var(--accent-primary)] hover:text-[var(--accent-secondary)]">${t.edit}</button>
                        <button onclick="deleteClient('${client.id}')" class="text-red-600 hover:text-red-800">${t.delete}</button>
                    ` : `
                        <div class="text-xs text-[var(--text-secondary)] px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded">
                            ${t.viewOnly || 'Somente visualização'}
                        </div>
                    `}
                </div>
            </li>`;
        }).join('');
    }

    function renderServices() {
        const t = getTranslations();
        
        if (!appState.services.length) {
            dom.serviceList.innerHTML = `<li class="p-4 text-center text-[var(--text-secondary)]">${t.noServicesFound}</li>`;
            return;
        }

        const canEdit = canEditServices();

        dom.serviceList.innerHTML = appState.services.map(service => `
            <li class="p-4 hover:bg-[var(--accent-light)] flex justify-between items-center border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <div>
                    <div class="font-medium text-[var(--text-primary)]">${service.name}</div>
                    <div class="text-sm text-[var(--text-secondary)]">${service.duration}min - R$ ${service.price ? service.price.toFixed(2) : '0.00'}</div>
                </div>
                ${canEdit ? `
                    <div class="flex space-x-2">
                        <button onclick="editService('${service.id}')" class="text-[var(--accent-primary)] hover:text-[var(--accent-secondary)]">${t.edit}</button>
                        <button onclick="deleteService('${service.id}')" class="text-red-600 hover:text-red-800">${t.delete}</button>
                    </div>
                ` : `
                    <div class="text-xs text-[var(--text-secondary)] px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded">
                        ${t.viewOnly || 'Somente visualização'}
                    </div>
                `}
            </li>
        `).join('');
    }

    function renderStaff() {
        const t = getTranslations();
        
        if (!appState.staff.length) {
            dom.staffList.innerHTML = `<li class="p-4 text-center text-[var(--text-secondary)]">${t.noStaffFound}</li>`;
            return;
        }
        
        const canEdit = canEditStaff();
        
        dom.staffList.innerHTML = appState.staff.map(staff => `
            <li class="p-4 hover:bg-[var(--accent-light)] border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <div class="flex flex-col space-y-4">
                    <!-- Cabeçalho com foto e informações básicas -->
                    <div class="flex justify-between items-start">
                        <div class="flex items-center space-x-3">
                            <div class="w-16 h-16 bg-[var(--accent-light)] rounded-full flex items-center justify-center overflow-hidden">
                                ${staff.photo_url ? 
                                    `<img src="${staff.photo_url}" alt="${staff.name}" class="w-full h-full object-cover">` :
                                    `<div class="w-16 h-16 bg-[var(--accent-primary)] rounded-full flex items-center justify-center text-2xl text-white font-semibold">
                                        ${staff.name.charAt(0).toUpperCase()}
                                    </div>`
                                }
                            </div>
                            <div>
                                <div class="font-medium text-[var(--text-primary)] text-lg">${staff.name}</div>
                                <div class="flex items-center space-x-2">
                                    <span class="text-sm px-2 py-1 rounded-full ${staff.role === 'admin' ? 'bg-purple-100 text-purple-800' : staff.role === 'receptionist' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">${t[staff.role] || staff.role}</span>
                                </div>
                            </div>
                        </div>
                        ${canEdit ? `
                            <div class="flex space-x-2">
                                <button onclick="editStaff('${staff.id}')" class="text-[var(--accent-primary)] hover:text-[var(--accent-secondary)]">${t.edit}</button>
                                ${staff.role !== 'admin' ? `<button onclick="deleteStaff('${staff.id}')" class="text-red-600 hover:text-red-800">${t.delete}</button>` : ''}
                            </div>
                        ` : `
                            <div class="text-xs text-[var(--text-secondary)] px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded">
                                ${t.viewOnly || 'Somente visualização'}
                            </div>
                        `}
                    </div>
                </div>
            </li>
        `).join('');
    }

    // Função para limpar horários customizados de dias anteriores (auto-reset do toggle de almoço)
    async function cleanOldDailySchedules(staffId) {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // Deletar todos os horários customizados de dias anteriores ao dia atual
            const { error } = await supabase
                .from('staff_daily_schedule')
                .delete()
                .eq('staff_id', staffId)
                .lt('date', today);
            
            if (error) throw error;
        } catch (error) {
            console.error('Erro ao limpar horários antigos:', error);
        }
    }

    async function renderMySchedule() {
        const t = getTranslations();
        const myScheduleView = document.getElementById('myScheduleView');
        
        if (!myScheduleView) return;

        // Buscar o funcionário atual
        const currentStaff = appState.staff.find(s => 
            s.user_id === appState.currentUser?.id || 
            s.email === appState.currentUser?.email
        );

        if (!currentStaff) {
            myScheduleView.innerHTML = `
                <div class="text-center p-8">
                    <p class="text-[var(--text-secondary)]">Você não está cadastrado como funcionário.</p>
                </div>
            `;
            return;
        }

        myScheduleView.innerHTML = `
            <div class="max-w-5xl mx-auto">
                <!-- Cabeçalho -->
                <div class="mb-6">
                    <div class="flex items-center space-x-4">
                        <div class="w-20 h-20 bg-[var(--accent-light)] rounded-full flex items-center justify-center overflow-hidden">
                            ${currentStaff.photo_url ? 
                                `<img src="${currentStaff.photo_url}" alt="${currentStaff.name}" class="w-full h-full object-cover">` :
                                `<div class="w-20 h-20 bg-[var(--accent-primary)] rounded-full flex items-center justify-center text-3xl text-white font-semibold">
                                    ${currentStaff.name.charAt(0).toUpperCase()}
                                </div>`
                            }
                        </div>
                        <div>
                            <h2 class="text-3xl font-bold text-[var(--text-primary)]">⏰ Meus Horários</h2>
                            <p class="text-[var(--text-secondary)]">Gerencie sua agenda de trabalho, ${currentStaff.name}</p>
                        </div>
                    </div>
                </div>

                <!-- Sistema de Abas -->
                <div class="mb-6">
                    <div class="border-b border-[var(--border-color)]">
                        <nav class="flex flex-wrap gap-2" aria-label="Tabs">
                            <button data-tab="horario-padrao" class="schedule-tab active px-5 py-3 text-sm font-medium border-b-2 border-[var(--accent-primary)] text-[var(--accent-primary)] flex items-center gap-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                Horário Padrão
                            </button>
                            <button data-tab="horario-almoco" class="schedule-tab px-5 py-3 text-sm font-medium border-b-2 border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)] flex items-center gap-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                                </svg>
                                Horário do Almoço
                            </button>
                            <button data-tab="customizar-dias" class="schedule-tab px-5 py-3 text-sm font-medium border-b-2 border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)] flex items-center gap-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                                Customizar Dias
                            </button>
                            <button data-tab="solicitar-folga" class="schedule-tab px-5 py-3 text-sm font-medium border-b-2 border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)] flex items-center gap-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                                </svg>
                                Solicitar Folga
                            </button>
                        </nav>
                    </div>
                </div>

                <!-- Conteúdo das Abas -->
                <div id="scheduleTabsContent">
                    <!-- Aba 1: Horário Padrão -->
                    <div data-tab-content="horario-padrao" class="schedule-tab-content">
                        <div class="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-6">
                            <h3 class="text-xl font-bold text-[var(--text-primary)] mb-6">⏱️ Horário Padrão da Semana</h3>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">🕔 Início do Expediente</label>
                                    <input type="time" id="defaultStartTime"
                                        class="block w-full px-4 py-3 text-lg border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                                        value="${currentStaff.defaultSchedule?.start_time || '08:00'}">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">🕔 Fim do Expediente</label>
                                    <input type="time" id="defaultEndTime"
                                        class="block w-full px-4 py-3 text-lg border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                                        value="${currentStaff.defaultSchedule?.end_time || '18:00'}">
                                </div>
                            </div>

                            <div class="flex justify-end">
                                <button onclick="saveMyDefaultWorkHours('${currentStaff.id}')"
                                    class="bg-[var(--accent-primary)] text-white py-3 px-6 rounded-lg hover:bg-[var(--accent-secondary)] flex items-center font-medium">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Salvar Horário Padrão
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Aba 2: Horário do Almoço -->
                    <div data-tab-content="horario-almoco" class="schedule-tab-content hidden">
                        <div class="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-6">
                            <div class="flex items-center justify-between mb-6">
                                <h3 class="text-xl font-bold text-[var(--text-primary)]">🍽️ Horário do Almoço</h3>
                                
                                <!-- Toggle para ativar/desativar almoço hoje -->
                                <div class="flex items-center gap-3">
                                    <span class="text-sm text-[var(--text-secondary)]" id="lunchStatusText">Almoço hoje: Ativo</span>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" id="lunchTodayToggle" class="sr-only peer" checked>
                                        <div class="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--accent-primary)]/25 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[var(--accent-primary)]"></div>
                                    </label>
                                </div>
                            </div>

                            <div id="lunchTimeInputs" class="space-y-6">
                                <div class="bg-[var(--accent-light)] border border-[var(--border-color)] rounded-lg p-4 mb-4">
                                    <p class="text-sm text-[var(--text-primary)]">
                                        <strong>💡 Dica:</strong> Use o toggle acima para desativar o almoço por hoje. O almoço será automaticamente reativado à meia-noite (00:00).
                                    </p>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">🕐 Início do Almoço</label>
                                        <input type="time" id="defaultLunchStart"
                                            class="block w-full px-4 py-3 text-lg border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                                            value="${currentStaff.default_lunch_start || '12:00'}">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">🕐 Fim do Almoço</label>
                                        <input type="time" id="defaultLunchEnd"
                                            class="block w-full px-4 py-3 text-lg border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                                            value="${currentStaff.default_lunch_end || '13:00'}">
                                    </div>
                                </div>

                                <div class="flex justify-end">
                                    <button onclick="saveMyLunchHours('${currentStaff.id}')"
                                        class="bg-[var(--accent-primary)] text-white py-3 px-6 rounded-lg hover:bg-[var(--accent-secondary)] flex items-center font-medium">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Salvar Horário de Almoço
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Aba 3: Customizar Dias -->
                    <div data-tab-content="customizar-dias" class="schedule-tab-content hidden">
                        <div class="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-6">
                            <h3 class="text-xl font-bold text-[var(--text-primary)] mb-4">📅 Customizar Dias Específicos</h3>
                            <p class="text-[var(--text-secondary)] mb-6">
                                Clique em qualquer dia do calendário para customizar o horário de trabalho.
                            </p>
                            <div id="myScheduleCalendar" class="bg-[var(--bg-primary)] rounded-lg p-4 border border-[var(--border-color)]">
                                <!-- Será preenchido dinamicamente -->
                            </div>
                        </div>
                    </div>

                    <!-- Aba 4: Solicitar Folga -->
                    <div data-tab-content="solicitar-folga" class="schedule-tab-content hidden">
                        <div class="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-6">
                            <h3 class="text-xl font-bold text-[var(--text-primary)] mb-4">🏖️ Solicitar Fechamento de Agenda</h3>
                            <p class="text-[var(--text-secondary)] mb-6">
                                Solicite o fechamento da sua agenda para um dia específico. O administrador será notificado.
                            </p>

                            <form id="requestDayOffForm" class="space-y-4">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">📅 Data da Folga</label>
                                        <input type="date" id="dayOffDate"
                                            min="${new Date(Date.now() + 86400000).toISOString().split('T')[0]}"
                                            required
                                            class="block w-full px-4 py-3 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">📝 Motivo</label>
                                        <select id="dayOffReason" required
                                            class="block w-full px-4 py-3 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]">
                                            <option value="">Selecione...</option>
                                            <option value="Consulta médica">Consulta médica</option>
                                            <option value="Assunto pessoal">Assunto pessoal</option>
                                            <option value="Viagem">Viagem</option>
                                            <option value="Outro">Outro</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">💬 Observações (opcional)</label>
                                    <textarea id="dayOffNotes" rows="3" placeholder="Detalhes adicionais..."
                                        class="block w-full px-4 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"></textarea>
                                </div>
                                <button type="submit" 
                                    class="w-full md:w-auto bg-[var(--accent-primary)] text-white py-3 px-6 rounded-lg hover:bg-[var(--accent-secondary)] flex items-center justify-center font-medium">
                                    <svg class="w-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                                    </svg>
                                    Enviar Solicitação
                                </button>
                            </form>

                            <div id="myDayOffRequests" class="mt-6 pt-6 border-t border-[var(--border-color)]">
                                <!-- Será preenchido dinamicamente -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Dicas -->
                <div class="mt-6 bg-[var(--accent-light)] border border-[var(--border-color)] rounded-lg p-4">
                    <h4 class="font-semibold text-[var(--text-primary)] mb-2 flex items-center">💡 Dicas</h4>
                    <ul class="text-sm text-[var(--text-primary)] space-y-1">
                        <li>• O <strong>Horário Padrão</strong> será aplicado todos os dias da semana</li>
                        <li>• Configure o <strong>Horário do Almoço</strong> que será usado diariamente</li>
                        <li>• Use <strong>Customizar Dias Específicos</strong> para alterar horários pontuais</li>
                        <li>• <strong>Solicitações de folga</strong> precisam ser aprovadas pelo administrador</li>
                    </ul>
                </div>
            </div>
        `;

        // Sistema de abas
        const tabs = myScheduleView.querySelectorAll('.schedule-tab');
        const tabContents = myScheduleView.querySelectorAll('.schedule-tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                // Remover active de todas as abas
                tabs.forEach(t => {
                    t.classList.remove('active', 'border-[var(--accent-primary)]', 'text-[var(--accent-primary)]');
                    t.classList.add('border-transparent', 'text-[var(--text-secondary)]');
                });
                
                // Ativar aba clicada
                tab.classList.add('active', 'border-[var(--accent-primary)]', 'text-[var(--accent-primary)]');
                tab.classList.remove('border-transparent', 'text-[var(--text-secondary)]');
                
                // Esconder todos os conteúdos
                tabContents.forEach(content => content.classList.add('hidden'));
                
                // Mostrar conteúdo da aba ativa
                const activeContent = myScheduleView.querySelector(`[data-tab-content="${targetTab}"]`);
                if (activeContent) activeContent.classList.remove('hidden');
            });
        });

        // ========== SISTEMA DE TOGGLE DE ALMOÇO ==========
        const lunchToggle = document.getElementById('lunchTodayToggle');
        const lunchStatusText = document.getElementById('lunchStatusText');
        const lunchTimeInputs = document.getElementById('lunchTimeInputs');
        
        if (lunchToggle && lunchStatusText) {
            // Verificar estado do almoço (prioridade: banco > localStorage)
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            
            // Verificar se o banco diz que está desativado hoje
            const isDisabledInDB = currentStaff.lunch_disabled_date === todayStr;
            
            // Verificar localStorage como fallback
            const lunchDisabledUntil = localStorage.getItem('lunchDisabledUntil_' + currentStaff.id);
            let isDisabledInLocalStorage = false;
            
            if (lunchDisabledUntil) {
                const disabledDate = new Date(lunchDisabledUntil);
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const savedDay = new Date(disabledDate.getFullYear(), disabledDate.getMonth(), disabledDate.getDate());
                
                if (today.getTime() === savedDay.getTime()) {
                    isDisabledInLocalStorage = true;
                } else {
                    // Data diferente, limpar localStorage
                    localStorage.removeItem('lunchDisabledUntil_' + currentStaff.id);
                }
            }
            
            // Determinar estado final (prioridade ao banco)
            const isLunchDisabled = isDisabledInDB || isDisabledInLocalStorage;
            lunchToggle.checked = !isLunchDisabled;
            
            // Atualizar UI com base no estado do toggle
            function updateLunchToggleUI() {
                if (lunchToggle.checked) {
                    lunchStatusText.textContent = 'Almoço hoje: Ativo';
                    lunchStatusText.classList.remove('text-orange-600', 'dark:text-orange-400');
                    lunchStatusText.classList.add('text-green-600', 'dark:text-green-400');
                } else {
                    lunchStatusText.textContent = 'Almoço hoje: Desativado';
                    lunchStatusText.classList.remove('text-green-600', 'dark:text-green-400');
                    lunchStatusText.classList.add('text-orange-600', 'dark:text-orange-400');
                }
            }
            
            // Inicializar UI
            updateLunchToggleUI();
            
            // Event listener para mudanças no toggle
            lunchToggle.addEventListener('change', async () => {
                updateLunchToggleUI();
                
                if (!lunchToggle.checked) {
                    // Desativado - salvar no banco E localStorage (fallback)
                    const now = new Date();
                    localStorage.setItem('lunchDisabledUntil_' + currentStaff.id, now.toISOString());
                    
                    // Salvar no banco
                    try {
                        const { error } = await supabase
                            .from('staff')
                            .update({ lunch_disabled_date: now.toISOString().split('T')[0] })
                            .eq('id', currentStaff.id);
                        
                        if (error) throw error;
                        
                        // Atualizar estado local
                        currentStaff.lunch_disabled_date = now.toISOString().split('T')[0];
                        const staffIndex = appState.staff.findIndex(s => s.id === currentStaff.id);
                        if (staffIndex !== -1) {
                            appState.staff[staffIndex].lunch_disabled_date = now.toISOString().split('T')[0];
                        }
                        
                        showNotification('⏸️ Almoço desativado para hoje. Será reativado automaticamente à meia-noite.', 'info');
                    } catch (error) {
                        console.error('Erro ao salvar estado do almoço:', error);
                        console.error('Detalhes do erro:', error.message, error.details, error.hint);
                        showNotification('❌ Erro ao salvar estado do almoço: ' + (error.message || 'Verifique se executou a migration'), 'error');
                    }
                } else {
                    // Reativado manualmente - limpar banco E localStorage
                    localStorage.removeItem('lunchDisabledUntil_' + currentStaff.id);
                    
                    try {
                        const { error } = await supabase
                            .from('staff')
                            .update({ lunch_disabled_date: null })
                            .eq('id', currentStaff.id);
                        
                        if (error) throw error;
                        
                        // Atualizar estado local
                        currentStaff.lunch_disabled_date = null;
                        const staffIndex = appState.staff.findIndex(s => s.id === currentStaff.id);
                        if (staffIndex !== -1) {
                            appState.staff[staffIndex].lunch_disabled_date = null;
                        }
                        
                        showNotification('✅ Almoço reativado!', 'success');
                    } catch (error) {
                        console.error('Erro ao salvar estado do almoço:', error);
                        console.error('Detalhes do erro:', error.message, error.details, error.hint);
                        showNotification('❌ Erro ao salvar estado do almoço: ' + (error.message || 'Verifique se executou a migration'), 'error');
                    }
                }
            });
            
            // Verificar a cada minuto se é meia-noite para resetar
            setInterval(async () => {
                const now = new Date();
                const hours = now.getHours();
                const minutes = now.getMinutes();
                
                // Se é exatamente 00:00
                if (hours === 0 && minutes === 0) {
                    const wasDisabled = !lunchToggle.checked;
                    
                    // Resetar toggle
                    lunchToggle.checked = true;
                    localStorage.removeItem('lunchDisabledUntil_' + currentStaff.id);
                    updateLunchToggleUI();
                    
                    // Limpar do banco também
                    try {
                        await supabase
                            .from('staff')
                            .update({ lunch_disabled_date: null })
                            .eq('id', currentStaff.id);
                        
                        // Atualizar estado local
                        currentStaff.lunch_disabled_date = null;
                        const staffIndex = appState.staff.findIndex(s => s.id === currentStaff.id);
                        if (staffIndex !== -1) {
                            appState.staff[staffIndex].lunch_disabled_date = null;
                        }
                    } catch (error) {
                        console.error('Erro ao resetar almoço à meia-noite:', error);
                    }
                    
                    if (wasDisabled) {
                        showNotification('🌅 Novo dia! Almoço foi reativado automaticamente.', 'info');
                    }
                }
            }, 60000); // Verificar a cada 1 minuto
        }

        // Renderizar calendário de customização
        renderMyScheduleCalendar(currentStaff);
        
        // Renderizar solicitações de folga
        renderMyDayOffRequests(currentStaff);
        
        // Event listener para formulário de solicitação
        setupDayOffRequestForm(currentStaff);
    }

    // Função para renderizar o mini calendário em "Meus Horários"
    async function renderMyScheduleCalendar(staff) {
        const calendarContainer = document.getElementById('myScheduleCalendar');
        if (!calendarContainer) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Zerar horas para comparação correta
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Buscar horários customizados do mês
        let customSchedules = {};
        try {
            const schedules = await db.getStaffScheduleForMonth(staff.id, currentYear, currentMonth + 1);
            schedules.forEach(schedule => {
                customSchedules[schedule.date] = schedule;
            });
        } catch (error) {
            console.error('Erro ao buscar horários:', error);
        }

        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const firstDayOfWeek = firstDay.getDay();
        const totalDays = lastDay.getDate();

        const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const userIsAdmin = isAdmin();

        let html = `
            <div class="mb-4 flex items-center justify-between">
                <h4 class="font-semibold text-[var(--text-primary)]">
                    ${today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h4>
                <div class="text-xs text-[var(--text-secondary)]">
                    <span class="inline-flex items-center mr-3">⏰ = Horário customizado</span>
                    <span class="inline-flex items-center">🔒 = Folga (apenas admin edita)</span>
                </div>
            </div>
            <div class="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[var(--text-secondary)] mb-2">
                ${weekdays.map(day => `<div class="p-1">${day}</div>`).join('')}
            </div>
            <div class="grid grid-cols-7 gap-1">
        `;

        // Células vazias
        for (let i = 0; i < firstDayOfWeek; i++) {
            html += '<div class="aspect-square"></div>';
        }

        // Dias do mês
        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayDate = new Date(dateStr + 'T00:00:00');
            dayDate.setHours(0, 0, 0, 0);
            
            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            const customSchedule = customSchedules[dateStr];
            const isDayOff = customSchedule?.is_day_off === true;
            
            // ✅ NOVA LÓGICA: Dia atual pode ser editado! Apenas dias ANTERIORES são bloqueados
            const isPast = dayDate < today;
            
            // Funcionárias não podem clicar em folgas (mas admin pode)
            const isClickDisabled = isPast || (isDayOff && !userIsAdmin);

            html += `
                <button 
                    onclick="showDayScheduleModal('${dateStr}')"
                    class="aspect-square p-1 rounded-lg border transition-all relative ${
                        isClickDisabled ? 'cursor-not-allowed opacity-50' :
                        'hover:shadow-md cursor-pointer'
                    } ${
                        isPast ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800' :
                        isDayOff ? 'bg-red-50 dark:bg-red-900/20 border-red-300 hover:bg-red-100' :
                        customSchedule ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 hover:bg-blue-100' :
                        isToday ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] hover:bg-[var(--accent-secondary)]' :
                        'border-[var(--border-color)] hover:bg-[var(--accent-light)]'
                    }"
                    ${isClickDisabled ? 'disabled' : ''}
                    title="${
                        isPast ? 'Dia já passou' :
                        isDayOff ? (userIsAdmin ? 'Folga - Clique para editar' : 'Folga - Apenas admin pode editar') :
                        customSchedule ? 'Horário customizado - Clique para editar' :
                        isToday ? 'Hoje - Clique para customizar' :
                        'Clique para customizar horário'
                    }">
                    <div class="text-xs font-medium ${isToday && !customSchedule ? 'text-white' : ''}">${day}</div>
                    ${customSchedule ? `
                        <div class="absolute top-0 right-0 text-xs">
                            ${isDayOff ? '🔒' : '⏰'}
                        </div>
                    ` : ''}
                </button>
            `;
        }

        html += '</div>';
        calendarContainer.innerHTML = html;
    }

    // Função para renderizar solicitações de folga do funcionário
    async function renderMyDayOffRequests(staff) {
        const container = document.getElementById('myDayOffRequests');
        if (!container) return;

        // Buscar solicitações do funcionário
        const requests = appState.scheduleRequests?.filter(r => r.staff_id === staff.id) || [];
        
        if (requests.length === 0) {
            container.innerHTML = `
                <div class="text-center py-6 text-[var(--text-secondary)]">
                    <div class="text-4xl mb-2">📭</div>
                    <p class="text-sm">Nenhuma solicitação enviada</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <h4 class="font-semibold text-[var(--text-primary)] mb-4">Minhas Solicitações</h4>
            <div class="space-y-3">
                ${requests.map(request => `
                    <div class="p-4 rounded-lg border ${
                        request.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
                        request.status === 'approved' ? 'bg-green-50 border-green-200' :
                        'bg-red-50 border-red-200'
                    }">
                        <div class="flex justify-between items-start mb-2">
                            <div class="flex items-center space-x-2">
                                <span class="font-medium ${
                                    request.status === 'pending' ? 'text-yellow-900' :
                                    request.status === 'approved' ? 'text-green-900' :
                                    'text-red-900'
                                }">
                                    ${new Date(request.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                                </span>
                                <span class="px-2 py-1 rounded-full text-xs font-semibold ${
                                    request.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                                    request.status === 'approved' ? 'bg-green-200 text-green-800' :
                                    'bg-red-200 text-red-800'
                                }">
                                    ${request.status === 'pending' ? '⏳ Pendente' :
                                      request.status === 'approved' ? '✅ Aprovada' : '❌ Rejeitada'}
                                </span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <span class="text-xs text-[var(--text-secondary)]">
                                    ${new Date(request.created_at).toLocaleDateString('pt-BR')}
                                </span>
                                ${request.status === 'pending' ? `
                                    <button onclick="cancelScheduleRequest('${request.id}')" 
                                        class="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                                        title="Cancelar solicitação">
                                        🗑️ Cancelar
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <p class="text-sm ${
                            request.status === 'pending' ? 'text-yellow-700' :
                            request.status === 'approved' ? 'text-green-700' :
                            'text-red-700'
                        }">
                            <strong>Motivo:</strong> ${request.reason}
                        </p>
                        ${request.notes ? `
                            <p class="text-xs mt-1 ${
                                request.status === 'pending' ? 'text-yellow-600' :
                                request.status === 'approved' ? 'text-green-600' :
                                'text-red-600'
                            }">
                                ${request.notes}
                            </p>
                        ` : ''}
                        ${request.admin_notes ? `
                            <p class="text-xs mt-2 p-2 bg-white rounded border ${
                                request.status === 'approved' ? 'border-green-300' : 'border-red-300'
                            }">
                                <strong>Resposta do Admin:</strong> ${request.admin_notes}
                            </p>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Configurar formulário de solicitação de folga
    function setupDayOffRequestForm(staff) {
        const form = document.getElementById('requestDayOffForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const date = document.getElementById('dayOffDate').value;
            const reason = document.getElementById('dayOffReason').value;
            const notes = document.getElementById('dayOffNotes').value;

            if (!date || !reason) {
                showNotification('Preencha todos os campos obrigatórios', 'error');
                return;
            }

            // CORREÇÃO: Verificar se já existe QUALQUER solicitação pendente (não só para esta data)
            const hasPendingRequest = appState.scheduleRequests?.some(r => 
                r.staff_id === staff.id && 
                r.status === 'pending'
            );

            if (hasPendingRequest) {
                showNotification('❌ Você já possui uma solicitação pendente. Aguarde a resposta do administrador ou cancele a solicitação anterior.', 'error');
                return;
            }

            try {
                // Criar solicitação
                const requestData = {
                    staff_id: staff.id,
                    date: date,
                    reason: reason,
                    notes: notes,
                    status: 'pending'
                };

                // Salvar no banco (assumindo que temos essa função)
                const newRequest = await db.addScheduleRequest(requestData);
                
                if (!appState.scheduleRequests) {
                    appState.scheduleRequests = [];
                }
                appState.scheduleRequests.push(newRequest);

                // Enviar notificação para TODOS admin e recepcionistas
                await sendDayOffNotification(staff, date, reason);

                // Limpar formulário
                form.reset();
                
                // Atualizar lista
                renderMyDayOffRequests(staff);
                
                showNotification('✅ Solicitação enviada! Aguarde aprovação do administrador.');
            } catch (error) {
                console.error('Erro ao enviar solicitação:', error);
                
                // Verificar se o erro é sobre a tabela não existir
                if (error.message.includes('schedule_requests') || error.message.includes('table') || error.message.includes('schema')) {
                    showNotification('⚠️ A funcionalidade de solicitações ainda não está configurada no banco de dados. Contate o administrador do sistema.', 'error');
                } else {
                    showNotification('❌ Erro ao enviar solicitação: ' + error.message, 'error');
                }
            }
        });
    }

    // Enviar notificação de solicitação de folga
    async function sendDayOffNotification(staff, date, reason) {
        const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
        const title = 'Nova Solicitação de Folga';
        const message = `${staff.name} solicitou fechamento de agenda para ${formattedDate}. Motivo: ${reason}`;

        // Buscar TODOS os usuários admin e recepcionistas
        const adminStaff = appState.staff.filter(s => s.role === 'admin' || s.role === 'receptionist');
        
        console.log('📧 Enviando notificação para admins/recepcionistas:', adminStaff.length);

        // Adicionar notificação no sino para cada admin/recepcionista
        if (window.addNotification) {
            adminStaff.forEach(admin => {
                // Se for o usuário atual E for admin/recepcionista, adicionar notificação
                if (admin.user_id === appState.currentUser?.id || admin.email === appState.currentUser?.email) {
                    window.addNotification(
                        title,
                        message,
                        '📅',
                        'info'
                    );
                    console.log('✅ Notificação adicionada ao sino para:', admin.name);
                }
            });
        }

        // Usar o NotificationManager para mostrar notificação do navegador
        if (window.NotificationManager) {
            try {
                // Verificar se o usuário atual é admin/recepcionista antes de mostrar notificação
                const isCurrentUserAdmin = adminStaff.some(admin => 
                    admin.user_id === appState.currentUser?.id || 
                    admin.email === appState.currentUser?.email
                );
                
                if (isCurrentUserAdmin) {
                    window.NotificationManager.notifyAdmin(
                        'Nova Solicitação de Folga',
                        message,
                        'info'
                    );
                    console.log('✅ Notificação do navegador enviada');
                }
            } catch (error) {
                console.error('Erro ao enviar notificação via NotificationManager:', error);
            }
        }

        // Fallback: Notificação do navegador se permitido
        const isCurrentUserAdmin = adminStaff.some(admin => 
            admin.user_id === appState.currentUser?.id || 
            admin.email === appState.currentUser?.email
        );
        
        if (isCurrentUserAdmin && 'Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification(title, {
                    body: message,
                    icon: '/assets/icon/favicon.ico',
                    badge: '/assets/icon/favicon.ico'
                });
                console.log('✅ Notificação nativa do navegador mostrada');
            } catch (error) {
                console.error('Erro ao mostrar notificação do navegador:', error);
            }
        }
    }

    // Função global para cancelar solicitação pendente
    window.cancelScheduleRequest = async function(requestId) {
        const confirmed = await showConfirm(
            'Esta solicitação de alteração de horário será cancelada.',
            'Cancelar Solicitação',
            {
                confirmText: 'Sim, Cancelar',
                cancelText: 'Não',
                type: 'warning',
                icon: '⚠️'
            }
        );
        
        if (!confirmed) {
            return;
        }

        try {
            await db.deleteScheduleRequest(requestId);
            
            // Remover do estado local
            const index = appState.scheduleRequests.findIndex(r => r.id === requestId);
            if (index !== -1) {
                appState.scheduleRequests.splice(index, 1);
            }

            showNotification('✅ Solicitação cancelada com sucesso!');
            
            // Atualizar visualização
            const currentStaff = appState.staff.find(s => 
                s.user_id === appState.currentUser?.id || 
                s.email === appState.currentUser?.email
            );
            if (currentStaff) {
                renderMyDayOffRequests(currentStaff);
            }
        } catch (error) {
            console.error('Erro ao cancelar solicitação:', error);
            showNotification('❌ Erro ao cancelar solicitação: ' + error.message, 'error');
        }
    };

    // Função global para aprovar solicitação (apenas admin)
    window.approveScheduleRequest = async function(requestId) {
        if (!isAdmin()) {
            showNotification('❌ Apenas administradores podem aprovar solicitações', 'error');
            return;
        }

        const request = appState.scheduleRequests.find(r => r.id === requestId);
        if (!request) {
            showNotification('❌ Solicitação não encontrada', 'error');
            return;
        }

        try {
            // Atualizar status da solicitação
            await db.updateScheduleRequest(requestId, { 
                status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: appState.currentUser.id
            });

            // Criar bloqueio de dia (marcar como dia de folga)
            const dayOffData = {
                staff_id: request.staff_id,
                date: request.date,
                is_day_off: true,
                notes: `Solicitação aprovada: ${request.reason}`
            };

            await db.setDailySchedule(dayOffData);

            // Atualizar estado local
            const index = appState.scheduleRequests.findIndex(r => r.id === requestId);
            if (index !== -1) {
                appState.scheduleRequests[index].status = 'approved';
            }

            showNotification('✅ Solicitação aprovada! O dia foi bloqueado no calendário.');
            renderScheduleRequests();
            
            // Recarregar calendário se estiver visível
            if (appState.currentView === 'calendarView') {
                renderCalendar();
            }
        } catch (error) {
            console.error('Erro ao aprovar solicitação:', error);
            showNotification('❌ Erro ao aprovar solicitação: ' + error.message, 'error');
        }
    };

    // Função global para rejeitar solicitação (apenas admin)
    window.rejectScheduleRequest = async function(requestId) {
        if (!isAdmin()) {
            showNotification('❌ Apenas administradores podem rejeitar solicitações', 'error');
            return;
        }

        const adminNotes = prompt('Motivo da rejeição (opcional):');
        
        try {
            // Atualizar status da solicitação
            await db.updateScheduleRequest(requestId, { 
                status: 'rejected',
                rejected_at: new Date().toISOString(),
                rejected_by: appState.currentUser.id,
                admin_notes: adminNotes || 'Rejeitado pelo administrador'
            });

            // Atualizar estado local
            const index = appState.scheduleRequests.findIndex(r => r.id === requestId);
            if (index !== -1) {
                appState.scheduleRequests[index].status = 'rejected';
                appState.scheduleRequests[index].admin_notes = adminNotes || 'Rejeitado pelo administrador';
            }

            showNotification('✅ Solicitação rejeitada.');
            renderScheduleRequests();
        } catch (error) {
            console.error('Erro ao rejeitar solicitação:', error);
            showNotification('❌ Erro ao rejeitar solicitação: ' + error.message, 'error');
        }
    };

    function renderProducts() {
        // Verificação de permissão - Admin e Recepcionista
        if (!canAccessSales()) {
            console.warn('Acesso negado: renderProducts');
            showNotification('Você não tem permissão para acessar vendas', 'error');
            return;
        }
        
        const t = getTranslations();
        const productList = document.getElementById('productList');
        
        if (!productList) return;

        // Verificar se o usuário tem permissão (apenas admin e recepcionista)
        if (!isAdmin() && !isReceptionist()) {
            productList.innerHTML = `
                <div class="col-span-full p-8 text-center bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
                    <div class="mb-4 text-4xl">🔒</div>
                    <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-2">${t.restrictedAccess || 'Acesso Restrito'}</h3>
                    <p class="text-[var(--text-secondary)]">Apenas administradores e recepcionistas podem gerenciar produtos.</p>
                </div>
            `;
            
            // Esconder botão de novo produto
            const newProductBtn = document.getElementById('newProductBtn');
            if (newProductBtn) newProductBtn.style.display = 'none';
            return;
        }

        // Mostrar botão de novo produto APENAS para admin
        const newProductBtn = document.getElementById('newProductBtn');
        if (newProductBtn) {
            newProductBtn.style.display = isAdmin() ? 'flex' : 'none';
        }

        // Por enquanto, lista vazia (vamos adicionar produtos do banco depois)
        if (!appState.products || appState.products.length === 0) {
            productList.innerHTML = `
                <div class="col-span-full p-12 text-center bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
                    <div class="mb-4 text-6xl">📦</div>
                    <p class="text-lg font-medium text-[var(--text-primary)] mb-2">${t.noProductsFound || 'Nenhum produto encontrado.'}</p>
                    <p class="text-sm text-[var(--text-secondary)]">Clique em "Novo Produto" para adicionar produtos ao estoque.</p>
                </div>
            `;
            return;
        }

        productList.innerHTML = appState.products.map(product => `
            <div class="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <!-- Foto do Produto -->
                <div class="relative bg-[var(--accent-light)] aspect-square overflow-hidden group">
                    ${product.photo_url ? 
                        `<img src="${product.photo_url}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">` :
                        `<div class="w-full h-full flex items-center justify-center">
                            <span class="text-6xl opacity-30">📦</span>
                         </div>`
                    }
                    <!-- Badge de Estoque -->
                    <div class="absolute top-3 left-3">
                        <div class="px-3 py-1 rounded-full text-xs font-semibold ${
                            product.stock > 10 ? 'bg-green-500 text-white' : 
                            product.stock > 0 ? 'bg-yellow-500 text-white' : 
                            'bg-red-500 text-white'
                        }">
                            ${product.stock > 10 ? '✓ Em estoque' : product.stock > 0 ? '⚠ Pouco estoque' : '✗ Sem estoque'}
                        </div>
                    </div>
                    <!-- Botões de Ação (APENAS para Admin) -->
                    ${isAdmin() ? `
                    <div class="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="editProduct('${product.id}')" 
                            class="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-[var(--accent-primary)] hover:text-white transition-colors"
                            title="${t.edit}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button onclick="deleteProduct('${product.id}')" 
                            class="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-500 hover:text-white transition-colors"
                            title="${t.delete}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                    ` : ''}
                </div>
                
                <!-- Informações do Produto -->
                <div class="p-4">
                    <h3 class="font-semibold text-[var(--text-primary)] mb-1 line-clamp-2 min-h-[3rem]" title="${product.name}">
                        ${product.name}
                    </h3>
                    <p class="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2 min-h-[2.5rem]">
                        ${product.description || 'Sem descrição'}
                    </p>
                    
                    <!-- Preço e Estoque -->
                    <div class="flex items-end justify-between border-t border-[var(--border-color)] pt-3">
                        <div>
                            <div class="text-2xl font-bold text-[var(--accent-primary)]">
                                R$ ${product.price ? product.price.toFixed(2) : '0.00'}
                            </div>
                            <div class="text-xs text-[var(--text-secondary)] mt-1">
                                📦 ${product.stock || 0} ${product.stock === 1 ? 'unidade' : 'unidades'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function renderCalendar() {
        updateCurrentDate();
        updateCalendarViewToggle();

        // Configurar event listeners para navegação do calendário
        setupCalendarNavigation();

        switch (appState.calendarViewType) {
            case 'month':
                renderMonthView(); // Agora é async, mas não precisa de await aqui
                break;
            case 'week':
                renderWeekView();
                break;
            case 'day':
                renderDayView();
                break;
        }
    }

    function updateCalendarViewToggle() {
        dom.calendarViewToggles.forEach(btn => {
            const isSelected = btn.dataset.viewType === appState.calendarViewType;
            btn.classList.toggle('bg-[var(--accent-primary)]', isSelected);
            btn.classList.toggle('text-white', isSelected);
            btn.classList.toggle('text-[var(--text-secondary)]', !isSelected);
        });
    }

    function setupCalendarNavigation() {
        if (dom.prevPeriodBtn) {
            dom.prevPeriodBtn.onclick = () => {
                switch (appState.calendarViewType) {
                    case 'month':
                        appState.currentDate.setMonth(appState.currentDate.getMonth() - 1);
                        break;
                    case 'week':
                        appState.currentDate.setDate(appState.currentDate.getDate() - 7);
                        break;
                    case 'day':
                        appState.currentDate.setDate(appState.currentDate.getDate() - 1);
                        break;
                }
                renderCalendar();
            };
        }

        if (dom.nextPeriodBtn) {
            dom.nextPeriodBtn.onclick = () => {
                switch (appState.calendarViewType) {
                    case 'month':
                        appState.currentDate.setMonth(appState.currentDate.getMonth() + 1);
                        break;
                    case 'week':
                        appState.currentDate.setDate(appState.currentDate.getDate() + 7);
                        break;
                    case 'day':
                        appState.currentDate.setDate(appState.currentDate.getDate() + 1);
                        break;
                }
                renderCalendar();
            };
        }

        if (dom.todayBtn) {
            dom.todayBtn.onclick = () => {
                appState.currentDate = new Date();
                renderCalendar();
            };
        }

        dom.calendarViewToggles.forEach(btn => {
            btn.onclick = () => {
                appState.calendarViewType = btn.dataset.viewType;
                renderCalendar();
            };
        });
    }

    async function renderMonthView() {
        const d = appState.currentDate;
        const year = d.getFullYear();
        const month = d.getMonth();
        const today = new Date();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const firstDayOfWeek = firstDayOfMonth.getDay();
        const totalDays = lastDayOfMonth.getDate();

        const weekdays = getTranslation('shortWeekdays') || ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        // Buscar funcionário atual
        const currentStaff = appState.staff.find(s => 
            s.user_id === appState.currentUser?.id || 
            s.email === appState.currentUser?.email
        );
        
        // CORREÇÃO: Determinar qual staff usar para buscar horários customizados
        // Se admin/recepcionista selecionou um staff específico, usar esse
        // Caso contrário, usar o staff do usuário logado
        let targetStaff = currentStaff;
        if (appState.selectedManicuristId && appState.selectedManicuristId !== 'all') {
            const selectedStaff = appState.staff.find(s => s.id === appState.selectedManicuristId);
            if (selectedStaff) {
                targetStaff = selectedStaff;
            }
        }
        
        // Buscar horários customizados do mês para o funcionário alvo
        let customSchedules = {};
        if (targetStaff) {
            try {
                const schedules = await db.getStaffScheduleForMonth(targetStaff.id, year, month + 1);
                schedules.forEach(schedule => {
                    customSchedules[schedule.date] = schedule;
                });
            } catch (error) {
                console.error('Erro ao buscar horários customizados:', error);
            }
        }

        let html = '<div class="grid grid-cols-7 text-center text-xs font-semibold text-[var(--text-secondary)] border-b border-[var(--border-color)]">';
        weekdays.forEach(day => {
            html += `<div class="p-2">${day}</div>`;
        });
        html += '</div>';

        html += '<div class="grid grid-cols-7">';
        
        // Células vazias para dias antes do primeiro dia do mês
        for (let i = 0; i < firstDayOfWeek; i++) {
            html += '<div class="border-t border-l border-[var(--border-color)] h-28"></div>';
        }

        // Células dos dias do mês
        for (let day = 1; day <= totalDays; day++) {
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const dayClass = isToday ? 'bg-[var(--accent-primary)] text-white' : 'hover:bg-[var(--accent-light)]';
            
            // Criar data corretamente para evitar problemas de timezone
            const currentDay = new Date(year, month, day, 12, 0, 0);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Verificar se tem horário customizado
            const hasCustomSchedule = customSchedules[dateStr];
            const isDayOff = hasCustomSchedule?.is_day_off;
            
            // Agendamentos para este dia - aplicar filtro de permissões
            const allDayAppointments = appState.appointments.filter(app => app.date === dateStr);
            const dayAppointments = getVisibleAppointments(allDayAppointments);
            
            html += `
                <div class="border-t border-l border-[var(--border-color)] h-28 p-1 cursor-pointer relative ${isDayOff ? 'bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20' : ''}" onclick="showDayAppointments('${dateStr}')">
                    ${isDayOff ? `
                        <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div class="text-4xl opacity-20 mb-1">🌴</div>
                            <div class="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded">FOLGA</div>
                        </div>
                    ` : hasCustomSchedule ? `
                        <div class="absolute top-1 right-1" title="Horário customizado">⏰</div>
                    ` : ''}
                    <div class="w-7 h-7 flex items-center justify-center rounded-full text-sm ${dayClass} mb-1 ${isDayOff ? 'opacity-50' : ''}">${day}</div>
                    <div class="space-y-1 ${isDayOff ? 'opacity-0' : ''}">
                        ${dayAppointments.slice(0, 3).map(app => {
                            const client = app.clients || appState.clients.find(c => c.id === app.client_id);
                            return `<div class="text-xs bg-blue-100 text-blue-800 rounded px-1 py-0.5 truncate">${client?.name || 'Cliente'}</div>`;
                        }).join('')}
                        ${dayAppointments.length > 3 ? `<div class="text-xs text-gray-500">+${dayAppointments.length - 3} mais</div>` : ''}
                    </div>
                </div>
            `;
        }

        html += '</div>';
        dom.calendarContainer.innerHTML = html;
        
        // Adicionar filtros de staff (manicure e cabeleireira) lado a lado
        if (canViewAllAppointments()) {
            addStaffFilters();
        }
    }

    async function renderWeekView() {
        const d = new Date(appState.currentDate);
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay()); // Vai para domingo

        const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        // Buscar funcionário alvo (igual lógica do renderMonthView)
        const currentStaff = appState.staff.find(s => 
            s.user_id === appState.currentUser?.id || 
            s.email === appState.currentUser?.email
        );
        
        let targetStaff = currentStaff;
        if (appState.selectedManicuristId && appState.selectedManicuristId !== 'all') {
            const selectedStaff = appState.staff.find(s => s.id === appState.selectedManicuristId);
            if (selectedStaff) {
                targetStaff = selectedStaff;
            }
        }
        
        // Buscar horários customizados da semana
        let customSchedules = {};
        if (targetStaff) {
            try {
                const year = startOfWeek.getFullYear();
                const month = startOfWeek.getMonth() + 1;
                const schedules = await db.getStaffScheduleForMonth(targetStaff.id, year, month);
                schedules.forEach(schedule => {
                    customSchedules[schedule.date] = schedule;
                });
            } catch (error) {
                console.error('Erro ao buscar horários customizados:', error);
            }
        }
        
        let html = `
            <div class="bg-[var(--bg-secondary)] rounded-lg p-6">
                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-[var(--text-primary)]">
                        Semana de ${startOfWeek.toLocaleDateString('pt-BR')}
                    </h3>
                </div>
                <div class="grid grid-cols-7 gap-4">
        `;
        
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            const dateStr = getLocalDateString(day);
            const allDayAppointments = appState.appointments.filter(app => app.date === dateStr);
            const dayAppointments = getVisibleAppointments(allDayAppointments);
            const isToday = day.toDateString() === new Date().toDateString();
            
            // Verificar se é dia de folga
            const hasCustomSchedule = customSchedules[dateStr];
            const isDayOff = hasCustomSchedule?.is_day_off;
            
            html += `
                <div class="text-center relative ${isToday ? 'bg-[var(--accent-light)] rounded-lg p-2' : ''} ${isDayOff ? 'bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg p-2' : ''}">
                    ${isDayOff ? `
                        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div class="text-3xl opacity-20">🌴</div>
                        </div>
                    ` : ''}
                    <div class="text-sm font-medium text-[var(--text-primary)] mb-2 ${isDayOff ? 'opacity-50' : ''}">
                        ${weekdays[i]}
                    </div>
                    <div class="text-sm text-[var(--text-secondary)] mb-3 ${isDayOff ? 'opacity-50' : ''}">
                        ${day.getDate()}
                    </div>
            `;
            
            if (isDayOff) {
                html += `<div class="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded inline-block">FOLGA</div>`;
            } else {
                html += `<div class="space-y-1">`;
                
                if (dayAppointments.length === 0) {
                    html += `<div class="text-xs text-[var(--text-secondary)]">Livre</div>`;
                } else {
                    dayAppointments
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .slice(0, 3)
                        .forEach(appointment => {
                            const client = appointment.clients || appState.clients.find(c => c.id === appointment.client_id);
                            const canEdit = canEditAppointment(appointment);
                            html += `
                                <div class="text-xs p-1 rounded ${getStatusColor(appointment.status)} ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}"
                                     ${canEdit ? `onclick="editAppointment('${appointment.id}')"` : 'title="Agendamento passado - não editável"'}>
                                    <div>${formatTime(appointment.time)} ${!canEdit ? '🔒' : ''}</div>
                                    <div class="truncate">${client?.name || 'Cliente'}</div>
                                </div>
                            `;
                        });
                    
                    if (dayAppointments.length > 3) {
                        const t = getTranslations();
                        html += `<div class="text-xs text-[var(--text-secondary)]">+${dayAppointments.length - 3} ${t.moreAppointments || 'mais'}</div>`;
                    }
                }
                
                html += `</div>`; // fecha space-y-1
            }

            html += `
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;

        dom.calendarContainer.innerHTML = html;
    }

    // Função para automatizar status de agendamentos passados
    async function processOverdueAppointments() {
        const updatedAppointments = [];
        
        for (let appointment of appState.appointments) {
            // Se o agendamento é de uma data passada e ainda está como 'scheduled'
            if (isDateInPast(appointment.date) && appointment.status === 'scheduled') {
                try {
                    // Atualizar automaticamente para 'no-show'
                    await db.updateAppointment(appointment.id, { status: 'no-show' });
                    appointment.status = 'no-show';
                    updatedAppointments.push(appointment);
                } catch (error) {
                    console.error('Erro ao atualizar status do agendamento:', error);
                }
            }
        }
        
        if (updatedAppointments.length > 0) {
            console.log(`${updatedAppointments.length} agendamentos atualizados automaticamente para 'não compareceu'`);
        }
    }

    // Função para verificar se um agendamento pode ser editado
    function canEditAppointment(appointment) {
        // Verificar se não é uma data passada
        if (isDateInPast(appointment.date)) {
            return false;
        }
        
        // APENAS Admin e recepcionista podem editar agendamentos
        // Manicures e cabeleireiras NÃO podem editar, nem os próprios
        if (canCreateAppointments()) {
            return true;
        }
        
        return false;
    }

    async function renderDayView() {
        const d = appState.currentDate;
        const dateStr = getLocalDateString(d);
        const dayAppointments = getVisibleAppointments(appState.appointments.filter(app => app.date === dateStr));

        // Buscar funcionário atual
        const currentStaff = appState.staff.find(s => 
            s.user_id === appState.currentUser?.id || 
            s.email === appState.currentUser?.email
        );

        // Determinar qual staff usar para buscar horários
        // Se admin/recepcionista selecionou um staff específico, usar esse
        // Caso contrário, usar o staff do usuário logado
        let targetStaff = currentStaff;
        if (appState.selectedManicuristId) {
            const selectedStaff = appState.staff.find(s => s.id === appState.selectedManicuristId);
            if (selectedStaff) {
                targetStaff = selectedStaff;
            }
        } else if (appState.selectedHairdresserId) {
            const selectedStaff = appState.staff.find(s => s.id === appState.selectedHairdresserId);
            if (selectedStaff) {
                targetStaff = selectedStaff;
            }
        }

        // Buscar horário customizado para este dia
        let customSchedule = null;
        if (targetStaff) {
            try {
                customSchedule = await db.getDailySchedule(targetStaff.id, dateStr);
            } catch (error) {
                console.error('Erro ao buscar horário customizado:', error);
            }
        }

        // Se for dia de folga customizado
        if (customSchedule?.is_day_off) {
            // CASO 1: O próprio funcionário vendo sua folga
            if (!canViewAllAppointments()) {
                let html = `
                    <div class="bg-[var(--bg-secondary)] rounded-lg p-6">
                        <div class="mb-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-3">
                                    <div class="text-2xl">🌴</div>
                                    <div>
                                        <div class="font-semibold text-yellow-900">
                                            Dia de Folga
                                        </div>
                                        ${customSchedule.notes ? `
                                            <div class="text-xs text-yellow-600 mt-1">
                                                ${customSchedule.notes}
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                                <button onclick="showDayScheduleModal('${dateStr}')" 
                                    class="text-sm px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-md transition-colors">
                                    Editar
                                </button>
                            </div>
                        </div>
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold text-[var(--text-primary)]">
                                ${d.toLocaleDateString('pt-BR', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </h3>
                        </div>
                        <div class="text-center text-[var(--text-secondary)] py-12">
                            <div class="text-6xl mb-4">🌴</div>
                            <h3 class="text-lg font-medium mb-2">Dia de Folga</h3>
                            <p class="text-sm">Não há atendimentos agendados para este dia.</p>
                        </div>
                    </div>
                `;
                dom.calendarContainer.innerHTML = html;
                return;
            }
            
            // CASO 2: Admin/Recepcionista vendo folga de outro funcionário
            // Mostrar aviso destacado mas permitir visualizar o dia
            const staffName = targetStaff?.name || 'Funcionário';
        }

        // Verificar se o almoço está ativo para o staff (ANTES de definir horários)
        const lunchActive = isLunchActiveToday(targetStaff);

        // Usar horários customizados se existirem, senão usar os padrões
        let workingStart, workingEnd, lunchStart, lunchEnd;
        
        if (customSchedule && !customSchedule.is_day_off) {
            // 1. Usar horários customizados do dia
            workingStart = customSchedule.start_time;
            workingEnd = customSchedule.end_time;
            // Só usar lunch do custom schedule se o almoço estiver ativo
            lunchStart = lunchActive ? (customSchedule.lunch_start || '12:00') : '00:00';
            lunchEnd = lunchActive ? (customSchedule.lunch_end || '13:00') : '00:00';
        } else if (targetStaff?.default_start_time) {
            // 2. Usar horário padrão do funcionário (selecionado ou logado)
            workingStart = targetStaff.default_start_time;
            workingEnd = targetStaff.default_end_time;
            // Só usar lunch padrão se o almoço estiver ativo
            lunchStart = lunchActive ? (targetStaff.default_lunch_start || '12:00') : '00:00';
            lunchEnd = lunchActive ? (targetStaff.default_lunch_end || '13:00') : '00:00';
        } else {
            // 3. Usar horários padrão das configurações globais
            workingStart = appState.settings.workingHours.start;
            workingEnd = appState.settings.workingHours.end;
            // Só usar lunch global se o almoço estiver ativo
            lunchStart = lunchActive ? (appState.settings.lunchTime?.start || '12:00') : '00:00';
            lunchEnd = lunchActive ? (appState.settings.lunchTime?.end || '13:00') : '00:00';
        }

        // Definir horários de trabalho (já processados acima)
        const startHour = parseInt(workingStart.split(':')[0]);
        const startMinute = parseInt(workingStart.split(':')[1]);
        const endHour = parseInt(workingEnd.split(':')[0]);
        const endMinute = parseInt(workingEnd.split(':')[1]);
        
        // Converter horários de almoço para array de números
        const lunchStartTime = lunchStart.split(':').map(Number);
        const lunchEndTime = lunchEnd.split(':').map(Number);
        
        // Duração dos agendamentos - AUTOMÁTICA baseada no funcionário (targetStaff)
        let appointmentDuration = 45; // Padrão: 45 minutos
        
        // Usar a duração do targetStaff (que já considera filtros)
        if (targetStaff) {
            appointmentDuration = getStaffSlotDuration(targetStaff);
        }

        let html = `
            <div class="bg-[var(--bg-secondary)] rounded-lg p-6">
                ${customSchedule?.is_day_off ? `
                    <div class="mb-4 p-5 rounded-lg bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-2 border-orange-300 dark:border-orange-700">
                        <div class="flex items-center space-x-4">
                            <div class="text-5xl">🌴</div>
                            <div class="flex-1">
                                <div class="flex items-center space-x-2 mb-2">
                                    <h4 class="font-bold text-lg text-orange-800 dark:text-orange-300">
                                        ${targetStaff?.name || 'Funcionário'} está de FOLGA neste dia!
                                    </h4>
                                </div>
                                <p class="text-sm text-orange-700 dark:text-orange-400">
                                    Não é recomendado agendar atendimentos para este dia.
                                </p>
                                ${customSchedule.notes ? `
                                    <div class="text-xs text-orange-600 dark:text-orange-400 mt-2 italic bg-white/50 dark:bg-black/20 px-2 py-1 rounded">
                                        📝 ${customSchedule.notes}
                                    </div>
                                ` : ''}
                            </div>
                            <button onclick="showEditDayOffModal('${dateStr}', '${targetStaff?.id}')" 
                                class="text-sm px-4 py-2 bg-orange-200 hover:bg-orange-300 dark:bg-orange-800 dark:hover:bg-orange-700 text-orange-900 dark:text-orange-100 rounded-md transition-colors font-medium">
                                ⚙️ Editar Folga
                            </button>
                        </div>
                    </div>
                ` : customSchedule && !customSchedule.is_day_off ? `
                    <div class="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <div class="text-2xl">⏰</div>
                                <div>
                                    <div class="font-semibold text-blue-900">
                                        Horário Customizado
                                    </div>
                                    <div class="text-sm text-blue-700">
                                        ${customSchedule.start_time} - ${customSchedule.end_time} 
                                        ${customSchedule.lunch_start ? `• Almoço: ${customSchedule.lunch_start}-${customSchedule.lunch_end}` : ''}
                                    </div>
                                    ${customSchedule.notes ? `
                                        <div class="text-xs text-blue-600 mt-1">
                                            ${customSchedule.notes}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            <button onclick="showDayScheduleModal('${dateStr}')" 
                                class="text-sm px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md transition-colors">
                                Editar
                            </button>
                        </div>
                    </div>
                ` : ''}
                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-[var(--text-primary)]">
                        ${d.toLocaleDateString('pt-BR', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </h3>
                </div>
        `;

        if (startHour === endHour && startMinute === endMinute) {
            html += `
                <div class="text-center text-[var(--text-secondary)] py-12">
                    <h3 class="text-sm font-medium">Nenhum horário configurado</h3>
                    <p class="text-sm">Configure os horários de funcionamento nas configurações.</p>
                </div>
            `;
        } else {
            // Gerar horários baseados na duração dos agendamentos
            // Usar os horários customizados se existirem
            const timeSlots = generateTimeSlots(
                workingStart,
                workingEnd,
                appointmentDuration,
                lunchStart,
                lunchEnd
            );

            // Organizar agendamentos por horário - corrigir formato de hora
            const appointmentsByTime = {};
            const occupiedSlots = new Set(); // 🆕 Rastrear slots ocupados por agendamentos multi-slot
            
            dayAppointments.forEach(appointment => {
                // Converter "10:00:00" para "10:00" para compatibilidade
                const timeKey = appointment.time.substring(0, 5);
                appointmentsByTime[timeKey] = appointment;
                
                // 🆕 Marcar todos os slots ocupados por este agendamento
                const duration = appointment.duration || 30;
                const slotsCount = Math.ceil(duration / 30);
                
                for (let i = 0; i < slotsCount; i++) {
                    const slotTime = addMinutesToTime(timeKey, i * 30);
                    occupiedSlots.add(slotTime);
                }
            });

            // IMPORTANTE: Adicionar slots para agendamentos que existem FORA do horário customizado
            // Isso garante que agendamentos existentes sempre apareçam, mesmo que o horário tenha sido customizado depois
            dayAppointments.forEach(appointment => {
                const appointmentTime = appointment.time.substring(0, 5);
                const slotExists = timeSlots.some(slot => slot.time === appointmentTime);
                
                if (!slotExists) {
                    // Adicionar slot para este agendamento que está fora do horário customizado
                    timeSlots.push({
                        time: appointmentTime,
                        isLunchTime: false,
                        isOutsideSchedule: true // Marcar como fora do horário
                    });
                }
            });
            
            // Ordenar slots por horário
            timeSlots.sort((a, b) => {
                const [aHour, aMin] = a.time.split(':').map(Number);
                const [bHour, bMin] = b.time.split(':').map(Number);
                return (aHour * 60 + aMin) - (bHour * 60 + bMin);
            });

            // Renderizar cada slot de horário
            timeSlots.forEach(timeSlot => {
                const appointment = appointmentsByTime[timeSlot.time];
                const isLunchTime = timeSlot.isLunchTime;
                
                // 🆕 PULAR slots ocupados por agendamentos multi-slot (exceto o primeiro)
                if (!appointment && occupiedSlots.has(timeSlot.time)) {
                    return; // Não renderizar - este slot faz parte de um agendamento maior
                }
                
                html += `
                    <div class="flex items-start py-3 border-b border-[var(--border-color)] last:border-b-0">
                        <div class="w-20 text-sm text-[var(--text-secondary)] font-mono pt-1">
                            ${timeSlot.time}
                        </div>
                        <div class="flex-1 ml-4">
                `;
                
                if (isLunchTime) {
                    html += `
                        <div class="text-sm text-orange-600 dark:text-orange-400 italic py-2">
                            Horário de almoço
                        </div>
                    `;
                } else if (!appointment) {
                    // Verificar se a data é no passado (anterior a hoje)
                    const isPast = isDateInPast(dateStr);
                    // Verificar se tem permissão para criar agendamentos
                    const canCreate = canCreateAppointments();
                    // Admin pode criar em qualquer data
                    const isAdmin = getUserRole() === 'admin';
                    const canCreateHere = canCreate && (!isPast || isAdmin);
                    
                    html += `
                        <div class="py-2 cursor-pointer text-[var(--text-secondary)] ${!canCreateHere ? 'opacity-50 cursor-not-allowed' : 'hover:text-[var(--accent-primary)] hover:bg-[var(--accent-light)]'} transition-colors min-h-[2rem] rounded px-2" 
                             ${canCreateHere ? `onclick="showAppointmentModal(null, '${dateStr}', '${timeSlot.time}')"` : ''}
                             ${!canCreate ? 'title="Apenas administradores e recepcionistas podem criar agendamentos"' : (isPast && !isAdmin ? 'title="Não é possível agendar em datas passadas (apenas admin)"' : '')}>
                             ${isPast && !isAdmin ? '<span class="text-xs italic">Horário passado</span>' : (!canCreate ? '<span class="text-xs italic">Apenas visualização</span>' : '')}
                        </div>
                    `;
                } else {
                    // Acessar dados com JOIN - podem vir como objetos ou por ID
                    const client = appointment.clients || appState.clients.find(c => c.id === appointment.client_id);
                    const service = appointment.services || appState.services.find(s => s.id === appointment.service_id);
                    const staff = appointment.staff || appState.staff.find(s => s.id === appointment.staff_id);
                    
                    // 🆕 Usar a duração do agendamento (não do serviço)
                    const duration = appointment.duration || 30;
                    const endTime = addMinutesToTime(appointment.time, duration);
                    const canEdit = canEditAppointment(appointment);
                    
                    // 🆕 Calcular altura visual baseada na duração (cada 30min = ~60px)
                    const slotsCount = Math.ceil(duration / 30);
                    const blockHeight = (slotsCount * 60) - 12; // -12 para compensar padding

                    html += `
                        <div class="py-2 ${canEdit ? 'cursor-pointer hover:bg-[var(--accent-light)]' : 'cursor-not-allowed opacity-75'} rounded-md p-3 -m-2 transition-colors ${timeSlot.isOutsideSchedule ? 'bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500' : 'border-l-4 border-[var(--accent-primary)]'}" 
                             style="min-height: ${blockHeight}px;"
                             ${canEdit ? `onclick="editAppointment('${appointment.id}')"` : 'title="Agendamentos passados não podem ser editados"'}>
                            <div class="flex items-start justify-between h-full">
                                <div class="flex-1">
                                    <div class="flex items-center space-x-2 mb-2">
                                        <span class="text-base font-semibold text-[var(--text-primary)]">
                                            ${formatTime(appointment.time)} - ${formatTime(endTime)}
                                        </span>
                                        <span class="text-xs px-2 py-1 rounded-full ${getStatusColor(appointment.status)}">
                                            ${getStatusText(appointment.status)}
                                        </span>
                                        ${!canEdit ? '<span class="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full">🔒 Bloqueado</span>' : ''}
                                        ${timeSlot.isOutsideSchedule ? '<span class="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full" title="Agendamento fora do horário customizado">⚠️ Fora do horário</span>' : ''}
                                    </div>
                                    <div class="text-sm font-medium text-[var(--text-primary)] mb-1">
                                        👤 ${client?.name || 'Cliente'}
                                    </div>
                                    <div class="text-sm text-[var(--text-secondary)]">
                                        ${service?.name || '⏳ Aguardando serviços'}
                                    </div>
                                    ${appointment.notes ? `<div class="text-xs text-[var(--text-secondary)] mt-2 italic bg-[var(--bg-secondary)] p-2 rounded">${appointment.notes}</div>` : ''}
                                    <div class="text-xs text-[var(--text-secondary)] mt-2 font-mono">
                                        ⏱️ Duração: ${duration} minutos (${slotsCount} slot${slotsCount > 1 ? 's' : ''} de 30min)
                                    </div>
                                </div>
                                <div class="text-right ml-4 flex flex-col items-end space-y-2">
                                    <button onclick="event.stopPropagation(); showAppointmentServicesModal('${appointment.id}')"
                                        class="text-xs px-3 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] transition-colors shadow-sm font-medium">
                                        ${service?.name ? '💰 Ver Serviços' : '➕ Add Serviços'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }
                
                html += `
                        </div>
                    </div>
                `;
            });
            
            // Resumo do dia (mais simples)
            if (dayAppointments.length > 0) {
                html += `
                    <div class="mt-6 pt-4 border-t border-[var(--border-color)]">
                        <div class="text-sm text-center">
                            <span class="text-[var(--text-secondary)]">Total: ${dayAppointments.length} agendamentos</span>
                        </div>
                    </div>
                `;
            }
        }

        html += '</div>';
        dom.calendarContainer.innerHTML = html;
    }

    // Função auxiliar para adicionar minutos a uma hora
    function addMinutesToTime(time, minutes) {
        const [hours, mins] = time.split(':').map(Number);
        const totalMinutes = hours * 60 + mins + minutes;
        const newHours = Math.floor(totalMinutes / 60);
        const newMins = totalMinutes % 60;
        return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
    }

    // Função para gerar slots de horário baseados na duração dos agendamentos
    function generateTimeSlots(startTime, endTime, duration, lunchStart, lunchEnd) {
        const slots = [];
        
        // Converter horários para minutos
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);
        const lunchStartMinutes = timeToMinutes(lunchStart);
        const lunchEndMinutes = timeToMinutes(lunchEnd);
        
        let currentMinutes = startMinutes;
        
        while (currentMinutes < endMinutes) {
            const timeStr = minutesToTime(currentMinutes);
            
            // Verificar se é horário de almoço
            const isLunchTime = currentMinutes >= lunchStartMinutes && currentMinutes < lunchEndMinutes;
            
            slots.push({
                time: timeStr,
                isLunchTime: isLunchTime
            });
            
            currentMinutes += duration;
        }
        
        return slots;
    }

    // Converter horário para minutos
    function timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // Converter minutos para horário
    function minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    function getStatusColor(status) {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            case 'no-show': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    function getStatusText(status) {
        const t = getTranslations();
        switch (status) {
            case 'scheduled': return t.statusScheduled || 'Agendado';
            case 'completed': return t.statusCompleted || 'Concluído';
            case 'cancelled': return t.statusCancelled || 'Cancelado';
            case 'no-show': return t.statusNoShow || 'Não compareceu';
            default: return status;
        }
    }

    function renderScheduleRequests() {
        const t = getTranslations();
        const scheduleRequestsView = document.getElementById('scheduleRequestsView');
        
        if (!scheduleRequestsView) {
            console.error('Schedule requests view not found');
            return;
        }

        // Debug: Verificar role atual
        console.log('🔍 renderScheduleRequests - Verificando permissões');
        console.log('isAdmin():', isAdmin());
        console.log('isManicurist():', isManicurist());
        console.log('isHairdresser():', isHairdresser());
        console.log('getUserRole():', getUserRole());

        // Verificar permissões - ADMIN TEM PRIORIDADE
        if (isAdmin()) {
            // Admins veem todas as solicitações e podem aprovar/rejeitar
            console.log('✅ Renderizando como ADMIN');
            const pendingRequests = appState.scheduleRequests.filter(r => r.status === 'pending');
            const processedRequests = appState.scheduleRequests.filter(r => r.status !== 'pending');
            
            scheduleRequestsView.innerHTML = `
                <div class="space-y-6">
                    <div class="bg-[var(--bg-secondary)] rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">
                            ${t.pendingScheduleRequests || 'Solicitações Pendentes'}
                        </h3>
                        ${pendingRequests.length === 0 ? `
                            <p class="text-[var(--text-secondary)] text-center py-8">
                                ${t.noPendingRequests || 'Nenhuma solicitação pendente'}
                            </p>
                        ` : pendingRequests.map(request => {
                            const staff = appState.staff.find(s => s.id === request.staff_id);
                            return `
                                <div class="border border-[var(--border-color)] rounded-lg p-4 mb-4 bg-[var(--bg-primary)]">
                                    <div class="flex justify-between items-start mb-2">
                                        <div>
                                            <span class="font-medium text-[var(--text-primary)]">
                                                ${staff?.name || 'Funcionário'} - ${new Date(request.date).toLocaleDateString('pt-BR')}
                                            </span>
                                            <span class="ml-2 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                                                Pendente
                                            </span>
                                        </div>
                                        <small class="text-[var(--text-secondary)]">
                                            ${new Date(request.created_at).toLocaleDateString('pt-BR')}
                                        </small>
                                    </div>
                                    <p class="text-[var(--text-secondary)] text-sm mb-3">
                                        <strong>Motivo:</strong> ${request.reason}
                                    </p>
                                    <div class="flex space-x-2">
                                        <button onclick="approveScheduleRequest('${request.id}')" 
                                            class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm">
                                            ✅ Aprovar
                                        </button>
                                        <button onclick="rejectScheduleRequest('${request.id}')" 
                                            class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                                            ❌ Rejeitar
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    <div class="bg-[var(--bg-secondary)] rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">
                            ${t.processedScheduleRequests || 'Solicitações Processadas'}
                        </h3>
                        ${processedRequests.length === 0 ? `
                            <p class="text-[var(--text-secondary)] text-center py-8">
                                ${t.noProcessedRequests || 'Nenhuma solicitação processada'}
                            </p>
                        ` : processedRequests.slice(0, 10).map(request => {
                            const staff = appState.staff.find(s => s.id === request.staff_id);
                            return `
                                <div class="border border-[var(--border-color)] rounded-lg p-4 mb-4 bg-[var(--bg-primary)]">
                                    <div class="flex justify-between items-start mb-2">
                                        <div>
                                            <span class="font-medium text-[var(--text-primary)]">
                                                ${staff?.name || 'Funcionário'} - ${new Date(request.date).toLocaleDateString('pt-BR')}
                                            </span>
                                            <span class="ml-2 px-2 py-1 rounded-full text-xs ${
                                                request.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }">
                                                ${request.status === 'approved' ? 'Aprovada' : 'Rejeitada'}
                                            </span>
                                        </div>
                                        <small class="text-[var(--text-secondary)]">
                                            ${new Date(request.created_at).toLocaleDateString('pt-BR')}
                                        </small>
                                    </div>
                                    <p class="text-[var(--text-secondary)] text-sm">
                                        <strong>Motivo:</strong> ${request.reason}
                                    </p>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        } else if (isManicurist() || isHairdresser()) {
            // Manicures e Cabeleireiras veem apenas suas próprias solicitações
            console.log('✅ Renderizando como MANICURE/CABELEIREIRA');
            const { currentUser, staff } = appState;
            const currentStaff = staff.find(s => s.user_id === currentUser?.id || s.email === currentUser?.email);
            const userRequests = currentStaff ? 
                appState.scheduleRequests.filter(r => r.staff_id === currentStaff.id) : [];
            
            scheduleRequestsView.innerHTML = `
                <div class="bg-[var(--bg-secondary)] rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">
                        ${t.myScheduleRequests || 'Minhas Solicitações de Fechamento'}
                    </h3>
                    ${userRequests.length === 0 ? `
                        <p class="text-[var(--text-secondary)] text-center py-8">
                            ${t.noScheduleRequests || 'Nenhuma solicitação encontrada'}
                        </p>
                    ` : userRequests.map(request => `
                        <div class="border border-[var(--border-color)] rounded-lg p-4 mb-4 bg-[var(--bg-primary)]">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <span class="font-medium text-[var(--text-primary)]">
                                        ${new Date(request.date).toLocaleDateString('pt-BR')}
                                    </span>
                                    <span class="ml-2 px-2 py-1 rounded-full text-xs ${
                                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        'bg-red-100 text-red-800'
                                    }">
                                        ${request.status === 'pending' ? 'Pendente' :
                                          request.status === 'approved' ? 'Aprovada' : 'Rejeitada'}
                                    </span>
                                </div>
                                <small class="text-[var(--text-secondary)]">
                                    ${new Date(request.created_at).toLocaleDateString('pt-BR')}
                                </small>
                            </div>
                            <p class="text-[var(--text-secondary)] text-sm">
                                <strong>Motivo:</strong> ${request.reason}
                            </p>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            // Recepcionistas não têm acesso às solicitações
            console.log('❌ Renderizando como RECEPCIONISTA (sem acesso)');
            scheduleRequestsView.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-6xl mb-4">🚫</div>
                    <h3 class="text-xl font-bold text-[var(--text-primary)] mb-2">${t.restrictedAccess}</h3>
                    <p class="text-[var(--text-secondary)]">Acesso restrito para administradores, manicures e cabeleireiras.</p>
                </div>
            `;
        }
    }

    function renderSettings() {
        const settingsView = document.getElementById('settingsView');
        const { currentUser, settings, staff } = appState;
        const t = getTranslations();
        
        // Usar a função utilitária para verificar se é admin
        const userStaff = staff.find(s => s.user_id === currentUser?.id || s.email === currentUser?.email);
        const loggedInUser = userStaff || { 
            name: currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || 'Admin', 
            email: currentUser?.email || 'admin@example.com' 
        };

        let settingsHtml = `
            <h2 class="text-2xl font-bold text-[var(--text-primary)] mb-6">${t.settings}</h2>
            <div class="space-y-8 max-w-4xl mx-auto">
                                <!-- Profile Settings -->
                <div class="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-6">
                    <h3 class="text-xl font-bold mb-4">${t.profileSettingsTitle}</h3>
                    <form id="profileSettingsForm" class="space-y-4">
                        <div>
                            <label for="profileEmail" class="block text-sm font-medium text-[var(--text-secondary)]">${t.email}</label>
                            <input type="email" id="profileEmail" value="${loggedInUser.email}" class="mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]">
                        </div>
                        <div>
                            <label for="profilePassword" class="block text-sm font-medium text-[var(--text-secondary)]">${t.newPassword}</label>
                            <input type="password" id="profilePassword" placeholder="${t.changePasswordPlaceholder}" class="mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]">
                        </div>
                        <button type="submit" class="bg-[var(--accent-primary)] text-white py-2 px-4 rounded-lg hover:bg-[var(--accent-secondary)] transition-colors duration-200">${t.saveChanges}</button>
                    </form>
                </div>
                <!-- Appearance Settings -->
                <div class="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-6">
                    <h3 class="text-xl font-bold mb-4">${t.appearanceTitle}</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-3">${t.theme}</label>
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                                ${window.ThemeManager?.getThemesList().map(theme => `
                                    <div class="theme-option border-2 rounded-lg p-3 cursor-pointer transition-all ${window.ThemeManager?.getCurrentTheme() === theme.key ? 'border-[var(--accent-primary)] bg-[var(--accent-light)]' : 'border-[var(--border-color)] hover:border-[var(--accent-primary)]'}" 
                                         onclick="selectTheme('${theme.key}')">
                                        <div class="flex items-center space-x-2">
                                            <div class="w-6 h-6 rounded-full border-2 border-white shadow-sm" style="background-color: ${theme.preview}"></div>
                                            <span class="text-sm font-medium">${theme.name}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div>
                            <label for="languageSelect" class="block text-sm font-medium text-[var(--text-secondary)]">${t.language}</label>
                            <select id="languageSelect" class="mt-1 block w-full max-w-xs px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]">
                                <option value="pt-BR" ${appState.settings.language === 'pt-BR' ? 'selected' : ''}>Português</option>
                                <option value="en-US" ${appState.settings.language === 'en-US' ? 'selected' : ''}>English</option>
                            </select>
                        </div>
                        <div class="flex items-center justify-between p-4 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 bg-[var(--accent-light)] rounded-full flex items-center justify-center">
                                    🔔
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-[var(--text-primary)]">${t.enableNotifications || 'Habilitar Notificações'}</span>
                                    <p class="text-xs text-[var(--text-secondary)]">
                                        ${'Notification' in window ? 
                                            'Receba alertas sobre agendamentos' : 
                                            'Notificações não suportadas neste navegador'}
                                    </p>
                                </div>
                            </div>
                            <label class="relative inline-flex items-center ${'Notification' in window ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}">
                                <input type="checkbox" id="enableNotifications" 
                                    ${localStorage.getItem('notifications-enabled') === 'true' && Notification?.permission === 'granted' ? 'checked' : ''} 
                                    ${'Notification' in window ? '' : 'disabled'} 
                                    class="sr-only peer">
                                <div class="w-11 h-6 bg-[var(--border-color)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 peer-disabled:bg-gray-300 peer-disabled:cursor-not-allowed"></div>
                            </label>
                        </div>
                    </div>
                </div>

            </div>
        `;
        
        settingsView.innerHTML = settingsHtml;
        addSettingsEventListeners();
    }

    function addSettingsEventListeners() {
        // Language select
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                appState.settings.language = e.target.value;
                saveUserSettings(); // Salvar configuração
                
                // Atualizar interface imediatamente usando o sistema global de traduções
                window.updateInterfaceLanguage();
                refreshCurrentView();
                
                showNotification('Idioma alterado com sucesso!');
            });
        }

        // Notifications toggle
        const notificationsToggle = document.getElementById('enableNotifications');
        if (notificationsToggle) {
            // Verificar se o dispositivo/navegador suporta notificações
            const supportsNotifications = 'Notification' in window;
            
            if (!supportsNotifications) {
                notificationsToggle.disabled = true;
                return; // Não adicionar event listener se não há suporte
            }

            notificationsToggle.addEventListener('change', async (e) => {
                if (e.target.checked) {
                    try {
                        let permissionGranted = false;
                        
                        // 🚀 USAR CAPACITOR LocalNotifications para APK
                        if (window.requestNotificationPermission) {
                            // Modo APK - usa Capacitor
                            console.log('[NOTIFICAÇÕES] Usando Capacitor LocalNotifications');
                            permissionGranted = await window.requestNotificationPermission();
                        } else if (window.NotificationManager && window.NotificationManager.requestPermission) {
                            // Modo Web - NotificationManager customizado
                            console.log('[NOTIFICAÇÕES] Usando NotificationManager');
                            permissionGranted = await window.NotificationManager.requestPermission();
                        } else if ('Notification' in window) {
                            // Fallback - API nativa do navegador
                            console.log('[NOTIFICAÇÕES] Usando Notification API nativa');
                            const permission = await Notification.requestPermission();
                            permissionGranted = permission === 'granted';
                            
                            if (permissionGranted) {
                                // Teste de notificação
                                new Notification('Sistema de Agendamento', {
                                    body: 'Notificações ativadas com sucesso!',
                                    icon: './assets/imgs/logo.png'
                                });
                            }
                        }

                        if (!permissionGranted) {
                            e.target.checked = false;
                            showNotification('❌ Permissão para notificações negada', 'error');
                        } else {
                            localStorage.setItem('notifications-enabled', 'true');
                            showNotification('✅ Notificações habilitadas com sucesso!', 'success');
                        }
                    } catch (error) {
                        console.error('Erro ao solicitar permissão de notificação:', error);
                        e.target.checked = false;
                        showNotification('Erro ao habilitar notificações. Tente novamente.', 'error');
                    }
                } else {
                    // Desabilitar notificações
                    localStorage.setItem('notifications-enabled', 'false');
                    if (window.NotificationManager && window.NotificationManager.disable) {
                        window.NotificationManager.disable();
                    }
                    showNotification('Notificações desabilitadas');
                }
            });

            // Verificar estado inicial das notificações
            const notificationsEnabled = localStorage.getItem('notifications-enabled') === 'true' && Notification.permission === 'granted';
            notificationsToggle.checked = notificationsEnabled;
        }
        
        // Profile form
        const profileForm = document.getElementById('profileSettingsForm');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                try {
                    const name = document.getElementById('profileName').value;
                    const email = document.getElementById('profileEmail').value;
                    const password = document.getElementById('profilePassword').value;

                    // Atualizar dados do usuário no Supabase
                    const updates = { name };
                    if (password) {
                        await window.supabase.auth.updateUser({ password });
                    }
                    
                    await window.supabase.auth.updateUser({
                        email,
                        data: updates
                    });

                    showNotification('Perfil atualizado com sucesso!');
                } catch (error) {
                    console.error('Erro ao atualizar perfil:', error);
                    showNotification('Erro ao atualizar perfil: ' + error.message);
                }
            });
        }

        // Admin form
        const adminForm = document.getElementById('adminSettingsForm');
        if (adminForm) {
            adminForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                try {
                    appState.settings.businessName = document.getElementById('salonName').value;
                    appState.settings.workingHours.start = document.getElementById('workHoursStart').value;
                    appState.settings.workingHours.end = document.getElementById('workHoursEnd').value;
                    appState.settings.appointmentDuration = parseInt(document.getElementById('appointmentDuration').value, 10);
                    appState.settings.lateToleranceInMinutes = parseInt(document.getElementById('lateTolerance').value, 10);
                    appState.settings.commissionRate = parseFloat(document.getElementById('commissionRate').value) / 100;
                    appState.settings.lunchTime = {
                        start: document.getElementById('lunchStart').value,
                        end: document.getElementById('lunchEnd').value
                    };
                    appState.settings.allowManicuristToMoveAppointments = document.getElementById('allowManicuristToMoveAppointments').checked;

                    // Salvar no Supabase (você pode implementar uma tabela de settings)
                    showNotification('Configurações administrativas salvas com sucesso!');
                } catch (error) {
                    console.error('Erro ao salvar configurações:', error);
                    showNotification('Erro ao salvar configurações: ' + error.message);
                }
            });
        }
    }

    // Função global para seleção de tema
    window.selectTheme = function(themeKey) {
        if (window.ThemeManager) {
            window.ThemeManager.applyTheme(themeKey);
            appState.settings.theme = themeKey;
            saveUserSettings();
            
            // Atualizar interface visual
            refreshCurrentView();
            showNotification(`Tema ${window.ThemeManager.themes[themeKey]?.name} aplicado!`);
        }
    };

    function showClientModal(client = null) {
        // Verificação de permissão
        if (!canEditClients()) {
            showNotification('Você não tem permissão para editar clientes', 'error');
            return;
        }
        
        const t = getTranslations();
        const isEdit = !!client;
        
        showModal(`
            <div class="bg-[var(--bg-primary)] rounded-lg max-w-md w-full mx-4 border border-[var(--border-color)]">
                <div class="p-6">
                    <h3 class="text-lg font-medium mb-4 text-[var(--text-primary)]">${isEdit ? t.editClient : t.addNewClient}</h3>
                    <form id="clientForm" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.clientName}</label>
                            <input type="text" name="name" value="${client?.name || ''}" required
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.clientPhone}</label>
                            <input type="tel" name="phone" value="${client?.phone || ''}"
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.clientEmail}</label>
                            <input type="email" name="email" value="${client?.email || ''}"
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">🎂 Aniversário (Dia/Mês)</label>
                            <div class="grid grid-cols-2 gap-2 mt-1">
                                <select name="birthday_day" class="border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                                    <option value="">Dia</option>
                                    ${Array.from({length: 31}, (_, i) => {
                                        const day = i + 1;
                                        const selected = client?.birthday_day === day ? 'selected' : '';
                                        return `<option value="${day}" ${selected}>${day}</option>`;
                                    }).join('')}
                                </select>
                                <select name="birthday_month" class="border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                                    <option value="">Mês</option>
                                    ${[
                                        {value: 1, name: 'Janeiro'}, {value: 2, name: 'Fevereiro'}, {value: 3, name: 'Março'},
                                        {value: 4, name: 'Abril'}, {value: 5, name: 'Maio'}, {value: 6, name: 'Junho'},
                                        {value: 7, name: 'Julho'}, {value: 8, name: 'Agosto'}, {value: 9, name: 'Setembro'},
                                        {value: 10, name: 'Outubro'}, {value: 11, name: 'Novembro'}, {value: 12, name: 'Dezembro'}
                                    ].map(month => {
                                        const selected = client?.birthday_month === month.value ? 'selected' : '';
                                        return `<option value="${month.value}" ${selected}>${month.name}</option>`;
                                    }).join('')}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">Observações</label>
                            <textarea name="notes" rows="3" placeholder="Observações sobre o cliente..."
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">${client?.notes || ''}</textarea>
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

        document.getElementById('clientForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const clientData = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                birthday_day: formData.get('birthday_day') ? parseInt(formData.get('birthday_day')) : null,
                birthday_month: formData.get('birthday_month') ? parseInt(formData.get('birthday_month')) : null,
                notes: formData.get('notes')
            };

            try {
                if (isEdit) {
                    await db.updateClient(client.id, clientData);
                    const index = appState.clients.findIndex(c => c.id === client.id);
                    if (index !== -1) {
                        appState.clients[index] = { ...client, ...clientData };
                    }
                } else {
                    const newClient = await db.addClient(clientData);
                    appState.clients.push(newClient);
                }
                renderClients();
                hideModal();
                showNotification(t.clientSaved);
            } catch (error) {
                console.error('Erro ao salvar cliente:', error);
            }
        });
    }

    function showServiceModal(service = null) {
        // Verificação de permissão - APENAS admin
        if (!canEditServices()) {
            showNotification('Você não tem permissão para editar serviços', 'error');
            return;
        }
        
        const t = getTranslations();
        const isEdit = !!service;
        
        showModal(`
            <div class="bg-[var(--bg-primary)] rounded-lg max-w-md w-full mx-4 border border-[var(--border-color)]">
                <div class="p-6">
                    <h3 class="text-lg font-medium mb-4 text-[var(--text-primary)]">${isEdit ? t.editService : t.addNewService}</h3>
                    <form id="serviceForm" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.serviceName}</label>
                            <input type="text" name="name" value="${service?.name || ''}" required
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.duration} (min)</label>
                                <input type="number" name="duration" value="${service?.duration || 30}" required min="1"
                                    class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.price} (R$)</label>
                                <input type="number" step="0.01" name="price" value="${service?.price || ''}" required min="0"
                                    class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">💰 Taxa de Comissão (%) <span class="text-xs opacity-70">(opcional)</span></label>
                            <input type="number" step="0.01" name="commission_rate" value="${service?.commission_rate ? (service.commission_rate * 100) : 50}" min="0" max="100"
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                            <p class="text-xs text-[var(--text-secondary)] mt-1">Porcentagem que o profissional recebe por este serviço</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">Descrição</label>
                            <textarea name="description" rows="3" placeholder="Descrição do serviço..."
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">${service?.description || ''}</textarea>
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

        document.getElementById('serviceForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            // Montar serviceData sem commission_rate inicialmente
            const serviceData = {
                name: formData.get('name'),
                duration: parseInt(formData.get('duration')),
                price: parseFloat(formData.get('price')),
                description: formData.get('description')
            };
            
            // Adicionar commission_rate apenas se foi preenchido
            const commissionValue = formData.get('commission_rate');
            if (commissionValue && commissionValue !== '') {
                serviceData.commission_rate = parseFloat(commissionValue) / 100; // Converter % para decimal
            }

            // Validação
            if (!serviceData.name || serviceData.name.trim() === '') {
                showNotification('Digite o nome do serviço', 'error');
                return;
            }
            if (!serviceData.duration || serviceData.duration <= 0) {
                showNotification('Digite uma duração válida', 'error');
                return;
            }
            if (!serviceData.price || serviceData.price <= 0) {
                showNotification('Digite um preço válido', 'error');
                return;
            }

            console.log('Salvando serviço:', serviceData);

            try {
                if (isEdit) {
                    await db.updateService(service.id, serviceData);
                    const index = appState.services.findIndex(s => s.id === service.id);
                    if (index !== -1) {
                        appState.services[index] = { ...service, ...serviceData };
                    }
                    showNotification('Serviço atualizado com sucesso!');
                } else {
                    const newService = await db.addService(serviceData);
                    appState.services.push(newService);
                    showNotification('Serviço criado com sucesso!');
                }
                
                // Recarregar serviços do banco
                appState.services = await db.getServices();
                
                renderServices();
                hideModal();
            } catch (error) {
                console.error('Erro ao salvar serviço:', error);
                showNotification('Erro ao salvar serviço: ' + (error.message || 'Erro desconhecido'), 'error');
            }
        });
    }

    function showStaffModal(staff = null) {
        // Verificação de permissão - APENAS admin
        if (!canEditStaff()) {
            showNotification('Você não tem permissão para editar funcionários', 'error');
            return;
        }
        
        const t = getTranslations();
        const isEdit = !!staff;
        const isAdminUser = isAdmin();
        const currentStaffUser = appState.staff.find(s => 
            s.user_id === appState.currentUser?.id || 
            s.email === appState.currentUser?.email
        );
        
        // Verificar se é o próprio funcionário editando ou se é admin
        const isOwnProfile = staff && currentStaffUser && staff.id === currentStaffUser.id;
        const canEditRole = isAdminUser && !isOwnProfile;
        
        showModal(`
            <div class="bg-[var(--bg-primary)] rounded-lg max-w-md w-full mx-4 border border-[var(--border-color)]">
                <div class="p-6">
                    <h3 class="text-lg font-medium mb-4 text-[var(--text-primary)]">${isEdit ? t.editStaff : t.addNewStaff}</h3>
                    <form id="staffForm" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.staffName}</label>
                            <input type="text" name="name" value="${staff?.name || ''}" required
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.role}</label>
                            <select name="role" ${!canEditRole ? 'disabled' : ''} class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 ${!canEditRole ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'} focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                                <option value="manicurist" ${staff?.role === 'manicurist' ? 'selected' : ''} class="bg-[var(--bg-secondary)] text-[var(--text-primary)]">${t.manicurist}</option>
                                <option value="hairdresser" ${staff?.role === 'hairdresser' ? 'selected' : ''} class="bg-[var(--bg-secondary)] text-[var(--text-primary)]">${t.hairdresser || 'Cabeleireira'}</option>
                                <option value="receptionist" ${staff?.role === 'receptionist' ? 'selected' : ''} class="bg-[var(--bg-secondary)] text-[var(--text-primary)]">${t.receptionist}</option>
                                <option value="admin" ${staff?.role === 'admin' ? 'selected' : ''} class="bg-[var(--bg-secondary)] text-[var(--text-primary)]">${t.admin}</option>
                            </select>
                            ${!canEditRole ? `
                                <p class="text-xs text-[var(--text-secondary)] mt-1">
                                    Apenas administradores podem alterar cargos. Para alterar sua foto, use o perfil na sidebar.
                                </p>
                            ` : ''}
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

        document.getElementById('staffForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const staffData = {
                name: formData.get('name'),
                role: staff?.role || formData.get('role') // Se não pode editar cargo, manter o atual
            };

            // Só atualiza o cargo se for admin e não for próprio perfil
            if (canEditRole) {
                staffData.role = formData.get('role');
            }

            try {
                if (isEdit) {
                    await db.updateStaff(staff.id, staffData);
                    const index = appState.staff.findIndex(s => s.id === staff.id);
                    if (index !== -1) {
                        appState.staff[index] = { ...staff, ...staffData };
                    }
                } else {
                    const newStaff = await db.addStaff(staffData);
                    appState.staff.push(newStaff);
                }
                renderStaff();
                hideModal();
                showNotification(t.staffSaved);
                
                // Atualizar header se for o usuário atual
                updateHeaderStaffInfo();
            } catch (error) {
                console.error('Erro ao salvar funcionário:', error);
            }
        });
    }

    // Função para o funcionário editar seu próprio perfil
    window.showMyProfile = function() {
        const t = getTranslations();
        const currentStaff = appState.staff.find(s => 
            s.user_id === appState.currentUser?.id || 
            s.email === appState.currentUser?.email
        );

        if (!currentStaff) {
            showNotification('Funcionário não encontrado', 'error');
            return;
        }

        showModal(`
            <div class="bg-[var(--bg-primary)] rounded-lg max-w-md w-full mx-4 border border-[var(--border-color)]">
                <div class="p-6">
                    <h3 class="text-lg font-medium mb-4 text-[var(--text-primary)]">Meu Perfil</h3>
                    <form id="myProfileForm" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">Foto de Perfil</label>
                            <div class="flex items-center space-x-4">
                                ${currentStaff.photo_url ? `
                                    <img id="myPhotoPreview" src="${currentStaff.photo_url}" alt="Minha Foto" class="w-24 h-24 rounded-full object-cover border-2 border-[var(--accent-primary)]">
                                ` : `
                                    <div id="myPhotoPreview" class="w-24 h-24 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white text-3xl font-bold border-2 border-[var(--accent-primary)]">
                                        ${currentStaff.name ? currentStaff.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                `}
                                <div class="flex-1">
                                    <input type="file" id="myPhotoInput" name="photo" accept="image/*" class="hidden">
                                    <button type="button" id="myPhotoButton"
                                        class="w-full px-4 py-2 text-sm font-medium text-white bg-[var(--accent-primary)] rounded-md hover:bg-[var(--accent-secondary)]">
                                        📸 Alterar Foto
                                    </button>
                                    <p class="text-xs text-[var(--text-secondary)] mt-2">PNG, JPG até 5MB</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">Nome</label>
                            <input type="text" name="name" value="${currentStaff.name || ''}" required
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                        </div>
                        <div class="flex justify-end space-x-3 pt-4">
                            <button type="button" onclick="hideModal()" 
                                class="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-md hover:bg-[var(--accent-light)] border border-[var(--border-color)]">
                                Cancelar
                            </button>
                            <button type="submit" 
                                class="px-4 py-2 text-sm font-medium text-white bg-[var(--accent-primary)] rounded-md hover:bg-[var(--accent-secondary)]">
                                💾 Salvar Perfil
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `);

        // 📸 BOTÃO DE FOTO - Usar galeria nativa no APK
        const myPhotoButton = document.getElementById('myPhotoButton');
        const myPhotoInput = document.getElementById('myPhotoInput');
        
        if (myPhotoButton) {
            myPhotoButton.addEventListener('click', async () => {
                // Tentar usar galeria nativa primeiro (APK)
                if (window.pickOrTakePhoto) {
                    try {
                        const photoData = await window.pickOrTakePhoto();
                        
                        // Atualizar preview
                        const preview = document.getElementById('myPhotoPreview');
                        if (preview) {
                            preview.innerHTML = `<img src="${photoData}" alt="Preview" class="w-24 h-24 rounded-full object-cover">`;
                            preview.className = "w-24 h-24 rounded-full overflow-hidden border-2 border-[var(--accent-primary)]";
                        }
                        
                        // Salvar base64 para upload
                        let hiddenInput = document.getElementById('myPhotoData');
                        if (!hiddenInput) {
                            hiddenInput = document.createElement('input');
                            hiddenInput.type = 'hidden';
                            hiddenInput.id = 'myPhotoData';
                            hiddenInput.name = 'photoData';
                            document.getElementById('myProfileForm').appendChild(hiddenInput);
                        }
                        hiddenInput.value = photoData;
                        
                    } catch (error) {
                        console.log('Usuário cancelou');
                    }
                } else {
                    // Fallback: input file (navegador)
                    myPhotoInput.click();
                }
            });
        }

        // Preview da foto (fallback para navegador)
        const photoInput = document.getElementById('myPhotoInput');
        if (photoInput) {
            photoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    // Verificar tamanho (5MB)
                    if (file.size > 5 * 1024 * 1024) {
                        showNotification('A foto deve ter no máximo 5MB', 'error');
                        e.target.value = '';
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const preview = document.getElementById('myPhotoPreview');
                        if (preview) {
                            preview.innerHTML = `<img src="${e.target.result}" alt="Preview" class="w-24 h-24 rounded-full object-cover">`;
                            preview.className = "w-24 h-24 rounded-full overflow-hidden border-2 border-[var(--accent-primary)]";
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        document.getElementById('myProfileForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const profileData = {
                name: formData.get('name')
            };

            try {
                // Upload da foto se houver
                const photoFile = formData.get('photo');
                if (photoFile && photoFile.size > 0) {
                    showNotification('Fazendo upload da foto...', 'info');
                    const photoUrl = await uploadPhoto(photoFile, 'staff');
                    profileData.photo_url = photoUrl;
                }

                await db.updateStaff(currentStaff.id, profileData);
                const index = appState.staff.findIndex(s => s.id === currentStaff.id);
                if (index !== -1) {
                    appState.staff[index] = { ...currentStaff, ...profileData };
                }
                
                hideModal();
                showNotification('✅ Perfil atualizado com sucesso!');
                
                // Atualizar sidebar
                updateHeaderStaffInfo();
            } catch (error) {
                console.error('Erro ao salvar perfil:', error);
                showNotification('Erro ao salvar perfil: ' + error.message, 'error');
            }
        });
    };

    // Função para customizar horário de um dia específico
    window.showDayScheduleModal = async function(date) {
        const t = getTranslations();
        const currentStaff = appState.staff.find(s => 
            s.user_id === appState.currentUser?.id || 
            s.email === appState.currentUser?.email
        );

        if (!currentStaff) {
            showNotification('Funcionário não encontrado', 'error');
            return;
        }

        // Buscar horário customizado para este dia, se existir
        const existingSchedule = await db.getDailySchedule(currentStaff.id, date);
        
        // 🔒 PROTEÇÃO: Verificar se é dia de folga
        const isDayOff = existingSchedule?.is_day_off === true;
        const userIsAdmin = isAdmin();
        
        // Funcionárias NÃO podem editar/remover dias de folga - apenas admin pode
        if (isDayOff && !userIsAdmin) {
            showModal(`
                <div class="bg-[var(--bg-primary)] rounded-lg max-w-md w-full mx-4 border border-[var(--border-color)]">
                    <div class="p-6">
                        <div class="flex items-center space-x-3 mb-4">
                            <div class="text-4xl">🔒</div>
                            <h3 class="text-xl font-bold text-[var(--text-primary)]">Dia de Folga</h3>
                        </div>
                        <p class="text-[var(--text-secondary)] mb-4">
                            Este dia foi marcado como folga pelo administrador. Apenas o administrador pode modificar ou remover dias de folga.
                        </p>
                        <div class="flex justify-end">
                            <button type="button" onclick="hideModal()" 
                                class="px-4 py-2 text-sm font-medium text-white bg-[var(--accent-primary)] rounded-md hover:bg-[var(--accent-secondary)]">
                                Entendi
                            </button>
                        </div>
                    </div>
                </div>
            `);
            return;
        }
        
        // Valores padrão
        const defaultStart = currentStaff.default_start_time || '08:00';
        const defaultEnd = currentStaff.default_end_time || '18:00';

        const dateObj = new Date(date + 'T00:00:00');
        const dateFormatted = dateObj.toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        showModal(`
            <div class="bg-[var(--bg-primary)] rounded-lg max-w-2xl w-full mx-4 border border-[var(--border-color)]">
                <div class="p-6">
                    <h3 class="text-xl font-bold mb-2 text-[var(--text-primary)]">
                        ⏰ Customizar Horário
                    </h3>
                    <p class="text-sm text-[var(--text-secondary)] mb-6">${dateFormatted}</p>
                    
                    <form id="dayScheduleForm" class="space-y-6">
                        <!-- Horários -->
                        <div class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <!-- Início do Expediente -->
                                <div>
                                    <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                        🕐 Início do Expediente
                                    </label>
                                    <input type="time" name="start_time" required
                                        value="${existingSchedule?.start_time || defaultStart}"
                                        class="block w-full px-4 py-3 text-lg border border-[var(--border-color)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]">
                                </div>

                                <!-- Fim do Expediente -->
                                <div>
                                    <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                        🕔 Fim do Expediente
                                    </label>
                                    <input type="time" name="end_time" required
                                        value="${existingSchedule?.end_time || defaultEnd}"
                                        class="block w-full px-4 py-3 text-lg border border-[var(--border-color)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]">
                                </div>
                            </div>

                            <!-- Observações -->
                            <div>
                                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    📝 Observações
                                </label>
                                <textarea name="notes" rows="2" placeholder="Ex: Reunião às 14h, sair mais cedo..."
                                    class="block w-full px-4 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]">${existingSchedule?.notes || ''}</textarea>
                            </div>
                            
                            <div class="bg-[var(--accent-light)] border border-[var(--border-color)] rounded-lg p-4">
                                <div class="flex items-start space-x-3">
                                    <div class="text-xl">💡</div>
                                    <div class="text-sm text-[var(--text-primary)]">
                                        <strong>Dica:</strong> Para solicitar folga, use a opção "Solicitar Fechamento de Agenda" na aba <strong>Meus Horários</strong>.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Botões de Ação -->
                        <div class="flex justify-between items-center pt-4 border-t border-[var(--border-color)]">
                            ${existingSchedule && !isDayOff ? `
                                <button type="button" onclick="deleteDaySchedule('${currentStaff.id}', '${date}')"
                                    class="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 border border-red-200">
                                    🗑️ Remover Customização
                                </button>
                            ` : '<div></div>'}
                            <div class="flex space-x-3">
                                <button type="button" onclick="hideModal()" 
                                    class="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-md hover:bg-[var(--accent-light)] border border-[var(--border-color)]">
                                    Cancelar
                                </button>
                                <button type="submit" 
                                    class="px-4 py-2 text-sm font-medium text-white bg-[var(--accent-primary)] rounded-md hover:bg-[var(--accent-secondary)]">
                                    💾 Salvar
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `);

        // Submit do formulário
        document.getElementById('dayScheduleForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            try {
                const scheduleData = {
                    staff_id: currentStaff.id,
                    date: date,
                    is_day_off: false, // NUNCA permite marcar como folga - deve usar solicitação
                    start_time: formData.get('start_time'),
                    end_time: formData.get('end_time'),
                    lunch_start: null, // Usa horário padrão
                    lunch_end: null, // Usa horário padrão
                    notes: formData.get('notes')
                };

                await db.setDailySchedule(scheduleData);
                
                hideModal();
                showNotification('✅ Horário customizado com sucesso!');
                
                // Atualizar visualização do calendário
                await refreshCurrentView();
            } catch (error) {
                console.error('Erro ao salvar horário:', error);
                showNotification('❌ Erro ao salvar horário. Tente novamente.', 'error');
            }
        });
    };

    // Função para remover customização de um dia
    window.deleteDaySchedule = async function(staffId, date) {
        // 🔒 PROTEÇÃO: Verificar se é dia de folga
        const existingSchedule = await db.getDailySchedule(staffId, date);
        const isDayOff = existingSchedule?.is_day_off === true;
        const userIsAdmin = isAdmin();
        
        // Funcionárias NÃO podem remover dias de folga - apenas admin pode
        if (isDayOff && !userIsAdmin) {
            showNotification('❌ Apenas o administrador pode remover dias de folga', 'error');
            return;
        }
        
        const confirmed = await showConfirm(
            'A customização será removida e o horário padrão será aplicado.',
            'Remover Customização',
            {
                confirmText: 'Remover',
                cancelText: 'Cancelar',
                type: 'warning',
                icon: '⚙️'
            }
        );
        
        if (!confirmed) {
            return;
        }

        try {
            await db.deleteDailySchedule(staffId, date);
            hideModal();
            showNotification('✅ Customização removida!');
            await refreshCurrentView();
        } catch (error) {
            console.error('Erro ao remover customização:', error);
            showNotification('❌ Erro ao remover customização. Tente novamente.', 'error');
        }
    };

    // Função específica para editar folga (apenas admin)
    window.showEditDayOffModal = async function(date, staffId = null) {
        const userIsAdmin = isAdmin();
        
        if (!userIsAdmin) {
            showNotification('❌ Apenas administradores podem editar folgas', 'error');
            return;
        }

        // Se staffId não foi fornecido, pegar do filtro atual
        if (!staffId) {
            staffId = appState.selectedStaffId || null;
        }

        const targetStaff = appState.staff.find(s => s.id === staffId);
        if (!targetStaff) {
            showNotification('❌ Funcionário não encontrado', 'error');
            return;
        }

        // Buscar informações da folga
        const existingSchedule = await db.getDailySchedule(staffId, date);
        
        const dateObj = new Date(date + 'T00:00:00');
        const dateFormatted = dateObj.toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        showModal(`
            <div class="bg-[var(--bg-primary)] rounded-lg max-w-md w-full mx-4 border border-[var(--border-color)]">
                <div class="p-6">
                    <div class="flex items-center space-x-3 mb-4">
                        <div class="text-3xl">🌴</div>
                        <div>
                            <h3 class="text-xl font-bold text-[var(--text-primary)]">Editar Folga</h3>
                            <p class="text-sm text-[var(--text-secondary)]">${targetStaff.name}</p>
                        </div>
                    </div>
                    
                    <p class="text-sm text-[var(--text-secondary)] mb-6">${dateFormatted}</p>
                    
                    <form id="editDayOffForm" class="space-y-4">
                        <!-- Observações -->
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                📝 Observações (opcional)
                            </label>
                            <textarea name="notes" rows="3" placeholder="Ex: Viagem, compromisso pessoal, feriado..."
                                class="block w-full px-4 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]">${existingSchedule?.notes || ''}</textarea>
                        </div>

                        <div class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-3">
                            <div class="flex items-start space-x-2">
                                <div class="text-lg">ℹ️</div>
                                <div class="text-xs text-orange-800 dark:text-orange-300">
                                    Este dia já está marcado como folga. Você pode atualizar as observações ou remover a folga completamente.
                                </div>
                            </div>
                        </div>

                        <!-- Botões de Ação -->
                        <div class="flex flex-col space-y-2 pt-4">
                            <button type="submit" 
                                class="w-full px-4 py-2 text-sm font-medium text-white bg-[var(--accent-primary)] rounded-md hover:bg-[var(--accent-secondary)] transition-colors">
                                💾 Salvar Alterações
                            </button>
                            
                            <button type="button" onclick="removeDayOff('${staffId}', '${date}')"
                                class="w-full px-4 py-2 text-sm font-medium text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                                🗑️ Remover Folga
                            </button>
                            
                            <button type="button" onclick="hideModal()" 
                                class="w-full px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-md hover:bg-[var(--accent-light)] border border-[var(--border-color)] transition-colors">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `);

        // Adicionar handler do formulário
        document.getElementById('editDayOffForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const notes = formData.get('notes');

            try {
                // Atualizar apenas as observações da folga
                await db.saveDailySchedule({
                    staff_id: staffId,
                    date: date,
                    is_day_off: true,
                    notes: notes || null,
                    start_time: null,
                    end_time: null
                });

                hideModal();
                showNotification('✅ Folga atualizada com sucesso!');
                await refreshCurrentView();
            } catch (error) {
                console.error('Erro ao atualizar folga:', error);
                showNotification('❌ Erro ao atualizar folga. Tente novamente.', 'error');
            }
        });
    };

    // Função para remover folga (apenas admin)
    window.removeDayOff = async function(staffId, date) {
        const confirmed = await showConfirm(
            'A folga será removida e o funcionário voltará a ter horário normal neste dia.',
            'Remover Folga',
            {
                confirmText: 'Remover Folga',
                cancelText: 'Cancelar',
                type: 'warning',
                icon: '🗑️'
            }
        );
        
        if (!confirmed) {
            return;
        }

        try {
            await db.deleteDailySchedule(staffId, date);
            hideModal();
            showNotification('✅ Folga removida com sucesso!');
            await refreshCurrentView();
        } catch (error) {
            console.error('Erro ao remover folga:', error);
            showNotification('❌ Erro ao remover folga. Tente novamente.', 'error');
        }
    };

    function showProductModal(product = null) {
        const t = getTranslations();
        const isEdit = !!product;
        
        showModal(`
            <div class="bg-[var(--bg-primary)] rounded-lg max-w-md w-full mx-4 border border-[var(--border-color)]">
                <div class="p-6">
                    <h3 class="text-lg font-medium mb-4 text-[var(--text-primary)]">${isEdit ? t.editProduct : t.newProduct}</h3>
                    <form id="productForm" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.productName}</label>
                            <input type="text" name="name" value="${product?.name || ''}" required
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.productDescription}</label>
                            <textarea name="description" rows="3"
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">${product?.description || ''}</textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.productPrice}</label>
                                <input type="number" name="price" value="${product?.price || ''}" step="0.01" min="0" required
                                    class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.productStock}</label>
                                <input type="number" name="stock" value="${product?.stock || 0}" min="0" required
                                    class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">Foto do Produto</label>
                            <div class="flex items-center space-x-4">
                                ${product?.photo_url ? `
                                    <img id="productPhotoPreview" src="${product.photo_url}" alt="Foto do produto" class="w-20 h-20 rounded-lg object-cover border-2 border-[var(--border-color)]">
                                ` : `
                                    <div id="productPhotoPreview" class="w-20 h-20 rounded-lg bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border-color)] flex items-center justify-center">
                                        <svg class="w-8 h-8 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                        </svg>
                                    </div>
                                `}
                                <div class="flex-1">
                                    <input type="file" id="productPhotoInput" name="photo" accept="image/*" class="hidden">
                                    <button type="button" onclick="document.getElementById('productPhotoInput').click()"
                                        class="w-full px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-md hover:bg-[var(--accent-light)] border border-[var(--border-color)]">
                                        Escolher Foto
                                    </button>
                                    <p class="text-xs text-[var(--text-secondary)] mt-1">PNG, JPG até 10MB</p>
                                </div>
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

        // Preview da foto
        const photoInput = document.getElementById('productPhotoInput');
        if (photoInput) {
            photoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const preview = document.getElementById('productPhotoPreview');
                        if (preview) {
                            preview.innerHTML = `<img src="${e.target.result}" alt="Preview" class="w-20 h-20 rounded-lg object-cover">`;
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        document.getElementById('productForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const productData = {
                name: formData.get('name'),
                description: formData.get('description') || '',
                price: parseFloat(formData.get('price')),
                stock: parseInt(formData.get('stock')) || 0
            };

            try {
                // Upload da foto se houver
                const photoFile = formData.get('photo');
                if (photoFile && photoFile.size > 0) {
                    const photoUrl = await uploadPhoto(photoFile, 'products');
                    productData.photo_url = photoUrl;
                }

                if (isEdit) {
                    await db.updateProduct(product.id, productData);
                    const index = appState.products.findIndex(p => p.id === product.id);
                    if (index !== -1) {
                        appState.products[index] = { ...product, ...productData };
                    }
                } else {
                    const newProduct = await db.addProduct(productData);
                    appState.products.push(newProduct);
                }
                renderProducts();
                hideModal();
                showNotification(t.productSaved);
            } catch (error) {
                console.error('Erro ao salvar produto:', error);
                showNotification('Erro ao salvar produto: ' + error.message, 'error');
            }
        });
    }

    async function uploadPhoto(file, folder = 'photos') {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { data, error } = await window.supabase.storage
            .from('photos')
            .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = window.supabase.storage
            .from('photos')
            .getPublicUrl(filePath);

        return publicUrl;
    }

    function showAppointmentModal(appointment = null, dateStr = null, timeStr = null) {
        const t = getTranslations();
        const isEdit = !!appointment;
        
        // Verificar permissões para criar/editar agendamentos
        if (!isEdit && !canCreateAppointments()) {
            showModal(`
                <div class="bg-[var(--bg-primary)] rounded-lg max-w-md w-full mx-4 border border-[var(--border-color)]">
                    <div class="p-6 text-center">
                        <div class="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                            <svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.5 0L4.732 8.5c-.77.833-.192 2.5 1.732 2.5z"></path>
                            </svg>
                        </div>
                        <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-2">Acesso Restrito</h3>
                        <p class="text-[var(--text-secondary)] mb-4">
                            Apenas administradores e recepcionistas podem criar novos agendamentos.
                        </p>
                        <button onclick="closeModal()" class="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)]">
                            Entendi
                        </button>
                    </div>
                </div>
            `);
            return;
        }
        
        // VALIDAÇÃO DE DATA PASSADA - Admin pode criar em qualquer data
        if (!isEdit && dateStr && getUserRole() !== 'admin') {
            if (isDateInPast(dateStr)) {
                showModal(`
                    <div class="bg-[var(--bg-primary)] rounded-lg max-w-md w-full mx-4 border border-[var(--border-color)]">
                        <div class="p-6 text-center">
                            <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                                <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <h3 class="text-lg font-medium mb-2 text-[var(--text-primary)]">Data Inválida</h3>
                            <p class="text-[var(--text-secondary)] mb-4">Não é possível agendar para datas que já passaram.</p>
                            <p class="text-xs text-[var(--text-secondary)] italic">💡 Apenas administradores podem criar agendamentos retroativos.</p>
                            <button onclick="hideModal()" 
                                class="px-4 py-2 text-sm font-medium text-white bg-[var(--accent-primary)] rounded-md hover:bg-[var(--accent-secondary)]">
                                Entendi
                            </button>
                        </div>
                    </div>
                `);
                return;
            }
        }
        
        // Se não for edição, preparar valores padrão
        const defaultDate = dateStr || getLocalDateString(new Date());
        const defaultTime = timeStr || '';
        
        // Obter data mínima - Admin pode qualquer data, outros só hoje em diante
        const today = new Date();
        const minDate = getUserRole() === 'admin' ? null : today.toISOString().split('T')[0];
        
        // Determinar horários baseado no staff selecionado (se houver filtro ativo)
        let workingStart = appState.settings.workingHours.start;
        let workingEnd = appState.settings.workingHours.end;
        let lunchStart = appState.settings.lunchTime?.start || '12:00';
        let lunchEnd = appState.settings.lunchTime?.end || '13:00';
        let slotDuration = appState.settings.appointmentDuration || 45;
        
        // Verificar se há um staff selecionado no filtro
        let selectedStaff = null;
        if (appState.selectedManicuristId) {
            selectedStaff = appState.staff.find(s => s.id === appState.selectedManicuristId);
        } else if (appState.selectedHairdresserId) {
            selectedStaff = appState.staff.find(s => s.id === appState.selectedHairdresserId);
        }
        
        // Se há staff selecionado, usar horários dele
        if (selectedStaff) {
            workingStart = selectedStaff.default_start_time || workingStart;
            workingEnd = selectedStaff.default_end_time || workingEnd;
            lunchStart = selectedStaff.default_lunch_start || lunchStart;
            lunchEnd = selectedStaff.default_lunch_end || lunchEnd;
            slotDuration = getStaffSlotDuration(selectedStaff);
            
            // Verificar se almoço está ativo
            if (!isLunchActiveToday(selectedStaff)) {
                lunchStart = '00:00';
                lunchEnd = '00:00';
            }
            
            // IMPORTANTE: Verificar horário personalizado do dia (assíncrono)
            if (defaultDate && selectedStaff) {
                db.getDailySchedule(selectedStaff.id, defaultDate).then(customSchedule => {
                    if (customSchedule && !customSchedule.is_day_off) {
                        // Atualizar horários para os customizados
                        const updatedSlots = generateTimeSlots(
                            customSchedule.start_time,
                            customSchedule.end_time,
                            slotDuration,
                            customSchedule.lunch_start || '00:00',
                            customSchedule.lunch_end || '00:00'
                        );
                        
                        // Atualizar o select de horários
                        const timeSelect = document.getElementById('appointmentTime');
                        if (timeSelect) {
                            timeSelect.innerHTML = `
                                <option value="">${t.selectTime || 'Selecione o horário'}</option>
                                ${updatedSlots.map(slot => `
                                    <option value="${slot.time}" ${defaultTime === slot.time ? 'selected' : ''}>
                                        ${slot.time}${slot.isLunchTime ? ' (Almoço)' : ''}
                                    </option>
                                `).join('')}
                            `;
                        }
                    }
                }).catch(error => {
                    console.error('Erro ao buscar horário customizado:', error);
                });
            }
        }
        
        // Gerar horários válidos baseados no staff (se selecionado) ou configuração global
        const validTimeSlots = generateTimeSlots(
            workingStart,
            workingEnd,
            slotDuration,
            lunchStart,
            lunchEnd
        );
        
        showModal(`
            <div class="bg-[var(--bg-primary)] rounded-lg max-w-md w-full mx-4 border border-[var(--border-color)]">
                <div class="p-6">
                    <h3 class="text-lg font-medium mb-4 text-[var(--text-primary)]">${isEdit ? 'Editar Agendamento' : t.newAppointment}</h3>
                    <form id="appointmentForm" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.selectClient}</label>
                            <select name="client_id" required class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                                <option value="" class="bg-[var(--bg-secondary)] text-[var(--text-primary)]">${t.selectClient}</option>
                                ${appState.clients.map(client => 
                                    `<option value="${client.id}" class="bg-[var(--bg-secondary)] text-[var(--text-primary)]" ${appointment?.client_id === client.id ? 'selected' : ''}>${client.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.selectStaff}</label>
                            <select id="staff-select" name="staff_id" required class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                                <option value="" class="bg-[var(--bg-secondary)] text-[var(--text-primary)]">${t.selectStaff}</option>
                                ${getVisibleStaffForBooking().map(staff => 
                                    `<option value="${staff.id}" data-role="${staff.role}" class="bg-[var(--bg-secondary)] text-[var(--text-primary)]" ${appointment?.staff_id === staff.id ? 'selected' : ''}>${staff.name} (${staff.role === 'manicurist' ? '💅 Manicure' : '💇 Cabeleireira'})</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.date}</label>
                            <input type="date" name="date" value="${appointment?.date || defaultDate}" required
                                ${!isEdit && minDate ? `min="${minDate}"` : ''}
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                            ${getUserRole() === 'admin' && !isEdit ? `
                                <p class="text-xs text-orange-600 dark:text-orange-400 mt-1 italic">
                                    💡 Como admin, você pode criar agendamentos em qualquer data (inclusive passadas)
                                </p>
                            ` : ''}
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.time}</label>
                            <select name="time" required class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                                <option value="" class="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Selecione um horário</option>
                                ${validTimeSlots.filter(slot => !slot.isLunchTime).map(slot => 
                                    `<option value="${slot.time}" class="bg-[var(--bg-secondary)] text-[var(--text-primary)]" ${appointment?.time === slot.time || defaultTime === slot.time ? 'selected' : ''}>${formatTime(slot.time)}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">⏱️ Duração (minutos)</label>
                            <select id="duration-select" name="duration" required class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                                <option value="">Selecione o funcionário primeiro</option>
                            </select>
                            <p class="text-xs text-[var(--text-secondary)] mt-1 italic">
                                💡 A duração varia conforme o tipo de profissional selecionado
                            </p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.notes}</label>
                            <textarea name="notes" rows="3"
                                class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">${appointment?.notes || ''}</textarea>
                        </div>
                        ${isEdit ? `
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)]">Status</label>
                            <select name="status" class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                                <option value="scheduled" class="bg-[var(--bg-secondary)] text-[var(--text-primary)]" ${appointment?.status === 'scheduled' ? 'selected' : ''}>Agendado</option>
                                <option value="completed" class="bg-[var(--bg-secondary)] text-[var(--text-primary)]" ${appointment?.status === 'completed' ? 'selected' : ''}>Concluído</option>
                                <option value="cancelled" class="bg-[var(--bg-secondary)] text-[var(--text-primary)]" ${appointment?.status === 'cancelled' ? 'selected' : ''}>Cancelado</option>
                                <option value="no-show" class="bg-[var(--bg-secondary)] text-[var(--text-primary)]" ${appointment?.status === 'no-show' ? 'selected' : ''}>Não compareceu</option>
                            </select>
                        </div>
                        ` : ''}
                        <div class="flex ${isEdit ? 'justify-between' : 'justify-end'} space-x-3 pt-4">
                            ${isEdit && getUserRole() === 'admin' ? `
                                <button type="button" onclick="deleteCurrentAppointment('${appointment.id}')" 
                                    class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                                    🗑️ Excluir
                                </button>
                            ` : ''}
                            <div class="flex space-x-3 ${!isEdit ? 'w-full justify-end' : 'ml-auto'}">
                                <button type="button" onclick="hideModal()" 
                                    class="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-md hover:bg-[var(--accent-light)] border border-[var(--border-color)]">
                                    ${t.cancel}
                                </button>
                                <button type="submit" 
                                    class="px-4 py-2 text-sm font-medium text-white bg-[var(--accent-primary)] rounded-md hover:bg-[var(--accent-secondary)]">
                                    ${t.save}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `);

        // ✨ FUNÇÃO PARA ATUALIZAR DURAÇÃO BASEADA NO CARGO DO FUNCIONÁRIO
        function updateDurationOptions() {
            const staffSelect = document.getElementById('staff-select');
            const durationSelect = document.getElementById('duration-select');
            
            if (!staffSelect || !durationSelect) return;
            
            const selectedOption = staffSelect.options[staffSelect.selectedIndex];
            const role = selectedOption?.dataset?.role;
            
            if (!role) {
                durationSelect.innerHTML = '<option value="">Selecione o funcionário primeiro</option>';
                return;
            }
            
            let options = [];
            let baseSlot = 0;
            
            if (role === 'manicurist') {
                // Manicures: 45 minutos por slot
                options = [
                    { value: 45, label: '45 minutos (1 slot)' },
                    { value: 90, label: '90 minutos (2 slots)' },
                    { value: 135, label: '135 minutos (3 slots)' },
                    { value: 180, label: '180 minutos (4 slots)' }
                ];
                baseSlot = 45;
            } else if (role === 'hairdresser') {
                // Cabeleireiras: 30 minutos por slot
                options = [
                    { value: 30, label: '30 minutos (1 slot)' },
                    { value: 60, label: '60 minutos (2 slots)' },
                    { value: 90, label: '90 minutos (3 slots)' },
                    { value: 120, label: '120 minutos (4 slots)' }
                ];
                baseSlot = 30;
            } else {
                // Outro cargo: opções padrão
                options = [
                    { value: 30, label: '30 minutos' },
                    { value: 45, label: '45 minutos' },
                    { value: 60, label: '60 minutos' },
                    { value: 90, label: '90 minutos' },
                    { value: 120, label: '120 minutos' }
                ];
            }
            
            durationSelect.innerHTML = options.map(opt => 
                `<option value="${opt.value}" class="bg-[var(--bg-secondary)] text-[var(--text-primary)]">${opt.label}</option>`
            ).join('');
        }

        // Função para atualizar os horários disponíveis baseado no funcionário e data selecionados
        async function updateAvailableTimeSlots() {
            const staffSelect = document.querySelector('[name="staff_id"]');
            const dateInput = document.querySelector('[name="date"]');
            const timeSelect = document.querySelector('[name="time"]');
            
            const selectedStaffId = staffSelect.value;
            const selectedDate = dateInput.value;
            
            if (!selectedStaffId || !selectedDate) {
                // Se não tiver staff ou data, usar horários globais padrão
                const validTimeSlots = generateTimeSlots(
                    appState.settings.workingHours.start,
                    appState.settings.workingHours.end,
                    appState.settings.appointmentDuration || 45, // Padrão: 45 minutos
                    appState.settings.lunchTime?.start || '12:00',
                    appState.settings.lunchTime?.end || '13:00'
                );
                
                const currentValue = timeSelect.value;
                timeSelect.innerHTML = `
                    <option value="">Selecione um horário</option>
                    ${validTimeSlots.filter(slot => !slot.isLunchTime).map(slot => 
                        `<option value="${slot.time}" ${currentValue === slot.time ? 'selected' : ''}>${formatTime(slot.time)}</option>`
                    ).join('')}
                `;
                return;
            }
            
            // Buscar funcionário selecionado
            const selectedStaff = appState.staff.find(s => s.id === selectedStaffId);
            if (!selectedStaff) return;
            
            // Buscar horário customizado para este dia
            let customSchedule = null;
            try {
                customSchedule = await db.getDailySchedule(selectedStaffId, selectedDate);
            } catch (error) {
                console.error('Erro ao buscar horário customizado:', error);
            }
            
            // 🚫 BLOQUEAR SE FOR DIA DE FOLGA
            if (customSchedule && customSchedule.is_day_off) {
                timeSelect.innerHTML = `
                    <option value="">🚫 Funcionário está de folga neste dia</option>
                `;
                timeSelect.disabled = true;
                showNotification('⚠️ Este funcionário está de folga no dia selecionado', 'error');
                return;
            }
            
            // Reabilitar select se não for folga
            timeSelect.disabled = false;
            
            // Determinar horários a usar (customizado > padrão do staff > global)
            let workingStart, workingEnd, lunchStart, lunchEnd;
            
            if (customSchedule && !customSchedule.is_day_off) {
                // Usar horário customizado
                workingStart = customSchedule.start_time;
                workingEnd = customSchedule.end_time;
                lunchStart = customSchedule.lunch_start || '12:00';
                lunchEnd = customSchedule.lunch_end || '13:00';
            } else if (selectedStaff.default_start_time) {
                // Usar horário padrão do funcionário
                workingStart = selectedStaff.default_start_time;
                workingEnd = selectedStaff.default_end_time;
                lunchStart = selectedStaff.default_lunch_start || '12:00';
                lunchEnd = selectedStaff.default_lunch_end || '13:00';
            } else {
                // Usar horários globais
                workingStart = appState.settings.workingHours.start;
                workingEnd = appState.settings.workingHours.end;
                lunchStart = appState.settings.lunchTime?.start || '12:00';
                lunchEnd = appState.settings.lunchTime?.end || '13:00';
            }
            
            // Verificar se o almoço está ativo hoje
            if (!isLunchActiveToday(selectedStaff)) {
                lunchStart = '00:00';
                lunchEnd = '00:00';
            }
            
            // Obter duração dos slots baseado no funcionário
            const appointmentDuration = getStaffSlotDuration(selectedStaff);
            
            // Gerar slots de tempo
            const validTimeSlots = generateTimeSlots(
                workingStart,
                workingEnd,
                appointmentDuration,
                lunchStart,
                lunchEnd
            );
            
            // Atualizar o select de horários
            const currentValue = timeSelect.value;
            timeSelect.innerHTML = `
                <option value="">Selecione um horário</option>
                ${validTimeSlots.filter(slot => !slot.isLunchTime).map(slot => 
                    `<option value="${slot.time}" ${currentValue === slot.time ? 'selected' : ''}>${formatTime(slot.time)}</option>`
                ).join('')}
            `;
        }
        
        // Adicionar listeners para atualizar horários quando funcionário ou data mudarem
        const staffSelect = document.querySelector('[name="staff_id"]');
        const dateInput = document.querySelector('[name="date"]');
        
        if (staffSelect) {
            staffSelect.addEventListener('change', () => {
                updateAvailableTimeSlots();
                updateDurationOptions(); // ✨ Atualiza durações quando muda funcionário
            });
        }
        
        if (dateInput) {
            dateInput.addEventListener('change', updateAvailableTimeSlots);
        }
        
        // Atualizar horários e durações inicialmente se já tiver staff e data selecionados
        if (appointment?.staff_id && appointment?.date) {
            updateAvailableTimeSlots();
            updateDurationOptions(); // ✨ Inicializa durações
        }

        document.getElementById('appointmentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const appointmentData = {
                client_id: formData.get('client_id'),
                staff_id: formData.get('staff_id'),
                service_id: formData.get('service_id'), // Adicionar service_id
                date: formData.get('date'),
                time: formData.get('time'),
                duration: parseInt(formData.get('duration')) || 30, // 🆕 DURAÇÃO EM MINUTOS
                notes: formData.get('notes'),
                status: formData.get('status') || 'scheduled'
            };
            
            try {
                // 🔒 VERIFICAR CONFLITO DE HORÁRIOS (exceto ao editar o próprio agendamento)
                if (!isEdit || appointment.staff_id !== appointmentData.staff_id || 
                    appointment.date !== appointmentData.date || appointment.time !== appointmentData.time ||
                    appointment.duration !== appointmentData.duration) {
                    
                    const hasConflict = await checkTimeConflict(
                        appointmentData.staff_id,
                        appointmentData.date,
                        appointmentData.time,
                        appointmentData.duration, // 🆕 PASSAR DURAÇÃO
                        isEdit ? appointment.id : null
                    );
                    
                    if (hasConflict) {
                        showNotification('⚠️ Este horário já está ocupado para este profissional!', 'error');
                        return;
                    }
                }
                
                if (isEdit) {
                    const updatedAppointment = await db.updateAppointment(appointment.id, appointmentData);
                    const index = appState.appointments.findIndex(a => a.id === appointment.id);
                    if (index !== -1) {
                        appState.appointments[index] = updatedAppointment;
                    }
                } else {
                    const newAppointment = await db.addAppointment(appointmentData);
                    appState.appointments.push(newAppointment);
                    
                    // 🔔 NOTIFICAR O FUNCIONÁRIO sobre o novo agendamento
                    await notifyStaffAboutNewAppointment(newAppointment, appointmentData);
                }
                
                // Recarregar dados para garantir sincronização
                appState.appointments = await db.getAppointments();
                
                // Atualizar a visualização atual
                if (appState.currentView === 'calendarView') {
                    renderCalendar();
                }
                
                hideModal();
                showNotification(isEdit ? '✅ Agendamento atualizado com sucesso!' : '✅ Agendamento criado com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao salvar agendamento:', error);
                showNotification('Erro ao salvar agendamento: ' + (error.message || 'Erro desconhecido'), 'error');
            }
        });
    }

    // 🔒 Função para verificar conflito de horários considerando duração e pausas/handoffs
    async function checkTimeConflict(staffId, date, startTime, duration, excludeAppointmentId = null) {
        try {
            // Buscar todos os agendamentos do funcionário nesta data
            const staffAppointments = appState.appointments.filter(a => 
                a.staff_id === staffId && 
                a.date === date && 
                a.status !== 'cancelled' &&
                (excludeAppointmentId ? a.id !== excludeAppointmentId : true)
            );
            
            // Se não há agendamentos, está livre
            if (staffAppointments.length === 0) return false;
            
            // Gerar todos os slots de 30min que o novo agendamento vai ocupar
            const requestedSlots = [];
            const durationInMinutes = duration || 30;
            const slotsCount = Math.ceil(durationInMinutes / 30);
            
            for (let i = 0; i < slotsCount; i++) {
                const slotTime = addMinutesToTime(startTime, i * 30);
                requestedSlots.push(slotTime);
            }
            
            // Para cada agendamento existente, verificar se algum slot solicitado conflita
            for (const existingAppt of staffAppointments) {
                // Buscar handoffs deste agendamento
                const handoffs = await db.getAppointmentHandoffs(existingAppt.id);
                
                // Gerar todos os slots que o agendamento existente ocupa
                const existingDuration = existingAppt.duration || 30;
                const existingSlotsCount = Math.ceil(existingDuration / 30);
                const existingSlots = [];
                
                for (let i = 0; i < existingSlotsCount; i++) {
                    const slotTime = addMinutesToTime(existingAppt.time, i * 30);
                    existingSlots.push(slotTime);
                }
                
                // Verificar se ALGUM slot solicitado conflita com ALGUM slot existente
                for (const requestedSlot of requestedSlots) {
                    // Verificar se este slot está dentro de uma pausa (handoff)
                    const isInHandoff = handoffs.some(handoff => {
                        return requestedSlot >= handoff.start_time && requestedSlot < handoff.end_time;
                    });
                    
                    // Se está em pausa/handoff, o profissional está LIVRE neste horário
                    if (isInHandoff) {
                        continue; // Pular este slot - não há conflito
                    }
                    
                    // Se NÃO está em pausa, verificar se conflita com algum slot existente
                    if (existingSlots.includes(requestedSlot)) {
                        return true; // CONFLITO! Horário ocupado
                    }
                }
            }
            
            return false; // Sem conflitos - todos os slots estão livres
        } catch (error) {
            console.error('Erro ao verificar conflito:', error);
            return false; // Em caso de erro, permitir (admin pode resolver depois)
        }
    }

    // Função para excluir agendamento (apenas admin)
    async function deleteCurrentAppointment(appointmentId) {
        const t = getTranslations();
        
        // Verificar permissão de admin
        if (getUserRole() !== 'admin') {
            showNotification('🚫 Apenas administradores podem excluir agendamentos', 'error');
            return;
        }
        
        const confirmed = await showConfirm(
            'Este agendamento será EXCLUÍDO PERMANENTEMENTE do sistema.\n\nEsta ação não pode ser desfeita!',
            'Excluir Agendamento',
            {
                confirmText: 'Sim, Excluir',
                cancelText: 'Cancelar',
                type: 'danger',
                icon: '⚠️'
            }
        );
        
        if (!confirmed) {
            return;
        }
        
        try {
            // Primeiro, excluir os serviços vinculados ao agendamento
            await db.deleteAppointmentServices(appointmentId);
            
            // Depois excluir o agendamento
            await db.deleteAppointment(appointmentId);
            
            // Remover do estado local
            const index = appState.appointments.findIndex(a => a.id === appointmentId);
            if (index !== -1) {
                appState.appointments.splice(index, 1);
            }
            
            // Recarregar dados
            appState.appointments = await db.getAppointments();
            
            // Fechar modal e atualizar visualização
            hideModal();
            
            if (appState.currentView === 'calendarView') {
                renderCalendar();
            }
            
            showNotification('✅ Agendamento excluído com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao excluir agendamento:', error);
            showNotification('❌ Erro ao excluir agendamento: ' + (error.message || 'Erro desconhecido'), 'error');
        }
    }
    
    // Disponibilizar função globalmente
    window.deleteCurrentAppointment = deleteCurrentAppointment;

    // 🔔 Função para notificar funcionário sobre novo agendamento
    async function notifyStaffAboutNewAppointment(appointment, appointmentData) {
        try {
            // Buscar informações do funcionário
            const staff = appState.staff.find(s => s.id === appointmentData.staff_id);
            if (!staff) return;
            
            // Buscar informações do cliente
            const client = appState.clients.find(c => c.id === appointmentData.client_id);
            const clientName = client?.name || 'Cliente';
            
            // Formatar data e hora
            const appointmentDate = new Date(appointmentData.date + 'T' + appointmentData.time);
            const dateFormatted = appointmentDate.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit',
                year: 'numeric'
            });
            const timeFormatted = appointmentData.time;
            
            // Criar mensagem de notificação
            const notificationTitle = '📅 Novo Agendamento!';
            const notificationBody = `${clientName} - ${dateFormatted} às ${timeFormatted}`;
            
            // Adicionar ao sino de notificações (SEMPRE, independente das configurações)
            addNotificationToBell({
                id: appointment.id,
                type: 'new_appointment',
                title: notificationTitle,
                message: notificationBody,
                staffId: staff.id,
                appointmentId: appointment.id,
                timestamp: new Date().toISOString(),
                read: false
            });
            
            // Se as notificações estiverem habilitadas, mostrar notificação sonora/visual
            if (window.notificationManager && staff.user_id === appState.currentUser?.id) {
                // Tocar som
                playNotificationSound();
                
                // Mostrar notificação do navegador (se permitido)
                window.notificationManager.show(notificationTitle, {
                    body: notificationBody,
                    icon: '/assets/icon/favicon.ico',
                    badge: '/assets/icon/favicon.ico',
                    tag: `appointment-${appointment.id}`,
                    requireInteraction: false,
                    data: {
                        appointmentId: appointment.id,
                        url: window.location.origin
                    }
                });
            }
        } catch (error) {
            console.error('Erro ao notificar funcionário:', error);
        }
    }
    
    // Função para adicionar notificação ao sino
    function addNotificationToBell(notification) {
        // Buscar notificações existentes do localStorage
        let notifications = [];
        try {
            const stored = localStorage.getItem('staff_notifications');
            if (stored) {
                notifications = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
        }
        
        // Adicionar nova notificação no início
        notifications.unshift(notification);
        
        // Limitar a 50 notificações
        if (notifications.length > 50) {
            notifications = notifications.slice(0, 50);
        }
        
        // Salvar no localStorage
        try {
            localStorage.setItem('staff_notifications', JSON.stringify(notifications));
        } catch (error) {
            console.error('Erro ao salvar notificações:', error);
        }
        
        // Atualizar contador do sino
        updateNotificationBellCount();
    }
    
    // Função para atualizar contador do sino
    function updateNotificationBellCount() {
        try {
            const stored = localStorage.getItem('staff_notifications');
            if (!stored) return;
            
            const notifications = JSON.parse(stored);
            const currentStaff = appState.staff.find(s => 
                s.user_id === appState.currentUser?.id || 
                s.email === appState.currentUser?.email
            );
            
            if (!currentStaff) return;
            
            // Contar não lidas do funcionário atual
            const unreadCount = notifications.filter(n => 
                !n.read && n.staffId === currentStaff.id
            ).length;
            
            // Atualizar badge no sino
            const bellIcon = document.querySelector('[data-notification-bell]');
            if (bellIcon) {
                let badge = bellIcon.querySelector('.notification-badge');
                
                if (unreadCount > 0) {
                    if (!badge) {
                        badge = document.createElement('span');
                        badge.className = 'notification-badge absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold';
                        bellIcon.appendChild(badge);
                    }
                    badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                } else if (badge) {
                    badge.remove();
                }
            }
        } catch (error) {
            console.error('Erro ao atualizar contador:', error);
        }
    }
    
    // Função para tocar som de notificação
    function playNotificationSound() {
        try {
            // Criar elemento de áudio
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSqCzvLZiDQIFmi67einTxALTqfk77hgHQU7kdXxyXcpBSd5x/LaijgIGWm88OScTQwLUKzm77lgGgU7k9XxxHQnBSl7yPLaizsIHGy98OWcSAwKUKzk7rZfGgU7lNbxw3InBSp9yPLajDsIG22+8OSbSAwKUK7k7bVeGQU8ltf'.substring(0, 200));
            audio.volume = 0.3;
            audio.play().catch(err => console.log('Não foi possível tocar o som:', err));
        } catch (error) {
            console.log('Erro ao tocar som:', error);
        }
    }

    function showAppointmentServicesModal(appointmentId) {
        const appointment = appState.appointments.find(a => a.id === appointmentId);
        if (!appointment) {
            showNotification('Agendamento não encontrado');
            return;
        }
        
        const t = getTranslations();
        
        // Verificar se é manicure, cabeleireira, admin ou recepcionista
        const userRole = getUserRole();
        const isAdmin = userRole === 'admin';
        
        // 🔒 PROTEÇÃO: Apenas admin pode adicionar serviços em agendamentos que NÃO estão com status "scheduled"
        // Outros usuários só podem adicionar se estiver "scheduled"
        const canAddServices = isAdmin || 
            (appointment.status === 'scheduled' && (userRole === 'manicurist' || userRole === 'hairdresser' || userRole === 'receptionist'));
        
        // Verificar se o agendamento foi concluído - se foi, não pode adicionar/remover serviços
        const isCompleted = appointment.status === 'completed';
        
        // Filtrar serviços baseado no papel do usuário
        let availableServices = appState.services;
        
        showModal(`
            <div class="bg-[var(--bg-primary)] rounded-lg max-w-2xl w-full mx-4 border border-[var(--border-color)] max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-medium text-[var(--text-primary)]">${t.servicesPerformed}</h3>
                        <div class="text-sm text-[var(--text-secondary)]">
                            ${appointment.clients?.name || 'Cliente'} • ${formatTime(appointment.time)} • ${new Date(appointment.date).toLocaleDateString()}
                        </div>
                    </div>
                    
                    ${isCompleted ? `
                        <div class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div class="flex items-center space-x-2">
                                <span class="text-green-600 dark:text-green-400">✅</span>
                                <span class="text-sm text-green-700 dark:text-green-300 font-medium">Agendamento concluído - Serviços bloqueados para edição</span>
                            </div>
                        </div>
                    ` : appointment.status !== 'scheduled' && !isAdmin ? `
                        <div class="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                            <div class="flex items-center space-x-2">
                                <span class="text-orange-600 dark:text-orange-400">🔒</span>
                                <span class="text-sm text-orange-700 dark:text-orange-300 font-medium">
                                    Só é possível adicionar serviços em agendamentos com status "Agendado". 
                                    ${appointment.status === 'cancelled' ? 'Este agendamento foi cancelado.' : 
                                      appointment.status === 'no_show' ? 'Cliente não compareceu.' : 
                                      'Status atual: ' + appointment.status}
                                </span>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div id="servicesContainer" class="space-y-3 mb-4">
                        <div class="text-center text-[var(--text-secondary)] py-4">${t.noServicesPerformed}</div>
                    </div>
                    
                    <!-- 🔄 Seção de Pausas/Transferências -->
                    ${canAddServices && !isCompleted ? `
                        <div class="border-t border-[var(--border-color)] pt-4 mb-4">
                            <div class="flex items-center justify-between mb-3">
                                <h4 class="text-sm font-semibold text-[var(--text-primary)] flex items-center space-x-2">
                                    <span>🔄</span>
                                    <span>Pausas / Transferências</span>
                                </h4>
                                <button onclick="showAddHandoffForm('${appointmentId}')" 
                                    class="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                                    ➕ Adicionar Pausa
                                </button>
                            </div>
                            
                            <div id="handoffsContainer" class="space-y-2">
                                <div class="text-center text-[var(--text-secondary)] text-sm py-2">
                                    Nenhuma pausa/transferência registrada
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${canAddServices && !isCompleted ? `
                        <div class="border-t border-[var(--border-color)] pt-4">
                            <form id="addServiceForm" class="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                <div>
                                    <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.selectService}</label>
                                    <select name="service_id" required class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                                        <option value="">${t.selectService}</option>
                                        ${availableServices.map(service => 
                                            `<option value="${service.id}" data-price="${service.price}">${service.name} - R$ ${service.price.toFixed(2)}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.quantity}</label>
                                    <input type="number" name="quantity" value="1" min="1" required
                                        class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-[var(--text-secondary)]">${t.priceCharged}</label>
                                    <input type="number" name="price_charged" step="0.01" min="0" required
                                        class="mt-1 block w-full border-[var(--border-color)] rounded-md shadow-sm px-3 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                                </div>
                                <div>
                                    <button type="submit" 
                                        class="w-full px-4 py-2 text-sm font-medium text-white bg-[var(--accent-primary)] rounded-md hover:bg-[var(--accent-secondary)]">
                                        ${t.addService}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ` : ''}
                    
                    <div class="flex justify-between items-center mt-6 pt-4 border-t border-[var(--border-color)]">
                        <div class="text-lg font-medium text-[var(--text-primary)]">
                            ${t.totalValue}: <span id="totalValue">R$ 0,00</span>
                        </div>
                        <div class="flex space-x-3">
                            <button onclick="hideModal()" 
                                class="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-md hover:bg-[var(--accent-light)] border border-[var(--border-color)]">
                                Fechar
                            </button>
                            ${canAddServices && appointment.status === 'scheduled' ? `
                                <button onclick="markAppointmentAsCompleted('${appointment.id}')"
                                    class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                                    ${t.markAsCompleted}
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `);
        
        // Carregar serviços existentes
        loadAppointmentServices(appointment.id, isCompleted);
        
        // Carregar handoffs/pausas existentes
        if (canAddServices && !isCompleted) {
            loadAppointmentHandoffs(appointment.id);
        }
        
        // Event listeners
        if (canAddServices && !isCompleted) {
            const form = document.getElementById('addServiceForm');
            const serviceSelect = form.querySelector('[name="service_id"]');
            const priceInput = form.querySelector('[name="price_charged"]');
            
            // Auto-fill price when service is selected
            serviceSelect.addEventListener('change', (e) => {
                const selectedOption = e.target.selectedOptions[0];
                if (selectedOption && selectedOption.dataset.price) {
                    priceInput.value = selectedOption.dataset.price;
                }
            });
            
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await addServiceToAppointment(appointment.id, e.target);
            });
        }
    }

    async function loadAppointmentServices(appointmentId, isCompleted = false) {
        try {
            const services = await db.getAppointmentServices(appointmentId);
            renderAppointmentServices(services, isCompleted);
        } catch (error) {
            console.error('Erro ao carregar serviços do agendamento:', error);
        }
    }

    function renderAppointmentServices(services, isCompleted = false) {
        const t = getTranslations();
        const container = document.getElementById('servicesContainer');
        const userRole = getUserRole();
        const canRemove = (userRole === 'manicurist' || userRole === 'hairdresser' || userRole === 'admin' || userRole === 'receptionist') && !isCompleted;
        
        if (!services.length) {
            container.innerHTML = `<div class="text-center text-[var(--text-secondary)] py-4">${t.noServicesPerformed}</div>`;
            updateTotalValue(0);
            return;
        }
        
        let total = 0;
        container.innerHTML = services.map(service => {
            const subtotal = service.price_charged * service.quantity;
            total += subtotal;
            
            return `
                <div class="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-md border border-[var(--border-color)]">
                    <div class="flex-1">
                        <div class="font-medium text-[var(--text-primary)]">${service.services.name}</div>
                        <div class="text-sm text-[var(--text-secondary)]">
                            ${service.quantity}x R$ ${service.price_charged.toFixed(2)} = R$ ${subtotal.toFixed(2)}
                        </div>
                    </div>
                    ${canRemove ? `
                        <button onclick="removeAppointmentService('${service.id}')"
                            class="text-red-600 hover:text-red-800 text-sm font-medium">
                            ${t.removeService}
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        updateTotalValue(total);
    }

    function updateTotalValue(total) {
        const totalElement = document.getElementById('totalValue');
        if (totalElement) {
            totalElement.textContent = `R$ ${total.toFixed(2)}`;
        }
    }

    async function addServiceToAppointment(appointmentId, form) {
        const t = getTranslations();
        const formData = new FormData(form);
        
        try {
            const serviceData = {
                appointment_id: appointmentId,
                service_id: formData.get('service_id'),
                quantity: parseInt(formData.get('quantity')),
                price_charged: parseFloat(formData.get('price_charged'))
            };
            
            await db.addAppointmentService(serviceData);
            form.reset();
            loadAppointmentServices(appointmentId);
            showNotification('Serviço adicionado com sucesso!');
        } catch (error) {
            console.error('Erro ao adicionar serviço:', error);
            showNotification('Erro ao adicionar serviço');
        }
    }

    async function removeAppointmentService(serviceId) {
        try {
            await db.deleteAppointmentService(serviceId);
            // Reload services for current appointment
            const container = document.getElementById('servicesContainer');
            if (container) {
                const appointment = appState.appointments.find(a => a.id === container.dataset.appointmentId);
                if (appointment) {
                    loadAppointmentServices(appointment.id);
                }
            }
            showNotification('Serviço removido com sucesso!');
        } catch (error) {
            console.error('Erro ao remover serviço:', error);
            showNotification('Erro ao remover serviço');
        }
    }

    async function markAppointmentAsCompleted(appointmentId) {
        try {
            const appointment = appState.appointments.find(a => a.id === appointmentId);
            if (!appointment) {
                throw new Error('Agendamento não encontrado');
            }
            
            // Atualizar status do agendamento
            await db.updateAppointment(appointmentId, { status: 'completed' });
            
            // 📝 SALVAR NO HISTÓRICO DO CLIENTE
            const appointmentServices = await db.getAppointmentServices(appointmentId);
            
            if (appointmentServices && appointmentServices.length > 0) {
                // Calcular total dos serviços
                const totalValue = appointmentServices.reduce((sum, service) => {
                    return sum + (service.price_charged * service.quantity);
                }, 0);
                
                // Criar lista de serviços para o histórico
                const servicesPerformed = appointmentServices.map(as => as.services.name).join(', ');
                
                // Salvar no histórico
                await db.addClientHistory({
                    client_id: appointment.client_id,
                    service_date: appointment.date,
                    service_time: appointment.time,
                    services_performed: servicesPerformed,
                    staff_id: appointment.staff_id,
                    total_value: totalValue,
                    notes: appointment.notes || null
                });
            }
            
            // Recarregar appointments do banco para garantir sincronização
            try {
                const freshAppointments = await db.getAppointments();
                appState.appointments = freshAppointments;
            } catch (error) {
                console.error('Erro ao recarregar appointments:', error);
                // Fallback: atualizar apenas localmente
                const appointmentIndex = appState.appointments.findIndex(a => a.id === appointmentId);
                if (appointmentIndex !== -1) {
                    appState.appointments[appointmentIndex].status = 'completed';
                }
            }
            
            hideModal();
            renderCalendar();
            showNotification('✅ Agendamento marcado como concluído! Histórico da cliente atualizado.');
        } catch (error) {
            console.error('Erro ao marcar como concluído:', error);
            showNotification('❌ Erro ao marcar como concluído: ' + error.message, 'error');
        }
    }

    // Funções globais para os botões
    window.removeAppointmentService = removeAppointmentService;
    window.showAppointmentServicesModal = showAppointmentServicesModal;
    window.markAppointmentAsCompleted = markAppointmentAsCompleted;

    // 🔄 ==================== FUNÇÕES DE HANDOFFS/PAUSAS ====================
    
    // Carregar handoffs de um agendamento
    async function loadAppointmentHandoffs(appointmentId) {
        try {
            const handoffs = await db.getAppointmentHandoffs(appointmentId);
            renderAppointmentHandoffs(handoffs, appointmentId);
        } catch (error) {
            console.error('Erro ao carregar handoffs:', error);
        }
    }

    // Renderizar lista de handoffs
    function renderAppointmentHandoffs(handoffs, appointmentId) {
        const container = document.getElementById('handoffsContainer');
        if (!container) return;
        
        if (!handoffs || handoffs.length === 0) {
            container.innerHTML = `
                <div class="text-center text-[var(--text-secondary)] text-sm py-2">
                    Nenhuma pausa/transferência registrada
                </div>
            `;
            return;
        }
        
        container.innerHTML = handoffs.map(handoff => `
            <div class="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border-color)]">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-1">
                            <span class="text-blue-600 dark:text-blue-400 font-medium text-sm">
                                🔄 ${handoff.start_time.substring(0, 5)} - ${handoff.end_time.substring(0, 5)}
                            </span>
                            <span class="text-xs text-[var(--text-secondary)]">
                                (${calculateDuration(handoff.start_time, handoff.end_time)} min)
                            </span>
                        </div>
                        <div class="text-sm text-[var(--text-primary)]">
                            <strong>Com:</strong> ${handoff.staff?.name || 'Profissional'}
                        </div>
                        ${handoff.services ? `
                            <div class="text-xs text-[var(--text-secondary)]">
                                <strong>Serviço:</strong> ${handoff.services.name}
                            </div>
                        ` : ''}
                        ${handoff.notes ? `
                            <div class="text-xs text-[var(--text-secondary)] mt-1 italic">
                                📝 ${handoff.notes}
                            </div>
                        ` : ''}
                    </div>
                    <div class="flex items-center space-x-2">
                        <button onclick="editHandoff('${handoff.id}', '${appointmentId}')" 
                            class="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded" 
                            title="Editar">
                            ✏️
                        </button>
                        <button onclick="deleteHandoff('${handoff.id}', '${appointmentId}')" 
                            class="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" 
                            title="Remover">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Calcular duração entre dois horários
    function calculateDuration(startTime, endTime) {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        return endMinutes - startMinutes;
    }

    // Mostrar formulário para adicionar handoff
    window.showAddHandoffForm = function(appointmentId) {
        const appointment = appState.appointments.find(a => a.id === appointmentId);
        if (!appointment) return;
        
        const availableStaff = appState.staff.filter(s => 
            s.id !== appointment.staff_id && 
            (s.role === 'manicurist' || s.role === 'hairdresser')
        );
        
        showModal(`
            <div class="bg-[var(--bg-primary)] rounded-lg max-w-lg w-full mx-4 border border-[var(--border-color)]">
                <div class="p-6">
                    <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center space-x-2">
                        <span>🔄</span>
                        <span>Adicionar Pausa/Transferência</span>
                    </h3>
                    
                    <div class="bg-[var(--accent-light)] border border-[var(--border-color)] rounded-lg p-3 mb-4">
                        <div class="text-xs text-[var(--text-primary)]">
                            <strong>💡 Como funciona:</strong> Durante a pausa, o profissional principal fica livre para atender outros clientes, 
                            enquanto este cliente é atendido temporariamente por outro profissional.
                        </div>
                    </div>
                    
                    <form id="addHandoffForm" class="space-y-4">
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    ⏰ Início da Pausa
                                </label>
                                <input type="time" name="start_time" required
                                    class="block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    ⏰ Fim da Pausa
                                </label>
                                <input type="time" name="end_time" required
                                    class="block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]">
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                👤 Profissional Temporário
                            </label>
                            <select name="handoff_staff_id" required
                                class="block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]">
                                <option value="">Selecione o profissional</option>
                                ${availableStaff.map(staff => 
                                    `<option value="${staff.id}">${staff.name} (${staff.role === 'manicurist' ? 'Manicure' : 'Cabeleireira'})</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                💅 Serviço Realizado (opcional)
                            </label>
                            <select name="service_id"
                                class="block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]">
                                <option value="">Selecione o serviço</option>
                                ${appState.services.map(service => 
                                    `<option value="${service.id}">${service.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                📝 Observações (opcional)
                            </label>
                            <textarea name="notes" rows="2" placeholder="Ex: Cliente vai fazer mechas enquanto espera a unha secar..."
                                class="block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]"></textarea>
                        </div>
                        
                        <div class="flex space-x-3 pt-4">
                            <button type="button" onclick="hideModal()" 
                                class="flex-1 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-md hover:bg-[var(--accent-light)] border border-[var(--border-color)]">
                                Cancelar
                            </button>
                            <button type="submit" 
                                class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                                ✅ Adicionar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `);
        
        // Event listener do formulário
        document.getElementById('addHandoffForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await addHandoff(appointmentId, e.target);
        });
    };

    // Adicionar handoff
    async function addHandoff(appointmentId, form) {
        try {
            const formData = new FormData(form);
            const handoffData = {
                appointment_id: appointmentId,
                handoff_staff_id: formData.get('handoff_staff_id'),
                service_id: formData.get('service_id') || null,
                start_time: formData.get('start_time'),
                end_time: formData.get('end_time'),
                notes: formData.get('notes') || null
            };
            
            // Validar horários
            if (handoffData.start_time >= handoffData.end_time) {
                showNotification('⚠️ O horário de fim deve ser maior que o de início', 'error');
                return;
            }
            
            await db.addAppointmentHandoff(handoffData);
            hideModal();
            showNotification('✅ Pausa/transferência adicionada com sucesso!');
            
            // Reabrir modal de serviços para mostrar o handoff adicionado
            showAppointmentServicesModal(appointmentId);
        } catch (error) {
            console.error('Erro ao adicionar handoff:', error);
            showNotification('❌ Erro ao adicionar pausa/transferência', 'error');
        }
    }

    // Editar handoff
    window.editHandoff = async function(handoffId, appointmentId) {
        try {
            const handoffs = await db.getAppointmentHandoffs(appointmentId);
            const handoff = handoffs.find(h => h.id === handoffId);
            if (!handoff) return;
            
            const appointment = appState.appointments.find(a => a.id === appointmentId);
            const availableStaff = appState.staff.filter(s => 
                s.id !== appointment.staff_id && 
                (s.role === 'manicurist' || s.role === 'hairdresser')
            );
            
            showModal(`
                <div class="bg-[var(--bg-primary)] rounded-lg max-w-lg w-full mx-4 border border-[var(--border-color)]">
                    <div class="p-6">
                        <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center space-x-2">
                            <span>✏️</span>
                            <span>Editar Pausa/Transferência</span>
                        </h3>
                        
                        <form id="editHandoffForm" class="space-y-4">
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                        ⏰ Início da Pausa
                                    </label>
                                    <input type="time" name="start_time" value="${handoff.start_time}" required
                                        class="block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                        ⏰ Fim da Pausa
                                    </label>
                                    <input type="time" name="end_time" value="${handoff.end_time}" required
                                        class="block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]">
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    👤 Profissional Temporário
                                </label>
                                <select name="handoff_staff_id" required
                                    class="block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]">
                                    ${availableStaff.map(staff => 
                                        `<option value="${staff.id}" ${staff.id === handoff.handoff_staff_id ? 'selected' : ''}>${staff.name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    💅 Serviço Realizado (opcional)
                                </label>
                                <select name="service_id"
                                    class="block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]">
                                    <option value="">Selecione o serviço</option>
                                    ${appState.services.map(service => 
                                        `<option value="${service.id}" ${service.id === handoff.service_id ? 'selected' : ''}>${service.name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    📝 Observações (opcional)
                                </label>
                                <textarea name="notes" rows="2"
                                    class="block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]">${handoff.notes || ''}</textarea>
                            </div>
                            
                            <div class="flex space-x-3 pt-4">
                                <button type="button" onclick="hideModal()" 
                                    class="flex-1 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-md hover:bg-[var(--accent-light)] border border-[var(--border-color)]">
                                    Cancelar
                                </button>
                                <button type="submit" 
                                    class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                                    ✅ Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `);
            
            document.getElementById('editHandoffForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const updates = {
                    handoff_staff_id: formData.get('handoff_staff_id'),
                    service_id: formData.get('service_id') || null,
                    start_time: formData.get('start_time'),
                    end_time: formData.get('end_time'),
                    notes: formData.get('notes') || null
                };
                
                if (updates.start_time >= updates.end_time) {
                    showNotification('⚠️ O horário de fim deve ser maior que o de início', 'error');
                    return;
                }
                
                await db.updateAppointmentHandoff(handoffId, updates);
                hideModal();
                showNotification('✅ Pausa atualizada com sucesso!');
                showAppointmentServicesModal(appointmentId);
            });
        } catch (error) {
            console.error('Erro ao editar handoff:', error);
            showNotification('❌ Erro ao editar pausa', 'error');
        }
    };

    // Deletar handoff
    window.deleteHandoff = async function(handoffId, appointmentId) {
        const confirmed = await showConfirm(
            'Esta pausa/transferência será removida e o profissional principal voltará a ficar ocupado durante todo o período do agendamento.',
            'Remover Pausa',
            {
                confirmText: 'Remover',
                cancelText: 'Cancelar',
                type: 'warning',
                icon: '🗑️'
            }
        );
        
        if (!confirmed) return;
        
        try {
            await db.deleteAppointmentHandoff(handoffId);
            showNotification('✅ Pausa removida com sucesso!');
            loadAppointmentHandoffs(appointmentId);
        } catch (error) {
            console.error('Erro ao deletar handoff:', error);
            showNotification('❌ Erro ao remover pausa', 'error');
        }
    };

    // Funções globais para os botões
    window.removeAppointmentService = removeAppointmentService;
    window.markAppointmentAsCompleted = markAppointmentAsCompleted;
    window.showAppointmentServicesModal = showAppointmentServicesModal;

    function showModal(content) {
        dom.modalContainer.innerHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                ${content}
            </div>
        `;
        dom.modalContainer.classList.remove('hidden');
    }

    function hideModal() {
        dom.modalContainer.innerHTML = '';
        dom.modalContainer.classList.add('hidden');
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    function getTranslation(key) {
        const lang = appState.settings.language;
        return translations[lang][key] || key;
    }

    function updateCurrentDate() {
        if (!dom.currentDateDisplay) return;
        
        const d = appState.currentDate;
        const monthName = getTranslation('months') ? getTranslation('months')[d.getMonth()] : 'Mês';
        let text = `${monthName} ${d.getFullYear()}`;

        if (appState.calendarViewType === 'week') {
            const startOfWeek = new Date(d);
            startOfWeek.setDate(d.getDate() - d.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            text = `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${monthName} ${d.getFullYear()}`;
        } else if (appState.calendarViewType === 'day') {
            text = d.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }

        dom.currentDateDisplay.textContent = text;
    }

    function handleClientSearch(e) {
        const query = e.target.value.toLowerCase();
        const filteredClients = appState.clients.filter(client => 
            client.name.toLowerCase().includes(query) ||
            (client.phone && client.phone.includes(query)) ||
            (client.email && client.email.toLowerCase().includes(query))
        );
        
        const t = getTranslations();
        if (!filteredClients.length && query) {
            dom.clientList.innerHTML = `<li class="p-4 text-center text-gray-500">${t.noClientsFound}</li>`;
            return;
        }
        
        const originalClients = appState.clients;
        appState.clients = query ? filteredClients : originalClients;
        renderClients();
        if (query) appState.clients = originalClients;
    }

    window.editClient = (id) => {
        const client = appState.clients.find(c => c.id === id);
        if (client) showClientModal(client);
    };

    window.deleteClient = async (id) => {
        const confirmed = await showConfirm(
            'Este cliente será excluído permanentemente do sistema.',
            'Excluir Cliente',
            {
                confirmText: 'Excluir',
                cancelText: 'Cancelar',
                type: 'danger',
                icon: '🗑️'
            }
        );
        
        if (confirmed) {
            try {
                await db.deleteClient(id);
                appState.clients = appState.clients.filter(c => c.id !== id);
                renderClients();
            } catch (error) {
                console.error('Erro ao excluir cliente:', error);
            }
        }
    };

    window.editService = (id) => {
        const service = appState.services.find(s => s.id === id);
        if (service) showServiceModal(service);
    };

    window.deleteService = async (id) => {
        const confirmed = await showConfirm(
            'Este serviço será excluído permanentemente do sistema.',
            'Excluir Serviço',
            {
                confirmText: 'Excluir',
                cancelText: 'Cancelar',
                type: 'danger',
                icon: '🗑️'
            }
        );
        
        if (confirmed) {
            try {
                await db.deleteService(id);
                appState.services = appState.services.filter(s => s.id !== id);
                renderServices();
            } catch (error) {
                console.error('Erro ao excluir serviço:', error);
            }
        }
    };

    window.editStaff = (id) => {
        const staff = appState.staff.find(s => s.id === id);
        if (staff) showStaffModal(staff);
    };

    window.deleteStaff = async (id) => {
        const confirmed = await showConfirm(
            'Este funcionário será excluído permanentemente do sistema.',
            'Excluir Funcionário',
            {
                confirmText: 'Excluir',
                cancelText: 'Cancelar',
                type: 'danger',
                icon: '🗑️'
            }
        );
        
        if (confirmed) {
            try {
                await db.deleteStaff(id);
                appState.staff = appState.staff.filter(s => s.id !== id);
                renderStaff();
            } catch (error) {
                console.error('Erro ao excluir funcionário:', error);
            }
        }
    };

    window.showDayAppointments = (dateStr) => {
        // Parse da data string (formato: YYYY-MM-DD)
        const [year, month, day] = dateStr.split('-').map(Number);
        // Criar data ao meio-dia para evitar problemas de timezone
        appState.currentDate = new Date(year, month - 1, day, 12, 0, 0);
        appState.calendarViewType = 'day';
        renderCalendar();
    };

    window.editAppointment = (appointmentId) => {
        const appointment = appState.appointments.find(app => app.id === appointmentId);
        if (appointment) {
            showAppointmentModal(appointment);
        }
    };

    window.showAppointmentModal = (appointment = null, dateStr = null, timeStr = null) => {
        showAppointmentModal(appointment, dateStr, timeStr);
    };

    async function renderReports() {
        const reportsView = document.getElementById('reportsView');
        if (!reportsView) return;
        
        const t = getTranslations();
        const userRole = getUserRole();
        let content = '';

        // Mostrar loading enquanto carrega
        reportsView.innerHTML = `
            <div class="space-y-6">
                <h2 class="text-2xl font-bold text-[var(--text-primary)]">${t.reportsTitle}</h2>
                <div class="flex items-center justify-center py-12">
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)] mx-auto mb-4"></div>
                        <p class="text-[var(--text-secondary)]">${t.loadingAnalytics || 'Carregando relatórios...'}</p>
                    </div>
                </div>
            </div>
        `;

        if (userRole === 'admin') {
            content = await renderAdvancedAdminReports();
        } else if (userRole === 'manicurist' || userRole === 'hairdresser') {
            content = renderManicuristReports();
        } else {
            content = `<p class="text-center text-[var(--text-secondary)]">${t.noPermissionViewReports}</p>`;
        }

        reportsView.innerHTML = `
            <div class="space-y-6">
                <h2 class="text-2xl font-bold text-[var(--text-primary)]">${t.reportsTitle}</h2>
                ${content}
            </div>
        `;
    }

    async function renderAdvancedAdminReports() {
        const t = getTranslations();
        
        // 📊 Analytics usando cálculos locais
        // Pegar período selecionado ou usar padrão
        const selectedPeriod = appState.selectedAnalyticsPeriod || 'last30days';
        let startDate, endDate;
        const today = new Date();
        
        switch(selectedPeriod) {
            case 'today':
                startDate = endDate = today.toISOString().split('T')[0];
                break;
            case 'last7days':
                startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                endDate = today.toISOString().split('T')[0];
                break;
            case 'last30days':
                startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                endDate = today.toISOString().split('T')[0];
                break;
            case 'thisMonth':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                endDate = today.toISOString().split('T')[0];
                break;
            case 'lastMonth':
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                startDate = lastMonth.toISOString().split('T')[0];
                endDate = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
                break;
            case 'custom':
                startDate = appState.customStartDate || new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                endDate = appState.customEndDate || today.toISOString().split('T')[0];
                break;
            default:
                startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                endDate = today.toISOString().split('T')[0];
        }
        
        const analytics = calculateLocalAnalytics(startDate, endDate);

        return `
            <div class="analytics-dashboard bg-[var(--bg-secondary)] rounded-lg p-6">
                <!-- 📊 Header do Dashboard -->
                <div class="dashboard-header mb-6">
                    <div class="flex justify-between items-center mb-4">
                        <div>
                            <h2 class="text-2xl font-bold text-[var(--text-primary)]">📊 ${t.analyticsDashboard || 'Analytics Dashboard'}</h2>
                            <p class="text-[var(--text-secondary)] text-sm">
                                📅 ${t.period || 'Período'}: ${analytics.period_info?.start_date} a ${analytics.period_info?.end_date}
                            </p>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="refreshAnalytics()" class="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] text-sm">
                                🔄 ${t.updateButton || 'Atualizar'}
                            </button>
                            <button onclick="exportAnalytics()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                                📊 ${t.exportButton || 'Exportar'}
                            </button>
                        </div>
                    </div>
                    
                    <!-- 📅 Seletor de Período -->
                    <div class="bg-[var(--bg-primary)] p-4 rounded-lg border border-[var(--border-color)]">
                        <div class="flex flex-wrap gap-2 items-center">
                            <span class="text-sm font-medium text-[var(--text-secondary)]">Período:</span>
                            <button onclick="changePeriod('today')" class="px-3 py-1.5 rounded-md text-sm ${selectedPeriod === 'today' ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--accent-light)]'}">
                                Hoje
                            </button>
                            <button onclick="changePeriod('last7days')" class="px-3 py-1.5 rounded-md text-sm ${selectedPeriod === 'last7days' ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--accent-light)]'}">
                                Últimos 7 dias
                            </button>
                            <button onclick="changePeriod('last30days')" class="px-3 py-1.5 rounded-md text-sm ${selectedPeriod === 'last30days' ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--accent-light)]'}">
                                Últimos 30 dias
                            </button>
                            <button onclick="changePeriod('thisMonth')" class="px-3 py-1.5 rounded-md text-sm ${selectedPeriod === 'thisMonth' ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--accent-light)]'}">
                                Este Mês
                            </button>
                            <button onclick="changePeriod('lastMonth')" class="px-3 py-1.5 rounded-md text-sm ${selectedPeriod === 'lastMonth' ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--accent-light)]'}">
                                Mês Passado
                            </button>
                            <div class="flex items-center space-x-2 ml-2">
                                <input type="date" id="customStartDate" value="${startDate}" 
                                    class="px-2 py-1 text-sm border border-[var(--border-color)] rounded bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                                <span class="text-[var(--text-secondary)]">até</span>
                                <input type="date" id="customEndDate" value="${endDate}"
                                    class="px-2 py-1 text-sm border border-[var(--border-color)] rounded bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                                <button onclick="applyCustomPeriod()" class="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                                    Aplicar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 📈 Métricas Principais -->
                <div class="metrics-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div class="metric-card bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-blue-100 text-sm font-medium">
                                    ${selectedPeriod === 'today' ? 'Receita Hoje' : selectedPeriod === 'thisMonth' ? 'Receita Este Mês' : selectedPeriod === 'lastMonth' ? 'Receita Mês Passado' : 'Receita do Período'}
                                </p>
                                <p class="text-2xl font-bold">R$ ${(analytics.financial_metrics?.revenue_period || 0).toFixed(2)}</p>
                            </div>
                            <div class="text-3xl opacity-80">💰</div>
                        </div>
                    </div>

                    <div class="metric-card bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-green-100 text-sm font-medium">Ticket Médio</p>
                                <p class="text-2xl font-bold">R$ ${(analytics.financial_metrics?.avg_appointment_value || 0).toFixed(2)}</p>
                            </div>
                            <div class="text-3xl opacity-80">🎯</div>
                        </div>
                    </div>

                    <div class="metric-card bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-purple-100 text-sm font-medium">
                                    ${selectedPeriod === 'today' ? 'Agendamentos Hoje' : 'Agendamentos do Período'}
                                </p>
                                <p class="text-2xl font-bold">${analytics.basic_metrics?.appointments_period || 0}</p>
                            </div>
                            <div class="text-3xl opacity-80">📅</div>
                        </div>
                    </div>

                    <div class="metric-card bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-orange-100 text-sm font-medium">Atendimentos Concluídos</p>
                                <p class="text-2xl font-bold">${analytics.appointment_status?.completed || 0}</p>
                            </div>
                            <div class="text-3xl opacity-80">✅</div>
                        </div>
                    </div>
                </div>

                <!-- 📊 Gráficos Principais -->
                <div class="charts-section grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <!-- Gráfico de Receita Diária -->
                    <div class="chart-container bg-[var(--bg-primary)] rounded-lg p-4">
                        <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">📈 Receita dos Últimos 7 Dias</h3>
                        <div class="chart-wrapper h-64">
                            <canvas id="revenueChart"></canvas>
                        </div>
                    </div>

                    <!-- Gráfico de Serviços Populares -->
                    <div class="chart-container bg-[var(--bg-primary)] rounded-lg p-4">
                        <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">🏆 Serviços Mais Populares</h3>
                        <div class="chart-wrapper h-64">
                            <canvas id="servicesChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- 📊 Status dos Agendamentos -->
                <div class="status-section bg-[var(--bg-primary)] rounded-lg p-4 mb-6">
                    <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">📋 Status dos Agendamentos</h3>
                    <div class="status-grid grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="status-item text-center p-3 rounded-lg bg-[var(--accent-light)] border border-[var(--border-color)]">
                            <div class="text-2xl font-bold text-[var(--accent-primary)]">${analytics.appointment_status?.scheduled || 0}</div>
                            <div class="text-sm text-[var(--accent-primary)]">🕐 Agendados</div>
                        </div>
                        <div class="status-item text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                            <div class="text-2xl font-bold text-green-600">${analytics.appointment_status?.completed || 0}</div>
                            <div class="text-sm text-green-600">✅ Concluídos</div>
                        </div>
                        <div class="status-item text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                            <div class="text-2xl font-bold text-red-600">${analytics.appointment_status?.cancelled || 0}</div>
                            <div class="text-sm text-red-600">❌ Cancelados</div>
                        </div>
                        <div class="status-item text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20">
                            <div class="text-2xl font-bold text-gray-600">${analytics.appointment_status?.no_show || 0}</div>
                            <div class="text-sm text-gray-600">👻 Não Compareceu</div>
                        </div>
                    </div>
                </div>

                <!-- 👥 Performance da Equipe -->
                <div class="staff-performance bg-[var(--bg-primary)] rounded-lg p-4 mb-6">
                    <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">👥 Performance da Equipe</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b border-[var(--border-color)]">
                                    <th class="text-left py-2 text-[var(--text-primary)]">Profissional</th>
                                    <th class="text-center py-2 text-[var(--text-primary)]">Atendimentos</th>
                                    <th class="text-center py-2 text-[var(--text-primary)]">Receita</th>
                                    <th class="text-center py-2 text-[var(--text-primary)]">💰 Comissão</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(analytics.trends?.staff_performance || []).map(staff => `
                                    <tr class="border-b border-[var(--border-color)] hover:bg-[var(--accent-light)]">
                                        <td class="py-2 text-[var(--text-primary)]">
                                            <div class="flex items-center">
                                                <div class="w-8 h-8 bg-[var(--accent-primary)] rounded-full flex items-center justify-center text-white text-xs mr-2">
                                                    ${staff.staff_name?.charAt(0) || 'N'}
                                                </div>
                                                ${staff.staff_name || 'N/A'}
                                            </div>
                                        </td>
                                        <td class="text-center py-2 text-[var(--text-secondary)]">${staff.appointments_completed || 0}</td>
                                        <td class="text-center py-2 text-[var(--text-secondary)]">R$ ${(staff.total_revenue || 0).toFixed(2)}</td>
                                        <td class="text-center py-2 font-semibold text-green-600">R$ ${(staff.total_commission || 0).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- ⏰ Horários e Dias Mais Movimentados -->
                <div class="time-analytics grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="bg-[var(--bg-primary)] rounded-lg p-4">
                        <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">⏰ Horários Mais Movimentados</h3>
                        <div class="space-y-2">
                            ${(analytics.time_analytics?.busiest_hours || []).length > 0 ? 
                                (analytics.time_analytics.busiest_hours || []).map((hour, index) => {
                                    const maxCount = Math.max(...analytics.time_analytics.busiest_hours.map(h => h.count));
                                    const percentage = maxCount > 0 ? (hour.count / maxCount) * 100 : 0;
                                    return `
                                    <div class="flex items-center justify-between p-2 hover:bg-[var(--accent-light)] rounded">
                                        <span class="text-[var(--text-primary)]">${hour.hour}</span>
                                        <div class="flex items-center">
                                            <div class="w-32 h-3 bg-gray-200 dark:bg-gray-700 rounded mr-2">
                                                <div class="h-3 bg-blue-600 rounded" style="width: ${percentage}%"></div>
                                            </div>
                                            <span class="text-sm font-medium text-[var(--text-secondary)] w-8 text-right">${hour.count}</span>
                                        </div>
                                    </div>
                                `}).join('') 
                                : '<div class="text-center text-[var(--text-secondary)] py-4">Sem dados disponíveis</div>'
                            }
                        </div>
                    </div>

                    <div class="bg-[var(--bg-primary)] rounded-lg p-4">
                        <h3 class="text-lg font-semibold text-[var(--text-primary)] mb-4">📅 Dias Mais Movimentados</h3>
                        <div class="space-y-2">
                            ${(analytics.time_analytics?.busiest_days || []).length > 0 ?
                                (analytics.time_analytics.busiest_days || []).map((day, index) => {
                                    const maxCount = Math.max(...analytics.time_analytics.busiest_days.map(d => d.count));
                                    const percentage = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                                    return `
                                    <div class="flex items-center justify-between p-2 hover:bg-[var(--accent-light)] rounded">
                                        <span class="text-[var(--text-primary)]">${day.day}</span>
                                        <div class="flex items-center">
                                            <div class="w-32 h-3 bg-gray-200 dark:bg-gray-700 rounded mr-2">
                                                <div class="h-3 bg-green-600 rounded" style="width: ${percentage}%"></div>
                                            </div>
                                            <span class="text-sm font-medium text-[var(--text-secondary)] w-8 text-right">${day.count}</span>
                                        </div>
                                    </div>
                                `}).join('')
                                : '<div class="text-center text-[var(--text-secondary)] py-4">Sem dados disponíveis</div>'
                            }
                        </div>
                    </div>
                </div>
            </div>

            <!-- 📊 Scripts para Gráficos -->
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <script>
                // Aguardar Chart.js carregar e DOM estar pronto
                setTimeout(function() {
                    const dailyRevenueData = ${JSON.stringify(analytics.trends?.daily_revenue || [])};
                    const servicesData = ${JSON.stringify(analytics.trends?.popular_services || [])};
                    
                    // Gráfico de Receita Diária
                    if (typeof Chart !== 'undefined') {
                        const revenueCtx = document.getElementById('revenueChart');
                        
                        if (revenueCtx) {
                            if (dailyRevenueData && dailyRevenueData.length > 0) {
                                new Chart(revenueCtx, {
                                    type: 'line',
                                    data: {
                                        labels: dailyRevenueData.map(d => {
                                            const date = new Date(d.date + 'T00:00:00');
                                            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                                        }),
                                        datasets: [{
                                            label: 'Receita (R$)',
                                            data: dailyRevenueData.map(d => d.revenue),
                                            borderColor: 'rgb(59, 130, 246)',
                                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                            tension: 0.4,
                                            fill: true,
                                            borderWidth: 2,
                                            pointRadius: 4,
                                            pointHoverRadius: 6
                                        }]
                                    },
                                    options: {
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { 
                                                display: true,
                                                labels: {
                                                    color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#1a1a1a'
                                                }
                                            },
                                            tooltip: {
                                                callbacks: {
                                                    label: function(context) {
                                                        return 'Receita: R$ ' + context.parsed.y.toFixed(2);
                                                    }
                                                }
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                ticks: {
                                                    color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#6b7280',
                                                    callback: function(value) {
                                                        return 'R$ ' + value.toFixed(2);
                                                    }
                                                },
                                                grid: {
                                                    color: getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#e5e7eb'
                                                }
                                            },
                                            x: {
                                                ticks: {
                                                    color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#6b7280'
                                                },
                                                grid: {
                                                    color: getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#e5e7eb'
                                                }
                                            }
                                        }
                                    }
                                });
                            } else {
                                revenueCtx.parentElement.innerHTML = '<div class="flex items-center justify-center h-64 text-[var(--text-secondary)]"><p>📊 Sem dados de receita no período selecionado</p></div>';
                            }
                        }

                        // Gráfico de Serviços Populares
                        const servicesCtx = document.getElementById('servicesChart');
                        
                        if (servicesCtx) {
                            if (servicesData && servicesData.length > 0) {
                                new Chart(servicesCtx, {
                                    type: 'doughnut',
                                    data: {
                                        labels: servicesData.map(s => s.service_name),
                                        datasets: [{
                                            data: servicesData.map(s => s.times_booked),
                                            backgroundColor: [
                                                '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
                                                '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
                                            ],
                                            borderWidth: 2,
                                            borderColor: '#fff'
                                        }]
                                    },
                                    options: {
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'bottom',
                                                labels: {
                                                    color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#1a1a1a',
                                                    padding: 10,
                                                    font: {
                                                        size: 11
                                                    }
                                                }
                                            },
                                            tooltip: {
                                                callbacks: {
                                                    label: function(context) {
                                                        const label = context.label || '';
                                                        const value = context.parsed || 0;
                                                        return label + ': ' + value + ' vezes';
                                                    }
                                                }
                                            }
                                        }
                                    }
                                });
                            } else {
                                servicesCtx.parentElement.innerHTML = '<div class="flex items-center justify-center h-64 text-[var(--text-secondary)]"><p>🏆 Sem serviços agendados no período selecionado</p></div>';
                            }
                        }
                    }
                }, 500); // Aguardar 500ms para garantir que tudo está carregado
            </script>
        `;
    }

    // 📊 Função para calcular analytics localmente (fallback)
    function calculateLocalAnalytics(startDate = null, endDate = null) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Se não passar datas, usa últimos 30 dias
        const periodStart = startDate ? new Date(startDate) : new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        const periodEnd = endDate ? new Date(endDate) : today;
        
        periodStart.setHours(0, 0, 0, 0);
        periodEnd.setHours(23, 59, 59, 999);

        const completedAppointments = appState.appointments.filter(a => {
            const appointmentDate = new Date(a.date);
            return a.status === 'completed' && appointmentDate >= periodStart && appointmentDate <= periodEnd;
        });

        // Calcular receita total usando novo fluxo de appointment_services
        const calculateAppointmentTotal = (appointment) => {
            // Se tem serviços específicos no novo fluxo, usar eles
            if (appointment.appointment_services && appointment.appointment_services.length > 0) {
                return appointment.appointment_services.reduce((total, service) => {
                    return total + (service.price_charged * service.quantity);
                }, 0);
            }
            // Fallback para o sistema antigo
            const service = appState.services.find(s => s.id === appointment.service_id);
            return service ? service.price : 0;
        };

        // 💰 NOVA: Calcular comissão do agendamento
        const calculateAppointmentCommission = (appointment) => {
            if (appointment.appointment_services && appointment.appointment_services.length > 0) {
                return appointment.appointment_services.reduce((totalCommission, appointmentService) => {
                    // Buscar o serviço para pegar a commission_rate
                    const service = appState.services.find(s => s.id === appointmentService.service_id);
                    if (service && service.commission_rate) {
                        // Comissão = preço cobrado * taxa de comissão * quantidade
                        const serviceCommission = appointmentService.price_charged * service.commission_rate * appointmentService.quantity;
                        return totalCommission + serviceCommission;
                    }
                    return totalCommission;
                }, 0);
            }
            // Fallback para sistema antigo
            const service = appState.services.find(s => s.id === appointment.service_id);
            if (service && service.commission_rate) {
                return service.price * service.commission_rate;
            }
            return 0;
        };

        const totalRevenue = completedAppointments.reduce((sum, app) => {
            return sum + calculateAppointmentTotal(app);
        }, 0);

        // 📊 Calcular receita diária (últimos 7 dias do período)
        const dailyRevenue = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(periodEnd);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayRevenue = completedAppointments
                .filter(a => a.date === dateStr)
                .reduce((sum, app) => sum + calculateAppointmentTotal(app), 0);
            
            dailyRevenue.push({
                date: dateStr,
                revenue: dayRevenue
            });
        }

        // 📊 Serviços mais populares
        const serviceCount = {};
        completedAppointments.forEach(app => {
            if (app.appointment_services && app.appointment_services.length > 0) {
                app.appointment_services.forEach(as => {
                    const service = appState.services.find(s => s.id === as.service_id);
                    if (service) {
                        if (!serviceCount[service.id]) {
                            serviceCount[service.id] = {
                                service_name: service.name,
                                times_booked: 0
                            };
                        }
                        serviceCount[service.id].times_booked += as.quantity;
                    }
                });
            } else if (app.service_id) {
                const service = appState.services.find(s => s.id === app.service_id);
                if (service) {
                    if (!serviceCount[service.id]) {
                        serviceCount[service.id] = {
                            service_name: service.name,
                            times_booked: 0
                        };
                    }
                    serviceCount[service.id].times_booked += 1;
                }
            }
        });

        const popularServices = Object.values(serviceCount)
            .sort((a, b) => b.times_booked - a.times_booked)
            .slice(0, 5);

        // ⏰ Horários mais movimentados
        const hourCount = {};
        appState.appointments
            .filter(a => {
                const appointmentDate = new Date(a.date);
                return appointmentDate >= periodStart && appointmentDate <= periodEnd;
            })
            .forEach(app => {
                const hour = app.time.split(':')[0];
                hourCount[hour] = (hourCount[hour] || 0) + 1;
            });

        const busiestHours = Object.entries(hourCount)
            .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // 📅 Dias mais movimentados
        const dayOfWeekCount = {};
        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        
        appState.appointments
            .filter(a => {
                const appointmentDate = new Date(a.date);
                return appointmentDate >= periodStart && appointmentDate <= periodEnd;
            })
            .forEach(app => {
                const date = new Date(app.date);
                const dayOfWeek = date.getDay();
                const dayName = dayNames[dayOfWeek];
                dayOfWeekCount[dayName] = (dayOfWeekCount[dayName] || 0) + 1;
            });

        const busiestDays = Object.entries(dayOfWeekCount)
            .map(([day, count]) => ({ day, count }))
            .sort((a, b) => b.count - a.count);

        return {
            period_info: {
                start_date: periodStart.toISOString().split('T')[0],
                end_date: periodEnd.toISOString().split('T')[0],
                days_analyzed: Math.ceil((periodEnd - periodStart) / (24 * 60 * 60 * 1000))
            },
            basic_metrics: {
                total_clients: appState.clients.length,
                active_staff: appState.staff.filter(s => s.is_active !== false).length,
                total_services: appState.services.filter(s => s.is_active !== false).length,
                appointments_today: appState.appointments.filter(a => 
                    new Date(a.date).toDateString() === today.toDateString()
                ).length,
                appointments_period: appState.appointments.filter(a => {
                    const appointmentDate = new Date(a.date);
                    return appointmentDate >= periodStart && appointmentDate <= periodEnd;
                }).length
            },
            financial_metrics: {
                revenue_today: appState.appointments
                    .filter(a => a.status === 'completed' && new Date(a.date).toDateString() === today.toDateString())
                    .reduce((sum, app) => sum + calculateAppointmentTotal(app), 0),
                revenue_period: totalRevenue,
                avg_appointment_value: completedAppointments.length > 0 ? totalRevenue / completedAppointments.length : 0,
                pending_payments: 0
            },
            appointment_status: {
                scheduled: appState.appointments.filter(a => a.status === 'scheduled').length,
                completed: appState.appointments.filter(a => a.status === 'completed').length,
                cancelled: appState.appointments.filter(a => a.status === 'cancelled').length,
                no_show: appState.appointments.filter(a => a.status === 'no_show').length
            },
            trends: {
                daily_revenue: dailyRevenue,
                popular_services: popularServices,
                staff_performance: appState.staff
                    .filter(staff => staff.role === 'manicurist' || staff.role === 'hairdresser') // 🔧 FIX: Apenas manicures e cabeleireiras
                    .map(staff => {
                        const staffAppointments = completedAppointments.filter(a => a.staff_id === staff.id);
                        const staffRevenue = staffAppointments.reduce((sum, app) => sum + calculateAppointmentTotal(app), 0);
                        const staffCommission = staffAppointments.reduce((sum, app) => sum + calculateAppointmentCommission(app), 0);
                        
                        return {
                            staff_name: staff.name,
                            staff_role: staff.role,
                            appointments_completed: staffAppointments.length,
                            total_revenue: staffRevenue,
                            total_commission: staffCommission
                        };
                    })
            },
            time_analytics: {
                busiest_hours: busiestHours,
                busiest_days: busiestDays
            }
        };
    }

    // 🔄 Função para atualizar analytics
    window.refreshAnalytics = async function() {
        const t = getTranslations(); // 🔧 FIX: Adicionar traduções
        const reportsView = document.getElementById('reportsView');
        const userRole = getUserRole();
        
        if (reportsView && (isAdmin() || isManicurist() || isHairdresser())) {
            const loadingHtml = `
                <div class="space-y-6">
                    <h2 class="text-2xl font-bold text-[var(--text-primary)]">${t.reportsTitle || 'Relatórios'}</h2>
                    <div class="flex items-center justify-center py-12">
                        <div class="text-center">
                            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)] mx-auto mb-4"></div>
                            <p class="text-[var(--text-secondary)]">${t.updatingAnalytics || 'Atualizando analytics...'}</p>
                        </div>
                    </div>
                </div>
            `;
            reportsView.innerHTML = loadingHtml;
            
            // Aguardar um pouco para mostrar o loading
            setTimeout(async () => {
                let newContent;
                if (userRole === 'admin') {
                    newContent = await renderAdvancedAdminReports();
                } else if (userRole === 'manicurist' || userRole === 'hairdresser') {
                    newContent = renderManicuristReports();
                } else {
                    newContent = `<p class="text-center text-[var(--text-secondary)]">${t.noPermissionViewReports || 'Sem permissão'}</p>`;
                }
                
                reportsView.innerHTML = `
                    <div class="space-y-6">
                        <h2 class="text-2xl font-bold text-[var(--text-primary)]">${t.reportsTitle || 'Relatórios'}</h2>
                        ${newContent}
                    </div>
                `;
                showNotification(t.analyticsUpdated || '📊 Analytics atualizado com sucesso!', 'success');
            }, 100); // 🔧 FIX: Reduzir de 1000ms para 100ms para ser mais rápido
        }
    };

    // 📅 Função para mudar período do analytics
    window.changePeriod = function(period) {
        appState.selectedAnalyticsPeriod = period;
        refreshAnalytics(); // Já vai recarregar com o novo período
    };

    // 📅 Função para aplicar período customizado
    window.applyCustomPeriod = function() {
        const startDate = document.getElementById('customStartDate')?.value;
        const endDate = document.getElementById('customEndDate')?.value;
        
        if (!startDate || !endDate) {
            showNotification('Por favor, selecione as datas de início e fim', 'error');
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            showNotification('A data de início deve ser anterior à data de fim', 'error');
            return;
        }
        
        appState.customStartDate = startDate;
        appState.customEndDate = endDate;
        appState.selectedAnalyticsPeriod = 'custom';
        refreshAnalytics();
    };

    // 📊 Função para exportar analytics
    window.exportAnalytics = function() {
        const currentDate = new Date().toISOString().split('T')[0];
        const dataToExport = {
            exported_at: new Date().toISOString(),
            salon_name: appState.settings.businessName || 'Meu Salão',
            period: `${currentDate} - Últimos 30 dias`,
            basic_metrics: calculateLocalAnalytics().basic_metrics,
            financial_metrics: calculateLocalAnalytics().financial_metrics
        };
        
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${currentDate}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification(t.analyticsExported || '📊 Analytics exportado com sucesso!', 'success');
    };

    function renderManicuristReports() {
        const t = getTranslations();
        const { currentUser, staff } = appState;
        
        const currentStaff = staff.find(s => s.user_id === currentUser?.id || s.email === currentUser?.email);
        
        if (!currentStaff) {
            return `
                <div class="bg-[var(--bg-secondary)] p-6 rounded-lg border border-[var(--border-color)]">
                    <p class="text-center text-[var(--text-secondary)]">
                        ${t.noStaffDataFound || 'Dados do funcionário não encontrados'}
                    </p>
                </div>
            `;
        }
        
        const completedAppointments = appState.appointments.filter(a => 
            a.status === 'completed' && a.staff_id === currentStaff.id
        );
        
        // Calcular receita e comissão usando novo fluxo de appointment_services
        let totalRevenue = 0;
        let totalCommission = 0;
        
        completedAppointments.forEach(app => {
            if (app.appointment_services && app.appointment_services.length > 0) {
                // Novo fluxo: múltiplos serviços por agendamento
                app.appointment_services.forEach(appointmentService => {
                    const service = appState.services.find(s => s.id === appointmentService.service_id);
                    if (service) {
                        const serviceTotal = appointmentService.price_charged * appointmentService.quantity;
                        totalRevenue += serviceTotal;
                        // Comissão = preço total do serviço * taxa de comissão do serviço
                        totalCommission += serviceTotal * (service.commission_rate || 0.50);
                    }
                });
            } else {
                // Fallback: sistema antigo (1 serviço por agendamento)
                const service = appState.services.find(s => s.id === app.service_id);
                if (service) {
                    totalRevenue += service.price;
                    totalCommission += service.price * (service.commission_rate || 0.50);
                }
            }
        });
        
        const today = new Date();
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Calcular início da semana (domingo)
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        // Calcular fim da semana (sábado)
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        const monthlyAppointments = completedAppointments.filter(a => new Date(a.date) >= thisMonth);
        const weeklyAppointments = completedAppointments.filter(a => {
            const appointmentDate = new Date(a.date);
            return appointmentDate >= startOfWeek && appointmentDate <= endOfWeek;
        });
        
        let monthlyRevenue = 0;
        let monthlyCommission = 0;
        let weeklyRevenue = 0;
        let weeklyCommission = 0;
        
        monthlyAppointments.forEach(app => {
            if (app.appointment_services && app.appointment_services.length > 0) {
                app.appointment_services.forEach(appointmentService => {
                    const service = appState.services.find(s => s.id === appointmentService.service_id);
                    if (service) {
                        const serviceTotal = appointmentService.price_charged * appointmentService.quantity;
                        monthlyRevenue += serviceTotal;
                        monthlyCommission += serviceTotal * (service.commission_rate || 0.50);
                    }
                });
            } else {
                const service = appState.services.find(s => s.id === app.service_id);
                if (service) {
                    monthlyRevenue += service.price;
                    monthlyCommission += service.price * (service.commission_rate || 0.50);
                }
            }
        });
        
        weeklyAppointments.forEach(app => {
            if (app.appointment_services && app.appointment_services.length > 0) {
                app.appointment_services.forEach(appointmentService => {
                    const service = appState.services.find(s => s.id === appointmentService.service_id);
                    if (service) {
                        const serviceTotal = appointmentService.price_charged * appointmentService.quantity;
                        weeklyRevenue += serviceTotal;
                        weeklyCommission += serviceTotal * (service.commission_rate || 0.50);
                    }
                });
            } else {
                const service = appState.services.find(s => s.id === app.service_id);
                if (service) {
                    weeklyRevenue += service.price;
                    weeklyCommission += service.price * (service.commission_rate || 0.50);
                }
            }
        });

        return `
            <div class="bg-[var(--bg-secondary)] p-6 rounded-lg border border-[var(--border-color)]">
                <h3 class="font-bold text-xl mb-6 text-[var(--text-primary)]">
                    ${t.myPerformance || 'Meu Desempenho'} - ${currentStaff.name}
                </h3>
                
                <!-- Métricas da Semana Atual (DESTAQUE) -->
                <div class="mb-6">
                    <h4 class="font-semibold text-sm text-[var(--text-secondary)] mb-3 flex items-center">
                        <span class="mr-2">📅</span> Semana Atual (${startOfWeek.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${endOfWeek.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-5 rounded-lg border-2 border-green-200 dark:border-green-800">
                            <div class="flex items-center">
                                <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3 shadow-md">
                                    <span class="text-xl">💰</span>
                                </div>
                                <div>
                                    <p class="text-xs text-green-700 dark:text-green-300 font-medium">Receita da Semana</p>
                                    <p class="text-2xl font-bold text-green-600 dark:text-green-400">R$ ${weeklyRevenue.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-5 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                            <div class="flex items-center">
                                <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3 shadow-md">
                                    <span class="text-xl">💵</span>
                                </div>
                                <div>
                                    <p class="text-xs text-blue-700 dark:text-blue-300 font-medium">Comissão da Semana</p>
                                    <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">R$ ${weeklyCommission.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-5 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                            <div class="flex items-center">
                                <div class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3 shadow-md">
                                    <span class="text-xl">📊</span>
                                </div>
                                <div>
                                    <p class="text-xs text-purple-700 dark:text-purple-300 font-medium">Atendimentos da Semana</p>
                                    <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">${weeklyAppointments.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Métricas do Mês Atual -->
                <div class="mb-6">
                    <h4 class="font-semibold text-sm text-[var(--text-secondary)] mb-3">
                        📆 Mês Atual
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-[var(--bg-primary)] p-4 rounded-lg border border-[var(--border-color)]">
                            <div class="flex items-center">
                                <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                    💰
                                </div>
                                <div>
                                    <p class="text-xs text-[var(--text-secondary)]">Receita do Mês</p>
                                    <p class="text-lg font-bold text-green-600">R$ ${monthlyRevenue.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-[var(--bg-primary)] p-4 rounded-lg border border-[var(--border-color)]">
                            <div class="flex items-center">
                                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                    💵
                                </div>
                                <div>
                                    <p class="text-xs text-[var(--text-secondary)]">Comissão do Mês</p>
                                    <p class="text-lg font-bold text-blue-600">R$ ${monthlyCommission.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-[var(--bg-primary)] p-4 rounded-lg border border-[var(--border-color)]">
                            <div class="flex items-center">
                                <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                                    📅
                                </div>
                                <div>
                                    <p class="text-xs text-[var(--text-secondary)]">Atendimentos do Mês</p>
                                    <p class="text-lg font-bold text-purple-600">${monthlyAppointments.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Totais Gerais -->
                <div class="space-y-4">
                    <h4 class="font-semibold text-lg text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">
                        ${t.totalPerformance || 'Desempenho Total'}
                    </h4>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="flex justify-between items-center p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
                            <span class="text-[var(--text-secondary)]">${t.totalRevenueGenerated || 'Receita Total Gerada'}</span>
                            <span class="font-bold text-lg text-[var(--accent-primary)]">R$ ${totalRevenue.toFixed(2)}</span>
                        </div>
                        
                        <div class="flex justify-between items-center p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
                            <span class="text-[var(--text-secondary)]">${t.myCommission || 'Minha Comissão'}</span>
                            <span class="font-bold text-lg text-green-600">R$ ${totalCommission.toFixed(2)}</span>
                        </div>
                        
                        <div class="flex justify-between items-center p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
                            <span class="text-[var(--text-secondary)]">${t.totalServices || 'Total de Atendimentos'}</span>
                            <span class="font-bold text-lg text-[var(--accent-primary)]">${completedAppointments.length}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Cards de Resumo com Informações da Semana -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 rounded-lg border border-green-200 dark:border-green-800">
                        <h5 class="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">💰 Esta Semana</h5>
                        <div class="space-y-1 text-sm">
                            <div class="flex justify-between">
                                <span class="text-[var(--text-secondary)]">Média por atendimento:</span>
                                <span class="font-bold text-green-600">R$ ${weeklyAppointments.length > 0 ? (weeklyRevenue / weeklyAppointments.length).toFixed(2) : '0.00'}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-[var(--text-secondary)]">Comissão média:</span>
                                <span class="font-bold text-blue-600">R$ ${weeklyAppointments.length > 0 ? (weeklyCommission / weeklyAppointments.length).toFixed(2) : '0.00'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
                        <h5 class="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-2">📊 Total Geral</h5>
                        <div class="space-y-1 text-sm">
                            <div class="flex justify-between">
                                <span class="text-[var(--text-secondary)]">Receita total:</span>
                                <span class="font-bold text-[var(--accent-primary)]">R$ ${totalRevenue.toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-[var(--text-secondary)]">Comissão total:</span>
                                <span class="font-bold text-green-600">R$ ${totalCommission.toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-[var(--text-secondary)]">Total atendimentos:</span>
                                <span class="font-bold text-[var(--accent-primary)]">${completedAppointments.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    window.hideModal = hideModal;

    function showManicuristLoginsModal() {
        const t = getTranslations();
        const manicures = appState.staff.filter(s => s.role === 'manicurist');
        const modalHtml = `
            <div id="manicurist-logins-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-[var(--bg-primary)] rounded-lg shadow-xl p-6 w-full max-w-md border border-[var(--border-color)]">
                    <h3 class="text-xl font-bold mb-4 text-[var(--text-primary)]">${t.manicuristLogins}</h3>
                    <div class="overflow-x-auto mb-4">
                        <table class="w-full text-left text-sm">
                            <thead>
                                <tr class="border-b border-[var(--border-color)]">
                                    <th class="py-2 text-[var(--text-primary)]">${t.name}</th>
                                    <th class="py-2 text-[var(--text-primary)]">${t.email}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${manicures.length === 0 ? 
                                    `<tr><td colspan="2" class="py-2 text-[var(--text-secondary)]">${t.noManicuristRegistered}</td></tr>` :
                                    manicures.map(m => `
                                        <tr class="border-b border-[var(--border-color)]">
                                            <td class="py-2 text-[var(--text-primary)]">${m.name}</td>
                                            <td class="py-2 text-[var(--text-secondary)]">${m.email}</td>
                                        </tr>
                                    `).join('')
                                }
                            </tbody>
                        </table>
                    </div>
                    <button id="close-manicurist-logins-btn" class="px-4 py-2 bg-[var(--accent-primary)] text-white rounded hover:bg-[var(--accent-secondary)] transition-colors duration-200">${t.close}</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('close-manicurist-logins-btn').addEventListener('click', () => {
            document.getElementById('manicurist-logins-modal').remove();
        });
        
        document.getElementById('manicurist-logins-modal').addEventListener('click', (e) => {
            if (e.target.id === 'manicurist-logins-modal') {
                document.getElementById('manicurist-logins-modal').remove();
            }
        });
    }

    // Expor função globalmente
    window.showManicuristLoginsModal = showManicuristLoginsModal;

    // Modal de logins de cabeleireiras
    function showHairdresserLoginsModal() {
        const t = getTranslations();
        const hairdressers = appState.staff.filter(s => s.role === 'hairdresser');
        const modalHtml = `
            <div id="hairdresser-logins-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-[var(--bg-primary)] rounded-lg shadow-xl p-6 w-full max-w-md border border-[var(--border-color)]">
                    <h3 class="text-xl font-bold mb-4 text-[var(--text-primary)]">${t.hairdresserLogins || 'Logins das Cabeleireiras'}</h3>
                    <div class="overflow-x-auto mb-4">
                        <table class="w-full text-left text-sm">
                            <thead>
                                <tr class="border-b border-[var(--border-color)]">
                                    <th class="py-2 text-[var(--text-primary)]">${t.name}</th>
                                    <th class="py-2 text-[var(--text-primary)]">${t.email}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${hairdressers.length === 0 ? 
                                    `<tr><td colspan="2" class="py-2 text-[var(--text-secondary)]">${t.noHairdresserRegistered || 'Nenhuma cabeleireira cadastrada'}</td></tr>` :
                                    hairdressers.map(h => `
                                        <tr class="border-b border-[var(--border-color)]">
                                            <td class="py-2 text-[var(--text-primary)]">${h.name}</td>
                                            <td class="py-2 text-[var(--text-secondary)]">${h.email}</td>
                                        </tr>
                                    `).join('')
                                }
                            </tbody>
                        </table>
                    </div>
                    <button id="close-hairdresser-logins-btn" class="px-4 py-2 bg-[var(--accent-primary)] text-white rounded hover:bg-[var(--accent-secondary)] transition-colors duration-200">${t.close}</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('close-hairdresser-logins-btn').addEventListener('click', () => {
            document.getElementById('hairdresser-logins-modal').remove();
        });
        
        document.getElementById('hairdresser-logins-modal').addEventListener('click', (e) => {
            if (e.target.id === 'hairdresser-logins-modal') {
                document.getElementById('hairdresser-logins-modal').remove();
            }
        });
    }

    // Expor função globalmente
    window.showHairdresserLoginsModal = showHairdresserLoginsModal;

    // Função para configurar permissões da interface
    function setupButtonPermissions() {
        const canEditClientsFlag = canEditClients();
        const canEditServicesFlag = canEditServices();
        const canEditStaffFlag = canEditStaff();
        const canCreateAppointmentsFlag = canCreateAppointments();
        
        // Controlar visibilidade dos botões "Adicionar Novo"
        const newClientBtn = document.getElementById('newClientBtn');
        const newServiceBtn = document.getElementById('newServiceBtn');
        const newStaffBtn = document.getElementById('newStaffBtn');
        const newAppointmentBtn = document.getElementById('newAppointmentBtn');
        
        if (newClientBtn) {
            newClientBtn.classList.toggle('hidden', !canEditClientsFlag);
        }
        
        if (newServiceBtn) {
            newServiceBtn.classList.toggle('hidden', !canEditServicesFlag);
        }
        
        if (newStaffBtn) {
            newStaffBtn.classList.toggle('hidden', !canEditStaffFlag);
        }

        // Controlar visibilidade do botão "Novo Agendamento" (apenas admin e recepcionista)
        if (newAppointmentBtn) {
            newAppointmentBtn.classList.toggle('hidden', !canCreateAppointmentsFlag);
        }

        // Controlar visibilidade dos relatórios
        // Admin: vê todos os relatórios gerais
        // Manicure e Cabeleireira: veem apenas seus próprios relatórios
        // Recepcionista: não vê relatórios
        const reportsLink = document.querySelector('[data-view="reportsView"]');
        if (reportsLink) {
            const canViewReports = isAdmin() || isManicurist() || isHairdresser();
            reportsLink.parentElement.style.display = canViewReports ? 'block' : 'none';
        }
    }

    function initializeEnhancements() {
        setupUIPermissions();
        setupButtonPermissions();

        if (window.NotificationManager) {
            // Programar lembretes diários
            if (window.NotificationIntegration) {
                window.NotificationIntegration.scheduleDailyReminders();
            }
        }

        // Inicializar sincronização automática
        if (window.CacheManager) {
            // Sincronizar dados na inicialização
            window.CacheManager.syncWithSupabase();
            
            // Configurar sincronização periódica baseada na conexão
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden && navigator.onLine) {
                    window.CacheManager.syncWithSupabase();
                }
            });
        }

        // Aplicar tema salvo
        if (window.ThemeManager) {
            const savedTheme = window.ThemeManager.getCurrentTheme();
            if (savedTheme && savedTheme !== 'light-mode') {
                window.ThemeManager.applyTheme(savedTheme);
            }
        }

        if (window.PerformanceMonitor) {
            // Registrar tempo de carregamento da app
            window.PerformanceMonitor.recordAction('app_initialization', Date.now() - window.performance.timing.navigationStart);
        }
    }

    const originalSaveAppointment = window.saveAppointment;
    window.saveAppointment = function(appointmentData, isEdit = false) {
        const result = originalSaveAppointment?.call(this, appointmentData, isEdit);
        
        if (window.NotificationIntegration && !isEdit) {
            window.NotificationIntegration.onAppointmentCreated(appointmentData);
        }
        
        return result;
    };

    const originalCancelAppointment = window.cancelAppointment;
    window.cancelAppointment = function(appointmentId, reason) {
        const appointment = appState.appointments.find(a => a.id === appointmentId);
        
        const result = originalCancelAppointment?.call(this, appointmentId, reason);
        
        if (window.NotificationIntegration && appointment) {
            window.NotificationIntegration.onAppointmentCancelled(appointment, reason);
        }
        
        return result;
    };
    
    window.toggleNotificationPanel = function() {
        const panel = document.getElementById('notificationPanel');
        const badge = document.getElementById('notificationBadge');
        
        if (panel) {
            panel.classList.toggle('hidden');
            
            if (!panel.classList.contains('hidden') && badge) {
                badge.classList.add('hidden');
                document.getElementById('notificationCount').textContent = '0';
            }
        }
    };

    window.addNotification = function(title, message, icon = '🔔', type = 'info') {
        const notificationList = document.getElementById('notificationList');
        const badge = document.getElementById('notificationBadge');
        const count = document.getElementById('notificationCount');
        
        if (!notificationList) return;
        
        // Remover mensagem "Nenhuma notificação"
        const emptyMessage = notificationList.querySelector('.text-center');
        if (emptyMessage && emptyMessage.textContent.includes('Nenhuma notificação')) {
            emptyMessage.remove();
        }
        
        // Criar notificação
        const notification = document.createElement('div');
        notification.className = `p-3 border-b border-[var(--border-color)] hover:bg-[var(--accent-light)] cursor-pointer transition-colors`;
        notification.innerHTML = `
            <div class="flex items-start gap-3">
                <span class="text-2xl flex-shrink-0">${icon}</span>
                <div class="flex-1 min-w-0">
                    <p class="font-medium text-[var(--text-primary)] text-sm">${title}</p>
                    <p class="text-xs text-[var(--text-secondary)] mt-1">${message}</p>
                    <p class="text-xs text-[var(--text-secondary)] mt-1">${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            </div>
        `;
        
        // Adicionar no topo da lista
        notificationList.insertBefore(notification, notificationList.firstChild);
        
        // Atualizar badge
        if (badge && count) {
            badge.classList.remove('hidden');
            const currentCount = parseInt(count.textContent) || 0;
            count.textContent = currentCount + 1;
        }
        
        // Limitar a 20 notificações
        const notifications = notificationList.querySelectorAll('div.p-3');
        if (notifications.length > 20) {
            notifications[notifications.length - 1].remove();
        }
    };

    document.addEventListener('click', (e) => {
        const panel = document.getElementById('notificationPanel');
        const bell = document.getElementById('notificationBell');
        
        if (panel && !panel.classList.contains('hidden') && 
            !panel.contains(e.target) && !bell?.contains(e.target)) {
            panel.classList.add('hidden');
        }
    });

    // 🔔 Funções do Sistema de Notificações
    window.toggleNotificationPanel = function() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.classList.toggle('hidden');
            if (!panel.classList.contains('hidden')) {
                loadNotifications();
            }
        }
    };
    
    window.clearAllNotifications = async function() {
        const confirmed = await showConfirm(
            'Todas as suas notificações serão removidas permanentemente.',
            'Limpar Notificações',
            {
                confirmText: 'Limpar Tudo',
                cancelText: 'Cancelar',
                type: 'warning',
                icon: '🗑️'
            }
        );
        
        if (confirmed) {
            localStorage.removeItem('staff_notifications');
            loadNotifications();
            updateNotificationBellCount();
            showNotification('Notificações limpas com sucesso!');
        }
    };
    
    function loadNotifications() {
        const container = document.getElementById('notificationList');
        if (!container) return;
        
        try {
            const stored = localStorage.getItem('staff_notifications');
            if (!stored) {
                container.innerHTML = `
                    <div class="p-8 text-center text-[var(--text-secondary)]">
                        <div class="text-4xl mb-2">🔔</div>
                        <p>Nenhuma notificação nova</p>
                    </div>
                `;
                return;
            }
            
            const notifications = JSON.parse(stored);
            const currentStaff = appState.staff.find(s => 
                s.user_id === appState.currentUser?.id || 
                s.email === appState.currentUser?.email
            );
            
            if (!currentStaff) return;
            
            // Filtrar notificações do funcionário atual
            const myNotifications = notifications.filter(n => n.staffId === currentStaff.id);
            
            if (myNotifications.length === 0) {
                container.innerHTML = `
                    <div class="p-8 text-center text-[var(--text-secondary)]">
                        <div class="text-4xl mb-2">🔔</div>
                        <p>Nenhuma notificação nova</p>
                    </div>
                `;
                return;
            }
            
            // Renderizar notificações
            container.innerHTML = myNotifications.map(notif => `
                <div class="p-4 border-b border-[var(--border-color)] ${notif.read ? 'bg-[var(--bg-secondary)] opacity-60' : 'bg-[var(--accent-light)]'} hover:bg-[var(--bg-secondary)] cursor-pointer transition-colors"
                     onclick="markNotificationAsRead('${notif.id}')">
                    <div class="flex items-start space-x-3">
                        <div class="text-2xl">${notif.type === 'new_appointment' ? '📅' : '🔔'}</div>
                        <div class="flex-1">
                            <h4 class="font-semibold text-sm text-[var(--text-primary)] ${!notif.read ? 'font-bold' : ''}">
                                ${notif.title}
                            </h4>
                            <p class="text-xs text-[var(--text-secondary)] mt-1">${notif.message}</p>
                            <p class="text-xs text-[var(--text-secondary)] mt-2 italic">
                                ${formatNotificationTime(notif.timestamp)}
                            </p>
                        </div>
                        ${!notif.read ? '<div class="w-2 h-2 bg-blue-500 rounded-full"></div>' : ''}
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
            container.innerHTML = `
                <div class="p-4 text-center text-red-500">
                    Erro ao carregar notificações
                </div>
            `;
        }
    }
    
    window.markNotificationAsRead = function(notificationId) {
        try {
            const stored = localStorage.getItem('staff_notifications');
            if (!stored) return;
            
            let notifications = JSON.parse(stored);
            const index = notifications.findIndex(n => n.id === notificationId);
            
            if (index !== -1) {
                notifications[index].read = true;
                localStorage.setItem('staff_notifications', JSON.stringify(notifications));
                loadNotifications();
                updateNotificationBellCount();
            }
        } catch (error) {
            console.error('Erro ao marcar notificação como lida:', error);
        }
    };
    
    function formatNotificationTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Agora mesmo';
        if (diffMins < 60) return `Há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
        if (diffHours < 24) return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        if (diffDays < 7) return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
        
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    }

    // Initialize the app
    init();
});