// Configuração do Supabase
import { createClient } from '@supabase/supabase-js'

console.log('[Supabase] Iniciando configuração...')

const SUPABASE_URL = 'https://xrpqqgtwomrmcdogyhrz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycHFxZ3R3b21ybWNkb2d5aHJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MjY5NDAsImV4cCI6MjA3MzEwMjk0MH0.GfcMrs1-6z61UpXgxMY3GTgmJXq7f0PrC_uofByAKLI'

// Configurações para gerenciamento correto de sessão
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    flowType: 'implicit'
  }
}

console.log('[Supabase] Criando cliente com persistência de sessão...')

// Cria o cliente Supabase com configurações de sessão
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, supabaseOptions)

console.log('[Supabase] Cliente configurado com sucesso!')

// Exporta para uso global
window.supabase = supabase

// Exporta para imports ES6
export { supabase }
export default supabase