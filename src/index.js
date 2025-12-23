require('dotenv').config();
const app = require('./app');
const { initDatabase } = require('./database/connection');
const whatsappService = require('./services/whatsapp');
const schedulerService = require('./services/scheduler');
const { getSetting } = require('./database/queries');
const config = require('./config/express');

async function start() {
    try {
        console.log('🚀 Iniciando WhatsApp Books Bot...\n');
        
        // 1. Inicializar banco de dados
        console.log('📊 Inicializando banco de dados...');
        await initDatabase();
        console.log('✅ Banco de dados pronto\n');
        
        // 2. Inicializar WhatsApp
        console.log('📱 Conectando ao WhatsApp...');
        await whatsappService.initialize();
        
        // Aguardar conexão
        console.log('⏳ Aguardando autenticação...');
        const maxWait = 60000; // 60 segundos
        const startTime = Date.now();
        
        while (!whatsappService.isClientReady() && (Date.now() - startTime) < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (whatsappService.isClientReady()) {
            console.log('✅ WhatsApp conectado\n');
        } else {
            console.log('⚠️ WhatsApp não conectou automaticamente');
            console.log('   Acesse o painel web para escanear o QR code\n');
        }
        
        // 3. Verificar se deve iniciar o agendador
        const botActive = await getSetting('bot_active');
        if (botActive === 'true') {
            console.log('⏰ Iniciando agendador automático...');
            await schedulerService.start();
        } else {
            console.log('⏰ Agendador não iniciado (ative nas configurações)\n');
        }
        
        // 4. Iniciar servidor web
        const PORT = config.port;
        app.listen(PORT, () => {
            console.log('═'.repeat(60));
            console.log('✅ BOT INICIADO COM SUCESSO!');
            console.log('═'.repeat(60));
            console.log(`🌐 Painel web: http://localhost:${PORT}`);
            console.log(`👤 Usuário: ${config.admin.username}`);
            console.log(`🔑 Senha: ${config.admin.password}`);
            console.log('═'.repeat(60));
            console.log('\n💡 Pressione Ctrl+C para encerrar\n');
        });
        
    } catch (error) {
        console.error('❌ Erro ao iniciar:', error);
        process.exit(1);
    }
}

// Tratamento de encerramento
process.on('SIGINT', async () => {
    console.log('\n\n⏹️ Encerrando bot...');
    
    try {
        await schedulerService.stop();
        await whatsappService.disconnect();
        console.log('✅ Bot encerrado com sucesso');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao encerrar:', error);
        process.exit(1);
    }
});

// Iniciar
start();