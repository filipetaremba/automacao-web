const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const config = require('../config/whatsapp');

class WhatsAppService {
    constructor() {
        this.client = null;
        this.isReady = false;
        this.isConnecting = false;
    }

    /**
     * Inicializa o cliente do WhatsApp
     */
    async initialize() {
        if (this.isConnecting) {
            console.log('⏳ WhatsApp já está tentando conectar...');
            return;
        }

        this.isConnecting = true;
        console.log('🚀 Inicializando cliente WhatsApp...');

        try {
            this.client = new Client({
                authStrategy: new LocalAuth({
                    dataPath: config.sessionPath
                }),
                puppeteer: config.puppeteerOptions
            });

            this.setupEventHandlers();
            await this.client.initialize();
            
        } catch (error) {
            console.error('❌ Erro ao inicializar WhatsApp:', error);
            this.isConnecting = false;
            throw error;
        }
    }

    /**
     * Configura os eventos do cliente
     */
    setupEventHandlers() {
        // Evento: QR Code gerado
        this.client.on('qr', (qr) => {
            console.log('\n📱 QR CODE GERADO! Escaneie com seu WhatsApp:\n');
            qrcode.generate(qr, { small: true });
            console.log('\n');
        });

        // Evento: Autenticado com sucesso
        this.client.on('authenticated', () => {
            console.log('✅ WhatsApp autenticado com sucesso!');
        });

        // Evento: Pronto para usar
        this.client.on('ready', () => {
            console.log('✅ WhatsApp está pronto para uso!');
            this.isReady = true;
            this.isConnecting = false;
        });

        // Evento: Mensagem recebida (opcional - para logs)
        this.client.on('message', async (msg) => {
            // Você pode adicionar lógica aqui se quiser responder mensagens
            // Por enquanto só logamos
            if (msg.body.toLowerCase() === '!status') {
                await msg.reply('🤖 Bot de livros está ativo!');
            }
        });

        // Evento: Cliente desconectado
        this.client.on('disconnected', (reason) => {
            console.log('⚠️ WhatsApp desconectado:', reason);
            this.isReady = false;
            this.isConnecting = false;
            
            // Tentar reconectar após delay
            console.log('🔄 Tentando reconectar em 5 segundos...');
            setTimeout(() => {
                this.initialize().catch(err => {
                    console.error('❌ Erro ao reconectar:', err);
                });
            }, config.delays.reconnect);
        });

        // Evento: Erro de autenticação
        this.client.on('auth_failure', (msg) => {
            console.error('❌ Falha na autenticação:', msg);
            this.isReady = false;
            this.isConnecting = false;
            
            // Deletar sessão corrompida
            console.log('🗑️ Removendo sessão corrompida...');
            this.deleteSession();
        });

        // Evento: Carregando (mostra progresso)
        this.client.on('loading_screen', (percent, message) => {
            console.log(`📲 Carregando WhatsApp: ${percent}% - ${message}`);
        });
    }

    /**
     * Verifica se o cliente está pronto
     */
    isClientReady() {
        return this.isReady && this.client;
    }

    /**
     * Lista todos os grupos que o bot participa
     */
    async getGroups() {
        if (!this.isClientReady()) {
            throw new Error('WhatsApp não está pronto');
        }

        try {
            const chats = await this.client.getChats();
            const groups = chats.filter(chat => chat.isGroup);
            
            return groups.map(group => ({
                id: group.id._serialized,
                name: group.name,
                participantsCount: group.participants ? group.participants.length : 0
            }));
        } catch (error) {
            console.error('❌ Erro ao buscar grupos:', error);
            throw error;
        }
    }

    /**
     * Busca um grupo específico por ID
     */
    async getGroupById(groupId) {
        if (!this.isClientReady()) {
            throw new Error('WhatsApp não está pronto');
        }

        try {
            const chat = await this.client.getChatById(groupId);
            if (!chat.isGroup) {
                throw new Error('Este chat não é um grupo');
            }
            return chat;
        } catch (error) {
            console.error('❌ Erro ao buscar grupo:', error);
            throw error;
        }
    }

