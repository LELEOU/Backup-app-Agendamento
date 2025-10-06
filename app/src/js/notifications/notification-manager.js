class NotificationManager {
    constructor() {
        this.permission = null;
        this.serviceWorkerRegistration = null;
        this.fallbackNotifications = [];
        this.isOperaGX = navigator.userAgent.includes('OPR') || navigator.userAgent.includes('Opera');
        this.init();
    }

    async init() {
        // Verificar suporte a notificações
        if (!('Notification' in window)) {
            console.warn('Este navegador não suporta notificações - usando fallback');
            this.createFallbackSystem();
            return;
        }

        // Para OperaGX e navegadores problemáticos, criar sistema alternativo
        if (this.isOperaGX) {
            console.log('OperaGX detectado - implementando sistema de notificação alternativo');
            this.createFallbackSystem();
        }

        // Tentar solicitar permissão de forma mais robusta
        await this.requestPermissionRobust();
        
        // Registrar Service Worker
        await this.registerServiceWorker();
    }

    async requestPermissionRobust() {
        // Verificar se já temos permissão
        if (Notification.permission === 'granted') {
            this.permission = 'granted';
            return true;
        }

        // Se foi negado, usar fallback
        if (Notification.permission === 'denied') {
            console.log('Notificações negadas - usando sistema alternativo');
            this.createFallbackSystem();
            return false;
        }

        try {
            // Tentar solicitar permissão com timeout
            const result = await Promise.race([
                Notification.requestPermission(),
                new Promise(resolve => setTimeout(() => resolve('timeout'), 5000))
            ]);

            if (result === 'timeout') {
                console.log('Timeout na solicitação de permissão - usando fallback');
                this.createFallbackSystem();
                return false;
            }

            this.permission = result;
            
            if (result !== 'granted') {
                console.log('Permissão não concedida - usando fallback');
                this.createFallbackSystem();
            }
            
            return result === 'granted';
        } catch (error) {
            console.error('Erro ao solicitar permissão:', error);
            this.createFallbackSystem();
            return false;
        }
    }

    createFallbackSystem() {
        // Criar container para notificações in-app
        if (!document.getElementById('fallback-notifications')) {
            const container = document.createElement('div');
            container.id = 'fallback-notifications';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 300px;
                pointer-events: none;
            `;
            
            // Aguardar o body estar disponível antes de adicionar
            if (document.body) {
                document.body.appendChild(container);
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    document.body.appendChild(container);
                });
            }
        }
    }

    showFallbackNotification(title, body, options = {}) {
        const container = document.getElementById('fallback-notifications');
        if (!container) return;

        const notification = document.createElement('div');
        notification.style.cssText = `
            background: var(--bg-primary, #ffffff);
            border: 2px solid var(--accent-primary, #3b82f6);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            pointer-events: auto;
            cursor: pointer;
            animation: slideInRight 0.3s ease-out;
            max-width: 100%;
            word-wrap: break-word;
        `;

        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <div style="font-size: 24px; flex-shrink: 0;">📱</div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: bold; color: var(--text-primary, #000); margin-bottom: 4px; font-size: 14px;">
                        ${title}
                    </div>
                    <div style="color: var(--text-secondary, #666); font-size: 12px; line-height: 1.4;">
                        ${body}
                    </div>
                </div>
                <button style="background: none; border: none; font-size: 18px; cursor: pointer; color: var(--text-secondary, #666); padding: 0; line-height: 1;" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
                setTimeout(() => notification.remove(), 300);
            }
        }, options.duration || 5000);

        // Adicionar evento de clique se fornecido
        if (options.onclick) {
            notification.addEventListener('click', options.onclick);
        }

        container.appendChild(notification);

        // Adicionar CSS de animação se ainda não existir
        if (!document.getElementById('fallback-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'fallback-notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    async registerServiceWorker() {
        // Service Worker não funciona em desenvolvimento (localhost sem HTTPS)
        // Só tenta registrar em produção
        if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
            try {
                this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registrado com sucesso');
            } catch (error) {
                console.log('ℹ️ Service Worker não disponível (esperado em desenvolvimento)');
            }
        } else {
            console.log('ℹ️ Service Worker desabilitado em desenvolvimento');
        }
    }

    // Notificação para novo agendamento
    notifyNewAppointment(appointment, staff) {
        const client = appointment.clients || { name: 'Cliente' };
        const service = appointment.services || { name: 'Serviço' };
        
        const title = '📅 Novo Agendamento!';
        const body = `${client.name} agendou ${service.name} para ${this.formatDateTime(appointment.date, appointment.time)}`;
        
        this.showNotification(title, body, {
            icon: '/assets/icon/favicon.ico',
            badge: '/assets/icon/favicon.ico',
            tag: `appointment-${appointment.id}`,
            data: {
                type: 'new_appointment',
                appointmentId: appointment.id,
                staffId: staff.id
            },
            actions: [
                {
                    action: 'view',
                    title: 'Ver Detalhes',
                    icon: '/assets/icon/favicon.ico'
                },
                {
                    action: 'confirm',
                    title: 'Confirmar',
                    icon: '/assets/icon/favicon.ico'
                }
            ]
        });
    }

    // Notificação para cancelamento
    notifyAppointmentCancelled(appointment, staff, reason = '') {
        const client = appointment.clients || { name: 'Cliente' };
        const service = appointment.services || { name: 'Serviço' };
        
        const title = '❌ Agendamento Cancelado';
        const body = `${client.name} cancelou ${service.name} (${this.formatDateTime(appointment.date, appointment.time)})${reason ? ` - ${reason}` : ''}`;
        
        this.showNotification(title, body, {
            icon: '/assets/icon/favicon.ico',
            badge: '/assets/icon/favicon.ico',
            tag: `cancelled-${appointment.id}`,
            data: {
                type: 'appointment_cancelled',
                appointmentId: appointment.id,
                staffId: staff.id
            },
            requireInteraction: true
        });
    }

    // Notificação para alteração de agendamento
    notifyAppointmentChanged(appointment, staff, changes) {
        const client = appointment.clients || { name: 'Cliente' };
        
        const title = '🔄 Agendamento Alterado';
        let body = `${client.name} alterou o agendamento:\n`;
        
        if (changes.date) body += `Nova data: ${this.formatDate(changes.date)}\n`;
        if (changes.time) body += `Novo horário: ${changes.time}\n`;
        if (changes.service) body += `Novo serviço: ${changes.service.name}\n`;
        
        this.showNotification(title, body, {
            icon: '/assets/icon/favicon.ico',
            badge: '/assets/icon/favicon.ico',
            tag: `changed-${appointment.id}`,
            data: {
                type: 'appointment_changed',
                appointmentId: appointment.id,
                staffId: staff.id
            }
        });
    }

    // Lembrete para agendamento próximo (15 min antes)
    notifyUpcomingAppointment(appointment, staff) {
        const client = appointment.clients || { name: 'Cliente' };
        const service = appointment.services || { name: 'Serviço' };
        
        const title = '⏰ Próximo Agendamento';
        const body = `${client.name} - ${service.name} em 15 minutos`;
        
        this.showNotification(title, body, {
            icon: '/assets/icon/favicon.ico',
            badge: '/assets/icon/favicon.ico',
            tag: `reminder-${appointment.id}`,
            data: {
                type: 'appointment_reminder',
                appointmentId: appointment.id,
                staffId: staff.id
            },
            requireInteraction: true
        });
    }

    // Notificação personalizada para admin
    notifyAdmin(title, message, type = 'info') {
        const icons = {
            info: '🔵',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };

        this.showNotification(`${icons[type]} ${title}`, message, {
            icon: '/assets/icon/favicon.ico',
            badge: '/assets/icon/favicon.ico',
            tag: `admin-${Date.now()}`,
            data: {
                type: 'admin_notification',
                level: type
            }
        });
    }

    // Função base para mostrar notificação
    showNotification(title, body, options = {}) {
        // Se não temos permissão OU se é OperaGX, usar fallback
        if (this.permission !== 'granted' || this.isOperaGX) {
            this.showFallbackNotification(title, body, options);
            return;
        }

        try {
            const defaultOptions = {
                body,
                icon: '/assets/icon/favicon.ico',
                badge: '/assets/icon/favicon.ico',
                vibrate: [200, 100, 200],
                timestamp: Date.now(),
                requireInteraction: false
            };

            const finalOptions = { ...defaultOptions, ...options };

            if (this.serviceWorkerRegistration) {
                // Usar Service Worker para notificações persistentes
                this.serviceWorkerRegistration.showNotification(title, finalOptions);
            } else {
                // Fallback para notificação básica
                const notification = new Notification(title, finalOptions);
                
                // Auto-fechar após 5 segundos se não requer interação
                if (!finalOptions.requireInteraction) {
                    setTimeout(() => {
                        notification.close();
                    }, 5000);
                }
            }
        } catch (error) {
            console.error('Erro ao mostrar notificação nativa, usando fallback:', error);
            this.showFallbackNotification(title, body, options);
        }
    }

    // Programar lembrete automático
    scheduleReminder(appointment, staff, minutesBefore = 15) {
        const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
        const reminderTime = new Date(appointmentDateTime.getTime() - (minutesBefore * 60 * 1000));
        const now = new Date();

        if (reminderTime > now) {
            const timeUntilReminder = reminderTime.getTime() - now.getTime();
            
            setTimeout(() => {
                this.notifyUpcomingAppointment(appointment, staff);
            }, timeUntilReminder);

            console.log(`Lembrete programado para ${reminderTime.toLocaleString()}`);
        }
    }

    // Utilitários
    formatDateTime(date, time) {
        const dateObj = new Date(date);
        const formattedDate = dateObj.toLocaleDateString('pt-BR');
        const formattedTime = time.substring(0, 5);
        return `${formattedDate} às ${formattedTime}`;
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('pt-BR');
    }

    // Verificar se as notificações estão habilitadas
    isEnabled() {
        return this.permission === 'granted';
    }

    // Status das notificações
    getStatus() {
        return {
            supported: 'Notification' in window,
            permission: this.permission,
            serviceWorkerRegistered: !!this.serviceWorkerRegistration
        };
    }
}

// Instância global
window.NotificationManager = new NotificationManager();

// Integração com o sistema de agendamentos
window.NotificationIntegration = {
    // Notificar quando um novo agendamento é criado
    onAppointmentCreated(appointment) {
        const staff = window.appState?.staff?.find(s => s.id === appointment.staff_id);
        if (staff && staff.id !== window.appState?.currentUser?.id) {
            window.NotificationManager.notifyNewAppointment(appointment, staff);
        }
    },

    // Notificar quando um agendamento é cancelado
    onAppointmentCancelled(appointment, reason) {
        const staff = window.appState?.staff?.find(s => s.id === appointment.staff_id);
        if (staff) {
            window.NotificationManager.notifyAppointmentCancelled(appointment, staff, reason);
        }
    },

    // Notificar quando um agendamento é alterado
    onAppointmentUpdated(appointment, changes) {
        const staff = window.appState?.staff?.find(s => s.id === appointment.staff_id);
        if (staff && staff.id !== window.appState?.currentUser?.id) {
            window.NotificationManager.notifyAppointmentChanged(appointment, staff, changes);
        }
    },

    // Programar lembretes para todos os agendamentos do dia
    scheduleDailyReminders() {
        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = window.appState?.appointments?.filter(app => 
            app.date === today && app.status === 'scheduled'
        ) || [];

        todayAppointments.forEach(appointment => {
            const staff = window.appState?.staff?.find(s => s.id === appointment.staff_id);
            if (staff) {
                window.NotificationManager.scheduleReminder(appointment, staff);
            }
        });

        console.log(`${todayAppointments.length} lembretes programados para hoje`);
    },

    // Função de teste para verificar notificações
    testNotifications() {
        console.log('🧪 Testando sistema de notificações...');
        
        if (window.NotificationManager) {
            // Teste 1: Notificação básica
            window.NotificationManager.showFallbackNotification(
                '🧪 Teste de Notificação',
                'Se você vê esta notificação, o sistema está funcionando!',
                { duration: 8000 }
            );

            // Teste 2: Notificação de agendamento (simulada)
            setTimeout(() => {
                const mockAppointment = {
                    id: 'test-123',
                    date: new Date().toISOString().split('T')[0],
                    time: '14:30',
                    clients: { name: 'Cliente Teste' },
                    services: { name: 'Manicure Teste' }
                };
                const mockStaff = { id: 'staff-123', name: 'Funcionário Teste' };
                
                window.NotificationManager.notifyNewAppointment(mockAppointment, mockStaff);
            }, 2000);

            // Teste 3: Notificação de lembrete
            setTimeout(() => {
                window.NotificationManager.showFallbackNotification(
                    '⏰ Teste de Lembrete',
                    'Esta seria uma notificação de lembrete 15 minutos antes do agendamento',
                    { duration: 6000 }
                );
            }, 4000);

            console.log('✅ Testes de notificação iniciados! Observe o canto superior direito da tela.');
        } else {
            console.error('❌ NotificationManager não encontrado!');
        }
    }
};

// Função global para testar notificações (pode ser chamada no console)
window.testNotifications = () => {
    if (window.NotificationManager) {
        window.NotificationManager.showFallbackNotification(
            '🧪 Teste Manual',
            'Notificação chamada diretamente do console!',
            { duration: 5000 }
        );
    }
};

// Disponibilizar globalmente
window.NotificationManager = NotificationManager;
