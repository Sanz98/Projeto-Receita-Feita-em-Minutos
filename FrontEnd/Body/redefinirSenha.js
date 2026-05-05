document.getElementById('form-redefinir').addEventListener('submit', async (e) => {
    e.preventDefault();
    const novaSenha = document.getElementById('nova-senha').value;
    
    // Pega o token que está na URL do navegador
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        alert('Token de recuperação não encontrado!');
        return;
    }

    const response = await fetch('http://localhost:3000/users/redefinir-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, novaSenha })
    });

    const data = await response.json();
    if (response.ok) {
        alert('Senha alterada com sucesso! Você já pode fazer login.');
        window.location.href = 'login.html'; // Redireciona para o login
    } else {
        alert(data.error);
    }
});