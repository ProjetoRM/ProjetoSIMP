const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const { PDFDocument, rgb } = require('pdf-lib');

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

        // Carrega o PDF original
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();

        // aqui define o que vai ser assinado.
        const signatureText = 'Assinado por: Gustavo Gouveia';

        //aqui adiciona a assinatura e define o local onde ela fica também
        for (const page of pages) {
            const { width, height } = page.getSize();
            const fontSize = 12;

            const textWidth = (width - fontSize * signatureText.length) / 2;
            const textHeight = (height - fontSize) / 2;

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

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/teste.html');
});