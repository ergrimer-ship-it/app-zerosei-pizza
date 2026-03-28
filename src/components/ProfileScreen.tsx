import { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { createUserProfileWithUid, getUserProfile, updateUserProfile } from '../services/dbService';
import { auth, db, functions } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
} from 'firebase/auth';
import './ProfileScreen.css';

interface ProfileScreenProps {
    userProfile: UserProfile | null;
    setUserProfile: (profile: UserProfile | null) => void;
}

type AuthMode = 'login' | 'register';

function ProfileScreen({ userProfile, setUserProfile }: ProfileScreenProps) {
    const [authMode, setAuthMode] = useState<AuthMode>('login');
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [googlePendingUser, setGooglePendingUser] = useState<{ uid: string; email: string; displayName: string } | null>(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    useEffect(() => {
        if (userProfile) {
            setFormData(prev => ({
                ...prev,
                firstName: userProfile.firstName,
                lastName: userProfile.lastName,
                phone: userProfile.phone,
                email: userProfile.email,
            }));
        }
    }, [userProfile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    // ─── GOOGLE SIGN-IN ───────────────────────────────────────────
    const handleGoogleSignIn = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const firebaseUser = result.user;

            const existing = await getUserProfile(firebaseUser.uid);
            if (!existing) {
                const parts = (firebaseUser.displayName || '').split(' ');
                setFormData(prev => ({
                    ...prev,
                    firstName: parts[0] || '',
                    lastName: parts.slice(1).join(' ') || '',
                    email: firebaseUser.email || '',
                    phone: '',
                }));
                setGooglePendingUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    displayName: firebaseUser.displayName || '',
                });
            }
            // Se il profilo esiste, onAuthStateChanged in App.tsx carica userProfile automaticamente
        } catch (error: any) {
            showMessage('error', `Errore Google: ${error.message}`);
        }
    };

    // ─── COMPLETAMENTO PROFILO GOOGLE ─────────────────────────────
    const handleCompleteGoogleProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!googlePendingUser) return;
        if (!formData.firstName || !formData.lastName || !formData.phone) {
            showMessage('error', 'Compila tutti i campi obbligatori.');
            return;
        }
        try {
            await createUserProfileWithUid(googlePendingUser.uid, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                email: googlePendingUser.email,
                loyaltyPoints: 0,
            });
            setGooglePendingUser(null);
        } catch (error: any) {
            showMessage('error', `Errore: ${error.message}`);
        }
    };

    // ─── REGISTRAZIONE EMAIL/PASSWORD ─────────────────────────────
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.firstName || !formData.lastName || !formData.phone || !formData.email || !formData.password) {
            showMessage('error', 'Compila tutti i campi obbligatori.');
            return;
        }
        if (formData.password.length < 6) {
            showMessage('error', 'La password deve essere di almeno 6 caratteri.');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            showMessage('error', 'Le password non coincidono.');
            return;
        }
        try {
            const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            await createUserProfileWithUid(cred.user.uid, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                email: formData.email,
                loyaltyPoints: 0,
            });
            showMessage('success', 'Registrazione completata! Benvenuto 🎉');
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                showMessage('error', 'Email già registrata. Prova ad accedere.');
            } else {
                showMessage('error', `Errore: ${error.message}`);
            }
        }
    };

    // ─── LOGIN ────────────────────────────────────────────────────
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            showMessage('error', 'Inserisci email e password.');
            return;
        }
        try {
            await signInWithEmailAndPassword(auth, formData.email, formData.password);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                showMessage('error', 'Email o password non corretti.');
            } else {
                showMessage('error', `Errore: ${error.message}`);
            }
        }
    };

    // ─── LOGOUT ───────────────────────────────────────────────────
    const handleLogout = async () => {
        await signOut(auth);
        setUserProfile(null);
    };

    // ─── MODIFICA PROFILO ─────────────────────────────────────────
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile) return;
        if (!formData.firstName || !formData.lastName || !formData.phone) {
            showMessage('error', 'Compila tutti i campi obbligatori.');
            return;
        }
        try {
            await updateUserProfile(userProfile.id, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
            });
            setUserProfile({ ...userProfile, firstName: formData.firstName, lastName: formData.lastName, phone: formData.phone });
            setIsEditing(false);
            showMessage('success', 'Profilo aggiornato!');
        } catch (error: any) {
            showMessage('error', `Errore: ${error.message}`);
        }
    };

    // ─── SYNC FIDELITY ────────────────────────────────────────────
    const handleSyncFidelity = async () => {
        if (!userProfile) return;
        setIsSyncing(true);
        setSyncError(null);
        try {
            const searchAndSync = httpsCallable(functions, 'searchAndSyncFidelityPoints');
            const result = await searchAndSync({
                email: userProfile.email,
                firstName: userProfile.firstName,
                lastName: userProfile.lastName,
                phone: userProfile.phone
            });
            const data = result.data as any;
            if (data.success) {
                const userRef = doc(db, 'users', userProfile.id);
                await updateDoc(userRef, {
                    cassaCloudId: data.customerId,
                    loyaltyPoints: data.points,
                    loyaltyPointsLastSync: new Date().toISOString()
                });
                setUserProfile({ ...userProfile, cassaCloudId: data.customerId, loyaltyPoints: data.points, loyaltyPointsLastSync: new Date().toISOString() } as any);
                showMessage('success', `Fidelity Card collegata! Punti: ${data.points}`);
            } else {
                setSyncError(data.message || 'Errore durante la ricerca');
                if (data.code === 'CUSTOMER_NOT_FOUND') {
                    showMessage('error', 'Nessuna Fidelity Card trovata. Chiedi in cassa!');
                }
            }
        } catch (error: any) {
            setSyncError('Errore di connessione. Riprova più tardi.');
            showMessage('error', 'Errore di connessione durante la sincronizzazione.');
        } finally {
            setIsSyncing(false);
        }
    };

    // ─── RENDER: utente NON loggato ───────────────────────────────
    if (!userProfile) {
        // Form completamento profilo dopo Google Sign-In
        if (googlePendingUser) {
            return (
                <div className="profile-screen fade-in">
                    <h1 className="screen-title">Completa il Profilo</h1>
                    {message && <div className={`message ${message.type}`}>{message.text}</div>}
                    <div className="profile-card">
                        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '16px' }}>
                            Ciao <strong>{googlePendingUser.displayName}</strong>! Aggiungi il tuo numero per completare la registrazione.
                        </p>
                        <form onSubmit={handleCompleteGoogleProfile} className="profile-form">
                            <div className="form-group">
                                <label>Nome *</label>
                                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="input" required />
                            </div>
                            <div className="form-group">
                                <label>Cognome *</label>
                                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="input" required />
                            </div>
                            <div className="form-group">
                                <label>Telefono *</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Il tuo numero di cellulare" className="input" required />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">Completa Registrazione</button>
                            </div>
                        </form>
                    </div>
                </div>
            );
        }

        return (
            <div className="profile-screen fade-in">
                <h1 className="screen-title">Il Tuo Profilo</h1>
                {message && <div className={`message ${message.type}`}>{message.text}</div>}

                <div className="auth-tabs">
                    <button className={`auth-tab ${authMode === 'login' ? 'active' : ''}`} onClick={() => setAuthMode('login')}>
                        🔑 Accedi
                    </button>
                    <button className={`auth-tab ${authMode === 'register' ? 'active' : ''}`} onClick={() => setAuthMode('register')}>
                        ✨ Registrati
                    </button>
                </div>

                <div className="profile-card">
                    {authMode === 'login' ? (
                        <form onSubmit={handleLogin} className="profile-form">
                            <div className="form-group">
                                <label htmlFor="login-email">Email *</label>
                                <input type="email" id="login-email" name="email" value={formData.email} onChange={handleChange} placeholder="La tua email" className="input" required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="login-password">Password *</label>
                                <input type="password" id="login-password" name="password" value={formData.password} onChange={handleChange} placeholder="La tua password" className="input" required />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">Accedi</button>
                            </div>
                            <div className="google-divider"><span>oppure</span></div>
                            <button type="button" className="btn-google" onClick={handleGoogleSignIn}>
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" />
                                Accedi con Google
                            </button>
                            <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.9rem', color: '#666' }}>
                                Non hai un account?{' '}
                                <button type="button" className="btn btn-text" onClick={() => setAuthMode('register')}>Registrati</button>
                            </p>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister} className="profile-form">
                            <div className="form-group">
                                <label htmlFor="firstName">Nome *</label>
                                <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Il tuo nome" className="input" required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="lastName">Cognome *</label>
                                <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Il tuo cognome" className="input" required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="phone">Telefono *</label>
                                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="Il tuo numero di cellulare" className="input" required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="reg-email">Email *</label>
                                <input type="email" id="reg-email" name="email" value={formData.email} onChange={handleChange} placeholder="La tua email" className="input" required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="reg-password">Password * <small style={{ color: '#999' }}>(min. 6 caratteri)</small></label>
                                <input type="password" id="reg-password" name="password" value={formData.password} onChange={handleChange} placeholder="Scegli una password" className="input" required minLength={6} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirmPassword">Conferma Password *</label>
                                <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Ripeti la password" className="input" required />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">Crea Account</button>
                            </div>
                            <div className="google-divider"><span>oppure</span></div>
                            <button type="button" className="btn-google" onClick={handleGoogleSignIn}>
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" />
                                Registrati con Google
                            </button>
                            <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.9rem', color: '#666' }}>
                                Hai già un account?{' '}
                                <button type="button" className="btn btn-text" onClick={() => setAuthMode('login')}>Accedi</button>
                            </p>
                        </form>
                    )}
                </div>

                <div className="info-box">
                    <h3>ℹ️ Perché registrarsi?</h3>
                    <p>Con un account puoi attivare i coupon sconto e collegare la tua Fidelity Card per accumulare punti.</p>
                </div>
            </div>
        );
    }

    // ─── RENDER: utente LOGGATO ───────────────────────────────────
    return (
        <div className="profile-screen fade-in">
            <h1 className="screen-title">Il Tuo Profilo</h1>
            {message && <div className={`message ${message.type}`}>{message.text}</div>}

            <div className="profile-card">
                <div className="profile-header">
                    <div className="avatar-circle">
                        {userProfile.firstName ? userProfile.firstName[0].toUpperCase() : '👤'}
                    </div>
                    {!isEditing && (
                        <div className="profile-summary">
                            <h2>{userProfile.firstName} {userProfile.lastName}</h2>
                            <p>{userProfile.phone}</p>
                            <p style={{ fontSize: '0.85rem', color: '#999' }}>{userProfile.email}</p>
                        </div>
                    )}
                </div>

                {isEditing ? (
                    <form onSubmit={handleSaveProfile} className="profile-form">
                        <div className="form-group">
                            <label>Nome *</label>
                            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="input" required />
                        </div>
                        <div className="form-group">
                            <label>Cognome *</label>
                            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="input" required />
                        </div>
                        <div className="form-group">
                            <label>Telefono *</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input" required />
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn btn-ghost" onClick={() => setIsEditing(false)}>Annulla</button>
                            <button type="submit" className="btn btn-primary">Salva</button>
                        </div>
                    </form>
                ) : (
                    <div className="form-actions">
                        <button className="btn btn-primary" onClick={() => setIsEditing(true)}>Modifica Dati</button>
                        <button className="btn btn-outline" onClick={handleLogout} style={{ color: '#e53935', borderColor: '#e53935' }}>
                            🚪 Esci
                        </button>
                    </div>
                )}
            </div>

            {/* Fidelity Card */}
            {!isEditing && (
                <div className="profile-card">
                    <h3>💳 Fidelity Card ZeroSei</h3>
                    {userProfile.cassaCloudId ? (
                        <div className="fidelity-info">
                            <div className="points-display">
                                <span className="points-label">I tuoi Punti:</span>
                                <span className="points-value">{userProfile.loyaltyPoints || 0}</span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                                {userProfile.loyaltyPointsLastSync
                                    ? `Aggiornato: ${new Date(userProfile.loyaltyPointsLastSync).toLocaleString('it-IT')}`
                                    : ''}
                            </p>
                            <button onClick={handleSyncFidelity} disabled={isSyncing} className="btn btn-secondary" style={{ marginTop: '10px', width: '100%' }}>
                                {isSyncing ? '🔄 Sincronizzazione...' : '🔄 Aggiorna Punti'}
                            </button>
                        </div>
                    ) : (
                        <div className="fidelity-connect">
                            <p>Per collegare la tua Fidelity Card, comunica alla pizzeria l'email usata nel profilo. Una volta inserita nel gestionale, premi il pulsante qui sotto.</p>
                            <button onClick={handleSyncFidelity} disabled={isSyncing} className="btn btn-primary" style={{ marginTop: '10px', width: '100%' }}>
                                {isSyncing ? '🔍 Ricerca in corso...' : '🔗 Collega Fidelity Card'}
                            </button>
                            {syncError && <p style={{ color: 'red', marginTop: '10px', fontSize: '0.9rem' }}>{syncError}</p>}
                        </div>
                    )}
                </div>
            )}

            <div className="info-box">
                <h3>ℹ️ Perché serve il profilo?</h3>
                <p>I tuoi dati servono per pre-compilare i messaggi WhatsApp per gli ordini e per associare la tua Fidelity Card.</p>
            </div>
        </div>
    );
}

export default ProfileScreen;
