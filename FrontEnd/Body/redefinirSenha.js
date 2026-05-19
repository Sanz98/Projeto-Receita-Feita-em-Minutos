document.getElementById('form-redefinir').addEventListener('submit', async (e) => {
    e.preventDefault();
    const novaSenha = document.getElementById('nova-senha').value.trim();
    
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');
    const token = urlParams.get('token');

    if (!username || !token) {
        alert('Erro de segurança: Token de recuperação inválido ou ausente na URL.');
        return;
    }

    // 🧠 Lógica Inteligente
    let baseUrl = '';
    const host = window.location.hostname;
    if (host === '127.0.0.1' || host === 'localhost' || window.location.protocol === 'file:') {
        if(window.location.port !== '3000') {
            baseUrl = 'http://localhost:3000';
        }
    }

    try {
        const response = await fetch(`${baseUrl}/users/redefinir-senha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, token, novaSenha })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Palavra-passe alterada com sucesso! Já pode iniciar sessão.');
            window.location.href = 'login.html';
        } else {
            alert(data.mensagem || 'Falha ao redefinir a palavra-passe.');
        }
    } catch (error) {
        console.error('Erro na redefinição:', error);
        alert('Erro ao ligar ao servidor.');
    }
});