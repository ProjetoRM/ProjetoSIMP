const express = require('express');
const bodyParser = require('body-parser');
const app = express();


app.use(bodyParser.json());


app.post('/cadastrar', (req, res) => {
    const { email, senha } = req.body;

    
    const regexEmail = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    
    if (!regexEmail.test(email)) {
        return res.status(400).json({ error: 'Por favor, insira um email válido.' });
    }

    
    if (senha.length < 8) {
        return res.status(400).json({ error: 'A senha deve conter pelo menos 8 caracteres.' });
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
