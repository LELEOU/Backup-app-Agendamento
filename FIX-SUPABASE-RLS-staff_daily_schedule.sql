-- ================================================
-- FIX: Erro 406 na tabela staff_daily_schedule
-- ================================================

-- 1. Verificar se RLS está ativado (deve estar)
-- Se não estiver, ative com:
-- ALTER TABLE staff_daily_schedule ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS DE LEITURA (SELECT)
-- Permitir que usuários autenticados leiam horários customizados

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Usuários autenticados podem ver horários customizados" ON staff_daily_schedule;

-- Criar nova política de leitura
CREATE POLICY "Usuários autenticados podem ler horários de staff"
ON staff_daily_schedule
FOR SELECT
TO authenticated
USING (true);

-- 3. POLÍTICAS DE INSERÇÃO (INSERT)
-- Permitir que admin e staff criem horários customizados

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Admins e staff podem criar horários customizados" ON staff_daily_schedule;

-- Criar nova política de inserção
CREATE POLICY "Admins e recepcionistas podem criar horários"
ON staff_daily_schedule
FOR INSERT
TO authenticated
WITH CHECK (
    -- Admin pode criar para qualquer staff
    (auth.jwt() ->> 'role' = 'admin')
    OR
    -- Receptionist pode criar para qualquer staff
    (auth.jwt() ->> 'role' = 'receptionist')
    OR
    -- Staff pode criar apenas seus próprios horários
    (
        (auth.jwt() ->> 'role' IN ('manicurist', 'hairdresser'))
        AND 
        staff_id IN (
            SELECT id FROM staff WHERE user_id = auth.uid()
        )
    )
);

-- 4. POLÍTICAS DE ATUALIZAÇÃO (UPDATE)

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Staff pode atualizar horários customizados" ON staff_daily_schedule;

-- Criar nova política de atualização
CREATE POLICY "Usuários autorizados podem atualizar horários"
ON staff_daily_schedule
FOR UPDATE
TO authenticated
USING (
    -- Admin pode atualizar qualquer horário
    (auth.jwt() ->> 'role' = 'admin')
    OR
    -- Receptionist pode atualizar qualquer horário
    (auth.jwt() ->> 'role' = 'receptionist')
    OR
    -- Staff pode atualizar apenas seus próprios horários
    (
        (auth.jwt() ->> 'role' IN ('manicurist', 'hairdresser'))
        AND 
        staff_id IN (
            SELECT id FROM staff WHERE user_id = auth.uid()
        )
    )
)
WITH CHECK (
    -- Mesmas regras para o novo valor
    (auth.jwt() ->> 'role' = 'admin')
    OR
    (auth.jwt() ->> 'role' = 'receptionist')
    OR
    (
        (auth.jwt() ->> 'role' IN ('manicurist', 'hairdresser'))
        AND 
        staff_id IN (
            SELECT id FROM staff WHERE user_id = auth.uid()
        )
    )
);

-- 5. POLÍTICAS DE DELEÇÃO (DELETE)

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Admins podem deletar horários customizados" ON staff_daily_schedule;

-- Criar nova política de deleção
CREATE POLICY "Admins e recepcionistas podem deletar horários"
ON staff_daily_schedule
FOR DELETE
TO authenticated
USING (
    (auth.jwt() ->> 'role' = 'admin')
    OR
    (auth.jwt() ->> 'role' = 'receptionist')
);

-- ================================================
-- VERIFICAÇÃO
-- ================================================

-- Listar todas as políticas da tabela
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'staff_daily_schedule';

-- ================================================
-- TESTE RÁPIDO (executar depois das políticas)
-- ================================================

-- Verificar se consegue ler (deve retornar registros ou vazio)
SELECT * FROM staff_daily_schedule LIMIT 5;

-- ================================================
-- NOTAS IMPORTANTES
-- ================================================

-- 1. Estas políticas assumem que a coluna 'role' está no JWT do Supabase
--    Se não estiver, você precisa ajustar as policies

-- 2. Para verificar o JWT atual:
--    SELECT auth.jwt();

-- 3. Se o erro persistir, verifique se:
--    - O usuário está autenticado
--    - O JWT contém a role correta
--    - As foreign keys estão corretas

-- 4. Para desabilitar RLS temporariamente (NÃO RECOMENDADO EM PRODUÇÃO):
--    ALTER TABLE staff_daily_schedule DISABLE ROW LEVEL SECURITY;

-- ================================================
-- ALTERNATIVA SIMPLES (SE AS POLÍTICAS ACIMA FALHAREM)
-- ================================================

-- Se você quer uma solução mais simples e permissiva:

DROP POLICY IF EXISTS "Permitir tudo para autenticados" ON staff_daily_schedule;

CREATE POLICY "Permitir tudo para autenticados"
ON staff_daily_schedule
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ATENÇÃO: Esta política é MUITO permissiva!
-- Use apenas para testes ou em desenvolvimento
-- Em produção, use as políticas granulares acima
