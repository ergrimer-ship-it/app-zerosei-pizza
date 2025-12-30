import { useState, useEffect } from 'react';
import { UserProfile, LoyaltyCard, LoyaltyReward } from '../types';
import { getLoyaltyPoints } from '../services/cassaCloudService';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './FidelityCardScreen.css';

interface FidelityCardScreenProps {
    userProfile: UserProfile | null;
}

function FidelityCardScreen({ userProfile }: FidelityCardScreenProps) {
    const navigate = useNavigate();
    const [loyaltyData, setLoyaltyData] = useState<LoyaltyCard | null>(null);
    const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingRewards, setLoadingRewards] = useState(true);

    useEffect(() => {
        loadRewards();
    }, []);

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
                            // Salva l'ID nel profilo utente in Firestore (solo se l'utente ha un ID)
                            if (userProfile.id) {
                                try {
                                    const userDocRef = doc(db, 'users', userProfile.id);
                                    await updateDoc(userDocRef, {
                                        cassaCloudId: foundId,
                                        loyaltyPointsLastSync: new Date().toISOString()
                                    });
                                    console.log('✅ Saved Cassa in Cloud ID to Firestore:', customerId);
                                } catch (updateError) {
                                    console.error('❌ Error saving cassaCloudId to Firestore:', updateError);
                                    // Continuiamo comunque anche se il salvataggio fallisce
                                }
                            } else {
                                console.warn('⚠️ User profile not saved yet, skipping cassaCloudId save');
                            }
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

    const loadRewards = async () => {
        setLoadingRewards(true);
        try {
            const docRef = doc(db, 'config', 'rewards');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                // Filtra solo premi attivi
                const activeRewards = (data.rewards || []).filter((r: LoyaltyReward) => r.available);
                setRewards(activeRewards);
            } else {
                setRewards([]);
            }
        } catch (error) {
            console.error('Error loading rewards:', error);
            setRewards([]);
        }
        setLoadingRewards(false);
    };

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
                                <span className="points-value">
                                    {loading ? (
                                        <div className="spinner" aria-label="Caricamento punti"></div>
                                    ) : (
                                        loyaltyData?.points || 0
                                    )}
                                </span>
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
                {loadingRewards ? (
                    <div className="loading-rewards">Caricamento premi...</div>
                ) : rewards.length === 0 ? (
                    <div className="no-rewards">
                        <p>Nessun premio disponibile al momento.</p>
                    </div>
                ) : (
                    <div className="rewards-list">
                        {rewards.map((reward) => (
                            <div key={reward.id} className="reward-item">
                                <div className="reward-icon">{reward.imageUrl || '🎁'}</div>
                                <div className="reward-info">
                                    <h3>{reward.name}</h3>
                                    <p>{reward.description}</p>
                                    <p className="reward-points-required">{reward.pointsRequired} Punti</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="info-box mt-xl">
                <p>I punti vengono aggiornati automaticamente dopo ogni acquisto in cassa.</p>
            </div>
        </div>
    );
}

export default FidelityCardScreen;
