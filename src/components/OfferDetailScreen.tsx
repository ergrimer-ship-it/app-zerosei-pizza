import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { NewsPromotion, UserProfile } from '../types';
import './OfferDetailScreen.css';

interface OfferDetailScreenProps {
    userProfile: UserProfile | null;
}

function OfferDetailScreen({ userProfile }: OfferDetailScreenProps) {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [offer, setOffer] = useState<NewsPromotion | null>(null);
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState(false);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadOffer();
    }, [id]);

    const loadOffer = async () => {
        if (!id) return;

        try {
            const docRef = doc(db, 'promotions', id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setOffer({
                    id: docSnap.id,
                    title: data.title,
                    description: data.description,
                    imageUrl: data.imageUrl,
                    validFrom: data.validFrom?.toDate() || new Date(),
                    validTo: data.validTo?.toDate() || new Date(),
                    active: data.active,
                    showAsPopup: data.showAsPopup,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                });
            } else {
                setError('Offerta non trovata');
            }
        } catch (err) {
            console.error('Error loading offer:', err);
            setError('Errore nel caricamento dell\'offerta');
        }
        setLoading(false);
    };

    const generateRandomCode = (): string => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const checkDailyLimit = async (): Promise<boolean> => {
        if (!userProfile) return false;

        // Inizio giornata odierna (00:00)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        try {
            const couponsRef = collection(db, 'GeneratedCoupons');
            const q = query(
                couponsRef,
                where('userId', '==', userProfile.id),
                where('createdAt', '>=', Timestamp.fromDate(today))
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.size > 0;
        } catch (err) {
            console.error('Error checking daily limit:', err);
            return false;
        }
    };

    const handleActivateOffer = async () => {
        if (!userProfile) {
            setError('Devi essere loggato per attivare un\'offerta');
            return;
        }

        if (!offer) return;

        setActivating(true);
        setError(null);

        try {
            // Step 1: Verifica limite giornaliero
            const hasActivatedToday = await checkDailyLimit();

            if (hasActivatedToday) {
                setError('🚫 Puoi attivare solo un\'offerta al giorno. Torna domani!');
                setActivating(false);
                return;
            }

            // Step 2: Genera codice
            const newCode = generateRandomCode();

            // Step 3: Salva in Firestore
            const couponData = {
                userId: userProfile.id,
                offerId: offer.id,
                offerTitle: offer.title,
                code: newCode,
                status: 'active',
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'GeneratedCoupons'), couponData);

            // Step 4: Mostra codice
            setGeneratedCode(newCode);
        } catch (err) {
            console.error('Error activating offer:', err);
            setError('Errore nell\'attivazione dell\'offerta. Riprova.');
        }

        setActivating(false);
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (!userProfile) {
        return (
            <div className="offer-detail-screen fade-in">
                <div className="login-prompt">
                    <span className="lock-icon">🔒</span>
                    <h2>Accedi per attivare le offerte</h2>
                    <p>Crea un profilo per ricevere codici sconto esclusivi!</p>
                    <button className="btn btn-primary" onClick={() => navigate('/profile')}>
                        Crea Profilo
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="offer-detail-screen fade-in">
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    Caricamento...
                </div>
            </div>
        );
    }

    if (error && !offer) {
        return (
            <div className="offer-detail-screen fade-in">
                <div className="error-message">
                    <p>{error}</p>
                    <button className="btn btn-secondary" onClick={() => navigate('/news')}>
                        Torna alle offerte
                    </button>
                </div>
            </div>
        );
    }

    if (!offer) return null;

    const isValid = new Date() >= new Date(offer.validFrom) && new Date() <= new Date(offer.validTo);

    return (
        <div className="offer-detail-screen fade-in">
            <button className="back-button" onClick={() => navigate('/news')}>
                ← Torna alle offerte
            </button>

            <div className="offer-detail-card">
                {offer.imageUrl && (
                    <img src={offer.imageUrl} alt={offer.title} className="offer-detail-image" />
                )}

                <div className="offer-detail-content">
                    <h1 className="offer-title">{offer.title}</h1>

                    <div className="offer-validity">
                        <span className={`validity-badge ${isValid ? 'valid' : 'expired'}`}>
                            {isValid ? '✓ Offerta Valida' : '✗ Offerta Scaduta'}
                        </span>
                        <p className="validity-dates">
                            Dal {formatDate(offer.validFrom)} al {formatDate(offer.validTo)}
                        </p>
                    </div>

                    <p className="offer-description">{offer.description}</p>

                    {!generatedCode && isValid && (
                        <div className="activation-section">
                            {error && (
                                <div className="alert alert-error">
                                    {error}
                                </div>
                            )}

                            <button
                                className="btn btn-primary btn-large"
                                onClick={handleActivateOffer}
                                disabled={activating}
                            >
                                {activating ? 'Attivazione in corso...' : '🎫 ATTIVA QUESTA OFFERTA'}
                            </button>

                            <p className="help-text">
                                Attiva l'offerta per ricevere il tuo codice sconto personale
                            </p>
                        </div>
                    )}

                    {generatedCode && (
                        <div className="coupon-generated">
                            <div className="coupon-box">
                                <h2>🎉 Offerta Attivata!</h2>
                                <div className="coupon-code">
                                    <span className="code-label">Il tuo codice è:</span>
                                    <span className="code-value">{generatedCode}</span>
                                </div>
                                <p className="coupon-instructions">
                                    📱 <strong>Mostra questo codice in cassa</strong> per ricevere lo sconto
                                </p>
                            </div>
                        </div>
                    )}

                    {!isValid && (
                        <div className="alert alert-warning">
                            Questa offerta non è più valida
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default OfferDetailScreen;
