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
