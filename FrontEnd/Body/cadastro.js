let baseUrl = '';
const host = window.location.hostname;
if (host === '127.0.0.1' || host === 'localhost' || window.location.protocol === 'file:') {
    if(window.location.port !== '3000') {
        baseUrl = 'http://localhost:3000';
    }
}

async function cadastrarUsuario(event) {
  event.preventDefault(); 

  const usuarioDigitado = document.getElementById('new-username').value.trim();
  const senhaDigitada = document.getElementById('new-password').value.trim();
  const perfilEscolhido = document.getElementById('new-perfil').value; 
  const mensagemAviso = document.getElementById('msg-aviso');

  if (!usuarioDigitado || !senhaDigitada) {
    mensagemAviso.style.color = '#ef4444';
    mensagemAviso.style.borderColor = 'rgba(239, 68, 68, 0.2)';
    mensagemAviso.style.background = 'rgba(239, 68, 68, 0.1)';
    mensagemAviso.innerText = "Preencha todos os campos!";
    mensagemAviso.style.display = 'block';
    return;
  }

  try {
    const resposta = await fetch(`${baseUrl}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: usuarioDigitado, 
        password: senhaDigitada, 
        perfil: perfilEscolhido 
      })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      mensagemAviso.style.color = '#10b981'; 
      mensagemAviso.style.borderColor = 'rgba(16, 185, 129, 0.2)';
      mensagemAviso.style.background = 'rgba(16, 185, 129, 0.1)';
      mensagemAviso.innerText = "Conta criada com sucesso! Redirecionando...";
      mensagemAviso.style.display = 'block';
      
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000); 
      
    } else {
      mensagemAviso.style.color = '#ef4444';
      mensagemAviso.style.borderColor = 'rgba(239, 68, 68, 0.2)';
      mensagemAviso.style.background = 'rgba(239, 68, 68, 0.1)';
      mensagemAviso.innerText = dados.mensagem || "Erro ao criar conta.";
      mensagemAviso.style.display = 'block';
    }
  } catch (error) {
    mensagemAviso.style.color = '#ef4444';
    mensagemAviso.style.borderColor = 'rgba(239, 68, 68, 0.2)';
    mensagemAviso.style.background = 'rgba(239, 68, 68, 0.1)';
    mensagemAviso.innerText = "Erro ao conectar. Verifique se o servidor Back-end está rodando.";
    mensagemAviso.style.display = 'block';
  }
}