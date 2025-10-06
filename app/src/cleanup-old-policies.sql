-- ============================================
-- LIMPEZA DE POLÍTICAS ANTIGAS
-- Execute este script SOMENTE DEPOIS de confirmar que as novas políticas
-- estão funcionando corretamente
-- ============================================

-- ANTES DE EXECUTAR:
-- ✅ Teste login como funcionário
-- ✅ Teste login como admin
-- ✅ Teste criar/ver/cancelar solicitações
-- ✅ Confirme que tudo funciona

-- ============================================
-- VERIFICAR POLÍTICAS ATUAIS
-- ============================================

SELECT 
    '📋 POLÍTICAS ANTES DA LIMPEZA' as info,
    policyname,
    cmd as comando,
    CASE 
        WHEN policyname = 'Users can manage schedule requests' THEN '🗑️ SERÁ REMOVIDA'
        ELSE '✅ PERMANECE'
    END as status
FROM pg_policies
WHERE tablename = 'schedule_requests'
ORDER BY policyname;

-- ============================================
-- REMOVER POLÍTICA ANTIGA
-- ============================================

-- Esta é a única operação destrutiva
-- Remover apenas se as novas políticas estiverem funcionando
DROP POLICY IF EXISTS "Users can manage schedule requests" ON schedule_requests;

-- ============================================
-- VERIFICAR RESULTADO
-- ============================================

SELECT 
    '✅ LIMPEZA CONCLUÍDA' as status,
    COUNT(*) as politicas_restantes
FROM pg_policies
WHERE tablename = 'schedule_requests';

-- Mostrar políticas finais
SELECT 
    '📋 POLÍTICAS FINAIS' as info,
    policyname,
    cmd as comando
FROM pg_policies
WHERE tablename = 'schedule_requests'
ORDER BY policyname;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- 6 políticas (ou 7 se considerar staff + admin + receptionist):
-- 1. Staff can view their own requests
-- 2. Staff can create their own requests
-- 3. Staff can delete their pending requests
-- 4. Admins can view all requests
-- 5. Admins can update all requests
-- 6. Receptionists can view all requests
-- ============================================
