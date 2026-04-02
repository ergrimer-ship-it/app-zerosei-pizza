import { useState, useEffect } from 'react';
import { getAllPromotions } from '../services/dbService';
import type { NewsPromotion } from '../types';
import './PromotionPopup.css';

function PromotionPopup() {
    const [promotion, setPromotion] = useState<NewsPromotion | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        loadPopupPromotion();
    }, []);

    const loadPopupPromotion = async () => {
        try {
            const promotions = await getAllPromotions();

            // Find active promotions that should show as popup
            const popupPromotions = promotions.filter(p =>
                p.active &&
                p.showAsPopup &&
                isPromotionValid(p)
            );

            if (popupPromotions.length > 0) {
                const promo = popupPromotions[0]; // Show the first one

                // Check if user has already seen this promotion iteration
                let seenMap: Record<string, number> = {};
                try {
                    const parsed = JSON.parse(localStorage.getItem('seenPromotions') || '{}');
                    if (Array.isArray(parsed)) {
                        parsed.forEach(id => { seenMap[id] = 9999999999999; }); // Legacy permanent hide
                    } else {
                        seenMap = parsed;
                    }
                } catch (e) { }

                const promoTime = promo.updatedAt ? new Date(promo.updatedAt).getTime() : 0;
                const lastDismissedTime = seenMap[promo.id] || 0;

                // Show it if it was never dismissed, OR if it was updated AFTER it was dismissed
                if (promoTime > lastDismissedTime) {
                    setPromotion(promo);
                    setIsVisible(true);
                }
            }
        } catch (error) {
            console.error('Error loading popup promotion:', error);
        }
    };

    const isPromotionValid = (promo: NewsPromotion) => {
        const now = new Date();
        return now >= new Date(promo.validFrom) && now <= new Date(promo.validTo);
    };

    const handleClose = (dontShowAgain: boolean = false) => {
        if (dontShowAgain && promotion) {
            try {
                const parsed = JSON.parse(localStorage.getItem('seenPromotions') || '{}');
                let seenMap: Record<string, number> = {};
                if (Array.isArray(parsed)) {
                    parsed.forEach(id => { seenMap[id] = Date.now(); });
                } else {
                    seenMap = parsed;
                }
                const promoTime = promotion.updatedAt ? new Date(promotion.updatedAt).getTime() : 0;
                // Preveniamo clock skew assicurandoci che il tempo di chiusura sia per forza >= dell'aggiornamento
                seenMap[promotion.id] = Math.max(Date.now(), promoTime + 1000);
                localStorage.setItem('seenPromotions', JSON.stringify(seenMap));
            } catch (e) { }
        }
        setIsVisible(false);
    };

    if (!isVisible || !promotion) {
        return null;
    }

    return (
        <div className="promotion-popup-overlay" onClick={() => handleClose(false)}>
            <div className="promotion-popup" onClick={e => e.stopPropagation()}>
                <button className="popup-close" onClick={() => handleClose(false)}>✕</button>

                {promotion.imageUrl && (
                    <div className="popup-image">
                        <img src={promotion.imageUrl} alt={promotion.title} />
                    </div>
                )}

                <div className="popup-content">
                    <h2>{promotion.title}</h2>
                    <p>{promotion.description}</p>

                    <div className="popup-actions">
                        <button
                            className="btn btn-primary"
                            onClick={() => handleClose(false)}
                        >
                            Ho capito!
                        </button>
                        <button
                            className="btn btn-text"
                            onClick={() => handleClose(true)}
                        >
                            Non mostrare più
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PromotionPopup;
