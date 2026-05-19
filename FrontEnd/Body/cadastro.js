async function cadastrarUsuario(event) {
  event.preventDefault(); 

  const usuarioDigitado = document.getElementById('new-username').value.trim();
  const senhaDigitada = document.getElementById('new-password').value.trim();
  const mensagemAviso = document.getElementById('msg-aviso');

  // 🧠 Lógica Inteligente de Rotas
  let baseUrl = '';
  const host = window.location.hostname;
  if (host === '127.0.0.1' || host === 'localhost' || window.location.protocol === 'file:') {
      if(window.location.port !== '3000') {
          baseUrl = 'http://localhost:3000';
      }
  }

  try {
    const resposta = await fetch(`${baseUrl}/users/register`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true' // Força o ngrok a ignorar o ecrã de aviso
      },
      body: JSON.stringify({ username: usuarioDigitado, password: senhaDigitada })
    });

    const dados = await resposta.json();

    if (resposta.ok || resposta.status === 201) {
      // Redirecionamento instantâneo
      window.location.replace('login.html');
    } else {
      mensagemAviso.style.color = '#ef4444';
      mensagemAviso.innerText = dados.mensagem || "Erro ao criar conta.";
      mensagemAviso.style.display = 'block';
    }
  } catch (error) {
    console.error("Erro no cadastro:", error);
    mensagemAviso.style.color = '#ef4444';
    mensagemAviso.innerText = "Erro de conexão com o servidor.";
    mensagemAviso.style.display = 'block';
  }
}