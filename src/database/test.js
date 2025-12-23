const { initDatabase, closeConnection } = require('./connection');
const {
    addBook,
    getAllBooks,
    getPendingBooks,
    getNextBookToSend,
    updateBookStatus,
    countBooksByStatus,
    setSetting,
    getSetting,
    addLog,
    getRecentLogs
} = require('./queries');

async function testDatabase() {
    try {
        console.log('🧪 Iniciando testes do banco de dados...\n');

        // 1. Inicializar banco
        await initDatabase();
        console.log('✅ Banco inicializado\n');

        // 2. Testar configurações
        console.log('📝 Testando configurações...');
        await setSetting('group_id', '123456789@g.us');
        const groupId = await getSetting('group_id');
        console.log(`   Group ID salvo: ${groupId}\n`);

        // 3. Adicionar livro de teste
        console.log('📚 Adicionando livro de teste...');
        const book = await addBook({
            title: 'O Senhor dos Anéis',
            author: 'J.R.R. Tolkien',
            pages: 1200,
            description: 'Uma épica aventura na Terra Média',
            coverPath: '/uploads/covers/lotr.jpg',
            pdfPath: '/uploads/pdfs/lotr.pdf'
        });
        console.log(`   Livro adicionado: ID ${book.id}\n`);

        // 4. Buscar todos os livros
        console.log('📖 Buscando todos os livros...');
        const allBooks = await getAllBooks();
        console.log(`   Total de livros: ${allBooks.length}\n`);

        // 5. Buscar livros pendentes
        console.log('⏳ Buscando livros pendentes...');
        const pending = await getPendingBooks();
        console.log(`   Livros pendentes: ${pending.length}\n`);

        // 6. Buscar próximo livro
        console.log('🎯 Buscando próximo livro para enviar...');
        const next = await getNextBookToSend();
        if (next) {
            console.log(`   Próximo: "${next.title}" por ${next.author}\n`);
        }

        // 7. Atualizar status
        console.log('🔄 Atualizando status do livro...');
        await updateBookStatus(book.id, 'sent');
        console.log('   Status atualizado para "sent"\n');

        // 8. Adicionar log
        console.log('📊 Adicionando log...');
        await addLog(book.id, 'success');
        console.log('   Log adicionado\n');

        // 9. Estatísticas
        console.log('📈 Estatísticas:');
        const bookStats = await countBooksByStatus();
        console.log(`   Pendentes: ${bookStats.pending}`);
        console.log(`   Enviados: ${bookStats.sent}`);
        console.log(`   Com erro: ${bookStats.error}\n`);

        // 10. Buscar logs
        console.log('📜 Últimos logs:');
        const logs = await getRecentLogs(5);
        logs.forEach(log => {
            console.log(`   - ${log.book_title}: ${log.status}`);
        });

        console.log('\n✅ Todos os testes passaram!');

    } catch (error) {
        console.error('\n❌ Erro nos testes:', error);
    } finally {
        await closeConnection();
        console.log('\n🔌 Conexão fechada');
    }
}

// Executar testes
testDatabase();