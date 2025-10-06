// Componente de histórico de atendimentos
export class HistoryView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.history = new AppointmentHistory();
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.selectedClient = null;
    }

    /**
     * Inicializa o componente
     */
    async init() {
        this.render();
        this.attachEventListeners();
    }

    /**
     * Renderiza o componente
     */
    render() {
        this.container.innerHTML = `
            <div class="history-view">
                <div class="history-header">
                    <h2>Histórico de Atendimentos</h2>
                    <div class="client-selector">
                        <label for="clientSelect">Selecione o Cliente:</label>
                        <select id="clientSelect">
                            <option value="">Selecione...</option>
                        </select>
                    </div>
                </div>

                <div class="client-stats" style="display: none;">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h3>Total de Atendimentos</h3>
                            <p id="totalAppointments">0</p>
                        </div>
                        <div class="stat-card">
                            <h3>Total Gasto</h3>
                            <p id="totalSpent">R$ 0,00</p>
                        </div>
                        <div class="stat-card">
                            <h3>Taxa de Conclusão</h3>
                            <p id="completionRate">0%</p>
                        </div>
                        <div class="stat-card">
                            <h3>Última Visita</h3>
                            <p id="lastVisit">-</p>
                        </div>
                    </div>
                </div>

                <div class="history-list">
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Serviço</th>
                                <th>Profissional</th>
                                <th>Valor</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="historyTableBody">
                            <!-- Dados serão inseridos aqui -->
                        </tbody>
                    </table>
                </div>

                <div class="pagination">
                    <button id="prevPage" disabled>&lt; Anterior</button>
                    <span id="pageInfo">Página 1</span>
                    <button id="nextPage">Próximo &gt;</button>
                </div>
            </div>
        `;
    }

    /**
     * Anexa os event listeners
     */
    attachEventListeners() {
        const clientSelect = document.getElementById('clientSelect');
        const prevButton = document.getElementById('prevPage');
        const nextButton = document.getElementById('nextPage');

        clientSelect.addEventListener('change', () => {
            this.selectedClient = clientSelect.value;
            this.currentPage = 1;
            this.loadHistory();
        });

        prevButton.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadHistory();
            }
        });

        nextButton.addEventListener('click', () => {
            this.currentPage++;
            this.loadHistory();
        });
    }

    /**
     * Carrega o histórico do cliente selecionado
     */
    async loadHistory() {
        if (!this.selectedClient) return;

        try {
            const offset = (this.currentPage - 1) * this.itemsPerPage;
            const history = await this.history.getClientHistory(this.selectedClient, {
                limit: this.itemsPerPage,
                offset
            });

            const stats = await this.history.getClientStats(this.selectedClient);
            this.updateStats(stats);
            this.updateHistoryTable(history);
            this.updatePagination(history.length < this.itemsPerPage);
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            // TODO: Mostrar mensagem de erro ao usuário
        }
    }

    /**
     * Atualiza as estatísticas do cliente
     */
    updateStats(stats) {
        const statsContainer = this.container.querySelector('.client-stats');
        statsContainer.style.display = 'block';

        document.getElementById('totalAppointments').textContent = stats.total_appointments;
        document.getElementById('totalSpent').textContent = 
            new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            }).format(stats.total_spent);
        document.getElementById('completionRate').textContent = 
            `${stats.completion_rate}%`;
        document.getElementById('lastVisit').textContent = 
            new Date(stats.last_visit).toLocaleDateString('pt-BR');
    }

    /**
     * Atualiza a tabela de histórico
     */
    updateHistoryTable(history) {
        const tbody = document.getElementById('historyTableBody');
        tbody.innerHTML = '';

        history.forEach(appointment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(appointment.date).toLocaleDateString('pt-BR')} 
                    ${appointment.time}</td>
                <td>${appointment.service.name}</td>
                <td>
                    <div class="staff-info">
                        <img src="${appointment.staff.photo_url || 'assets/imgs/default-avatar.png'}" 
                             alt="${appointment.staff.name}"
                             class="staff-photo-small">
                        ${appointment.staff.name}
                    </div>
                </td>
                <td>${new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                }).format(appointment.price)}</td>
                <td>
                    <span class="status-badge ${appointment.status}">
                        ${this.getStatusText(appointment.status)}
                    </span>
                </td>
                <td>
                    <button onclick="showAppointmentDetails('${appointment.id}')"
                            class="btn-icon">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Atualiza a paginação
     */
    updatePagination(isLastPage) {
        const prevButton = document.getElementById('prevPage');
        const nextButton = document.getElementById('nextPage');
        const pageInfo = document.getElementById('pageInfo');

        prevButton.disabled = this.currentPage === 1;
        nextButton.disabled = isLastPage;
        pageInfo.textContent = `Página ${this.currentPage}`;
    }

    /**
     * Retorna o texto do status
     */
    getStatusText(status) {
        const statusMap = {
            'completed': 'Concluído',
            'cancelled': 'Cancelado',
            'no-show': 'Não Compareceu'
        };
        return statusMap[status] || status;
    }
}