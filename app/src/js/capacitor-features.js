/**
 * 🚀 CAPACITOR FEATURES - Recursos Nativos do App
 * Pull-to-refresh, Notificações, Galeria, etc.
 */

import { App } from '@capacitor/app';
import PullToRefresh from 'pulltorefreshjs';

// Gerenciamento do botão de voltar no Android
App.addListener('backButton', ({ canGoBack }) => {
  if (canGoBack) {
    window.history.back();
  } else {
    App.exitApp();
  }
});

// Funcionalidade de "Puxar para Atualizar"
PullToRefresh.init({
  mainElement: '#mainContent', // O ID do seu contêiner de conteúdo principal
  onRefresh: function() {
    window.location.reload();
  }
});
