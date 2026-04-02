import { useState, useEffect } from 'react';
import { UserProfile, LoyaltyCard, LoyaltyReward } from '../types';
import { db, functions } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import './FidelityCardScreen.css';

interface FidelityCardScreenProps {
    userProfile: UserProfile | null;
}

function FidelityCardScreen({ userProfile }: FidelityCardScreenProps) {
    const navigate = useNavigate();
    const [loyaltyData, setLoyaltyData] = useState<LoyaltyCard | null>(null);
    const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
    const [loadingRewards, setLoadingRewards] = useState(true);
    const [howItWorks, setHowItWorks] = useState<{ title: string; description: string }[]>([]);
    
    // Stato per la sincronizzazione manuale
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadRewards();
        loadHowItWorks();
    }, []);

    // Inizializza i dati dal profilo in modo sincrono invece di ri-scaricarli in automatico
    useEffect(() => {
        if (userProfile && !loyaltyData) {
            setLoyaltyData({
                customerId: userProfile.cassaCloudId || '',
                points: userProfile.loyaltyPoints || 0,
                tier: 'Member',
                lastUpdated: new Date(userProfile.loyaltyPointsLastSync || Date.now())
            } as LoyaltyCard);
        }
    }, [userProfile, loyaltyData]);

    const handleSyncFidelity = async () => {
        if (!userProfile) return;
        setIsSyncing(true);
        setSyncMessage(null);
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
                if (userProfile.id) {
                    const userRef = doc(db, 'users', userProfile.id);
                    await updateDoc(userRef, {
                        cassaCloudId: data.customerId,
                        loyaltyPoints: data.points,
                        loyaltyPointsLastSync: new Date().toISOString()
                    });
                }
                
                // Aggiorna lo stato locale per la UI
                setLoyaltyData(prev => ({
                    ...prev,
                    customerId: data.customerId,
                    points: data.points,
                    tier: prev?.tier || 'Member',
                    lastUpdated: new Date()
                } as LoyaltyCard));
                
                setSyncMessage({ type: 'success', text: `Fidelity aggiornata! Hai ${data.points} punti.` });
            } else {
                if (data.code === 'CUSTOMER_NOT_FOUND') {
                    setSyncMessage({ type: 'error', text: 'Nessuna Fidelity Card trovata per questa email/cellulare.' });
                } else {
                    setSyncMessage({ type: 'error', text: data.message || "Errore durante l'aggiornamento." });
                }
            }
        } catch (error: any) {
            console.error('Sync error:', error);
            setSyncMessage({ type: 'error', text: 'Errore di connessione. Riprova più tardi.' });
        } finally {
            setIsSyncing(false);
            // Nasconde il messaggio dopo 5 sec
            setTimeout(() => setSyncMessage(null), 5000);
        }
    };

    async function loadRewards() {
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

    async function loadHowItWorks() {
        try {
            const docRef = doc(db, 'config', 'fidelity');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setHowItWorks(docSnap.data().howItWorks || []);
            }
        } catch (error) {
            console.error('Error loading howItWorks:', error);
        }
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
                                    {isSyncing ? (
                                        <div className="spinner" aria-label="Caricamento punti"></div>
                                    ) : (
                                        loyaltyData?.points || 0
                                    )}
                                </span>
                                <span className="points-label">Punti</span>
                            </div>

                            {/* Gamification Progress Bar */}
                            {(() => {
                                const currentPoints = loyaltyData?.points || 0;
                                // Sort rewards by points required to find the next target
                                const sortedRewards = [...rewards].sort((a, b) => a.pointsRequired - b.pointsRequired);
                                const nextReward = sortedRewards.find(r => r.pointsRequired > currentPoints);

                                if (nextReward) {
                                    const pointsNeeded = nextReward.pointsRequired - currentPoints;
                                    const prevRewardPoints = sortedRewards.filter(r => r.pointsRequired <= currentPoints).pop()?.pointsRequired || 0;

                                    // Calculate percentage for the bar (start from previous tier or 0)
                                    // Range is [prevRewardPoints, nextReward.pointsRequired]
                                    const totalRange = nextReward.pointsRequired - prevRewardPoints;
                                    const progressInRange = currentPoints - prevRewardPoints;
                                    const percentage = Math.min(100, Math.max(5, (progressInRange / totalRange) * 100)); // Min 5% for visibility

                                    return (
                                        <div className="gamification-container fade-in">
                                            <div className="progress-message">
                                                Ti mancano solo <strong>{pointsNeeded} punti</strong> per <strong>{nextReward.name}</strong>! 🎁
                                            </div>
                                            <div className="progress-bar-container">
                                                <div
                                                    className="progress-bar-fill"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                } else if (rewards.length > 0) {
                                    // User has reached the top tier
                                    return (
                                        <div className="gamification-container fade-in">
                                            <div className="progress-message">
                                                Hai raggiunto il livello massimo! Goditi i tuoi premi! 🏆
                                            </div>
                                            <div className="progress-bar-container">
                                                <div className="progress-bar-fill" style={{ width: '100%' }}></div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                        <div className="card-footer">
                            <span className="card-holder">{userProfile.firstName} {userProfile.lastName}</span>
                            <span className="card-id">ID: {userProfile.phone}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="fidelity-actions-container">
                <button 
                    onClick={handleSyncFidelity} 
                    disabled={isSyncing} 
                    className="btn btn-sync-fidelity" 
                >
                    {isSyncing ? 'Attendere...' : '🔄 Aggiorna Punti'}
                </button>
                {syncMessage && (
                    <div className={`sync-message ${syncMessage.type}`}>
                        {syncMessage.text}
                    </div>
                )}
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





            {howItWorks.length > 0 && (
                <div className="info-box mt-xl">
                    {howItWorks.map((section, i) => (
                        <div key={i} style={{ marginBottom: i < howItWorks.length - 1 ? '16px' : 0 }}>
                            {section.title && <h3 style={{ marginBottom: '6px', fontSize: '1rem' }}>{section.title}</h3>}
                            {section.description && <p style={{ margin: 0, lineHeight: 1.6 }}>{section.description}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div >
    );
}

export default FidelityCardScreen;
