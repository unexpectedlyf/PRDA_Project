const message = document.getElementById('message');

// Show feedback in the message area when a form succeeds or fails.
function showMessage(text, success = false) {
  if (!message) return;
  message.textContent = text;
  message.className = success ? 'message success' : 'message';
  message.hidden = false;
}

// Send JSON to the server and turn unsuccessful responses into clear errors.
async function api(url, method, body, token) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Something went wrong.');
  return result;
}
const login = document.getElementById('login-form');
if (login) {
  login.addEventListener('submit', async event => {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(login));

    try {
      const result = await api('/api/login', 'POST', fields);
      // Keep the token in this tab rather than placing it in the page URL.
      sessionStorage.setItem('token', result.token);
      location.href = '/profile.html';
    } catch (err) {
      showMessage(err.message);
    }
  });
}

// Send new account details when the registration form is submitted.
const register = document.getElementById('register-form');
if (register) {
  register.addEventListener('submit', async event => {
    event.preventDefault();

    try {
      await api(
        '/api/register',
        'POST',
        Object.fromEntries(new FormData(register))
      );
      showMessage('Account created. Go to login to continue.', true);
    } catch (err) {
      showMessage(err.message);
    }
  });
}

// Load the signed-in user's details and allow the profile form to save edits.
const profile = document.getElementById('profile-form');
if (profile) {
  const token = sessionStorage.getItem('token');
  if (!token) location.replace('/');
  else {
    api('/api/profile', 'GET', null, token)
      .then(({ user }) => {
        document.getElementById('username').textContent = user.username;
        ['email', 'phone', 'dob'].forEach(key => {
          profile.elements[key].value = user[key];
        });
      })
      .catch(err => {
        showMessage(err.message);
        sessionStorage.removeItem('token');
      });
  }

  profile.addEventListener('submit', async event => {
    event.preventDefault();

    try {
      await api(
        '/api/profile',
        'PUT',
        Object.fromEntries(new FormData(profile)),
        sessionStorage.getItem('token')
      );
      showMessage('Your profile was saved.', true);
    } catch (err) {
      showMessage(err.message);
    }
  });
}

// Clear the tab's login token and return to the login page when signing out.
const logout = document.getElementById('logout');
if (logout) {
  logout.addEventListener('click', () => {
    sessionStorage.removeItem('token');
    location.replace('/');
  });
}
