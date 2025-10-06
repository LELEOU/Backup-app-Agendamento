-- Execute este SQL no Supabase SQL Editor para adicionar a tabela de serviços de agendamento
-- Esta tabela armazena os serviços realizados em cada agendamento

CREATE TABLE IF NOT EXISTS appointment_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    price_charged DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários autenticados gerenciem os serviços
CREATE POLICY "Users can manage appointment services" ON appointment_services
    FOR ALL USING (auth.role() = 'authenticated');

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_appointment_services_updated_at BEFORE UPDATE ON appointment_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentário na tabela
COMMENT ON TABLE appointment_services IS 'Serviços realizados em cada agendamento (permite múltiplos serviços por agendamento)';
