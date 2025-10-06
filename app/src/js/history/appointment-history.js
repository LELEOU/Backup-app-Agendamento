import { supabase } from '../supabase-config.js';

export class AppointmentHistory {
    constructor() {
        if (!AppointmentHistory.instance) {
            AppointmentHistory.instance = this;
        }
        return AppointmentHistory.instance;
    }

    /**
     * Busca o histórico de atendimentos de um cliente
     * @param {string} clientId - ID do cliente
     * @param {Object} options - Opções de busca (limit, offset, orderBy)
     * @returns {Promise<Array>} Lista de atendimentos
     */
    async getClientHistory(clientId, options = {}) {
        try {
            const {
                limit = 10,
                offset = 0,
                orderBy = { column: 'date', ascending: false }
            } = options;

            const { data, error } = await supabase
                .from('appointment_history')
                .select(`
                    *,
                    staff:staff_id (
                        id,
                        name,
                        role,
                        photo_url
                    ),
                    service:service_id (
                        id,
                        name,
                        price,
                        duration
                    )
                `)
                .eq('client_id', clientId)
                .order(orderBy.column, { ascending: orderBy.ascending })
                .range(offset, offset + limit - 1);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao buscar histórico:', error.message);
            throw error;
        }
    }

    /**
     * Adiciona um novo registro ao histórico
     * @param {Object} appointment - Dados do atendimento
     * @returns {Promise<Object>} Registro criado
     */
    async addToHistory(appointment) {
        try {
            const { data, error } = await supabase
                .from('appointment_history')
                .insert([appointment])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao adicionar ao histórico:', error.message);
            throw error;
        }
    }

    /**
     * Atualiza um registro no histórico
     * @param {string} id - ID do registro
     * @param {Object} updates - Campos a atualizar
     * @returns {Promise<Object>} Registro atualizado
     */
    async updateHistory(id, updates) {
        try {
            const { data, error } = await supabase
                .from('appointment_history')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao atualizar histórico:', error.message);
            throw error;
        }
    }

    /**
     * Remove um registro do histórico
     * @param {string} id - ID do registro
     * @returns {Promise<void>}
     */
    async deleteFromHistory(id) {
        try {
            const { error } = await supabase
                .from('appointment_history')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Erro ao remover do histórico:', error.message);
            throw error;
        }
    }

    /**
     * Busca estatísticas de atendimentos
     * @param {string} clientId - ID do cliente
     * @returns {Promise<Object>} Estatísticas
     */
    async getClientStats(clientId) {
        try {
            const { data, error } = await supabase
                .rpc('get_client_stats', { p_client_id: clientId });

            if (error) throw error;
            return data || {};
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error.message);
            throw error;
        }
    }
}