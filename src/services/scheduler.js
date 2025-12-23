const cron = require('node-cron');
const whatsappService = require('./whatsapp');
const { 
    getNextBookToSend, 
    updateBookStatus, 
    addLog,
    getSetting,
    setSetting 
} = require('../database/queries');

class SchedulerService {
    constructor() {
        this.task = null;
        this.isRunning = false;
        this.cronExpression = null;
    }

    /**
     * Inicia o agendador
     */
    async start(cronExpression = null) {
        try {
            // Buscar expressão cron do banco ou usar a fornecida
            if (!cronExpression) {
                cronExpression = await getSetting('cron_schedule');
                if (!cronExpression) {
                    cronExpression = process.env.CRON_SCHEDULE || '0 9 * * *';
                }
            }

            // Validar expressão cron
            if (!cron.validate(cronExpression)) {
                throw new Error(`Expressão cron inválida: ${cronExpression}`);
            }

            this.cronExpression = cronExpression;

            console.log('⏰ Iniciando agendador...');
            console.log(`   Expressão cron: ${cronExpression}`);
            console.log(`   Próxima execução: ${this.getNextExecutionTime(cronExpression)}`);

            // Criar tarefa agendada
            this.task = cron.schedule(cronExpression, async () => {
                await this.executeTask();
            });

            this.isRunning = true;
            await setSetting('bot_active', 'true');
            
            console.log('✅ Agendador iniciado com sucesso!\n');
            return true;

        } catch (error) {
            console.error('❌ Erro ao iniciar agendador:', error);
            throw error;
        }
    }

    /**
     * Para o agendador
     */
    async stop() {
        if (this.task) {
            this.task.stop();
            this.task = null;
            this.isRunning = false;
            await setSetting('bot_active', 'false');
            console.log('⏹️ Agendador parado');
            return true;
        }
        return false;
    }

    /**
     * Executa a tarefa de envio
     */
    async executeTask() {
        console.log('\n' + '='.repeat(60));
        console.log('🚀 EXECUTANDO TAREFA AGENDADA');
        console.log('   Data/Hora:', new Date().toLocaleString('pt-BR'));
        console.log('='.repeat(60) + '\n');

        try {
            // 1. Verificar se WhatsApp está pronto
            if (!whatsappService.isClientReady()) {
                throw new Error('WhatsApp não está conectado');
            }

            // 2. Buscar GROUP_ID
            const groupId = await getSetting('group_id');
            if (!groupId) {
                throw new Error('GROUP_ID não configurado no banco de dados');
            }

            // 3. Buscar próximo livro para enviar
            console.log('📚 Buscando próximo livro...');
            const book = await getNextBookToSend();

            if (!book) {
                console.log('📭 Nenhum livro pendente para enviar');
                console.log('💡 Adicione mais livros através do painel web\n');
                return;
            }

            console.log(`📖 Livro encontrado: "${book.title}" por ${book.author}`);

            // 4. Preparar dados do livro
            const bookData = {
                id: book.id,
                title: book.title,
                author: book.author,
                pages: book.pages,
                description: book.description,
                coverPath: book.cover_path,
                pdfPath: book.pdf_path
            };

            // 5. Enviar livro
            console.log('📤 Iniciando envio...\n');
            await whatsappService.sendBook(groupId, bookData);

            // 6. Atualizar status no banco
            const now = new Date().toISOString();
            await updateBookStatus(book.id, 'sent', now);
            await addLog(book.id, 'success', null);
            await setSetting('last_send_date', now);

            console.log('✅ TAREFA CONCLUÍDA COM SUCESSO!');
            console.log('='.repeat(60) + '\n');

        } catch (error) {
            console.error('❌ ERRO NA TAREFA:', error.message);
            
            // Registrar erro no log se tiver ID do livro
            try {
                const book = await getNextBookToSend();
                if (book) {
                    await updateBookStatus(book.id, 'error', new Date().toISOString());
                    await addLog(book.id, 'error', error.message);
                }
            } catch (logError) {
                console.error('❌ Erro ao registrar log:', logError);
            }

            console.log('='.repeat(60) + '\n');
        }
    }

    /**
     * Executa o envio imediatamente (teste manual)
     */
    async executeNow() {
        console.log('🚀 Executando envio manual...\n');
        await this.executeTask();
    }

    /**
     * Atualiza a expressão cron
     */
    async updateSchedule(newCronExpression) {
        if (!cron.validate(newCronExpression)) {
            throw new Error(`Expressão cron inválida: ${newCronExpression}`);
        }

        // Parar agendador atual
        if (this.isRunning) {
            await this.stop();
        }

        // Salvar nova expressão
        await setSetting('cron_schedule', newCronExpression);

        // Reiniciar com nova expressão
        await this.start(newCronExpression);

        console.log(`✅ Agendamento atualizado: ${newCronExpression}`);
    }

    /**
     * Retorna o status do agendador
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            cronExpression: this.cronExpression,
            nextExecution: this.isRunning 
                ? this.getNextExecutionTime(this.cronExpression)
                : null
        };
    }

    /**
     * Calcula próxima execução
     */
    getNextExecutionTime(cronExpression) {
        try {
            // Função auxiliar para calcular próxima execução
            const schedule = cron.schedule(cronExpression, () => {});
            const next = schedule.nextDate();
            schedule.stop();
            
            if (next) {
                return next.toLocaleString('pt-BR', {
                    dateStyle: 'full',
                    timeStyle: 'short'
                });
            }
            return 'Não calculado';
        } catch (error) {
            return 'Erro ao calcular';
        }
    }

    /**
     * Obtém estatísticas de envio
     */
    async getStats() {
        try {
            const lastSend = await getSetting('last_send_date');
            const botActive = await getSetting('bot_active');
            
            return {
                lastSendDate: lastSend ? new Date(lastSend).toLocaleString('pt-BR') : 'Nunca',
                isActive: botActive === 'true',
                isRunning: this.isRunning,
                schedule: this.cronExpression
            };
        } catch (error) {
            console.error('❌ Erro ao buscar estatísticas:', error);
            return null;
        }
    }
}

// Exportar instância única (Singleton)
const schedulerService = new SchedulerService();
module.exports = schedulerService;