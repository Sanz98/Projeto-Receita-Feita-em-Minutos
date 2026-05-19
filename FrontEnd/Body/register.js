async function registrarUsuario(event) {
  event.preventDefault(); 

  const usuarioDigitado = document.getElementById('reg-username').value.trim();
  const senhaDigitada = document.getElementById('reg-password').value.trim();
  
  const msgErro = document.getElementById('msg-erro');
  const msgSucesso = document.getElementById('msg-sucesso');

  msgErro.style.display = 'none';
  msgSucesso.style.display = 'none';

  if (usuarioDigitado.length < 3) {
    msgErro.innerText = "O nome de usuário deve ter pelo menos 3 caracteres.";
    msgErro.style.display = 'block';
    return;
  }
  if (senhaDigitada.length < 6) {
    msgErro.innerText = "A senha deve ter pelo menos 6 caracteres para ser segura.";
    msgErro.style.display = 'block';
    return;
  }

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

    if (resposta.status === 201) {
      // Redireciona imediatamente sem atrasos
      window.location.replace('login.html');
    } else {
      msgErro.innerText = dados.mensagem || "Erro ao criar conta.";
      msgErro.style.display = 'block';
    }
  } catch (error) {
    console.error("Erro no registro:", error);
    msgErro.innerText = "Erro de conexão. O servidor está rodando?";
    msgErro.style.display = 'block';
  }
}