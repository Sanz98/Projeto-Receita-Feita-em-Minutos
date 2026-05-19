document.getElementById('form-esqueci').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const btn = document.querySelector('.btn-primary');
    const textoOriginal = btn.innerText;
    
    // Efeito de carregamento para melhor experiência
    btn.innerText = "A verificar...";
    btn.disabled = true;

    // 🧠 Lógica Inteligente para o ngrok e localhost
    let baseUrl = '';
    const host = window.location.hostname;
    if (host === '127.0.0.1' || host === 'localhost' || window.location.protocol === 'file:') {
        if(window.location.port !== '3000') {
            baseUrl = 'http://localhost:3000';
        }
    }

    try {
        const response = await fetch(`${baseUrl}/users/esqueci-senha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        const data = await response.json();
        
        if (response.ok) {
            // Atualiza a interface para o e-mail simulado
            const container = document.querySelector('.auth-container');
            container.innerHTML = `
                <h2>E-mail Simulado 📬</h2>
                <p class="subtitle" style="margin-bottom: 25px;">
                    Como este é um ambiente académico sem envio real de e-mails, clica no botão abaixo para simular o link de segurança que receberias na tua caixa de entrada.
                </p>
                <a href="${data.link}" style="display: block; width: 100%; padding: 14px; background: #10b981; color: #fff; border-radius: 12px; text-decoration: none; font-size: 1rem; font-weight: 600; transition: background 0.3s; text-align: center; box-sizing: border-box;">
                    🔗 Redefinir a Minha Palavra-passe
                </a>
                <div class="form-footer" style="margin-top: 24px;">
                    <p><a href="login.html" style="color: #FF6B00; text-decoration: none; font-weight: 600;">Voltar para o Login</a></p>
                </div>
            `;
        } else {
            alert(data.mensagem || 'Utilizador não encontrado no sistema.');
            btn.innerText = textoOriginal;
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Erro ao solicitar recuperação:', error);
        alert('Falha na ligação com o servidor. O Back-end está a correr?');
        btn.innerText = textoOriginal;
        btn.disabled = false;
    }
});