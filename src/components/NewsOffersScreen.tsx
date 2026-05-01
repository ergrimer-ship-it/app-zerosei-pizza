import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getAllPromotions } from '../services/dbService';
import type { NewsPromotion, UserProfile } from '../types';
import './NewsOffersScreen.css';

interface CouponStatus {
    status: 'active' | 'redeemed' | 'expired';
    code?: string;
}

// Utente "nuovo" = registrato da meno di 30 giorni
const isNewUser = (profile: { createdAt?: Date | string } | null): boolean => {
    if (!profile?.createdAt) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(profile.createdAt) >= thirtyDaysAgo;
};

interface NewsOffersScreenProps {
    userProfile: UserProfile | null;
}

function NewsOffersScreen({ userProfile }: NewsOffersScreenProps) {
    const navigate = useNavigate();
    const [promotions, setPromotions] = useState<NewsPromotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [couponStatusMap, setCouponStatusMap] = useState<Record<string, CouponStatus>>({});

    useEffect(() => {
        loadPromotions();
    }, []);

    const loadPromotions = async () => {
        try {
            const data = await getAllPromotions();
            const allActive = data.filter(p => p.active && isPromotionValid(p));

            // Carica stato coupon utente (solo se loggato)
            let statusMap: Record<string, CouponStatus> = {};

            if (userProfile) {
                if (userProfile.id && !userProfile.id.startsWith('temp_')) {
                    statusMap = await fetchUserCoupons(userProfile.id, allActive);
                    setCouponStatusMap(statusMap);
                }
            }

            // Filtra offerte newUsersOnly:
            // - Nascondi se l'utente non è nuovo
            // - Nascondi se il coupon è già stato riscattato
            const visiblePromotions = allActive.filter(p => {
                if (!p.newUsersOnly) return true; // offerta normale, sempre visibile
                if (!isNewUser(userProfile)) return false; // utente non nuovo
                const coupon = statusMap[p.id];
                if (coupon?.status === 'redeemed') return false; // già riscattata
                return true;
            });

            setPromotions(visiblePromotions);
        } catch (error) {
            console.error('Error loading promotions:', error);
        }
        setLoading(false);
    };

    // Funzione che ritorna la mappa senza effetti collaterali (usata in loadPromotions)
    const fetchUserCoupons = async (userId: string, promotionsList: NewsPromotion[]): Promise<Record<string, CouponStatus>> => {
        try {
            const promotionIds = promotionsList
                .filter(p => p.type !== 'news')
                .map(p => p.id);

            if (promotionIds.length === 0) return {};

            const couponsRef = collection(db, 'GeneratedCoupons');
            const q = query(couponsRef, where('userId', '==', userId));
            const querySnapshot = await getDocs(q);

            const statusMap: Record<string, CouponStatus> = {};
            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (promotionIds.includes(data.offerId)) {
                    // Calcola scadenza di 1 ora
                    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                    const isExpired = Date.now() > createdAt.getTime() + 3600 * 1000;
                    
                    let computedStatus = data.status;
                    if (data.status === 'active' && isExpired) {
                        computedStatus = 'expired';
                    }

                    statusMap[data.offerId] = { status: computedStatus, code: data.code };
                }
            });
            return statusMap;
        } catch (error) {
            console.error('Error loading user coupons:', error);
            return {};
        }
    };

    // Compatibilità: wrapper che aggiorna lo state
    const loadUserCoupons = async (userId: string, promotionsList: NewsPromotion[]) => {
        const statusMap = await fetchUserCoupons(userId, promotionsList);
        setCouponStatusMap(statusMap);
    };
    void loadUserCoupons; // usato implicitamente tramite fetchUserCoupons

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const isPromotionValid = (promotion: NewsPromotion) => {
        const now = new Date();
        return now >= new Date(promotion.validFrom) && now <= new Date(promotion.validTo);
    };

    if (loading) {
        return (
            <div className="news-screen fade-in">
                <h1 className="screen-title">Novità e Offerte</h1>
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    Caricamento offerte...
                </div>
            </div>
        );
    }

    return (
        <div className="news-screen fade-in">
            <h1 className="screen-title">Novità e Offerte</h1>

            {promotions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <p>Nessuna offerta disponibile al momento.</p>
                    <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>
                        Torna presto per scoprire le nostre promozioni!
                    </p>
                </div>
            ) : (
                <div className="news-grid">
                    {promotions.map(promotion => {
                        const coupon = couponStatusMap[promotion.id];
                        return (
                            <div
                                key={promotion.id}
                                className="news-card clickable"
                                onClick={() => navigate(`/offer/${promotion.id}`)}
                            >
                                {promotion.imageUrl ? (
                                    <img
                                        src={promotion.imageUrl}
                                        alt={promotion.title}
                                        className="news-image"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="news-icon">
                                        {promotion.type === 'news' ? '📰' : '🎉'}
                                    </div>
                                )}
                                <div className="news-content">
                                    <span className="news-date">
                                        {formatDate(promotion.validFrom)} - {formatDate(promotion.validTo)}
                                    </span>
                                    {!isPromotionValid(promotion) && (
                                        <span className="news-badge expired">Scaduta</span>
                                    )}
                                    {promotion.type === 'news' && (
                                        <span className="news-badge info" style={{ backgroundColor: '#2196F3', color: 'white' }}>Novità</span>
                                    )}
                                    <h3>{promotion.title}</h3>
                                    <p>{promotion.description}</p>

                                    {/* Badge stato coupon - solo per promozioni */}
                                    {promotion.type !== 'news' && coupon && (
                                        <div className={`coupon-status-badge ${
                                            coupon.status === 'active' ? 'coupon-status-active' : 
                                            coupon.status === 'expired' ? 'coupon-status-expired' : 'coupon-status-redeemed'
                                        }`}>
                                            {coupon.status === 'active' ? (
                                                <>
                                                    <span className="coupon-status-icon">🎫</span>
                                                    <span>Attivata – Codice: <strong>{coupon.code}</strong></span>
                                                </>
                                            ) : coupon.status === 'expired' ? (
                                                <>
                                                    <span className="coupon-status-icon">⏰</span>
                                                    <span>Coupon Scaduto</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="coupon-status-icon">✓</span>
                                                    <span>Già utilizzata</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default NewsOffersScreen;
