async function fazerLogin(event) {
  event.preventDefault(); 

  const usuarioDigitado = document.getElementById('username').value.trim();
  const senhaDigitada = document.getElementById('password').value.trim();
  const mensagemErro = document.getElementById('msg-erro');

  try {
    const resposta = await fetch('http://localhost:3000/users/login', {
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
      mensagemErro.style.display = 'block'; 
    }
  } catch (error) {
    console.error("Erro na API de login:", error);
    mensagemErro.innerText = "Erro no servidor. Verifique o backend.";
    mensagemErro.style.display = 'block';
  }
}