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
