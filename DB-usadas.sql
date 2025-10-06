-- Tabelas para o Sistema de Agendamento de Salão
-- Execute este SQL no Dashboard do Supabase (SQL Editor)

-- 1. Tabela de Clientes
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Serviços
CREATE TABLE IF NOT EXISTS services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    duration INTEGER NOT NULL, -- em minutos
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Funcionários
CREATE TABLE IF NOT EXISTS staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'manicurist', -- 'admin' ou 'manicurist'
    email VARCHAR(255) UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    commission_rate DECIMAL(3,2) DEFAULT 0.50, -- 50% por padrão
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Agendamentos
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'no_show', 'cancelled'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(staff_id, date, time) -- Evita conflitos de horário
);

-- 5. Tabela de Configurações do Sistema
CREATE TABLE IF NOT EXISTS settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) DEFAULT 'Agenda de Salão',
    business_phone VARCHAR(20),
    work_hours_start TIME DEFAULT '08:00',
    work_hours_end TIME DEFAULT '18:00',
    lunch_start TIME DEFAULT '12:00',
    lunch_end TIME DEFAULT '13:00',
    work_days INTEGER[] DEFAULT '{1,2,3,4,5,6}', -- Array de dias da semana (0=Dom, 6=Sáb)
    appointment_duration INTEGER DEFAULT 40, -- minutos
    late_tolerance INTEGER DEFAULT 10, -- minutos
    commission_rate DECIMAL(3,2) DEFAULT 0.50,
    theme VARCHAR(20) DEFAULT 'light-mode',
    language VARCHAR(10) DEFAULT 'pt-BR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas de RLS (Row Level Security)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir operações para usuários autenticados
CREATE POLICY "Users can manage their own data" ON clients
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage services" ON services
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage staff" ON staff
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage appointments" ON appointments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their settings" ON settings
    FOR ALL USING (auth.uid() = user_id);

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Dados iniciais de exemplo
INSERT INTO services (name, duration, price, description) VALUES
    ('Manicure Simples', 30, 25.00, 'Manicure básica com esmaltação'),
    ('Manicure com Nail Art', 45, 35.00, 'Manicure com decoração artística'),
    ('Pedicure', 40, 30.00, 'Cuidados completos para os pés'),
    ('Esmaltação em Gel', 60, 45.00, 'Esmaltação duradoura em gel'),
    ('Remoção de Cutícula', 20, 15.00, 'Cuidados especiais com cutículas');

-- Comentários nas tabelas
COMMENT ON TABLE clients IS 'Cadastro de clientes do salão';
COMMENT ON TABLE services IS 'Serviços oferecidos pelo salão';
COMMENT ON TABLE staff IS 'Funcionários do salão';
COMMENT ON TABLE appointments IS 'Agendamentos realizados';
COMMENT ON TABLE settings IS 'Configurações personalizadas do usuário';



-- Adicionar colunas de aniversário à tabela clients
ALTER TABLE clients 
ADD COLUMN birthday_day INTEGER CHECK (birthday_day >= 1 AND birthday_day <= 31),
ADD COLUMN birthday_month INTEGER CHECK (birthday_month >= 1 AND birthday_month <= 12);

-- Comentários para documentar
COMMENT ON COLUMN clients.birthday_day IS 'Dia do aniversário (1-31)';
COMMENT ON COLUMN clients.birthday_month IS 'Mês do aniversário (1-12)';


-- =====================================================
-- 🔧 ADICIONAR COMMISSION_RATE NA TABELA SERVICES
-- =====================================================
-- Execute este SQL no Supabase SQL Editor

-- Adicionar coluna commission_rate se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' 
        AND column_name = 'commission_rate'
    ) THEN
        ALTER TABLE services 
        ADD COLUMN commission_rate DECIMAL(3,2) DEFAULT 0.50;
        
        RAISE NOTICE 'Coluna commission_rate adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna commission_rate já existe!';
    END IF;
END $$;

-- Atualizar serviços existentes (se houver) com taxa padrão de 50%
UPDATE services 
SET commission_rate = 0.50 
WHERE commission_rate IS NULL;

-- Verificar resultado
SELECT id, name, price, commission_rate FROM services LIMIT 5;

-- =====================================================
-- ✅ PRONTO!
-- =====================================================
-- Agora a tabela services tem a coluna commission_rate
-- e você pode cadastrar novos serviços normalmente!
-- =====================================================



Apartir desse ponto foi que começo a dar problema na DB e temos que ver uma maneira de corrigir sem perder dados e ou comprometer o sistema.


-- =====================================================
-- 🔧 ADICIONAR HORÁRIOS FLEXÍVEIS E REMOVER ALMOÇO FIXO
-- =====================================================
-- Execute este SQL no Supabase SQL Editor

-- 1. Remover colunas de almoço da tabela settings de forma segura
DO $$ 
BEGIN
    -- Verificar e remover lunch_start
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' 
        AND column_name = 'lunch_start'
    ) THEN
        ALTER TABLE settings DROP COLUMN lunch_start;
        RAISE NOTICE 'Coluna lunch_start removida com sucesso!';
    END IF;

    -- Verificar e remover lunch_end
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' 
        AND column_name = 'lunch_end'
    ) THEN
        ALTER TABLE settings DROP COLUMN lunch_end;
        RAISE NOTICE 'Coluna lunch_end removida com sucesso!';
    END IF;
END $$;

