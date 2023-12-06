const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const multer = require("multer");
const { PDFDocument, rgb } = require("pdf-lib");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
// const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const prisma = new PrismaClient();

app.use(
  cors({
    origin: "*",
  })
);
// app.use(express.static(path.join(__dirname, "src")));

app.get("/", (req, res) => {
  res.status(200).json({ status: "running"})
});

// app.get("/login.html", (req, res) => {
//   res.sendFile(path.join(__dirname, "", "login.html"));
// });

// app.get("/cadastro.html", (req, res) => {
//   res.sendFile(path.join(__dirname, "", "cadastro.html"));
// });

app.post("/signup", async (req, res) => {
  try {
    const { nome, cpf, email, senha } = req.body;

    const existingEmail = await prisma.user.findUnique({
      where: { email: req.body.email },
    });

    if (existingEmail) {
      return res.status(400).json({ message: "Email já em uso." });
    }

    const existingCpf = await prisma.user.findUnique({
      where: { cpf: req.body.cpf },
    });

    if (existingCpf) {
      return res.status(400).json({ message: "CPF já em uso." });
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

    res.status(201).json({
      message: "Usuário criado com sucesso.",
      user: { ...user, senha: undefined },
    });
  } catch (error) {
    res.status(500).json({ message: "Erro no servidor" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(senha, user.senha))) {
      return res.status(401).json({ message: "Email ou senha inválidos." });
    }

    res.status(200).json({ message: "Login bem-sucedido." });
  } catch (error) {
    res.status(500).json({ message: "Erro no login. Tente novamente." });
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Erro ao fazer logout" });
    }

    res.redirect("/pages/login.html");
  });
});

app.post(
  "/adicionar-assinatura",
  upload.single("pdfFile"),
  async (req, res) => {
    try {
      const pdfBytes = req.file.buffer;

      // carrega o PDF original
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();

      // aqui define o que vai ser assinado
      const signatureText = "Assinado por: Gustavo Gouveia";

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

      const modifiedPdfData = await pdfDoc.save({ format: "binary" });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="pdf-modificado.pdf"'
      );

      res.send(Buffer.from(modifiedPdfData, "binary"));
    } catch (error) {
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao adicionar a assinatura ao PDF." });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
