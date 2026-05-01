import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../firebase';
import './AdminLogin.css';

interface AdminLoginProps {
    onLogin: () => void;
}

function AdminLogin({ onLogin }: AdminLoginProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const fn = httpsCallable(getFunctions(app), 'adminLogin');
            const result = await fn({ password: password.trim() });
            const data = result.data as { success: boolean; token: string };
            if (data.success) {
                localStorage.setItem('admin_authenticated', 'true');
                localStorage.setItem('admin_token', data.token);
                onLogin();
                navigate('/admin/dashboard');
            }
        } catch {
            setError('Password non corretta');
            setPassword('');
        } finally {
            setLoading(false);
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

                    <button type="submit" className="btn-login" disabled={loading}>
                        {loading ? 'Verifica...' : 'Accedi'}
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
