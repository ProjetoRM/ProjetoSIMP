const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

app.post('/cadastrar', (req, res) => {
    const { email, senha } = req.body;

    const regexEmail = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    if (!regexEmail.test(email)) {
        return res.status(400).json({ error: 'Insira um email válido.' });
    }

    
    if (senha.length < 8 || !/[A-Z]/.test(senha) || !/[a-z]/.test(senha) || !/[@#$%^&+=]/.test(senha)) {
        return res.status(400).json({ error: 'Senha inválida. Use pelo menos 8 caracteres, incluindo uma letra maiúscula, uma minúscula e um caractere especial.' });
    }

    // Simulação de cadastro em banco de dados
    const usuario = {
        email: email,
        // Outros dados do usuário
    };

    return res.status(200).json({ message: 'Cadastro realizado com sucesso.', usuario });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
