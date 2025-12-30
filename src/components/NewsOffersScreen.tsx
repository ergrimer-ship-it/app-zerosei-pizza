import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPromotions } from '../services/dbService';
import type { NewsPromotion } from '../types';
import './NewsOffersScreen.css';

function NewsOffersScreen() {
    const navigate = useNavigate();
    const [promotions, setPromotions] = useState<NewsPromotion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPromotions();
    }, []);

    const loadPromotions = async () => {
        try {
            const data = await getAllPromotions();
            // Filter only active promotions
            const activePromotions = data.filter(p => p.active);
            setPromotions(activePromotions);
        } catch (error) {
            console.error('Error loading promotions:', error);
        }
        setLoading(false);
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
                    {promotions.map(promotion => (
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
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default NewsOffersScreen;

