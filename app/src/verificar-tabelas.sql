-- ============================================
-- SCRIPT DE VERIFICAÇÃO DE TABELAS
-- Execute este script para verificar quais tabelas já existem
-- ============================================

-- 1. VERIFICAR TODAS AS TABELAS DO SISTEMA
-- ============================================
SELECT 
    '✅ Tabela existe' as status,
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as total_colunas
FROM information_schema.tables t
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. VERIFICAR TABELAS ESPECÍFICAS DO PROJETO
-- ============================================
SELECT
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') 
        THEN '✅ EXISTE' 
        ELSE '❌ NÃO EXISTE' 
    END as appointments,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') 
        THEN '✅ EXISTE' 
        ELSE '❌ NÃO EXISTE' 
    END as clients,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') 
        THEN '✅ EXISTE' 
        ELSE '❌ NÃO EXISTE' 
    END as services,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff') 
        THEN '✅ EXISTE' 
        ELSE '❌ NÃO EXISTE' 
    END as staff,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_daily_schedule') 
        THEN '✅ EXISTE' 
        ELSE '❌ NÃO EXISTE' 
    END as staff_daily_schedule,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schedule_requests') 
        THEN '✅ EXISTE' 
        ELSE '❌ NÃO EXISTE - EXECUTE add-schedule-requests-table.sql' 
    END as schedule_requests,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointment_services') 
        THEN '✅ EXISTE' 
        ELSE '❌ NÃO EXISTE - EXECUTE add-appointment-services-table.sql' 
    END as appointment_services;

-- 3. VERIFICAR POLÍTICAS RLS ATIVAS
-- ============================================
SELECT 
    tablename as tabela,
    COUNT(*) as total_politicas,
    string_agg(policyname, ', ') as nomes_politicas
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 4. VERIFICAR TRIGGERS
-- ============================================
SELECT 
    event_object_table as tabela,
    trigger_name,
    event_manipulation as evento,
    action_statement as acao
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- 5. CONTAR REGISTROS EM CADA TABELA
-- ============================================
SELECT 
    'appointments' as tabela,
    COUNT(*) as total_registros
FROM appointments
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'services', COUNT(*) FROM services
UNION ALL
SELECT 'staff', COUNT(*) FROM staff
UNION ALL
SELECT 'staff_daily_schedule', COUNT(*) FROM staff_daily_schedule
UNION ALL
SELECT 'schedule_requests', 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schedule_requests')
        THEN (SELECT COUNT(*) FROM schedule_requests)::text::integer
        ELSE -1 
    END
UNION ALL
SELECT 'appointment_services', 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointment_services')
        THEN (SELECT COUNT(*) FROM appointment_services)::text::integer
        ELSE -1 
    END;

-- 6. VERIFICAR EXTENSÕES INSTALADAS
-- ============================================
SELECT 
    extname as extensao,
    extversion as versao,
    CASE extname
        WHEN 'btree_gist' THEN '✅ Necessária para schedule_requests'
        WHEN 'uuid-ossp' THEN '✅ Necessária para gerar UUIDs'
        ELSE '📦 Extensão adicional'
    END as descricao
FROM pg_extension
WHERE extname IN ('btree_gist', 'uuid-ossp', 'pgcrypto')
ORDER BY extname;

-- 7. VERIFICAR SE FALTA ALGUMA EXTENSÃO
-- ============================================
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'btree_gist')
        THEN '✅ btree_gist instalada'
        ELSE '❌ INSTALAR: CREATE EXTENSION btree_gist;'
    END as btree_gist,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp')
        THEN '✅ uuid-ossp instalada'
        ELSE '❌ INSTALAR: CREATE EXTENSION "uuid-ossp";'
    END as uuid_ossp;

-- ============================================
-- RESUMO FINAL
-- ============================================
SELECT 
    '🎯 RESUMO DA VERIFICAÇÃO' as titulo,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tabelas,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_politicas_rls,
    (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public') as total_triggers;
