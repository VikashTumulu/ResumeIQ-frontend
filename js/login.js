const form = document.getElementById('loginForm');
const errorMsg = document.getElementById('errorMsg');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  errorMsg.textContent = '';

  try {
    const response = await fetch('https://resumeiq-backend-xjzs.onrender.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const rawText = await response.text();

    if (!response.ok) {
      let message = rawText;
      try {
        const errorData = JSON.parse(rawText);
        message = errorData.message || rawText;
      } catch (parseError) {
        // backend sent plain text, not JSON — use rawText as-is
      }
      throw new Error(message);
    }

    const data = JSON.parse(rawText);

    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('userName', data.name);

    window.location.href = 'dashboard.html';

  } catch (error) {
    errorMsg.textContent = error.message;
  }
});