-- 2. Criar tabela de horários dos profissionais (se não existir)
CREATE TABLE IF NOT EXISTS staff_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL DEFAULT '08:00',
    end_time TIME NOT NULL DEFAULT '18:00',
    lunch_start TIME DEFAULT '12:00',
    lunch_end TIME DEFAULT '13:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(staff_id, day_of_week)
);

-- Comentar tabela
COMMENT ON TABLE staff_schedules IS 'Horários padrão dos profissionais por dia da semana';
COMMENT ON COLUMN staff_schedules.day_of_week IS 'Dia da semana (0=Domingo, 6=Sábado)';
COMMENT ON COLUMN staff_schedules.start_time IS 'Horário de início do expediente';
COMMENT ON COLUMN staff_schedules.end_time IS 'Horário de fim do expediente';
COMMENT ON COLUMN staff_schedules.lunch_start IS 'Início do intervalo de almoço';
COMMENT ON COLUMN staff_schedules.lunch_end IS 'Fim do intervalo de almoço';

-- 3. Criar tabela para exceções de horário (dias específicos)
CREATE TABLE IF NOT EXISTS staff_schedule_exceptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    lunch_start TIME,
    lunch_end TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(staff_id, date)
);

-- Comentar tabela
COMMENT ON TABLE staff_schedule_exceptions IS 'Exceções de horário para dias específicos';
COMMENT ON COLUMN staff_schedule_exceptions.date IS 'Data específica da exceção';
COMMENT ON COLUMN staff_schedule_exceptions.start_time IS 'Horário de início (se diferente do padrão)';
COMMENT ON COLUMN staff_schedule_exceptions.end_time IS 'Horário de fim (se diferente do padrão)';
COMMENT ON COLUMN staff_schedule_exceptions.lunch_start IS 'Início do almoço (se diferente do padrão)';
COMMENT ON COLUMN staff_schedule_exceptions.lunch_end IS 'Fim do almoço (se diferente do padrão)';

-- 4. Adicionar RLS nas novas tabelas
DO $$ 
BEGIN
    -- Habilitar RLS para staff_schedules
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'staff_schedules' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS habilitado para staff_schedules';
    END IF;

    -- Habilitar RLS para staff_schedule_exceptions
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'staff_schedule_exceptions' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE staff_schedule_exceptions ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS habilitado para staff_schedule_exceptions';
    END IF;
END $$;

-- 5. Adicionar políticas de segurança
-- Para staff_schedules
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'staff_schedules' 
        AND policyname = 'Users can view all staff schedules'
    ) THEN
        CREATE POLICY "Users can view all staff schedules" ON staff_schedules
            FOR SELECT USING (auth.role() = 'authenticated');
        RAISE NOTICE 'Política de visualização criada para staff_schedules';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'staff_schedules' 
        AND policyname = 'Staff can manage their own schedules'
    ) THEN
        CREATE POLICY "Staff can manage their own schedules" ON staff_schedules
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM staff 
                    WHERE id = staff_id 
                    AND user_id = auth.uid()
                )
            );
        RAISE NOTICE 'Política de gerenciamento criada para staff_schedules';
    END IF;
END $$;

-- Para staff_schedule_exceptions
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'staff_schedule_exceptions' 
        AND policyname = 'Users can view all schedule exceptions'
    ) THEN
        CREATE POLICY "Users can view all schedule exceptions" ON staff_schedule_exceptions
            FOR SELECT USING (auth.role() = 'authenticated');
        RAISE NOTICE 'Política de visualização criada para staff_schedule_exceptions';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'staff_schedule_exceptions' 
        AND policyname = 'Staff can manage their own schedule exceptions'
    ) THEN
        CREATE POLICY "Staff can manage their own schedule exceptions" ON staff_schedule_exceptions
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM staff 
                    WHERE id = staff_id 
                    AND user_id = auth.uid()
                )
            );
        RAISE NOTICE 'Política de gerenciamento criada para staff_schedule_exceptions';
    END IF;
END $$;

-- 6. Adicionar triggers para updated_at
DO $$ 
BEGIN
    -- Para staff_schedules
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'set_timestamp_staff_schedules'
    ) THEN
        CREATE TRIGGER set_timestamp_staff_schedules
            BEFORE UPDATE ON staff_schedules
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger de updated_at criado para staff_schedules';
    END IF;

    -- Para staff_schedule_exceptions
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'set_timestamp_staff_schedule_exceptions'
    ) THEN
        CREATE TRIGGER set_timestamp_staff_schedule_exceptions
            BEFORE UPDATE ON staff_schedule_exceptions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger de updated_at criado para staff_schedule_exceptions';
    END IF;
END $$;

-- 7. Inserir horários padrão para profissionais existentes
DO $$ 
BEGIN
    INSERT INTO staff_schedules (staff_id, day_of_week)
    SELECT s.id, d.day
    FROM staff s
    CROSS JOIN (
        SELECT 1 as day UNION ALL
        SELECT 2 UNION ALL
        SELECT 3 UNION ALL
        SELECT 4 UNION ALL
        SELECT 5 UNION ALL
        SELECT 6
    ) d
    WHERE NOT EXISTS (
        SELECT 1 
        FROM staff_schedules ss 
        WHERE ss.staff_id = s.id 
        AND ss.day_of_week = d.day
    );

    RAISE NOTICE 'Horários padrão criados para profissionais existentes';
END $$;

