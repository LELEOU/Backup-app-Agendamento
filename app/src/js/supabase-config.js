// Configuração do Supabase
// Credenciais fixadas diretamente no código para funcionar no APK

const SUPABASE_URL = 'https://xrpqqgtwomrmcdogyhrz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycHFxZ3R3b21ybWNkb2d5aHJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MjY5NDAsImV4cCI6MjA3MzEwMjk0MH0.GfcMrs1-6z61UpXgxMY3GTgmJXq7f0PrC_uofByAKLI'

// Log de confirmação
console.log('✅ Supabase configurado e conectado!')
console.log('🔗 URL:', SUPABASE_URL)

// Inicializa o cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Exporta para uso global
window.supabase = supabase

// Exporta também como módulo ES6 para imports
export { supabase };
export default supabase;

console.log('✅ Supabase configurado e conectado!');
