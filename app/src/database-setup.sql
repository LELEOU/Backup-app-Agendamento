-- Tabelas para o Sistema de Agendamento de Salão
-- Execute este SQL no Dashboard do Supabase (SQL Editor)

-- 1. Tabela de Clientes
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    notes TEXT,
    birthday_day INTEGER CHECK (birthday_day >= 1 AND birthday_day <= 31),
    birthday_month INTEGER CHECK (birthday_month >= 1 AND birthday_month <= 12),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Serviços
CREATE TABLE IF NOT EXISTS services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    duration INTEGER NOT NULL, -- em minutos
    price DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(3,2) DEFAULT 0.50, -- Taxa de comissão padrão 50%
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Funcionários
CREATE TABLE IF NOT EXISTS staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'manicurist', -- 'admin', 'manicurist', 'hairdresser', 'receptionist'
    email VARCHAR(255) UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    commission_rate DECIMAL(3,2) DEFAULT 0.50, -- 50% por padrão
    photo_url TEXT,
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
    duration INTEGER DEFAULT 30, -- Duração em minutos (permite bloquear múltiplos slots de 30min)
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

-- Comentários específicos para as colunas de aniversário
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

-- 10. Tabela de Handoffs/Pausas em Agendamentos
-- Esta tabela armazena os períodos em que o cliente está sendo atendido por outro profissional
-- permitindo que o profissional principal fique livre durante esse tempo
CREATE TABLE IF NOT EXISTS appointment_handoffs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
    handoff_staff_id UUID REFERENCES staff(id) ON DELETE CASCADE NOT NULL, -- Profissional que vai atender durante a pausa
    service_id UUID REFERENCES services(id) ON DELETE CASCADE, -- Serviço realizado pelo profissional temporário
    start_time TIME NOT NULL, -- Horário que começa a pausa do profissional principal
    end_time TIME NOT NULL, -- Horário que termina a pausa (cliente volta para profissional principal)
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Habilitar RLS
ALTER TABLE appointment_handoffs ENABLE ROW LEVEL SECURITY;

-- Política para handoffs
CREATE POLICY "Users can manage appointment handoffs" ON appointment_handoffs
    FOR ALL USING (auth.role() = 'authenticated');

-- Trigger para atualizar updated_at
CREATE TRIGGER update_appointment_handoffs_updated_at BEFORE UPDATE ON appointment_handoffs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índice para melhorar performance em consultas
CREATE INDEX idx_appointment_handoffs_appointment ON appointment_handoffs(appointment_id);
CREATE INDEX idx_appointment_handoffs_staff ON appointment_handoffs(handoff_staff_id);

-- Comentário
COMMENT ON TABLE appointment_handoffs IS 'Períodos em que o cliente é transferido temporariamente para outro profissional, liberando o profissional principal';

