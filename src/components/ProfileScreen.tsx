import { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { createUserProfileWithUid, updateUserProfile } from '../services/dbService';
import { clearCart } from '../services/cartService';
import { Cart } from '../types';
import { auth, db } from '../firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import './ProfileScreen.css';

interface ProfileScreenProps {
    userProfile: UserProfile | null;
    setUserProfile: (profile: UserProfile | null) => void;
    setCart: (cart: Cart) => void;
}

type AuthMode = 'login' | 'register';

function ProfileScreen({ userProfile, setUserProfile, setCart }: ProfileScreenProps) {
    const [authMode, setAuthMode] = useState<AuthMode>('login');
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
        setTimeout(() => setMessage(null), 5000); // aumentato a 5s per leggere i popup al centro
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
            
            // Cerca se esiste già un vecchio profilo nel database creato prima dell'introduzione delle password
            const usersRef = collection(db, 'users');
            const qEmail = query(usersRef, where('email', '==', formData.email.toLowerCase()));
            const emailSnap = await getDocs(qEmail);
            
            let oldDocId = null;
            let oldProfileData = null;
            
            if (!emailSnap.empty) {
                oldDocId = emailSnap.docs[0].id;
                oldProfileData = emailSnap.docs[0].data();
            } else {
                // Tenta fallback col telefono
                const qPhone = query(usersRef, where('phone', '==', formData.phone));
                const phoneSnap = await getDocs(qPhone);
                if (!phoneSnap.empty) {
                    oldDocId = phoneSnap.docs[0].id;
                    oldProfileData = phoneSnap.docs[0].data();
                }
            }
            
            if (oldDocId && oldProfileData && oldDocId !== cred.user.uid) {
                // Migra i dati vecchi sul nuovo UID collegato all'autenticazione
                await createUserProfileWithUid(cred.user.uid, {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    email: formData.email,
                    loyaltyPoints: oldProfileData.loyaltyPoints || 0,
                    cassaCloudId: oldProfileData.cassaCloudId || null,
                    // Passiamo la data vecchia se esiste così teniamo traccia di quando era veramente cliente
                });
                // Rimuove il documento orfano vecchio così non ci sono account doppi in dashboard
                try { await deleteDoc(doc(db, 'users', oldDocId)); } catch(e) { console.error('Errore delete old doc', e); }
            } else {
                // Nessun vecchio doc: crea normalmente un profilo intonso
                await createUserProfileWithUid(cred.user.uid, {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    email: formData.email,
                    loyaltyPoints: 0,
                });
            }
            
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

    // ─── RECUPERO PASSWORD ─────────────────────────────────────────
    const handleResetPassword = async () => {
        if (!formData.email) {
            showMessage('error', 'Inserisci il tuo indirizzo email prima di cliccare su "Password dimenticata?".');
            return;
        }
        try {
            await sendPasswordResetEmail(auth, formData.email);
            showMessage('success', 'Email per il ripristino inviata! Controlla la tua casella di posta (inclusa la cartella Spam / Posta Indesiderata).');
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                showMessage('error', 'Nessun account trovato per questa email.');
            } else if (error.code === 'auth/missing-email' || error.code === 'auth/invalid-email') {
                showMessage('error', 'Inserisci un indirizzo email valido.');
            } else {
                showMessage('error', `Errore: ${error.message}`);
            }
        }
    };

    // ─── LOGOUT ───────────────────────────────────────────────────
    const handleLogout = async () => {
        await signOut(auth);
        setUserProfile(null);
        setCart(clearCart());
        setFormData({
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
            password: '',
            confirmPassword: '',
        });
        setAuthMode('login');

        // Forza un ricaricamento completo della pagina per pulire cache e memoria PWA
        window.location.href = '/';
        setTimeout(() => {
            window.location.reload();
        }, 100);
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



    // ─── RENDER: utente NON loggato ───────────────────────────────
    if (!userProfile) {
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
                            <div style={{ textAlign: 'right', marginTop: '-10px' }}>
                                <button type="button" className="btn btn-text" onClick={handleResetPassword} style={{ fontSize: '0.85rem', padding: '0' }}>Password dimenticata?</button>
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">Accedi</button>
                            </div>
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
                            <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.9rem', color: '#666' }}>
                                Hai già un account?{' '}
                                <button type="button" className="btn btn-text" onClick={() => setAuthMode('login')}>Accedi</button>
                            </p>
                        </form>
                    )}
                </div>

                <div className="info-box">
                    <p>Con un account puoi attivare i coupon sconto per i tuoi acquisti.</p>
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



            <div className="info-box">
                    <p>I tuoi dati servono per pre-compilare i messaggi WhatsApp per gli ordini in modo semplice e veloce.</p>
            </div>
        </div>
    );
}

export default ProfileScreen;
