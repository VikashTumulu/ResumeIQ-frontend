const form = document.getElementById('registerForm');
const errorMsg = document.getElementById('errorMsg');

form.addEventListener('submit', async (event) => {
  event.preventDefault(); // stop the page from refreshing (default form behavior)

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  errorMsg.textContent = ''; // clear any old error

  try {
    const response = await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
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

    // Save the JWT token so we stay logged in
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('userName', data.name);

    // Redirect to dashboard after successful registration
    window.location.href = 'dashboard.html';

  } catch (error) {
    errorMsg.textContent = error.message;
  }
});