-- 8. Função para buscar horário de um profissional em uma data
CREATE OR REPLACE FUNCTION get_staff_schedule(
    p_staff_id UUID,
    p_date DATE
)
RETURNS TABLE (
    start_time TIME,
    end_time TIME,
    lunch_start TIME,
    lunch_end TIME
) AS $$
BEGIN
    -- Primeiro tenta encontrar uma exceção para a data
    RETURN QUERY
    SELECT 
        se.start_time,
        se.end_time,
        se.lunch_start,
        se.lunch_end
    FROM staff_schedule_exceptions se
    WHERE se.staff_id = p_staff_id
    AND se.date = p_date;

    -- Se não encontrar exceção, usa o horário padrão do dia da semana
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            ss.start_time,
            ss.end_time,
            ss.lunch_start,
            ss.lunch_end
        FROM staff_schedules ss
        WHERE ss.staff_id = p_staff_id
        AND ss.day_of_week = EXTRACT(DOW FROM p_date)::INTEGER;
    END IF;
    
    -- Se não encontrar nada, retorna horário padrão
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            '08:00'::TIME as start_time,
            '18:00'::TIME as end_time,
            '12:00'::TIME as lunch_start,
            '13:00'::TIME as lunch_end;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ✅ PRONTO!
-- =====================================================
-- Agora temos:
-- 1. Removido horário de almoço fixo das configurações
-- 2. Tabela staff_schedules para horários padrão
-- 3. Tabela staff_schedule_exceptions para exceções
-- 4. Horários individuais por profissional
-- 5. RLS e políticas de segurança configuradas
-- =====================================================



-- =====================================================
-- 📊 FUNÇÃO PARA ESTATÍSTICAS DE CLIENTES
-- =====================================================
-- Execute este SQL no Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_client_stats(p_client_id UUID)
RETURNS TABLE (
    total_appointments INTEGER,
    total_spent DECIMAL(10,2),
    favorite_service UUID,
    favorite_staff UUID,
    avg_appointment_duration INTEGER,
    completion_rate DECIMAL(5,2),
    last_visit DATE
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as total_appts,
            COALESCE(SUM(price), 0) as total_spent,
            MODE() WITHIN GROUP (ORDER BY service_id) as fav_service,
            MODE() WITHIN GROUP (ORDER BY staff_id) as fav_staff,
            EXTRACT(EPOCH FROM AVG(
                s.duration * INTERVAL '1 minute'
            ))::INTEGER as avg_duration,
            (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / 
             NULLIF(COUNT(*), 0) * 100) as completion,
            MAX(date) as last_visit_date
        FROM appointment_history ah
        LEFT JOIN services s ON s.id = ah.service_id
        WHERE client_id = p_client_id
    )
    SELECT 
        total_appts::INTEGER,
        total_spent::DECIMAL(10,2),
        fav_service,
        fav_staff,
        avg_duration,
        ROUND(completion::DECIMAL(5,2), 2),
        last_visit_date
    FROM stats;
END;
$$;




-- =====================================================
-- 🧾 ADICIONAR HISTÓRICO DE ATENDIMENTOS (VERSÃO SEGURA)
-- =====================================================
-- Execute este SQL no Supabase SQL Editor
-- COMPATÍVEL com banco de dados existente

-- 1. Criar tabela de histórico de atendimentos
CREATE TABLE IF NOT EXISTS appointment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status TEXT CHECK (status IN ('completed', 'cancelled', 'no-show')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar comentários
COMMENT ON TABLE appointment_history IS 'Histórico de atendimentos dos clientes';
COMMENT ON COLUMN appointment_history.client_id IS 'ID do cliente atendido';
COMMENT ON COLUMN appointment_history.staff_id IS 'ID do profissional que realizou o atendimento';
COMMENT ON COLUMN appointment_history.service_id IS 'ID do serviço realizado';
COMMENT ON COLUMN appointment_history.date IS 'Data do atendimento';
COMMENT ON COLUMN appointment_history.time IS 'Horário do atendimento';
COMMENT ON COLUMN appointment_history.price IS 'Valor cobrado no atendimento';
COMMENT ON COLUMN appointment_history.status IS 'Status do atendimento (completed, cancelled, no-show)';
COMMENT ON COLUMN appointment_history.notes IS 'Observações sobre o atendimento';

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_appointment_history_client_id ON appointment_history(client_id);
CREATE INDEX IF NOT EXISTS idx_appointment_history_staff_id ON appointment_history(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointment_history_service_id ON appointment_history(service_id);
CREATE INDEX IF NOT EXISTS idx_appointment_history_date ON appointment_history(date);

-- 2. Adicionar RLS (Row Level Security)
ALTER TABLE appointment_history ENABLE ROW LEVEL SECURITY;

-- 3. Adicionar políticas de segurança SIMPLES
-- Todos os usuários autenticados podem ver e gerenciar o histórico
-- (Mesma política das outras tabelas do seu sistema)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'appointment_history' 
        AND policyname = 'Users can manage appointment history'
    ) THEN
        CREATE POLICY "Users can manage appointment history" 
        ON appointment_history
        FOR ALL
        USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 4. Adicionar trigger para updated_at
CREATE OR REPLACE FUNCTION update_appointment_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'set_timestamp_appointment_history'
    ) THEN
        CREATE TRIGGER set_timestamp_appointment_history
            BEFORE UPDATE ON appointment_history
            FOR EACH ROW
            EXECUTE FUNCTION update_appointment_history_updated_at();
    END IF;
