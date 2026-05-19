document.getElementById('form-redefinir').addEventListener('submit', async (e) => {
    e.preventDefault();
    const novaSenha = document.getElementById('nova-senha').value.trim();
    
    // Captura os parâmetros contidos na URL gerada pelo servidor
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');
    const token = urlParams.get('token');

    if (!username || !token) {
        alert('Erro de segurança: Token de recuperação inválido ou ausente na URL.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/users/redefinir-senha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, token, novaSenha })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Senha alterada com sucesso! Já podes fazer login.');
            window.location.href = 'login.html';
        } else {
            alert(data.mensagem || 'Falha ao redefinir a senha.');
        }
    } catch (error) {
        console.error('Erro na redefinição:', error);
        alert('Erro ao ligar ao servidor.');
    }
});