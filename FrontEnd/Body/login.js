async function fazerLogin(event) {
  event.preventDefault(); 

  const usuarioDigitado = document.getElementById('username').value.trim();
  const senhaDigitada = document.getElementById('password').value.trim();
  const mensagemErro = document.getElementById('msg-erro');
  
  // Limpa mensagens de erro anteriores
  if (mensagemErro) mensagemErro.style.display = 'none';

  try {
    // 🧠 LÓGICA INTELIGENTE DE ROTAS:
    // Se o site for aberto no Live Server local (127.0.0.1 ou localhost porta 5500), aponta para o backend (3000).
    // Se o site for aberto pelo ngrok no telemóvel, mantém o caminho relativo.
    let baseUrl = '';
    const host = window.location.hostname;
    if (host === '127.0.0.1' || host === 'localhost' || window.location.protocol === 'file:') {
        if(window.location.port !== '3000') {
            baseUrl = 'http://localhost:3000';
        }
    }

    const resposta = await fetch(`${baseUrl}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usuarioDigitado, password: senhaDigitada })
    });

    if (resposta.ok) {
      const dados = await resposta.json();
      localStorage.setItem('logado', 'true');
      localStorage.setItem('token', dados.token); 
      window.location.href = 'index.html'; 
    } else {
      const erroDados = await resposta.json();
      mensagemErro.innerText = erroDados.mensagem || "Utilizador ou palavra-passe incorretos.";
      mensagemErro.style.display = 'block'; 
    }
  } catch (error) {
    console.error("Erro na API de login:", error);
    mensagemErro.innerText = "Erro de ligação. O servidor Backend está a correr?";
    mensagemErro.style.display = 'block';
  }
}

// Garante que o evento está ligado ao formulário de login após a página carregar
document.addEventListener("DOMContentLoaded", () => {
  const formLogin = document.querySelector('form');
  if (formLogin) {
    formLogin.addEventListener('submit', fazerLogin);
  }
});