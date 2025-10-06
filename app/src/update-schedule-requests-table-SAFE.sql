-- ============================================
-- ATUALIZAÇÃO SEGURA DA TABELA schedule_requests
-- Esta versão NÃO remove políticas antigas automaticamente
-- Execute em etapas para máxima segurança
-- ============================================

-- ============================================
-- ETAPA 1: ADICIONAR COLUNAS QUE FALTAM
-- ============================================

-- Adicionar coluna admin_notes (observações do admin ao aprovar/rejeitar)
ALTER TABLE schedule_requests 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Adicionar coluna approved_by (quem aprovou)
ALTER TABLE schedule_requests 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- Adicionar coluna rejected_by (quem rejeitou)
ALTER TABLE schedule_requests 
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id);

-- Verificação: mostrar as novas colunas
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'schedule_requests'
    AND column_name IN ('admin_notes', 'approved_by', 'rejected_by');

-- ============================================
-- ETAPA 2: MODIFICAR COLUNA reason
-- ============================================

-- Expandir limite de VARCHAR(100) para TEXT
ALTER TABLE schedule_requests 
ALTER COLUMN reason TYPE TEXT;

-- ============================================
-- ETAPA 3: ADICIONAR EXTENSÃO E CONSTRAINT
-- ============================================

-- Instalar extensão necessária
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Adicionar constraint para evitar múltiplas solicitações pendentes
DO $$ 
BEGIN
    -- Verificar se a constraint já existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_pending_request_per_staff'
    ) THEN
        -- Verificar se há dados que violam a constraint
        IF EXISTS (
            SELECT staff_id, date, COUNT(*)
            FROM schedule_requests
            WHERE status = 'pending'
            GROUP BY staff_id, date
            HAVING COUNT(*) > 1
        ) THEN
            RAISE NOTICE '⚠️ ATENÇÃO: Existem solicitações duplicadas pendentes!';
            RAISE NOTICE 'Execute a limpeza antes de adicionar a constraint.';
            RAISE NOTICE 'Consulte o arquivo GUIA-ATUALIZACAO-SCHEDULE-REQUESTS.md';
        ELSE
            ALTER TABLE schedule_requests
            ADD CONSTRAINT unique_pending_request_per_staff 
                EXCLUDE USING gist (
                    staff_id WITH =,
                    daterange(date, date, '[]') WITH &&
                ) WHERE (status = 'pending');
            RAISE NOTICE '✅ Constraint adicionada com sucesso!';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ Constraint já existe.';
    END IF;
END $$;

-- ============================================
-- ETAPA 4: CRIAR ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_schedule_requests_staff_id ON schedule_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_schedule_requests_date ON schedule_requests(date);
CREATE INDEX IF NOT EXISTS idx_schedule_requests_status ON schedule_requests(status);
CREATE INDEX IF NOT EXISTS idx_schedule_requests_created_at ON schedule_requests(created_at DESC);

-- Verificação: mostrar índices criados
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'schedule_requests'
ORDER BY indexname;

-- ============================================
-- ETAPA 5: CRIAR NOVAS POLÍTICAS RLS
-- (SEM remover as antigas ainda)
-- ============================================

-- Política 1: Funcionários podem ver apenas suas próprias solicitações
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'schedule_requests' 
        AND policyname = 'Staff can view their own requests'
    ) THEN
        CREATE POLICY "Staff can view their own requests" ON schedule_requests
            FOR SELECT 
            USING (
                staff_id IN (
                    SELECT id FROM staff 
                    WHERE user_id = auth.uid() OR email = auth.email()
                )
            );
        RAISE NOTICE '✅ Política "Staff can view their own requests" criada';
    ELSE
        RAISE NOTICE 'ℹ️ Política "Staff can view their own requests" já existe';
    END IF;
END $$;

-- Política 2: Funcionários podem criar suas próprias solicitações
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'schedule_requests' 
        AND policyname = 'Staff can create their own requests'
    ) THEN
        CREATE POLICY "Staff can create their own requests" ON schedule_requests
            FOR INSERT 
            WITH CHECK (
                staff_id IN (
                    SELECT id FROM staff 
                    WHERE user_id = auth.uid() OR email = auth.email()
                )
            );
        RAISE NOTICE '✅ Política "Staff can create their own requests" criada';
    ELSE
        RAISE NOTICE 'ℹ️ Política "Staff can create their own requests" já existe';
    END IF;
