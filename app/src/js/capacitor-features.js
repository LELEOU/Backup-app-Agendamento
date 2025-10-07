/**
 * 🚀 CAPACITOR FEATURES - Recursos Nativos do App
 * Pull-to-refresh, Notificações, Galeria, etc.
 */

import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

// 🔄 PULL-TO-REFRESH - Puxar para baixo para recarregar
let isPulling = false;
let startY = 0;
let currentY = 0;
const pullThreshold = 80; // Pixels necessários para trigger

export function initPullToRefresh() {
    const mainContent = document.querySelector('main') || document.body;
    
    // Criar indicador visual de pull
    const refreshIndicator = document.createElement('div');
    refreshIndicator.id = 'refresh-indicator';
    refreshIndicator.style.cssText = `
        position: fixed;
        top: -60px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--accent-primary);
        color: white;
        padding: 12px 24px;
        border-radius: 0 0 12px 12px;
        font-size: 14px;
        font-weight: 600;
        transition: top 0.3s ease;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    refreshIndicator.innerHTML = '↓ Puxe para atualizar';
    document.body.appendChild(refreshIndicator);

    mainContent.addEventListener('touchstart', (e) => {
        if (mainContent.scrollTop === 0) {
            startY = e.touches[0].clientY;
            isPulling = true;
        }
    });

    mainContent.addEventListener('touchmove', (e) => {
        if (!isPulling) return;
        
        currentY = e.touches[0].clientY;
        const pullDistance = currentY - startY;

        if (pullDistance > 0 && pullDistance < 150) {
            refreshIndicator.style.top = `${Math.min(pullDistance - 60, 0)}px`;
            
            if (pullDistance > pullThreshold) {
                refreshIndicator.innerHTML = '↑ Solte para atualizar';
                refreshIndicator.style.background = 'var(--accent-secondary)';
            } else {
                refreshIndicator.innerHTML = '↓ Puxe para atualizar';
                refreshIndicator.style.background = 'var(--accent-primary)';
            }
        }
    });

    mainContent.addEventListener('touchend', async (e) => {
        if (!isPulling) return;
        
        const pullDistance = currentY - startY;
        
        if (pullDistance > pullThreshold) {
            // Trigger refresh!
            refreshIndicator.innerHTML = '🔄 Atualizando...';
            refreshIndicator.style.top = '0px';
            
            // Haptic feedback
            try {
                await Haptics.impact({ style: ImpactStyle.Medium });
            } catch (error) {
                console.log('Haptic não suportado');
            }

            // Recarregar dados
            await reloadAppData();
            
            // Esconder indicador
            setTimeout(() => {
                refreshIndicator.style.top = '-60px';
                refreshIndicator.innerHTML = '↓ Puxe para atualizar';
                refreshIndicator.style.background = 'var(--accent-primary)';
            }, 1000);
        } else {
            refreshIndicator.style.top = '-60px';
        }
        
        isPulling = false;
        startY = 0;
        currentY = 0;
    });
}

// Função para recarregar dados do app
async function reloadAppData() {
    try {
        // Se houver função global de reload
        if (window.loadInitialData) {
            await window.loadInitialData();
        } else {
            // Fallback: recarregar página
            window.location.reload();
        }
    } catch (error) {
        console.error('Erro ao recarregar dados:', error);
    }
}

// 🔔 NOTIFICAÇÕES DO SISTEMA - Permissão real do Android/iOS
export async function requestNotificationPermission() {
    try {
        console.log('[NOTIFICAÇÕES] Solicitando permissão...');
        
        const permission = await LocalNotifications.requestPermissions();
        
        if (permission.display === 'granted') {
            console.log('[NOTIFICAÇÕES] ✅ Permissão concedida!');
            
            // Salvar preferência
            localStorage.setItem('notifications_enabled', 'true');
            
            // Mostrar notificação de teste
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: "Notificações Ativadas! 🔔",
                        body: "Você receberá lembretes de agendamentos",
                        id: Date.now(),
                        schedule: { at: new Date(Date.now() + 1000) },
                        sound: undefined,
                        attachments: undefined,
                        actionTypeId: "",
                        extra: null
                    }
                ]
            });
            
            return true;
        } else {
            console.log('[NOTIFICAÇÕES] ❌ Permissão negada');
            localStorage.setItem('notifications_enabled', 'false');
            return false;
        }
    } catch (error) {
        console.error('[NOTIFICAÇÕES] Erro ao solicitar permissão:', error);
        return false;
    }
}

export async function checkNotificationPermission() {
    try {
        const permission = await LocalNotifications.checkPermissions();
        return permission.display === 'granted';
    } catch (error) {
        console.error('Erro ao verificar permissão:', error);
        return false;
    }
}

// 📸 GALERIA DE FOTOS - Acesso às fotos do dispositivo
export async function pickImageFromGallery() {
    try {
        const image = await Camera.getPhoto({
            quality: 90,
            allowEditing: true,
            resultType: CameraResultType.DataUrl,
            source: CameraSource.Photos // Apenas galeria
        });

        return image.dataUrl;
    } catch (error) {
        console.error('Erro ao selecionar foto:', error);
        throw error;
    }
}

export async function takePhoto() {
    try {
        const image = await Camera.getPhoto({
            quality: 90,
            allowEditing: true,
            resultType: CameraResultType.DataUrl,
            source: CameraSource.Camera // Apenas câmera
        });

        return image.dataUrl;
    } catch (error) {
        console.error('Erro ao tirar foto:', error);
        throw error;
    }
}

export async function pickOrTakePhoto() {
    try {
        const image = await Camera.getPhoto({
            quality: 90,
            allowEditing: true,
            resultType: CameraResultType.DataUrl,
            source: CameraSource.Prompt // Perguntar: Galeria ou Câmera?
        });

        return image.dataUrl;
    } catch (error) {
        console.error('Erro ao selecionar/tirar foto:', error);
        throw error;
    }
}

// 🎯 INICIALIZAR TODOS OS RECURSOS NATIVOS
export function initCapacitorFeatures() {
    console.log('[CAPACITOR] Inicializando recursos nativos...');
    
    // Pull-to-refresh
    initPullToRefresh();
    
    // Verificar permissão de notificações
    checkNotificationPermission().then(hasPermission => {
        console.log('[CAPACITOR] Permissão de notificações:', hasPermission ? '✅' : '❌');
    });
    
    console.log('[CAPACITOR] ✅ Recursos nativos inicializados!');
}

// Exportar para uso global
window.requestNotificationPermission = requestNotificationPermission;
window.pickImageFromGallery = pickImageFromGallery;
window.takePhoto = takePhoto;
window.pickOrTakePhoto = pickOrTakePhoto;
