const path = require('path');
const fs = require('fs');
const {
    getAllBooks,
    addBook,
    getBookById,
    updateBook,
    deleteBook,
    countBooksByStatus
} = require('../database/queries');

const bookController = {
    listBooks: async (req, res) => {
        try {
            const books = await getAllBooks();
            const stats = await countBooksByStatus();
            res.render('books/list', { books, stats });
        } catch (error) {
            res.render('books/list', { 
                books: [], 
                stats: { pending: 0, sent: 0, error: 0 },
                error: error.message 
            });
        }
    },

    showNewForm: (req, res) => {
        res.render('books/form', { book: null, error: null });
    },

    createBook: async (req, res) => {
        try {
            const { title, author, pages, description } = req.body;
            
            if (!req.files || !req.files.cover || !req.files.pdf) {
                throw new Error('Imagem da capa e PDF são obrigatórios');
            }

            const coverPath = path.join(__dirname, '../../public/uploads/covers/', req.files.cover[0].filename);
            const pdfPath = path.join(__dirname, '../../public/uploads/pdfs/', req.files.pdf[0].filename);

            await addBook({
                title,
                author,
                pages: pages || null,
                description,
                coverPath,
                pdfPath
            });

            res.redirect('/books?success=Livro adicionado com sucesso!');
        } catch (error) {
            res.render('books/form', { 
                book: req.body, 
                error: error.message 
            });
        }
    },

    showEditForm: async (req, res) => {
        try {
            const book = await getBookById(req.params.id);
            if (!book) {
                return res.redirect('/books?error=Livro não encontrado');
            }
            res.render('books/form', { book, error: null });
        } catch (error) {
            res.redirect('/books?error=' + error.message);
        }
    },

    updateBook: async (req, res) => {
        try {
            const { title, author, pages, description } = req.body;
            const bookId = req.params.id;

            const updateData = {
                title,
                author,
                pages: pages || null,
                description
            };

            if (req.files && req.files.cover) {
                updateData.coverPath = path.join(__dirname, '../../public/uploads/covers/', req.files.cover[0].filename);
            }

            if (req.files && req.files.pdf) {
                updateData.pdfPath = path.join(__dirname, '../../public/uploads/pdfs/', req.files.pdf[0].filename);
            }

            await updateBook(bookId, updateData);
            res.redirect('/books?success=Livro atualizado com sucesso!');
        } catch (error) {
            res.redirect('/books?error=' + error.message);
        }
    },

    deleteBook: async (req, res) => {
        try {
            const book = await getBookById(req.params.id);
            
            if (book) {
                if (fs.existsSync(book.cover_path)) {
                    fs.unlinkSync(book.cover_path);
                }
                if (fs.existsSync(book.pdf_path)) {
                    fs.unlinkSync(book.pdf_path);
                }
            }

            await deleteBook(req.params.id);
            res.redirect('/books?success=Livro deletado com sucesso!');
        } catch (error) {
            res.redirect('/books?error=' + error.message);
        }
    }
};

module.exports = bookController;