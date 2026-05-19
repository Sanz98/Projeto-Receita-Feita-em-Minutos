document.getElementById('form-esqueci').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const btn = document.querySelector('.btn-primary');
    const textoOriginal = btn.innerText;
    
    // Efeito de carregamento para melhor experiência
    btn.innerText = "Verificando...";
    btn.disabled = true;

    try {
        const response = await fetch('http://localhost:3000/users/esqueci-senha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        const data = await response.json();
        
        if (response.ok) {
            // Se o usuário existir e o link for gerado, atualizamos a interface na hora!
            const container = document.querySelector('.auth-container');
            container.innerHTML = `
                <h2>E-mail Simulado 📬</h2>
                <p class="subtitle" style="margin-bottom: 25px;">
                    Como este é um ambiente acadêmico sem envio real de e-mails, clique no botão abaixo para simular o link de segurança que você receberia na sua caixa de entrada.
                </p>
                <a href="${data.link}" style="display: block; width: 100%; padding: 14px; background: #10b981; color: #fff; border-radius: 12px; text-decoration: none; font-size: 1rem; font-weight: 600; transition: background 0.3s; text-align: center; box-sizing: border-box;">
                    🔗 Redefinir Minha Senha
                </a>
                <div class="form-footer" style="margin-top: 24px;">
                    <p><a href="login.html" style="color: #FF6B00; text-decoration: none; font-weight: 600;">Voltar para o Login</a></p>
                </div>
            `;
        } else {
            alert(data.mensagem || 'Usuário não encontrado no sistema.');
            btn.innerText = textoOriginal;
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Erro ao solicitar recuperação:', error);
        alert('Falha na conexão com o servidor.');
        btn.innerText = textoOriginal;
        btn.disabled = false;
    }
});