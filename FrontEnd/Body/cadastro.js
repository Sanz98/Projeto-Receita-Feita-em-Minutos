// Configuração inteligente da URL do servidor (Local vs Produção)
let baseUrl = '';
const host = window.location.hostname;
if (host === '127.0.0.1' || host === 'localhost' || window.location.protocol === 'file:') {
    if(window.location.port !== '3000') {
        baseUrl = 'http://localhost:3000';
    }
}

async function cadastrarUsuario(event) {
  event.preventDefault(); // Impede a tela de piscar

  const usuarioDigitado = document.getElementById('new-username').value.trim();
  const senhaDigitada = document.getElementById('new-password').value.trim();
  const mensagemAviso = document.getElementById('msg-aviso');

  // Trava de segurança extra para evitar envios vazios
  if (!usuarioDigitado || !senhaDigitada) {
    mensagemAviso.style.color = '#ef4444';
    mensagemAviso.innerText = "Preencha todos os campos!";
    mensagemAviso.style.display = 'block';
    return;
  }

  try {
    const resposta = await fetch(`${baseUrl}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usuarioDigitado, password: senhaDigitada })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      // Se deu certo, avisa o usuário e manda pro login!
      mensagemAviso.style.color = '#10b981'; // Verde de sucesso
      mensagemAviso.innerText = "Conta criada com sucesso! Redirecionando...";
      mensagemAviso.style.display = 'block';
      
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000); // Espera 2 segundos e vai pro login
      
    } else {
      // Se o usuário já existir, mostra o erro em vermelho
      mensagemAviso.style.color = '#ef4444';
      mensagemAviso.innerText = dados.mensagem || "Erro ao criar conta.";
      mensagemAviso.style.display = 'block';
    }
  } catch (error) {
    console.error("Erro na API de cadastro:", error);
    mensagemAviso.style.color = '#ef4444';
    mensagemAviso.innerText = "Erro ao conectar. Verifique se o servidor Back-end está a correr.";
    mensagemAviso.style.display = 'block';
  }
}