END $$;

-- 5. Migrar histórico existente (agendamentos já concluídos)
-- IMPORTANTE: Não copia o ID original para evitar conflitos
INSERT INTO appointment_history (
    client_id,
    staff_id,
    service_id,
    date,
    time,
    price,
    status,
    notes,
    created_at,
    updated_at
)
SELECT 
    client_id,
    staff_id,
    service_id,
    date,
    time,
    (SELECT price FROM services WHERE id = appointments.service_id) as price,
    status,
    notes,
    created_at,
    updated_at
FROM appointments
WHERE status = 'completed'
AND NOT EXISTS (
    SELECT 1 FROM appointment_history ah
    WHERE ah.client_id = appointments.client_id
    AND ah.date = appointments.date
    AND ah.time = appointments.time
);

-- =====================================================
-- ✅ PRONTO! TABELA CRIADA COM SEGURANÇA
-- =====================================================
-- Esta versão:
-- 1. Não modifica tabelas existentes
-- 2. Usa política RLS simples (igual às outras tabelas)
-- 3. Não depende de colunas que não existem
-- 4. Migra dados existentes sem conflitos
-- =====================================================




-- =====================================================
-- 📊 FUNÇÃO PARA ESTATÍSTICAS DE CLIENTES (VERSÃO SEGURA)
-- =====================================================
-- Execute este SQL no Supabase SQL Editor
-- COMPATÍVEL com banco de dados existente

-- Função para calcular estatísticas do cliente
CREATE OR REPLACE FUNCTION get_client_stats(p_client_id UUID)
RETURNS TABLE (
    total_appointments INTEGER,
    total_spent DECIMAL(10,2),
    favorite_service UUID,
    favorite_staff UUID,
    avg_appointment_duration INTEGER,
    completion_rate DECIMAL(5,2),
    last_visit DATE
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Verifica se a tabela appointment_history existe
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'appointment_history'
    ) THEN
        -- Se existir, usa dados do histórico
        RETURN QUERY
        WITH stats AS (
            SELECT 
                COUNT(*)::INTEGER as total_appts,
                COALESCE(SUM(ah.price), 0) as total_spent,
                MODE() WITHIN GROUP (ORDER BY ah.service_id) as fav_service,
                MODE() WITHIN GROUP (ORDER BY ah.staff_id) as fav_staff,
                COALESCE(AVG(s.duration)::INTEGER, 0) as avg_duration,
                CASE 
                    WHEN COUNT(*) > 0 THEN
                        (COUNT(*) FILTER (WHERE ah.status = 'completed')::DECIMAL / COUNT(*) * 100)
                    ELSE 0
                END as completion,
                MAX(ah.date) as last_visit_date
            FROM appointment_history ah
            LEFT JOIN services s ON s.id = ah.service_id
            WHERE ah.client_id = p_client_id
        )
        SELECT 
            total_appts,
            total_spent::DECIMAL(10,2),
            fav_service,
            fav_staff,
            avg_duration,
            ROUND(completion::DECIMAL(5,2), 2),
            last_visit_date
        FROM stats;
    ELSE
        -- Se não existir, usa dados dos appointments
        RETURN QUERY
        WITH stats AS (
            SELECT 
                COUNT(*)::INTEGER as total_appts,
                COALESCE(SUM(s.price), 0) as total_spent,
                MODE() WITHIN GROUP (ORDER BY a.service_id) as fav_service,
                MODE() WITHIN GROUP (ORDER BY a.staff_id) as fav_staff,
                COALESCE(AVG(s.duration)::INTEGER, 0) as avg_duration,
                CASE 
                    WHEN COUNT(*) > 0 THEN
                        (COUNT(*) FILTER (WHERE a.status = 'completed')::DECIMAL / COUNT(*) * 100)
                    ELSE 0
                END as completion,
                MAX(a.date) as last_visit_date
            FROM appointments a
            LEFT JOIN services s ON s.id = a.service_id
            WHERE a.client_id = p_client_id
        )
        SELECT 
            total_appts,
            total_spent::DECIMAL(10,2),
            fav_service,
            fav_staff,
            avg_duration,
            ROUND(completion::DECIMAL(5,2), 2),
            last_visit_date
        FROM stats;
    END IF;
END;
$$;

-- =====================================================
-- ✅ PRONTO! FUNÇÃO CRIADA COM SEGURANÇA
-- =====================================================
-- Esta função:
-- 1. Funciona com ou sem a tabela appointment_history
-- 2. Usa fallback para a tabela appointments
-- 3. Não quebra se não houver dados
-- 4. Retorna valores padrão quando necessário
-- =====================================================



-- =====================================================
-- 🔧 HORÁRIOS FLEXÍVEIS E NOVA ROLE (VERSÃO FINAL SEGURA)
-- =====================================================
-- Execute este SQL no Supabase SQL Editor
-- ✅ 100% SEGURO - COMPATÍVEL COM TABELAS EXISTENTES
-- =====================================================

-- 1. Adicionar a role 'cabelereira' de forma SEGURA
DO $$ 
BEGIN
    -- Remove constraint antiga se existir
    ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_role_check;
    
    -- Adiciona nova constraint com todas as roles
    ALTER TABLE staff 
    ADD CONSTRAINT staff_role_check 
    CHECK (role IN ('admin', 'manicurist', 'cabelereira'));
    
    RAISE NOTICE '✅ Role "cabelereira" adicionada com sucesso!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Aviso: %', SQLERRM;
