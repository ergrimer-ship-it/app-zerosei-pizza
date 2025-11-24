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
            // Use mock ID or real ID if available
            const customerId = userProfile.cassaCloudId || 'mock-customer-id';

            getLoyaltyPoints(customerId).then(data => {
                setLoyaltyData(data);
                setLoading(false);
            });
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
