import { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { createUserProfile, updateUserProfile, getUserByPhone } from '../services/dbService';
import { syncFidelityPoints } from '../services/fidelityService';
import './ProfileScreen.css';

interface ProfileScreenProps {
    userProfile: UserProfile | null;
    setUserProfile: (profile: UserProfile | null) => void;
}

function ProfileScreen({ userProfile, setUserProfile }: ProfileScreenProps) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setFormData({
                firstName: userProfile.firstName,
                lastName: userProfile.lastName,
                phone: userProfile.phone,
                email: userProfile.email
            });
        } else {
            setIsEditing(true);
        }
    }, [userProfile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.firstName || !formData.lastName || !formData.phone) {
            setMessage({ type: 'error', text: 'Per favore compila tutti i campi obbligatori.' });
            return;
        }

        try {
            const newProfile: UserProfile = {
                id: userProfile?.id || '', // ID will be set by Firestore if empty
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                email: formData.email,
                loyaltyPoints: userProfile?.loyaltyPoints || 0,
                createdAt: userProfile?.createdAt || new Date(),
                updatedAt: new Date()
            };

            // Save to Firestore
            if (userProfile?.id) {
                // Update existing
                await updateUserProfile(userProfile.id, newProfile);
            } else {
                // Create new
                // Check if user with this phone already exists
                const existingUser = await getUserByPhone(formData.phone);
                if (existingUser) {
                    // Update the existing user instead of creating duplicate
                    newProfile.id = existingUser.id;
                    newProfile.loyaltyPoints = existingUser.loyaltyPoints;
                    newProfile.createdAt = existingUser.createdAt;
                    await updateUserProfile(existingUser.id, newProfile);
                } else {
                    const newId = await createUserProfile(newProfile);
                    newProfile.id = newId;
                }
            }

            // Save to localStorage
            localStorage.setItem('user_profile', JSON.stringify(newProfile));
            setUserProfile(newProfile);
            setIsEditing(false);
            setMessage({ type: 'success', text: 'Profilo salvato con successo!' });
        } catch (error) {
            console.error('Error saving profile:', error);
            setMessage({ type: 'error', text: 'Errore nel salvataggio del profilo. Riprova.' });
        }

        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
    };

    const handleSyncFidelity = async () => {
        if (!userProfile) {
            setMessage({ type: 'error', text: 'Completa prima il profilo per sincronizzare i punti' });
            setTimeout(() => setMessage(null), 3000);
            return;
        }

        setIsSyncing(true);
        setMessage(null);

        try {
            const result = await syncFidelityPoints({
                email: userProfile.email,
                firstName: userProfile.firstName,
                lastName: userProfile.lastName,
                phone: userProfile.phone
            });

            if (result.success && result.points !== undefined) {
                // Aggiorna profilo con punti e customerId
                const updatedProfile = {
                    ...userProfile,
                    loyaltyPoints: result.points,
                    cassaCloudId: result.customerId,
                    loyaltyPointsLastSync: new Date()
                };

                await updateUserProfile(userProfile.id, updatedProfile);
                localStorage.setItem('user_profile', JSON.stringify(updatedProfile));
                setUserProfile(updatedProfile);

                setMessage({
                    type: 'success',
                    text: `✅ Punti sincronizzati! Hai ${result.points} punti fedeltà`
                });
            } else if (result.errorCode === 'MULTIPLE_CUSTOMERS') {
                setMessage({
                    type: 'error',
                    text: 'Trovati multipli clienti con lo stesso nome. Contatta il supporto.'
                });
            } else {
                setMessage({
                    type: 'error',
                    text: result.message || 'Errore durante la sincronizzazione'
                });
            }
        } catch (error: any) {
            console.error('Sync error:', error);
            setMessage({
                type: 'error',
                text: 'Errore di connessione. Riprova più tardi.'
            });
        } finally {
            setIsSyncing(false);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    return (
        <div className="profile-screen fade-in">
            <h1 className="screen-title">Il Tuo Profilo</h1>

            {message && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="profile-card">
                <div className="profile-header">
                    <div className="avatar-circle">
                        {formData.firstName ? formData.firstName[0].toUpperCase() : '👤'}
                    </div>
                    {!isEditing && (
                        <div className="profile-summary">
                            <h2>{userProfile?.firstName} {userProfile?.lastName}</h2>
                            <p>{userProfile?.phone}</p>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-group">
                        <label htmlFor="firstName">Nome *</label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            disabled={!isEditing}
                            placeholder="Il tuo nome"
                            className="input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="lastName">Cognome *</label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            disabled={!isEditing}
                            placeholder="Il tuo cognome"
                            className="input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">Telefono *</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={!isEditing}
                            placeholder="Il tuo numero di cellulare"
                            className="input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={!isEditing}
                            placeholder="La tua email (opzionale)"
                            className="input"
                        />
                    </div>

                    <div className="form-actions">
                        {isEditing ? (
                            <>
                                <button type="button" className="btn btn-ghost" onClick={() => setIsEditing(false)} disabled={!userProfile}>
                                    Annulla
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Salva Profilo
                                </button>
                            </>
                        ) : (
                            <button type="button" className="btn btn-primary" onClick={() => setIsEditing(true)}>
                                Modifica Dati
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {userProfile && !isEditing && (
                <div className="profile-card">
                    <h3>💳 Punti Fedeltà</h3>
                    <div className="fidelity-info">
                        <div className="points-display">
                            <span className="points-label">Punti attuali:</span>
                            <span className="points-value">{userProfile.loyaltyPoints || 0}</span>
                        </div>
                        {userProfile.loyaltyPointsLastSync && (
                            <p className="last-sync">
                                Ultimo aggiornamento: {new Date(userProfile.loyaltyPointsLastSync).toLocaleString('it-IT')}
                            </p>
                        )}
                        <button
                            onClick={handleSyncFidelity}
                            disabled={isSyncing}
                            className="btn btn-secondary"
                        >
                            {isSyncing ? '🔄 Sincronizzazione...' : '🔄 Sincronizza Punti'}
                        </button>
                    </div>
                </div>
            )}

            <div className="info-box">
                <h3>ℹ️ Perché serve il profilo?</h3>
                <p>
                    I tuoi dati servono solo per pre-compilare i messaggi WhatsApp per gli ordini e per associare la tua Fidelity Card.
                    Non vengono inviati a server esterni se non quando invii un ordine o usi la Fidelity Card.
                </p>
            </div>
        </div>
    );
}

export default ProfileScreen;