END $$;

-- Política 3: Funcionários podem deletar suas próprias solicitações pendentes
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'schedule_requests' 
        AND policyname = 'Staff can delete their pending requests'
    ) THEN
        CREATE POLICY "Staff can delete their pending requests" ON schedule_requests
            FOR DELETE 
            USING (
                staff_id IN (
                    SELECT id FROM staff 
                    WHERE user_id = auth.uid() OR email = auth.email()
                )
                AND status = 'pending'
            );
        RAISE NOTICE '✅ Política "Staff can delete their pending requests" criada';
    ELSE
        RAISE NOTICE 'ℹ️ Política "Staff can delete their pending requests" já existe';
    END IF;
END $$;

-- Política 4: Administradores podem ver todas as solicitações
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'schedule_requests' 
        AND policyname = 'Admins can view all requests'
    ) THEN
        CREATE POLICY "Admins can view all requests" ON schedule_requests
            FOR SELECT 
            USING (
                EXISTS (
                    SELECT 1 FROM staff 
                    WHERE (user_id = auth.uid() OR email = auth.email()) 
                    AND role = 'admin'
                )
            );
        RAISE NOTICE '✅ Política "Admins can view all requests" criada';
    ELSE
        RAISE NOTICE 'ℹ️ Política "Admins can view all requests" já existe';
    END IF;
END $$;

-- Política 5: Administradores podem atualizar todas as solicitações
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'schedule_requests' 
        AND policyname = 'Admins can update all requests'
    ) THEN
        CREATE POLICY "Admins can update all requests" ON schedule_requests
            FOR UPDATE 
            USING (
                EXISTS (
                    SELECT 1 FROM staff 
                    WHERE (user_id = auth.uid() OR email = auth.email()) 
                    AND role = 'admin'
                )
            );
        RAISE NOTICE '✅ Política "Admins can update all requests" criada';
    ELSE
        RAISE NOTICE 'ℹ️ Política "Admins can update all requests" já existe';
    END IF;
END $$;

-- Política 6: Recepcionistas podem ver todas as solicitações
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'schedule_requests' 
        AND policyname = 'Receptionists can view all requests'
    ) THEN
        CREATE POLICY "Receptionists can view all requests" ON schedule_requests
            FOR SELECT 
            USING (
                EXISTS (
                    SELECT 1 FROM staff 
                    WHERE (user_id = auth.uid() OR email = auth.email()) 
                    AND role = 'receptionist'
                )
            );
        RAISE NOTICE '✅ Política "Receptionists can view all requests" criada';
    ELSE
        RAISE NOTICE 'ℹ️ Política "Receptionists can view all requests" já existe';
    END IF;
END $$;

-- ============================================
-- ETAPA 6: VERIFICAR POLÍTICAS EXISTENTES
-- ============================================

SELECT 
    '📋 POLÍTICAS ATUAIS' as info,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'schedule_requests'
ORDER BY policyname;

-- ============================================
-- ETAPA 7: ATUALIZAR COMENTÁRIOS
-- ============================================

COMMENT ON COLUMN schedule_requests.admin_notes IS 'Observações do administrador ao aprovar/rejeitar';
COMMENT ON COLUMN schedule_requests.approved_by IS 'ID do admin que aprovou';
COMMENT ON COLUMN schedule_requests.rejected_by IS 'ID do admin que rejeitou';

-- ============================================
-- ETAPA 8: VERIFICAÇÃO FINAL
-- ============================================

SELECT 
    '✅ ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!' as status;

SELECT 
    '📊 ESTATÍSTICAS' as info,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'schedule_requests') as total_colunas,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'schedule_requests') as total_politicas,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'schedule_requests') as total_indices;

-- ============================================
-- PRÓXIMOS PASSOS (OPCIONAL)
-- ============================================

/*
Se você deseja remover a política antiga "Users can manage schedule requests",
execute o comando abaixo SOMENTE depois de verificar que as novas políticas
estão funcionando corretamente:

DROP POLICY IF EXISTS "Users can manage schedule requests" ON schedule_requests;

Para testar se as políticas estão funcionando:
1. Faça login como funcionário e tente criar uma solicitação
2. Faça login como admin e veja se consegue ver todas as solicitações
3. Verifique se funcionários só veem suas próprias solicitações
*/
