require('dotenv').config();

module.exports = {
    // Sessão do WhatsApp
    sessionPath: './.wwebjs_auth',
    
    // Configurações do cliente
    puppeteerOptions: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    },
    
    // Delays entre mensagens (em milissegundos)
    delays: {
        betweenMessages: 3000,      // 3 segundos entre mensagem de imagem e PDF
        afterSend: 2000,            // 2 segundos após enviar tudo
        reconnect: 5000             // 5 segundos para tentar reconectar
    },
    
    // Limites
    limits: {
        maxPdfSize: 64 * 1024 * 1024,  // 64MB (limite do WhatsApp)
        maxImageSize: 16 * 1024 * 1024  // 16MB para imagens
    }
};