const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(express.static('public')); 

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/teste.html'); 
});

app.post('/adicionar-assinatura', upload.single('pdfFile'), async (req, res) => {
    try {
        const pdfBytes = req.file.buffer;

      
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();

        // define a assinatura(AINDA DECIDIR COMO SERÁ A ASS)
        const signatureText = 'Assinado por: "olá"';

        // adiciona a assinatura
        for (const page of pages) {
            const { width, height } = page.getSize();
            const fontSize = 12;
            const textWidth = width / 2 - fontSize;
            const textHeight = 20;

            page.drawText(signatureText, {
                x: textWidth,
                y: textHeight,
                size: fontSize,
                color: rgb(0, 0, 0), 
            });
        }

        const pdfBytesModificado = await pdfDoc.save();

        console.log('Tamanho do PDF gerado:', pdfBytesModificado.length); // testando

        // Enviar o PDF modificado como resposta
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="pdf-modificado.pdf"');
        res.send(pdfBytesModificado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ocorreu um erro ao adicionar a assinatura ao PDF.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
