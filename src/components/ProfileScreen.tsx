import { useState, useEffect } from 'react';
import { UserProfile } from '../types';
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.firstName || !formData.lastName || !formData.phone) {
            setMessage({ type: 'error', text: 'Per favore compila tutti i campi obbligatori.' });
            return;
        }

        const newProfile: UserProfile = {
            id: userProfile?.id || Date.now().toString(),
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            email: formData.email,
            createdAt: userProfile?.createdAt || new Date(),
            updatedAt: new Date()
        };

        // Save to localStorage
        localStorage.setItem('user_profile', JSON.stringify(newProfile));
        setUserProfile(newProfile);
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Profilo salvato con successo!' });

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
