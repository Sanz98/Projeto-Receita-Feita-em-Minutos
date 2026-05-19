async function fazerLogin(event) {
  event.preventDefault(); 

  const usuarioDigitado = document.getElementById('username').value.trim();
  const senhaDigitada = document.getElementById('password').value.trim();
  const mensagemErro = document.getElementById('msg-erro');
  
  // Limpa mensagens anteriores
  if (mensagemErro) mensagemErro.style.display = 'none';

  try {
    // CORREÇÃO: Usando URL relativa e limpa
    const resposta = await fetch('/users/login', {
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
      mensagemErro.innerText = erroDados.mensagem || "Usuário ou senha incorretos.";
      mensagemErro.style.display = 'block'; 
    }
  } catch (error) {
    console.error("Erro na API de login:", error);
    mensagemErro.innerText = "Erro de conexão. Verifique o servidor.";
    mensagemErro.style.display = 'block';
  }
}

// Garante que o evento está ligado ao formulário de login
document.addEventListener("DOMContentLoaded", () => {
  const formLogin = document.querySelector('form');
  if (formLogin) {
    formLogin.addEventListener('submit', fazerLogin);
  }
});