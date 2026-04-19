import React, { useState } from 'react';
import api from '../api';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        username,
        password,
      });

      onLogin(response.data.token, response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1>🏥 MediLog</h1>
      <h2 style={{ textAlign: 'center', fontSize: '18px', marginBottom: '20px', color: '#7f8c8d' }}>
        Zdravotní informační systém
      </h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Uživatelské jméno</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Zadejte uživatelské jméno"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Heslo</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Zadejte heslo"
            disabled={loading}
          />
        </div>

        <button type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Přihlašování...' : 'Přihlásit se'}
        </button>
      </form>

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h3 style={{ fontSize: '14px', color: '#2c3e50', marginBottom: '10px' }}>Testovací přihlášení:</h3>
        <p style={{ fontSize: '13px', color: '#7f8c8d' }}>
          <strong>Lékař:</strong> dr_novak / password123
        </p>
        <p style={{ fontSize: '13px', color: '#7f8c8d' }}>
          <strong>Zdravotní sestra:</strong> nurse_jana / password123
        </p>
      </div>
    </div>
  );
}

export default Login;
