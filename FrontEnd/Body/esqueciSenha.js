document.getElementById('form-esqueci').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;

    const response = await fetch('http://localhost:3000/users/esqueci-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });

    const data = await response.json();
    if (response.ok) {
        alert('Verifique o console do servidor BackEnd para pegar o link de recuperação!');
    } else {
        alert(data.error);
    }
});