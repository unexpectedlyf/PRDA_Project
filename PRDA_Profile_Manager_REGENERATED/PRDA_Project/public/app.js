const message = document.getElementById('message');
function showMessage(text, success = false) {
  if (!message) return;
  message.textContent = text;
  message.className = success ? 'message success' : 'message';
  message.hidden = false;
}
async function api(url, method, body, token) {
  const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Something went wrong.');
  return result;
}
const login = document.getElementById('login-form');
if (login) login.addEventListener('submit', async event => {
  event.preventDefault();
  const fields = Object.fromEntries(new FormData(login));
  try {
    const result = await api('/api/login', 'POST', fields);
    // CUSTOM NOTE: sessionStorage keeps the token for this tab; do not put it in a URL.
    sessionStorage.setItem('token', result.token);
    location.href = '/profile.html';
  } catch (err) { showMessage(err.message); }
});
const register = document.getElementById('register-form');
if (register) register.addEventListener('submit', async event => {
  event.preventDefault();
  try { await api('/api/register', 'POST', Object.fromEntries(new FormData(register))); showMessage('Account created. Go to login to continue.', true); }
  catch (err) { showMessage(err.message); }
});
const profile = document.getElementById('profile-form');
if (profile) {
  const token = sessionStorage.getItem('token');
  if (!token) location.replace('/');
  else api('/api/profile', 'GET', null, token).then(({ user }) => {
    document.getElementById('username').textContent = user.username;
    ['email', 'phone', 'dob'].forEach(key => { profile.elements[key].value = user[key]; });
  }).catch(err => { showMessage(err.message); sessionStorage.removeItem('token'); });
  profile.addEventListener('submit', async event => {
    event.preventDefault();
    try { await api('/api/profile', 'PUT', Object.fromEntries(new FormData(profile)), sessionStorage.getItem('token')); showMessage('Your profile was saved.', true); }
    catch (err) { showMessage(err.message); }
  });
}
const logout = document.getElementById('logout');
if (logout) logout.addEventListener('click', () => { sessionStorage.removeItem('token'); location.replace('/'); });
