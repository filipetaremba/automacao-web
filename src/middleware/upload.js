const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Garantir que as pastas existem
const coverDir = path.join(__dirname, '../../public/uploads/covers');
const pdfDir = path.join(__dirname, '../../public/uploads/pdfs');

[coverDir, pdfDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configuração de armazenamento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'cover') {
            cb(null, coverDir);
        } else if (file.fieldname === 'pdf') {
            cb(null, pdfDir);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// Filtro de arquivos
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'cover') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas para a capa!'), false);
        }
    } else if (file.fieldname === 'pdf') {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos PDF são permitidos!'), false);
        }
    } else {
        cb(new Error('Campo de arquivo desconhecido!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 70 * 1024 * 1024 // 70MB
    }
});

module.exports = upload;