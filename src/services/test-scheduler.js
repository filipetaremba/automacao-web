const schedulerService = require('./scheduler');
const whatsappService = require('./whatsapp');
const { initDatabase } = require('../database/connection');
const { getAllSettings, getSetting } = require('../database/queries');
const { describeCron } = require('../utils/cronHelper');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function testScheduler() {
    try {
        console.log('🧪 Teste do Sistema de Agendamento\n');
        console.log('═'.repeat(60));

        // 1. Inicializar banco de dados
        console.log('\n1️⃣ Inicializando banco de dados...');
        await initDatabase();
        console.log('✅ Banco inicializado');

        // 2. Verificar configurações
        console.log('\n2️⃣ Verificando configurações:');
        const settings = await getAllSettings();
        console.log('   📋 GROUP_ID:', settings.group_id || '❌ NÃO CONFIGURADO');
        console.log('   ⏰ CRON:', settings.cron_schedule || '❌ NÃO CONFIGURADO');
        console.log('   📅 Último envio:', settings.last_send_date || 'Nunca');
        console.log('   🤖 Bot ativo:', settings.bot_active);

        // Validar GROUP_ID
        if (!settings.group_id) {
            console.log('\n❌ GROUP_ID não configurado!');
            console.log('💡 Execute: node src/services/test-whatsapp.js');
            console.log('   E copie o GROUP_ID para o arquivo .env ou banco');
            rl.close();
            return;
        }

        // 3. Inicializar WhatsApp
        console.log('\n3️⃣ Conectando ao WhatsApp...');
        await whatsappService.initialize();
        
        console.log('⏳ Aguardando conexão...');
        while (!whatsappService.isClientReady()) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        console.log('✅ WhatsApp conectado');

        // 4. Mostrar menu de testes
        console.log('\n4️⃣ Opções de Teste:');
        console.log('   1. Enviar livro AGORA (manual)');
        console.log('   2. Iniciar agendador');
        console.log('   3. Ver status do agendador');
        console.log('   4. Testar com cron de 1 minuto');
        console.log('   0. Sair');

        const option = await question('\n❓ Escolha uma opção: ');

        switch(option) {
            case '1':
                await testManualSend();
                break;
            case '2':
                await testStartScheduler();
                break;
            case '3':
                await testSchedulerStatus();
                break;
            case '4':
                await testOneMinuteCron();
                break;
            case '0':
                console.log('\n👋 Saindo...');
                break;
            default:
                console.log('\n❌ Opção inválida');
        }

    } catch (error) {
        console.error('\n❌ Erro no teste:', error);
    } finally {
        rl.close();
        console.log('\n💡 Pressione Ctrl+C para encerrar completamente');
    }
}

/**
 * Teste: Envio manual imediato
 */
async function testManualSend() {
    console.log('\n🚀 Executando envio manual...');
    console.log('═'.repeat(60));
    
    const confirm = await question('\n⚠️ Isso vai enviar um livro AGORA. Confirmar? (s/n): ');
    
    if (confirm.toLowerCase() === 's') {
        await schedulerService.executeNow();
    } else {
        console.log('❌ Cancelado');
    }
}

/**
 * Teste: Iniciar agendador
 */
async function testStartScheduler() {
    console.log('\n⏰ Iniciando agendador...');
    
    const cronExpression = await getSetting('cron_schedule') || '0 9 * * *';
    console.log(`   Expressão: ${cronExpression}`);
    console.log(`   Descrição: ${describeCron(cronExpression)}`);
    
    const confirm = await question('\n❓ Iniciar com esta configuração? (s/n): ');
    
    if (confirm.toLowerCase() === 's') {
        await schedulerService.start();
        
        console.log('\n✅ Agendador iniciado!');
        console.log('💡 O bot agora enviará livros automaticamente');
        console.log('⚠️ Mantenha este processo rodando');
        console.log('\n📊 Status:');
        const status = schedulerService.getStatus();
        console.log(`   Próxima execução: ${status.nextExecution}`);
        
        // Manter rodando
        console.log('\n⏳ Aguardando execução... (Ctrl+C para parar)');
        await new Promise(() => {}); // Manter processo vivo
    } else {
        console.log('❌ Cancelado');
    }
}

/**
 * Teste: Ver status
 */
async function testSchedulerStatus() {
    console.log('\n📊 Status do Agendador:');
    console.log('═'.repeat(60));
    
    const status = schedulerService.getStatus();
    const stats = await schedulerService.getStats();
    
    console.log('   Rodando:', status.isRunning ? '✅ SIM' : '❌ NÃO');
    console.log('   Expressão Cron:', status.cronExpression || 'Não configurado');
    console.log('   Descrição:', describeCron(status.cronExpression));
    console.log('   Próxima execução:', status.nextExecution || 'N/A');
    console.log('   Último envio:', stats.lastSendDate);
    console.log('   Bot ativo:', stats.isActive ? '✅' : '❌');
}

/**
 * Teste: Cron de 1 minuto (para teste rápido)
 */
async function testOneMinuteCron() {
    console.log('\n⚡ Teste Rápido: Envio a cada minuto');
    console.log('═'.repeat(60));
    console.log('⚠️ ATENÇÃO: Isso enviará um livro A CADA MINUTO!');
    console.log('   Use apenas para testar se está funcionando');
    
    const confirm = await question('\n❓ Confirmar teste? (s/n): ');
    
    if (confirm.toLowerCase() === 's') {
        console.log('\n🚀 Iniciando teste...');
        await schedulerService.start('* * * * *'); // Todo minuto
        
        console.log('✅ Agendador configurado para CADA MINUTO');
        console.log('⏰ Próximo envio em até 1 minuto...');
        console.log('⚠️ Pressione Ctrl+C para parar');
        
        // Manter rodando
        await new Promise(() => {});
    } else {
        console.log('❌ Cancelado');
    }
}

// Tratar Ctrl+C
process.on('SIGINT', async () => {
    console.log('\n\n⏹️ Parando agendador...');
    await schedulerService.stop();
    await whatsappService.disconnect();
    console.log('👋 Encerrado');
    process.exit(0);
});

// Executar teste
testScheduler();