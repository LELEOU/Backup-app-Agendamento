-- Migração para corrigir estrutura de horários
-- Execute este SQL no Supabase SQL Editor

-- Adicionar colunas de horário padrão na tabela staff
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS default_start_time TIME DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS default_end_time TIME DEFAULT '18:00',
ADD COLUMN IF NOT EXISTS default_lunch_start TIME DEFAULT '12:00',
ADD COLUMN IF NOT EXISTS default_lunch_end TIME DEFAULT '13:00',
ADD COLUMN IF NOT EXISTS slot_duration INTEGER DEFAULT 30;

-- Comentários nas colunas
COMMENT ON COLUMN staff.default_start_time IS 'Horário padrão de início do expediente';
COMMENT ON COLUMN staff.default_end_time IS 'Horário padrão de fim do expediente';
COMMENT ON COLUMN staff.default_lunch_start IS 'Horário padrão de início do almoço';
COMMENT ON COLUMN staff.default_lunch_end IS 'Horário padrão de fim do almoço';
COMMENT ON COLUMN staff.slot_duration IS 'Duração padrão dos slots de agendamento em minutos';

-- Migrar dados existentes se houver (caso tenha algum JSONB antigo)
-- UPDATE staff SET default_start_time = '08:00' WHERE default_start_time IS NULL;
-- UPDATE staff SET default_end_time = '18:00' WHERE default_end_time IS NULL;
-- UPDATE staff SET default_lunch_start = '12:00' WHERE default_lunch_start IS NULL;
-- UPDATE staff SET default_lunch_end = '13:00' WHERE default_lunch_end IS NULL;

-- Garantir que staff_daily_schedule está criado corretamente
CREATE TABLE IF NOT EXISTS staff_daily_schedule (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    lunch_start TIME,
    lunch_end TIME,
    is_day_off BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(staff_id, date)
);

-- Habilitar RLS se ainda não estiver
ALTER TABLE staff_daily_schedule ENABLE ROW LEVEL SECURITY;

-- Dropar política antiga se existir
DROP POLICY IF EXISTS "Users can manage daily schedules" ON staff_daily_schedule;

-- Recriar política correta
CREATE POLICY "Users can manage daily schedules" ON staff_daily_schedule
    FOR ALL 
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_staff_daily_schedule_updated_at ON staff_daily_schedule;
CREATE TRIGGER update_staff_daily_schedule_updated_at 
    BEFORE UPDATE ON staff_daily_schedule
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_staff_daily_schedule_staff_date 
    ON staff_daily_schedule(staff_id, date);

CREATE INDEX IF NOT EXISTS idx_staff_daily_schedule_date 
    ON staff_daily_schedule(date);
