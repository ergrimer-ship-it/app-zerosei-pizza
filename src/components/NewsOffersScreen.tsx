import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getAllPromotions } from '../services/dbService';
import type { NewsPromotion } from '../types';
import './NewsOffersScreen.css';

interface CouponStatus {
    status: 'active' | 'redeemed';
    code?: string;
}

function NewsOffersScreen() {
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
            const activePromotions = data.filter(p => p.active && isPromotionValid(p));
            setPromotions(activePromotions);

            // Carica stato coupon utente (solo se loggato)
            const savedProfile = localStorage.getItem('user_profile');
            if (savedProfile) {
                const profile = JSON.parse(savedProfile);
                if (profile.id && !profile.id.startsWith('temp_')) {
                    await loadUserCoupons(profile.id, activePromotions);
                }
            }
        } catch (error) {
            console.error('Error loading promotions:', error);
        }
        setLoading(false);
    };

    const loadUserCoupons = async (userId: string, promotionsList: NewsPromotion[]) => {
        try {
            const promotionIds = promotionsList
                .filter(p => p.type !== 'news')
                .map(p => p.id);

            if (promotionIds.length === 0) return;

            const couponsRef = collection(db, 'GeneratedCoupons');
            const q = query(couponsRef, where('userId', '==', userId));
            const querySnapshot = await getDocs(q);

            const statusMap: Record<string, CouponStatus> = {};
            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (promotionIds.includes(data.offerId)) {
                    statusMap[data.offerId] = {
                        status: data.status,
                        code: data.code,
                    };
                }
            });
            setCouponStatusMap(statusMap);
        } catch (error) {
            console.error('Error loading user coupons:', error);
        }
    };

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
                                        <div className={`coupon-status-badge ${coupon.status === 'active' ? 'coupon-status-active' : 'coupon-status-redeemed'}`}>
                                            {coupon.status === 'active' ? (
                                                <>
                                                    <span className="coupon-status-icon">🎫</span>
                                                    <span>Attivata – Codice: <strong>{coupon.code}</strong></span>
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