    /**
     * Valida se um arquivo existe e está dentro do limite de tamanho
     */
    validateFile(filePath, maxSize) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Arquivo não encontrado: ${filePath}`);
        }

        const stats = fs.statSync(filePath);
        const fileSizeInBytes = stats.size;

        if (fileSizeInBytes > maxSize) {
            const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
            const fileSizeMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
            throw new Error(
                `Arquivo muito grande: ${fileSizeMB}MB (máximo: ${maxSizeMB}MB)`
            );
        }

        return true;
    }

    /**
     * Envia mensagem de texto simples
     */
    async sendText(groupId, message) {
        if (!this.isClientReady()) {
            throw new Error('WhatsApp não está pronto');
        }

        try {
            await this.client.sendMessage(groupId, message);
            console.log('✅ Mensagem de texto enviada');
            return true;
        } catch (error) {
            console.error('❌ Erro ao enviar texto:', error);
            throw error;
        }
    }

    /**
     * Envia imagem com legenda
     */
    async sendImage(groupId, imagePath, caption) {
        if (!this.isClientReady()) {
            throw new Error('WhatsApp não está pronto');
        }

        try {
            // Validar arquivo
            this.validateFile(imagePath, config.limits.maxImageSize);

            // Criar mídia
            const media = MessageMedia.fromFilePath(imagePath);
            
            // Enviar
            await this.client.sendMessage(groupId, media, { caption });
            console.log('✅ Imagem enviada com sucesso');
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao enviar imagem:', error);
            throw error;
        }
    }

    /**
     * Envia documento PDF
     */
    async sendPDF(groupId, pdfPath, filename = null) {
        if (!this.isClientReady()) {
            throw new Error('WhatsApp não está pronto');
        }

        try {
            // Validar arquivo
            this.validateFile(pdfPath, config.limits.maxPdfSize);

            // Criar mídia
            const media = MessageMedia.fromFilePath(pdfPath);
            
            // Nome do arquivo
            const name = filename || path.basename(pdfPath);
            
            // Enviar como documento
            await this.client.sendMessage(groupId, media, {
                sendMediaAsDocument: true,
                caption: name
            });
            
            console.log('✅ PDF enviado com sucesso');
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao enviar PDF:', error);
            throw error;
        }
    }

    /**
     * Envia um livro completo (imagem + PDF)
     * Esta é a função principal que será usada!
     */
    async sendBook(groupId, bookData) {
        if (!this.isClientReady()) {
            throw new Error('WhatsApp não está pronto');
        }

        console.log(`\n📚 Enviando livro: "${bookData.title}"`);

        try {
            // Formatar mensagem da capa
            const caption = this.formatBookCaption(bookData);

            // 1. Enviar imagem da capa com informações
            console.log('📸 Enviando capa do livro...');
            await this.sendImage(groupId, bookData.coverPath, caption);
            
            // Aguardar delay
            console.log(`⏳ Aguardando ${config.delays.betweenMessages / 1000}s...`);
            await this.sleep(config.delays.betweenMessages);

            // 2. Enviar PDF
            console.log('📄 Enviando PDF do livro...');
            const pdfFilename = `${bookData.title} - ${bookData.author}.pdf`;
            await this.sendPDF(groupId, bookData.pdfPath, pdfFilename);

            // Aguardar delay final
            await this.sleep(config.delays.afterSend);

            console.log('✅ Livro enviado completamente!\n');
            return true;

        } catch (error) {
            console.error('❌ Erro ao enviar livro:', error);
            throw error;
        }
    }

    /**
     * Formata a legenda da mensagem do livro
     */
    formatBookCaption(bookData) {
        let caption = `📚 *${bookData.title}*\n\n`;
        caption += `✍️ *Autor:* ${bookData.author}\n`;
        
        if (bookData.pages) {
            caption += `📄 *Páginas:* ${bookData.pages}\n`;
        }
        
        if (bookData.description) {
            caption += `\n📖 *Descrição:*\n${bookData.description}\n`;
        }
        
        caption += `\n_O PDF será enviado em seguida..._`;
        
        return caption;
    }

    /**
     * Função auxiliar para delay
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Deleta a sessão salva
     */
    deleteSession() {
        try {
            if (fs.existsSync(config.sessionPath)) {
                fs.rmSync(config.sessionPath, { recursive: true, force: true });
                console.log('✅ Sessão deletada');
            }
        } catch (error) {
            console.error('❌ Erro ao deletar sessão:', error);
        }
    }

    /**
     * Desconecta o cliente
     */
    async disconnect() {
        if (this.client) {
            try {
                await this.client.destroy();
                this.isReady = false;
                this.isConnecting = false;
                console.log('✅ WhatsApp desconectado');
            } catch (error) {
                console.error('❌ Erro ao desconectar:', error);
            }
        }
    }

    /**
     * Obtém informações do bot
     */
    async getInfo() {
        if (!this.isClientReady()) {
            return {
                isReady: false,
                message: 'WhatsApp não está conectado'
            };
        }

        try {
            const info = this.client.info;
            return {
                isReady: true,
                phone: info.wid.user,
                pushname: info.pushname,
                platform: info.platform
            };
        } catch (error) {
            console.error('❌ Erro ao obter info:', error);
            return {
                isReady: false,
                message: 'Erro ao obter informações'
            };
        }
    }
}

// Exportar instância única (Singleton)
const whatsappService = new WhatsAppService();
module.exports = whatsappService;