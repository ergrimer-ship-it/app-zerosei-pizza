import { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { createUserProfile, updateUserProfile, getUserByPhone } from '../services/dbService';
import { db, functions } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
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
    const [syncError, setSyncError] = useState<string | null>(null);

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

    const handleSyncFidelity = async () => {
        if (!userProfile) return;
        setIsSyncing(true);
        setSyncError(null);

        try {
            console.log('Invoking searchAndSyncFidelityPoints...');
            const searchAndSync = httpsCallable(functions, 'searchAndSyncFidelityPoints');

            const result = await searchAndSync({
                email: userProfile.email,
                firstName: userProfile.firstName,
                lastName: userProfile.lastName,
                phone: userProfile.phone
            });

            console.log('Sync result:', result.data);
            const data = result.data as any;

            if (data.success) {
                // Update Firestore
                const userRef = doc(db, 'users', userProfile.id);
                await updateDoc(userRef, {
                    cassaCloudId: data.customerId,
                    loyaltyPoints: data.points,
                    loyaltyPointsLastSync: new Date().toISOString()
                });

                // Update local profile state immediately if setUserProfile is passed
                if (setUserProfile) {
                    setUserProfile({
                        ...userProfile,
                        cassaCloudId: data.customerId,
                        loyaltyPoints: data.points,
                        loyaltyPointsLastSync: new Date().toISOString()
                    } as any); // cast as any because types.ts might not be updated in IDE context yet
                }

                setMessage({ type: 'success', text: `Fidelity Card collegata! Punti: ${data.points}` });
            } else {
                setSyncError(data.message || 'Errore durante la ricerca');
                if (data.code === 'CUSTOMER_NOT_FOUND') {
                    setMessage({ type: 'error', text: 'Nessuna Fidelity Card trovata. Chiedi in cassa!' });
                }
            }

        } catch (error: any) {
            console.error('Sync error:', error);
            setSyncError('Errore di connessione. Riprova più tardi.');
            setMessage({ type: 'error', text: 'Errore di connessione durante la sincronizzazione.' });
        } finally {
            setIsSyncing(false);
        }
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
                // Remove id from the data stored in the document to avoid redundancy
                const { id, ...dataToUpdate } = newProfile;
                await updateUserProfile(userProfile.id, dataToUpdate);
            } else {
                // Create new
                // Check if user with this phone already exists
                const existingUser = await getUserByPhone(formData.phone);
                if (existingUser) {
                    // Update the existing user instead of creating duplicate
                    newProfile.id = existingUser.id;
                    newProfile.loyaltyPoints = existingUser.loyaltyPoints;
                    newProfile.createdAt = existingUser.createdAt;

                    const { id, ...dataToUpdate } = newProfile;
                    await updateUserProfile(existingUser.id, dataToUpdate);
                } else {
                    // Create brand new
                    // Ensure we don't pass 'id' to createUserProfile
                    const { id, ...dataToCreate } = newProfile;
                    const newId = await createUserProfile(dataToCreate);
                    newProfile.id = newId;
                }
            }

            // Save to localStorage
            localStorage.setItem('user_profile', JSON.stringify(newProfile));
            setUserProfile(newProfile);
            setIsEditing(false);
            setMessage({ type: 'success', text: 'Profilo salvato con successo!' });
        } catch (error: any) {
            console.error('Error saving profile:', error);
            // DEBUG: Mostriamo il messaggio dell'errore vero per capire cosa succede su mobile
            setMessage({
                type: 'error',
                text: `Errore: ${error.message || 'Errore sconosciuto'}. Codice: ${error.code || 'N/A'}`
            });
        }

        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
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

            {/* Fidelity Card Section */}
            {userProfile && !isEditing && (
                <div className="profile-card">
                    <h3>💳 Fidelity Card ZeroSei</h3>

                    {userProfile.cassaCloudId ? (
                        <div className="fidelity-info">
                            <div className="points-display">
                                <span className="points-label">I tuoi Punti:</span>
                                <span className="points-value">{userProfile.loyaltyPoints || 0}</span>
                            </div>
                            <p className="last-sync" style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                                {userProfile.loyaltyPointsLastSync
                                    ? `Aggiornato: ${new Date(userProfile.loyaltyPointsLastSync).toLocaleString('it-IT')}`
                                    : ''}
                            </p>
                            <button
                                onClick={handleSyncFidelity}
                                disabled={isSyncing}
                                className="btn btn-secondary"
                                style={{ marginTop: '10px', width: '100%' }}
                            >
                                {isSyncing ? '🔄 Sincronizzazione...' : '🔄 Aggiorna Punti'}
                            </button>
                        </div>
                    ) : (
                        <div className="fidelity-connect">
                            <p>Hai già una Fidelity Card in negozio? Collegala ora per vedere i tuoi punti!</p>
                            <button
                                onClick={handleSyncFidelity}
                                disabled={isSyncing}
                                className="btn btn-primary"
                                style={{ marginTop: '10px', width: '100%' }}
                            >
                                {isSyncing ? '🔍 Ricerca in corso...' : '🔗 Collega Fidelity Card'}
                            </button>
                            {syncError && <p className="error-text" style={{ color: 'red', marginTop: '10px', fontSize: '0.9rem' }}>{syncError}</p>}
                        </div>
                    )}
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
