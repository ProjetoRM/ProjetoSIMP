const express = require('express');
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


app.get('/', (req, res) => {
    
    res.sendFile(path.join(__dirname, 'public', 'cadastro.html'));
});
// 
app.post('/signup', async (req, res) => {
    try {
        const { nome, cpf, email, senha } = req.body;

        console.log('Dados do formulário:', req.body);

        const existingUser = await prisma.user.findUnique({
            where: { email: req.body.email }, 
        });
        

        if (existingUser) {
            return res.status(400).json({ message: 'Email já em uso.' });
        }

        // faz o hash da senha antes de salvar no db 
        const hashedPassword = await bcrypt.hash(senha, 10);

        const user = await prisma.user.create({
            data: {
                nome,
                cpf,
                email,
                senha: hashedPassword,
            },
        });

        res.json({ message: 'Cadastro bem-sucedido', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// Rota de login
app.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const passwordMatch = await bcrypt.compare(senha, user.senha);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        res.json({ message: 'Login bem-sucedido', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
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