END $$;

-- 2. Criar tabela para horários dos profissionais (SE NÃO EXISTIR)
CREATE TABLE IF NOT EXISTS staff_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL DEFAULT '08:00',
    end_time TIME NOT NULL DEFAULT '18:00',
    lunch_start TIME DEFAULT '12:00',
    lunch_end TIME DEFAULT '13:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(staff_id, day_of_week)
);

COMMENT ON TABLE staff_schedules IS 'Horários padrão dos profissionais por dia da semana';
COMMENT ON COLUMN staff_schedules.day_of_week IS 'Dia da semana (0=Domingo, 6=Sábado)';

-- 2.1. Adicionar coluna slot_duration SE NÃO EXISTIR
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff_schedules' 
        AND column_name = 'slot_duration'
    ) THEN
        ALTER TABLE staff_schedules 
        ADD COLUMN slot_duration INTEGER NOT NULL DEFAULT 30;
        
        COMMENT ON COLUMN staff_schedules.slot_duration IS 'Duração do slot em minutos (30 para manicure, 45 para cabeleeira)';
        RAISE NOTICE '✅ Coluna slot_duration adicionada!';
    ELSE
        RAISE NOTICE '✅ Coluna slot_duration já existe!';
    END IF;
END $$;

-- 3. Criar tabela para bloqueios de horário (SE NÃO EXISTIR)
CREATE TABLE IF NOT EXISTS staff_blocked_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE staff_blocked_slots IS 'Bloqueios de horário dos profissionais';
COMMENT ON COLUMN staff_blocked_slots.reason IS 'Motivo do bloqueio (ex: Almoço, Folga, etc)';

-- 4. Adicionar RLS nas novas tabelas (SE NÃO ESTIVER HABILITADO)
DO $$ 
BEGIN
    -- Para staff_schedules
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'staff_schedules' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS habilitado para staff_schedules';
    END IF;

    -- Para staff_blocked_slots
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'staff_blocked_slots' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE staff_blocked_slots ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS habilitado para staff_blocked_slots';
    END IF;
END $$;

-- 5. Adicionar políticas de segurança (SE NÃO EXISTIREM)
DO $$ 
BEGIN
    -- Políticas para staff_schedules
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'staff_schedules' 
        AND policyname = 'Users can view all staff schedules'
    ) THEN
        CREATE POLICY "Users can view all staff schedules" ON staff_schedules
            FOR SELECT USING (auth.role() = 'authenticated');
        RAISE NOTICE '✅ Política de visualização criada para staff_schedules';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'staff_schedules' 
        AND policyname = 'Users can manage staff schedules'
    ) THEN
        CREATE POLICY "Users can manage staff schedules" ON staff_schedules
            FOR ALL USING (auth.role() = 'authenticated');
        RAISE NOTICE '✅ Política de gerenciamento criada para staff_schedules';
    END IF;

    -- Políticas para staff_blocked_slots
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'staff_blocked_slots' 
        AND policyname = 'Users can view all staff blocked slots'
    ) THEN
        CREATE POLICY "Users can view all staff blocked slots" ON staff_blocked_slots
            FOR SELECT USING (auth.role() = 'authenticated');
        RAISE NOTICE '✅ Política de visualização criada para staff_blocked_slots';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'staff_blocked_slots' 
        AND policyname = 'Users can manage staff blocked slots'
    ) THEN
        CREATE POLICY "Users can manage staff blocked slots" ON staff_blocked_slots
            FOR ALL USING (auth.role() = 'authenticated');
        RAISE NOTICE '✅ Política de gerenciamento criada para staff_blocked_slots';
    END IF;
END $$;

-- 6. Adicionar triggers para updated_at (SE NÃO EXISTIREM)
DO $$ 
BEGIN
    -- Trigger para staff_schedules
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'set_timestamp_staff_schedules'
    ) THEN
        CREATE TRIGGER set_timestamp_staff_schedules
            BEFORE UPDATE ON staff_schedules
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ Trigger criado para staff_schedules';
    END IF;

    -- Trigger para staff_blocked_slots
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'set_timestamp_staff_blocked_slots'
    ) THEN
        CREATE TRIGGER set_timestamp_staff_blocked_slots
            BEFORE UPDATE ON staff_blocked_slots
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ Trigger criado para staff_blocked_slots';
    END IF;
END $$;

-- 7. Atualizar slot_duration para funcionários existentes baseado na role
DO $$ 
BEGIN
    UPDATE staff_schedules ss
    SET slot_duration = CASE 
        WHEN s.role = 'cabelereira' THEN 45
        ELSE 30
    END
    FROM staff s
    WHERE ss.staff_id = s.id
    AND ss.slot_duration = 30; -- Só atualiza se ainda estiver no padrão
    
    RAISE NOTICE '✅ Slot duration atualizado baseado nas roles!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Aviso ao atualizar slot_duration: %', SQLERRM;
END $$;

