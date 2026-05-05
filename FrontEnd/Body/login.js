async function fazerLogin(event) {
  // Previne que a página recarregue ao clicar em "Entrar"
  event.preventDefault();

  const usuarioDigitado = document.getElementById('username').value;
  const senhaDigitada = document.getElementById('password').value;
  const mensagemErro = document.getElementById('msg-erro');

  try {
    // Comunicação com o seu Backend na rota de login
    const resposta = await fetch('http://localhost:3000/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        username: usuarioDigitado, 
        password: senhaDigitada 
      })
    });

    if (resposta.ok) {
      const dados = await resposta.json();
      
      // Se a API te devolver um token (JWT), salva no navegador
      if (dados.token) {
        localStorage.setItem('token', dados.token);
      }
      
      // Redireciona para o site principal lindão!
      window.location.href = 'index.html';
      
    } else {
      // Se a senha estiver errada, mostra o aviso vermelho
      mensagemErro.style.display = 'block';
    }
  } catch (error) {
    console.error("Erro no login:", error);
    mensagemErro.innerText = "Erro ao conectar com o servidor. O backend está rodando?";
    mensagemErro.style.display = 'block';
  }
}