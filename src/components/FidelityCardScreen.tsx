import { useState, useEffect } from 'react';
import { UserProfile, LoyaltyCard } from '../types';
import { getLoyaltyPoints } from '../services/cassaCloudService';
import { useNavigate } from 'react-router-dom';
import './FidelityCardScreen.css';

interface FidelityCardScreenProps {
    userProfile: UserProfile | null;
}

function FidelityCardScreen({ userProfile }: FidelityCardScreenProps) {
    const navigate = useNavigate();
    const [loyaltyData, setLoyaltyData] = useState<LoyaltyCard | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setLoading(true);

            const fetchPoints = async () => {
                let customerId = userProfile.cassaCloudId;
                console.log('Initial customerId from profile:', customerId);

                // Se non abbiamo l'ID, proviamo a cercarlo
                if (!customerId) {
                    try {
                        console.log('Searching for customer profile with:', userProfile.email, userProfile.phone);
                        // Importiamo dinamicamente per evitare dipendenze circolari se ce ne fossero
                        const { linkCustomerProfile } = await import('../services/cassaCloudService');
                        const foundId = await linkCustomerProfile(userProfile);
                        console.log('Search result foundId:', foundId);

                        if (foundId) {
                            customerId = foundId;
                            // Qui dovremmo idealmente aggiornare il profilo utente nel DB con il nuovo ID
                            console.log('Found Cassa in Cloud ID:', customerId);
                        } else {
                            console.warn('Customer not found in Cassa in Cloud');
                        }
                    } catch (err) {
                        console.error('Error linking profile:', err);
                    }
                }

                if (customerId) {
                    console.log('Fetching points for customerId:', customerId);
                    getLoyaltyPoints(customerId).then(data => {
                        console.log('Loyalty data received:', data);
                        setLoyaltyData(data);
                        setLoading(false);
                    });
                } else {
                    console.log('No customerId available, skipping points fetch');
                    // Se ancora non abbiamo ID, mostriamo dati vuoti ma non carichiamo all'infinito
                    setLoading(false);
                }
            };

            fetchPoints();
        }
    }, [userProfile]);

    if (!userProfile) {
        return (
            <div className="fidelity-screen fade-in">
                <div className="login-prompt">
                    <span className="lock-icon">🔒</span>
                    <h2>Accedi per vedere la tua Fidelity Card</h2>
                    <p>Crea un profilo per accumulare punti e ricevere premi!</p>
                    <button className="btn btn-primary" onClick={() => navigate('/profile')}>
                        Crea Profilo
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fidelity-screen fade-in">
            <h1 className="screen-title">Fidelity Card</h1>

            <div className="card-container">
                <div className="digital-card">
                    <div className="card-front">
                        <div className="card-header">
                            <span className="card-logo">ZeroSei 🍕</span>
                            <span className="card-tier">{loyaltyData?.tier || 'Member'}</span>
                        </div>
                        <div className="card-body">
                            <div className="points-display">
                                <span className="points-value">{loading ? '...' : loyaltyData?.points || 0}</span>
                                <span className="points-label">Punti</span>
                            </div>
                        </div>
                        <div className="card-footer">
                            <span className="card-holder">{userProfile.firstName} {userProfile.lastName}</span>
                            <span className="card-id">ID: {userProfile.phone}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rewards-section">
                <h2>Premi Disponibili</h2>
                <div className="rewards-list">
                    <div className="reward-item">
                        <div className="reward-icon">🥤</div>
                        <div className="reward-info">
                            <h3>Bibita in omaggio</h3>
                            <p>100 Punti</p>
                        </div>
                        <button className="btn btn-sm btn-outline" disabled={!loyaltyData || loyaltyData.points < 100}>
                            Riscatta
                        </button>
                    </div>

                    <div className="reward-item">
                        <div className="reward-icon">🍕</div>
                        <div className="reward-info">
                            <h3>Pizza Margherita</h3>
                            <p>200 Punti</p>
                        </div>
                        <button className="btn btn-sm btn-outline" disabled={!loyaltyData || loyaltyData.points < 200}>
                            Riscatta
                        </button>
                    </div>

                    <div className="reward-item">
                        <div className="reward-icon">🍰</div>
                        <div className="reward-info">
                            <h3>Dolce a scelta</h3>
                            <p>150 Punti</p>
                        </div>
                        <button className="btn btn-sm btn-outline" disabled={!loyaltyData || loyaltyData.points < 150}>
                            Riscatta
                        </button>
                    </div>
                </div>
            </div>

            <div className="info-box mt-xl">
                <p>I punti vengono aggiornati automaticamente dopo ogni acquisto in cassa.</p>
            </div>
        </div>
    );
}

export default FidelityCardScreen;