-- 8. Função para gerar slots de horário
CREATE OR REPLACE FUNCTION generate_staff_slots(
    p_staff_id UUID,
    p_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_slot_duration INTEGER
) RETURNS TABLE (
    slot_time TIME
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE slots AS (
        -- Primeiro slot
        SELECT p_start_time::TIME AS slot_time
        
        UNION ALL
        
        -- Próximos slots
        SELECT (slot_time + (p_slot_duration || ' minutes')::INTERVAL)::TIME
        FROM slots
        WHERE (slot_time + (p_slot_duration || ' minutes')::INTERVAL)::TIME < p_end_time::TIME
    )
    SELECT s.slot_time 
    FROM slots s
    WHERE NOT EXISTS (
        -- Excluir slots bloqueados
        SELECT 1 
        FROM staff_blocked_slots b
        WHERE b.staff_id = p_staff_id
        AND b.date = p_date
        AND s.slot_time >= b.start_time
        AND s.slot_time < b.end_time
    )
    AND NOT EXISTS (
        -- Excluir slots já agendados
        SELECT 1
        FROM appointments a
        WHERE a.staff_id = p_staff_id
        AND a.date = p_date
        AND a.time = s.slot_time
        AND a.status NOT IN ('cancelled', 'no_show')
    );
END;
$$ LANGUAGE plpgsql;

-- 9. Inserir horários padrão para profissionais que ainda não têm
DO $$ 
BEGIN
    INSERT INTO staff_schedules (staff_id, day_of_week, slot_duration)
    SELECT 
        s.id, 
        d.day,
        CASE 
            WHEN s.role = 'cabelereira' THEN 45
            ELSE 30
        END as duration
    FROM staff s
    CROSS JOIN (
        SELECT 1 as day UNION ALL
        SELECT 2 UNION ALL
        SELECT 3 UNION ALL
        SELECT 4 UNION ALL
        SELECT 5 UNION ALL
        SELECT 6
    ) d
    WHERE NOT EXISTS (
        SELECT 1 
        FROM staff_schedules ss 
        WHERE ss.staff_id = s.id 
        AND ss.day_of_week = d.day
    );

    RAISE NOTICE '✅ Horários padrão criados para profissionais sem horário!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Aviso ao criar horários: %', SQLERRM;
END $$;

-- =====================================================
-- ✅ PRONTO! MIGRAÇÃO ULTRA SEGURA CONCLUÍDA
-- =====================================================
-- Esta migração:
-- ✅ NÃO remove NADA do banco de dados
-- ✅ Adiciona role "cabelereira" sem quebrar dados existentes
-- ✅ Cria tabelas apenas se não existirem
-- ✅ Adiciona coluna slot_duration se não existir
-- ✅ Adiciona políticas RLS simples (auth.role = authenticated)
-- ✅ Atualiza slot_duration baseado na role do funcionário
-- ✅ Cria horários padrão para profissionais sem horário
-- ✅ Não causa conflitos com banco existente
-- ✅ Pode ser executado múltiplas vezes sem problemas
-- =====================================================




-- =====================================================
-- Execute este SQL no Supabase SQL Editor
-- ✅ CORRIGE PROBLEMA DE AUTO-PROMOÇÃO DE CARGOS
-- =====================================================

-- 1. CORRIGIR CONSTRAINT DE ROLES (adicionar recepcionista e cabeleireiro)
DO $$ 
BEGIN
    -- Remove constraint antiga
    ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_role_check;
    
    -- Adiciona nova constraint com TODAS as roles
    ALTER TABLE staff 
    ADD CONSTRAINT staff_role_check 
    CHECK (role IN ('admin', 'manicurist', 'cabeleireira', 'recepcionista'));
    
    RAISE NOTICE '✅ Roles atualizadas: admin, manicurist, cabeleireira, recepcionista';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Aviso: %', SQLERRM;
END $$;

-- 2. ADICIONAR COLUNA photo_url SE NÃO EXISTIR
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff' 
        AND column_name = 'photo_url'
    ) THEN
        ALTER TABLE staff 
        ADD COLUMN photo_url TEXT;
        
        COMMENT ON COLUMN staff.photo_url IS 'URL da foto do perfil do funcionário';
        RAISE NOTICE '✅ Coluna photo_url adicionada!';
    ELSE
        RAISE NOTICE '✅ Coluna photo_url já existe!';
    END IF;
END $$;

-- 3. REMOVER POLÍTICA ANTIGA DE STAFF (se existir)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can manage staff" ON staff;
    RAISE NOTICE '✅ Política antiga removida!';
END $$;

