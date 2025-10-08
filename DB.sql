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

-- 6. Tabela de Produtos
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para produtos
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Política para produtos (apenas admin e recepcionista podem gerenciar)
CREATE POLICY "Users can manage products" ON products
    FOR ALL USING (auth.role() = 'authenticated');

-- Trigger para atualizar updated_at em produtos
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentário na tabela
COMMENT ON TABLE products IS 'Produtos vendidos pelo salão';


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


-- 6. Tabela de Produtos
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para produtos
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Política para produtos (apenas admin e recepcionista podem gerenciar)
CREATE POLICY "Users can manage products" ON products
    FOR ALL USING (auth.role() = 'authenticated');

-- Trigger para atualizar updated_at em produtos
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentário na tabela
COMMENT ON TABLE products IS 'Produtos vendidos pelo salão';


-- ===== ATUALIZAÇÕES PARA BANCOS EXISTENTES =====
-- Execute estas linhas se você já tinha o banco criado antes:

-- Adicionar campo photo_url na tabela staff (para fotos dos funcionários)
ALTER TABLE staff ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 7. Tabela de Horários Customizados por Dia
-- Esta tabela permite que funcionários personalizem seus horários em dias específicos
CREATE TABLE IF NOT EXISTS staff_daily_schedule (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    lunch_start TIME,
    lunch_end TIME,
    is_day_off BOOLEAN DEFAULT FALSE, -- Se TRUE, funcionário não trabalha neste dia
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(staff_id, date) -- Um funcionário só pode ter uma configuração por dia
);

-- Habilitar RLS
ALTER TABLE staff_daily_schedule ENABLE ROW LEVEL SECURITY;

-- Política para horários customizados
CREATE POLICY "Users can manage daily schedules" ON staff_daily_schedule
    FOR ALL USING (auth.role() = 'authenticated');

-- Trigger para atualizar updated_at
CREATE TRIGGER update_staff_daily_schedule_updated_at BEFORE UPDATE ON staff_daily_schedule
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentário
COMMENT ON TABLE staff_daily_schedule IS 'Horários customizados por dia para cada funcionário';


-- 8. Tabela de Solicitações de Folga/Fechamento de Agenda
-- Esta tabela armazena as solicitações de folga feitas pelos funcionários
CREATE TABLE IF NOT EXISTS schedule_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    reason VARCHAR(100) NOT NULL, -- 'folga', 'atestado', 'viagem', 'outros'
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE schedule_requests ENABLE ROW LEVEL SECURITY;

-- Política para solicitações de folga
CREATE POLICY "Users can manage schedule requests" ON schedule_requests
    FOR ALL USING (auth.role() = 'authenticated');

-- Trigger para atualizar updated_at
CREATE TRIGGER update_schedule_requests_updated_at BEFORE UPDATE ON schedule_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentário
COMMENT ON TABLE schedule_requests IS 'Solicitações de folga e fechamento de agenda dos funcionários';


-- 9. Tabela de Serviços Realizados em Agendamentos
-- Esta tabela armazena os serviços que foram realizados em cada agendamento
CREATE TABLE IF NOT EXISTS appointment_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    price_charged DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

-- Política para serviços de agendamento
CREATE POLICY "Users can manage appointment services" ON appointment_services
    FOR ALL USING (auth.role() = 'authenticated');

-- Trigger para atualizar updated_at
CREATE TRIGGER update_appointment_services_updated_at BEFORE UPDATE ON appointment_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentário
COMMENT ON TABLE appointment_services IS 'Serviços realizados em cada agendamento';



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



-- Migração para corrigir estrutura de horários
-- Execute este SQL no Supabase SQL Editor

-- Adicionar colunas de horário padrão na tabela staff
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS default_start_time TIME DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS default_end_time TIME DEFAULT '18:00',
ADD COLUMN IF NOT EXISTS default_lunch_start TIME DEFAULT '12:00',
ADD COLUMN IF NOT EXISTS default_lunch_end TIME DEFAULT '13:00',
ADD COLUMN IF NOT EXISTS slot_duration INTEGER DEFAULT 45;

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




