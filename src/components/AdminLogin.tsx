import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';

const ADMIN_PASSWORD = 'zerosei2024'; // In production, use environment variable

interface AdminLoginProps {
    onLogin: () => void;
}

function AdminLogin({ onLogin }: AdminLoginProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (password === ADMIN_PASSWORD) {
            localStorage.setItem('admin_authenticated', 'true');
            onLogin();
            navigate('/admin/dashboard');
        } else {
            setError('Password non corretta');
            setPassword('');
        }
    };

    return (
        <div className="admin-login-screen">
            <div className="admin-login-container">
                <div className="admin-login-header">
                    <h1>🍕 ZeroSei Pizza</h1>
                    <h2>Pannello Amministratore</h2>
                </div>

                <form onSubmit={handleSubmit} className="admin-login-form">
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            placeholder="Inserisci la password admin"
                            autoFocus
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="btn-login">
                        Accedi
                    </button>
                </form>

                <button
                    className="btn-back"
                    onClick={() => navigate('/')}
                >
                    ← Torna al sito
                </button>
            </div>
        </div>
    );
}

export default AdminLogin;