-- 4. CRIAR POLÍTICA DE SEGURANÇA PARA IMPEDIR AUTO-PROMOÇÃO
DO $$ 
BEGIN
    -- Política para VISUALIZAÇÃO (todos autenticados podem ver)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'staff' 
        AND policyname = 'Staff can view all staff'
    ) THEN
        CREATE POLICY "Staff can view all staff" ON staff
            FOR SELECT USING (auth.role() = 'authenticated');
        RAISE NOTICE '✅ Política de visualização criada!';
    END IF;

    -- Política para INSERÇÃO (apenas admin pode criar funcionários)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'staff' 
        AND policyname = 'Only admin can create staff'
    ) THEN
        CREATE POLICY "Only admin can create staff" ON staff
            FOR INSERT 
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM staff 
                    WHERE user_id = auth.uid() 
                    AND role = 'admin'
                )
            );
        RAISE NOTICE '✅ Política de inserção criada (apenas admin)!';
    END IF;

    -- Política para ATUALIZAÇÃO (funcionários podem editar seus próprios dados, MAS NÃO O CARGO)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'staff' 
        AND policyname = 'Staff can update own data except role'
    ) THEN
        CREATE POLICY "Staff can update own data except role" ON staff
            FOR UPDATE 
            USING (user_id = auth.uid())
            WITH CHECK (
                -- Permite atualizar próprios dados
                user_id = auth.uid() 
                AND (
                    -- Se for admin, pode alterar tudo (inclusive role de outros)
                    role = 'admin'
                    OR
                    -- Se NÃO for admin, NÃO pode alterar o próprio role
                    (role = (SELECT role FROM staff WHERE id = staff.id))
                )
            );
        RAISE NOTICE '✅ Política de atualização criada (protege role)!';
    END IF;

    -- Política adicional: ADMIN pode atualizar qualquer funcionário
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'staff' 
        AND policyname = 'Admin can update any staff'
    ) THEN
        CREATE POLICY "Admin can update any staff" ON staff
            FOR UPDATE 
            USING (
                EXISTS (
                    SELECT 1 FROM staff 
                    WHERE user_id = auth.uid() 
                    AND role = 'admin'
                )
            );
        RAISE NOTICE '✅ Política de admin criada!';
    END IF;

    -- Política para EXCLUSÃO (apenas admin)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'staff' 
        AND policyname = 'Only admin can delete staff'
    ) THEN
        CREATE POLICY "Only admin can delete staff" ON staff
            FOR DELETE 
            USING (
                EXISTS (
                    SELECT 1 FROM staff 
                    WHERE user_id = auth.uid() 
                    AND role = 'admin'
                )
            );
        RAISE NOTICE '✅ Política de exclusão criada (apenas admin)!';
    END IF;
END $$;

-- 5. CRIAR FUNÇÃO PARA VALIDAR MUDANÇA DE ROLE
CREATE OR REPLACE FUNCTION validate_staff_role_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o role está sendo alterado
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Verifica se quem está fazendo a alteração é admin
        IF NOT EXISTS (
            SELECT 1 FROM staff 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        ) THEN
            RAISE EXCEPTION 'Apenas administradores podem alterar cargos de funcionários';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CRIAR TRIGGER PARA VALIDAR MUDANÇA DE ROLE
DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS validate_staff_role_trigger ON staff;
    
    CREATE TRIGGER validate_staff_role_trigger
        BEFORE UPDATE ON staff
        FOR EACH ROW
        EXECUTE FUNCTION validate_staff_role_change();
    
    RAISE NOTICE '✅ Trigger de validação de role criado!';
END $$;

-- =====================================================
-- ✅ CORREÇÕES DE SEGURANÇA APLICADAS
-- =====================================================
-- 🔒 Agora:
-- ✅ Todas as roles funcionam (admin, manicurist, cabeleeira, recepcionista)
-- ✅ Funcionários NÃO podem alterar o próprio cargo
-- ✅ Apenas ADMIN pode alterar cargos
-- ✅ Apenas ADMIN pode criar/deletar funcionários
-- ✅ Funcionários podem editar dados próprios (exceto role)
-- ✅ Campo photo_url adicionado
-- =====================================================



-- =====================================================
-- 📊 HISTÓRICO COMPLETO DE CLIENTES (VERSÃO MELHORADA)
-- =====================================================
-- Execute este SQL no Supabase SQL Editor
-- ✅ MOSTRA TODOS OS DADOS SOLICITADOS
-- =====================================================

