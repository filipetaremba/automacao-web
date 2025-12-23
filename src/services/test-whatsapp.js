const whatsappService = require('./whatsapp');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function testWhatsApp() {
    try {
        console.log('🧪 Teste do Serviço WhatsApp\n');
        console.log('═'.repeat(50));

        // 1. Inicializar
        console.log('\n1️⃣ Inicializando WhatsApp...');
        await whatsappService.initialize();

        // Aguardar ficar pronto
        console.log('⏳ Aguardando conexão...');
        while (!whatsappService.isClientReady()) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 2. Mostrar informações
        console.log('\n2️⃣ Informações do Bot:');
        const info = await whatsappService.getInfo();
        console.log('   📱 Telefone:', info.phone);
        console.log('   👤 Nome:', info.pushname);
        console.log('   💻 Plataforma:', info.platform);

        // 3. Listar grupos
        console.log('\n3️⃣ Listando grupos...');
        const groups = await whatsappService.getGroups();
        console.log(`   📱 Você tem ${groups.length} grupos:\n`);
        
        groups.forEach((group, index) => {
            console.log(`   ${index + 1}. ${group.name}`);
            console.log(`      ID: ${group.id}`);
            console.log(`      👥 Membros: ${group.participantsCount}\n`);
        });

        // 4. Perguntar qual grupo usar
        if (groups.length > 0) {
            const answer = await question('\n❓ Deseja enviar uma mensagem de teste? (s/n): ');
            
            if (answer.toLowerCase() === 's') {
                const groupIndex = await question('   Digite o número do grupo: ');
                const selectedGroup = groups[parseInt(groupIndex) - 1];
                
                if (selectedGroup) {
                    console.log(`\n📤 Enviando mensagem para: ${selectedGroup.name}`);
                    await whatsappService.sendText(
                        selectedGroup.id,
                        '🤖 *Teste do Bot de Livros*\n\nO bot está funcionando corretamente!'
                    );
                    console.log('✅ Mensagem enviada com sucesso!');
                    
                    // Salvar GROUP_ID sugerido
                    console.log('\n💡 Cole esta linha no seu arquivo .env:');
                    console.log(`GROUP_ID=${selectedGroup.id}`);
                } else {
                    console.log('❌ Grupo inválido');
                }
            }
        }

        console.log('\n═'.repeat(50));
        console.log('✅ Teste concluído!\n');

    } catch (error) {
        console.error('\n❌ Erro no teste:', error);
    } finally {
        rl.close();
        // Não desconectar o WhatsApp para manter a sessão
        console.log('\n💡 Pressione Ctrl+C para sair (a sessão ficará salva)');
    }
}

// Tratar Ctrl+C
process.on('SIGINT', async () => {
    console.log('\n\n👋 Encerrando...');
    rl.close();
    await whatsappService.disconnect();
    process.exit(0);
});

// Executar teste
testWhatsApp();