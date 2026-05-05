async function fazerLogin(event) {
  event.preventDefault(); // Impede a tela de piscar

  const usuarioDigitado = document.getElementById('username').value;
  const senhaDigitada = document.getElementById('password').value;
  const mensagemErro = document.getElementById('msg-erro');

  try {
    const resposta = await fetch('http://localhost:3000/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usuarioDigitado, password: senhaDigitada })
    });

    if (resposta.ok) {
      // Cria o "carimbo" de acesso liberado
      localStorage.setItem('logado', 'true');
      window.location.href = 'index.html'; // Vai pro site principal
    } else {
      mensagemErro.style.display = 'block'; // Mostra o erro em vermelho
    }
  } catch (error) {
    console.error("Erro na API de login:", error);
    mensagemErro.innerText = "Erro no servidor. Verifique o backend.";
    mensagemErro.style.display = 'block';
  }
}