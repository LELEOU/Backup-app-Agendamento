-- ============================================
-- MIGRATION: Adicionar coluna duration na tabela appointments
-- Data: 06/01/2025
-- Descrição: Suporte a slots múltiplos com duração variável
-- ============================================

-- Verificar se a coluna já existe antes de adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'duration'
    ) THEN
        -- Adicionar coluna duration (duração em minutos)
        ALTER TABLE appointments 
        ADD COLUMN duration INTEGER DEFAULT 30 NOT NULL;
        
        RAISE NOTICE 'Coluna duration adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna duration já existe.';
    END IF;
END $$;

-- Criar índice para melhorar performance de queries por duração
CREATE INDEX IF NOT EXISTS idx_appointments_duration 
ON appointments(duration);

-- Atualizar agendamentos existentes que não têm duração definida
UPDATE appointments 
SET duration = 30 
WHERE duration IS NULL;

-- Adicionar comentário na coluna
COMMENT ON COLUMN appointments.duration IS 'Duração do agendamento em minutos (30, 45, 60, 90, 120, 150, 180)';

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar se a coluna foi criada corretamente
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'appointments' 
AND column_name = 'duration';

-- Contar agendamentos por duração
SELECT 
    duration,
    COUNT(*) as total
FROM appointments
GROUP BY duration
ORDER BY duration;