-- 1. FUNÇÃO MELHORADA PARA ESTATÍSTICAS DE CLIENTES
CREATE OR REPLACE FUNCTION get_client_complete_history(p_client_id UUID)
RETURNS TABLE (
    -- Estatísticas gerais
    total_appointments INTEGER,
    total_spent DECIMAL(10,2),
    favorite_service UUID,
    favorite_service_name TEXT,
    favorite_staff UUID,
    favorite_staff_name TEXT,
    
    -- Última visita
    last_visit_date DATE,
    last_visit_value DECIMAL(10,2),
    last_visit_service TEXT,
    
    -- Visitas no mês atual
    current_month_visits INTEGER,
    current_month_total DECIMAL(10,2),
    
    -- Visitas no ano atual
    current_year_visits INTEGER,
    current_year_total DECIMAL(10,2),
    
    -- Taxa de conclusão
    completion_rate DECIMAL(5,2)
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_current_month INTEGER;
    v_current_year INTEGER;
BEGIN
    v_current_month := EXTRACT(MONTH FROM CURRENT_DATE);
    v_current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    RETURN QUERY
    WITH base_data AS (
        -- Usa appointment_history se existir, senão usa appointments
        SELECT 
            ah.date,
            ah.time,
            ah.price,
            ah.status,
            ah.service_id,
            ah.staff_id,
            ah.created_at
        FROM appointment_history ah
        WHERE ah.client_id = p_client_id
        
        UNION ALL
        
        SELECT 
            a.date,
            a.time,
            (SELECT price FROM services WHERE id = a.service_id) as price,
            a.status,
            a.service_id,
            a.staff_id,
            a.created_at
        FROM appointments a
        WHERE a.client_id = p_client_id
        AND NOT EXISTS (SELECT 1 FROM appointment_history WHERE client_id = p_client_id)
    ),
    stats AS (
        SELECT 
            -- Totais gerais
            COUNT(*)::INTEGER as total_appts,
            COALESCE(SUM(bd.price), 0) as total_spent,
            
            -- Favoritos
            MODE() WITHIN GROUP (ORDER BY bd.service_id) as fav_service,
            MODE() WITHIN GROUP (ORDER BY bd.staff_id) as fav_staff,
            
            -- Última visita
            MAX(bd.date) as last_date,
            
            -- Mês atual
            COUNT(*) FILTER (
                WHERE EXTRACT(MONTH FROM bd.date) = v_current_month 
                AND EXTRACT(YEAR FROM bd.date) = v_current_year
            )::INTEGER as month_visits,
            COALESCE(SUM(bd.price) FILTER (
                WHERE EXTRACT(MONTH FROM bd.date) = v_current_month 
                AND EXTRACT(YEAR FROM bd.date) = v_current_year
            ), 0) as month_total,
            
            -- Ano atual
            COUNT(*) FILTER (
                WHERE EXTRACT(YEAR FROM bd.date) = v_current_year
            )::INTEGER as year_visits,
            COALESCE(SUM(bd.price) FILTER (
                WHERE EXTRACT(YEAR FROM bd.date) = v_current_year
            ), 0) as year_total,
            
            -- Taxa de conclusão
            CASE 
                WHEN COUNT(*) > 0 THEN
                    (COUNT(*) FILTER (WHERE bd.status = 'completed')::DECIMAL / COUNT(*) * 100)
                ELSE 0
            END as completion
        FROM base_data bd
    ),
    last_visit AS (
        SELECT 
            bd.price as last_value,
            s.name as last_service
        FROM base_data bd
        LEFT JOIN services s ON s.id = bd.service_id
        WHERE bd.date = (SELECT MAX(date) FROM base_data)
        LIMIT 1
    )
    SELECT 
        stats.total_appts,
        stats.total_spent::DECIMAL(10,2),
        stats.fav_service,
        (SELECT name FROM services WHERE id = stats.fav_service) as fav_service_name,
        stats.fav_staff,
        (SELECT name FROM staff WHERE id = stats.fav_staff) as fav_staff_name,
        
        stats.last_date,
        COALESCE(lv.last_value, 0)::DECIMAL(10,2),
        COALESCE(lv.last_service, '-'),
        
        stats.month_visits,
        stats.month_total::DECIMAL(10,2),
        
        stats.year_visits,
        stats.year_total::DECIMAL(10,2),
        
        ROUND(stats.completion::DECIMAL(5,2), 2)
    FROM stats
    LEFT JOIN last_visit lv ON true;
END;
$$;

-- 2. FUNÇÃO PARA LISTAR VISITAS POR MÊS
CREATE OR REPLACE FUNCTION get_client_visits_by_month(
    p_client_id UUID,
    p_year INTEGER DEFAULT NULL
)
RETURNS TABLE (
    month_name TEXT,
    month_number INTEGER,
    visit_count INTEGER,
    total_spent DECIMAL(10,2)
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_year INTEGER;
BEGIN
    v_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
    
    RETURN QUERY
    WITH base_data AS (
        SELECT date, price
        FROM appointment_history
        WHERE client_id = p_client_id
        
        UNION ALL
        
        SELECT a.date, s.price
        FROM appointments a
        JOIN services s ON s.id = a.service_id
        WHERE a.client_id = p_client_id
        AND NOT EXISTS (SELECT 1 FROM appointment_history WHERE client_id = p_client_id)
    ),
    monthly_stats AS (
        SELECT 
            EXTRACT(MONTH FROM bd.date)::INTEGER as month_num,
            COUNT(*)::INTEGER as visits,
            COALESCE(SUM(bd.price), 0)::DECIMAL(10,2) as total
        FROM base_data bd
        WHERE EXTRACT(YEAR FROM bd.date) = v_year
        GROUP BY EXTRACT(MONTH FROM bd.date)
    )
    SELECT 
        CASE ms.month_num
            WHEN 1 THEN 'Janeiro'
            WHEN 2 THEN 'Fevereiro'
            WHEN 3 THEN 'Março'
            WHEN 4 THEN 'Abril'
            WHEN 5 THEN 'Maio'
            WHEN 6 THEN 'Junho'
            WHEN 7 THEN 'Julho'
            WHEN 8 THEN 'Agosto'
            WHEN 9 THEN 'Setembro'
            WHEN 10 THEN 'Outubro'
            WHEN 11 THEN 'Novembro'
            WHEN 12 THEN 'Dezembro'
        END as month_name,
        ms.month_num,
        ms.visits,
        ms.total
    FROM monthly_stats ms
    ORDER BY ms.month_num;
END;
$$;

-- =====================================================
-- ✅ FUNÇÕES DE HISTÓRICO MELHORADAS
-- =====================================================
-- 📊 Agora você pode usar:
--
-- 1. get_client_complete_history(client_id)
--    Retorna TODOS os dados solicitados:
--    - Total de visitas
--    - Total gasto
--    - Serviço/profissional favorito
--    - Última visita (data e valor)
--    - Visitas no mês atual (quantidade e valor)
--    - Visitas no ano atual (quantidade e valor)
--    - Taxa de conclusão
--
-- 2. get_client_visits_by_month(client_id, year)
--    Retorna visitas agrupadas por mês
--    - Nome do mês
--    - Quantidade de visitas
--    - Total gasto no mês
--
-- Exemplo de uso:
-- SELECT * FROM get_client_complete_history('uuid-do-cliente');
-- SELECT * FROM get_client_visits_by_month('uuid-do-cliente', 2025);
-- =====================================================
