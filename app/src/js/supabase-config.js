// Configuração do Supabase - VERSÃO SIMPLIFICADA
import { createClient } from '@supabase/supabase-js'

console.log('[DEBUG 1/4] Iniciando supabase-config.js')

const SUPABASE_URL = 'https://xrpqqgtwomrmcdogyhrz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycHFxZ3R3b21ybWNkb2d5aHJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MjY5NDAsImV4cCI6MjA3MzEwMjk0MH0.GfcMrs1-6z61UpXgxMY3GTgmJXq7f0PrC_uofByAKLI'

console.log('[DEBUG 2/4] Credenciais carregadas')
console.log('[DEBUG 3/4] Criando cliente Supabase...')

// Cria o cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

console.log('[DEBUG 4/4] Supabase pronto!')

// Exporta para uso global
window.supabase = supabase

// Exporta para imports ES6
export { supabase }
export default supabase