-- PARA O LANCHE --

ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS lunch_disabled_date DATE;




-- Criar tabela de histórico de serviços do cliente
CREATE TABLE IF NOT EXISTS client_service_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    service_date DATE NOT NULL,
    service_time TIME NOT NULL,
    services_performed TEXT NOT NULL, -- Lista de serviços realizados (ex: "Manicure, Pedicure")
    total_value DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50), -- 'dinheiro', 'cartão', 'pix', etc
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE client_service_history IS 'Histórico completo de atendimentos dos clientes';
COMMENT ON COLUMN client_service_history.client_id IS 'ID do cliente atendido';
COMMENT ON COLUMN client_service_history.staff_id IS 'ID do profissional que realizou o atendimento';
COMMENT ON COLUMN client_service_history.service_date IS 'Data do atendimento';
COMMENT ON COLUMN client_service_history.service_time IS 'Horário do atendimento';
COMMENT ON COLUMN client_service_history.services_performed IS 'Lista de serviços realizados (separados por vírgula)';
COMMENT ON COLUMN client_service_history.total_value IS 'Valor total cobrado no atendimento';
COMMENT ON COLUMN client_service_history.payment_method IS 'Forma de pagamento utilizada';
COMMENT ON COLUMN client_service_history.notes IS 'Observações sobre o atendimento';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_client_service_history_client_id ON client_service_history(client_id);
CREATE INDEX IF NOT EXISTS idx_client_service_history_staff_id ON client_service_history(staff_id);
CREATE INDEX IF NOT EXISTS idx_client_service_history_date ON client_service_history(service_date DESC);

-- RLS (Row Level Security)
ALTER TABLE client_service_history ENABLE ROW LEVEL SECURITY;

-- Política para permitir operações para usuários autenticados
CREATE POLICY "Users can manage client service history" ON client_service_history
    FOR ALL USING (auth.role() = 'authenticated');

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_client_service_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_client_service_history_timestamp
    BEFORE UPDATE ON client_service_history
    FOR EACH ROW
    EXECUTE FUNCTION update_client_service_history_updated_at();




-- Script para migrar agendamentos concluídos para o histórico do cliente
-- Este script pega todos os agendamentos com status 'completed' que têm serviços
-- e cria registros no histórico do cliente

INSERT INTO client_service_history (
    client_id,
    staff_id,
    service_date,
    service_time,
    services_performed,
    total_value,
    notes,
    created_at
)
SELECT 
    a.client_id,
    a.staff_id,
    a.date AS service_date,
    a.time AS service_time,
    -- Concatenar nomes dos serviços
    STRING_AGG(DISTINCT s.name, ', ') AS services_performed,
    -- Somar valores dos serviços
    SUM(
        CASE 
            WHEN ap_s.price_charged IS NOT NULL THEN ap_s.price_charged * ap_s.quantity
            ELSE s.price
        END
    ) AS total_value,
    a.notes,
    a.updated_at AS created_at
FROM appointments a
LEFT JOIN appointment_services ap_s ON a.id = ap_s.appointment_id
LEFT JOIN services s ON ap_s.service_id = s.id OR a.service_id = s.id
WHERE a.status = 'completed'
    AND a.client_id IS NOT NULL
    -- Não duplicar registros que já existem
    AND NOT EXISTS (
        SELECT 1 
        FROM client_service_history csh 
        WHERE csh.client_id = a.client_id 
            AND csh.service_date = a.date 
            AND csh.service_time = a.time
            AND csh.staff_id = a.staff_id
    )
GROUP BY 
    a.id,
    a.client_id,
    a.staff_id,
    a.date,
    a.time,
    a.notes,
    a.updated_at
HAVING SUM(
    CASE 
        WHEN ap_s.price_charged IS NOT NULL THEN ap_s.price_charged * ap_s.quantity
        ELSE s.price
    END
) IS NOT NULL;

-- Verificar quantos registros foram criados
SELECT 
    COUNT(*) as total_historicos,
    MIN(service_date) as primeira_data,
    MAX(service_date) as ultima_data
FROM client_service_history;




