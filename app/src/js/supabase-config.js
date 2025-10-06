// Configuração do Supabase
// IMPORTANTE: Configure suas credenciais no arquivo .env na raiz do projeto

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xrpqqgtwomrmcdogyhrz.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycHFxZ3R3b21ybWNkb2d5aHJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MjY5NDAsImV4cCI6MjA3MzEwMjk0MH0.GfcMrs1-6z61UpXgxMY3GTgmJXq7f0PrC_uofByAKLI'

// Verifica se as credenciais foram configuradas corretamente
if (SUPABASE_URL.includes('seu-projeto-id') || SUPABASE_ANON_KEY.includes('sua_chave_publica')) {
    console.error('⚠️ CREDENCIAIS DO SUPABASE NÃO CONFIGURADAS!');
    console.error('📋 Crie um arquivo .env na raiz do projeto com:');
    console.error('   VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co');
    console.error('   VITE_SUPABASE_ANON_KEY=sua_chave_publica_aqui');
    console.error('📖 Veja CONFIGURAÇÃO-SUPABASE.md para mais detalhes');
}

// Inicializa o cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Exporta para uso global
window.supabase = supabase

// Exporta também como módulo ES6 para imports
export { supabase };
export default supabase;

console.log('✅ Supabase configurado e conectado!');
