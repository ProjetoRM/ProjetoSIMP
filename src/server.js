const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const { PDFDocument, rgb } = require('pdf-lib');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const prisma = new PrismaClient();
app.use(session({
    secret: '123', 
    resave: false,
    saveUninitialized: true,
  }));


app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    
    res.sendFile(path.join(__dirname, 'public/pages', 'index.html'));
});
// 
app.post('/signup', async (req, res) => {
    try {
        const { nome, cpf, email, senha } = req.body;

        const existingUser = await prisma.user.findUnique({
            where: { email: req.body.email }, 
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Email já em uso.' });
        }

   
        const hashedPassword = await bcrypt.hash(senha, 10);

        const user = await prisma.user.create({
            data: {
                nome,
                cpf,
                email,
                senha: hashedPassword,
            },
        });

        
        res.send(`<script>alert('Cadastro bem-sucedido'); window.location.href = '/';</script>`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// Rota de login
app.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        console.log('Email recebido:', email);

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !(await bcrypt.compare(senha, user.senha))) {
            console.log('Credenciais inválidas');
            return res.status(401).json({ message: 'Email ou senha inválidos.' });
        }

        console.log('Login bem-sucedido para:', email);
        res.status(200).json({ message: 'Login bem-sucedido.' });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro no login. Tente novamente.' });
    }
});

        app.post('/logout', (req, res) => {
            
            req.session.destroy((err) => {
            if (err) {
                console.error('Erro ao fazer logout:', err);
                return res.status(500).json({ message: 'Erro ao fazer logout' });
            }
            
            res.redirect('/pages/login.html');
            });
        });



app.post('/adicionar-assinatura', upload.single('pdfFile'), async (req, res) => {
    try {
        const pdfBytes = req.file.buffer;

        // Carrega o PDF original
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();

        // aqui define o que vai ser assinado.
        const signatureText = 'Assinado por: Gustavo Gouveia';

        const margin = 30; 

        for (const page of pages) {
            const { width, height } = page.getSize();
            const fontSize = 12;
        
            const textWidth = width - margin - fontSize * signatureText.length;
            const textHeight = margin;
        
            page.drawText(signatureText, {
                x: textWidth,
                y: textHeight,
                size: fontSize,
                color: rgb(0, 0, 0),
            });
        }

        
        const modifiedPdfData = await pdfDoc.save({ format: 'binary' });

        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="pdf-modificado.pdf"');

        
        res.send(Buffer.from(modifiedPdfData, 'binary'));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ocorreu um erro ao adicionar a assinatura ao PDF.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
