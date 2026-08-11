// src/components/Login.jsx
import React, { useState } from 'react';
import './Login.css';

function Login({ onLogin, onRegister }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (isRegisterMode) {
      try {
        await onRegister({ name, email, password });
        setSuccessMessage("Compte créé avec succès ! Connectez-vous maintenant.");
        setIsRegisterMode(false);
        setPassword('');
      } catch (err) {
        setError(err.message || "Impossible de s'enregistrer.");
      }
    } else {
      try {
        const result = await onLogin({ email, password });
        
        // Sécurité pour accepter un retour direct de l'utilisateur ou un objet { success, message }
        if (result && typeof result === 'object' && result.success === false) {
          setError(result.message || "Identifiants incorrects.");
        }
      } catch (err) {
        setError(err.message || "Erreur lors de la connexion.");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <span className="login-sub">PLATEFORME EMPLOYÉS</span>
          <h2>{isRegisterMode ? "Créer un compte" : "Connexion"}</h2>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error" style={{ color: '#dc2626', marginBottom: '10px' }}>{error}</div>}
          {successMessage && <div className="login-success" style={{ color: '#16a34a', marginBottom: '10px' }}>{successMessage}</div>}

          {isRegisterMode && (
            <div className="form-group">
              <label>Nom Complet</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}

          <div className="form-group">
            <label>Adresse Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="btn-login" style={{ marginTop: '15px', width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            {isRegisterMode ? "S'enregistrer" : "Se connecter"}
          </button>
        </form>

        <button onClick={() => setIsRegisterMode(!isRegisterMode)} style={{ background: 'none', border: 'none', color: '#2563eb', marginTop: '15px', cursor: 'pointer', width: '100%' }}>
          {isRegisterMode ? "Déjà un compte ? Se connecter" : "Nouveau ? Créer un compte"}
        </button>
      </div>
    </div>
  );
}

export default Login;