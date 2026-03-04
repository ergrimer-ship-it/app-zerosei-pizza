import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import './CouponStats.css';

interface CouponRecord {
    id: string;
    offerId: string;
    offerTitle: string;
    userId: string;
    code: string;
    status: 'active' | 'redeemed';
    createdAt: any;
    redeemedAt?: any;
}

interface PromoStat {
    offerId: string;
    offerTitle: string;
    totalActivated: number;
    totalRedeemed: number;
    totalPending: number;
    coupons: CouponRecord[];
}

function CouponStats() {
    const [loading, setLoading] = useState(true);
    const [coupons, setCoupons] = useState<CouponRecord[]>([]);
    const [expandedPromo, setExpandedPromo] = useState<string | null>(null);

    useEffect(() => {
        loadCoupons();
    }, []);

    const loadCoupons = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'GeneratedCoupons'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const data: CouponRecord[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as CouponRecord));
            setCoupons(data);
        } catch (error) {
            console.error('Errore caricamento coupon:', error);
        }
        setLoading(false);
    };

    // Raggruppa i coupon per promozione
    const promoStats: PromoStat[] = Object.values(
        coupons.reduce((acc, coupon) => {
            if (!acc[coupon.offerId]) {
                acc[coupon.offerId] = {
                    offerId: coupon.offerId,
                    offerTitle: coupon.offerTitle,
                    totalActivated: 0,
                    totalRedeemed: 0,
                    totalPending: 0,
                    coupons: [],
                };
            }
            acc[coupon.offerId].totalActivated++;
            if (coupon.status === 'redeemed') acc[coupon.offerId].totalRedeemed++;
            else acc[coupon.offerId].totalPending++;
            acc[coupon.offerId].coupons.push(coupon);
            return acc;
        }, {} as Record<string, PromoStat>)
    ).sort((a, b) => b.totalActivated - a.totalActivated);

    const totalActivated = coupons.length;
    const totalRedeemed = coupons.filter(c => c.status === 'redeemed').length;
    const totalPending = coupons.filter(c => c.status === 'active').length;

    const formatDate = (ts: any) => {
        if (!ts) return '—';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
            ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) return <div className="loading">Caricamento dati coupon...</div>;

    return (
        <div className="coupon-stats">
            <div className="cs-header">
                <h2>📊 Monitor Promozioni & Coupon</h2>
                <button className="btn btn-outline" onClick={loadCoupons}>🔄 Aggiorna</button>
            </div>

            {/* Riepilogo globale */}
            <div className="cs-summary-grid">
                <div className="cs-summary-card">
                    <div className="cs-summary-icon">🎫</div>
                    <div>
                        <p className="cs-summary-label">Coupon Attivati</p>
                        <p className="cs-summary-value">{totalActivated}</p>
                    </div>
                </div>
                <div className="cs-summary-card redeemed">
                    <div className="cs-summary-icon">✅</div>
                    <div>
                        <p className="cs-summary-label">Riscattati in Cassa</p>
                        <p className="cs-summary-value">{totalRedeemed}</p>
                    </div>
                </div>
                <div className="cs-summary-card pending">
                    <div className="cs-summary-icon">⏳</div>
                    <div>
                        <p className="cs-summary-label">In Attesa (non ancora usati)</p>
                        <p className="cs-summary-value">{totalPending}</p>
                    </div>
                </div>
            </div>

            {/* Dettaglio per promozione */}
            {promoStats.length === 0 ? (
                <div className="cs-empty">Nessun coupon attivato finora.</div>
            ) : (
                <div className="cs-promo-list">
                    <h3 className="cs-section-title">Dettaglio per Promozione</h3>
                    {promoStats.map(promo => (
                        <div key={promo.offerId} className="cs-promo-card">
                            <div
                                className="cs-promo-header"
                                onClick={() => setExpandedPromo(expandedPromo === promo.offerId ? null : promo.offerId)}
                            >
                                <div className="cs-promo-title">
                                    <span className="cs-promo-name">{promo.offerTitle}</span>
                                    <div className="cs-promo-badges">
                                        <span className="cs-badge total">{promo.totalActivated} attivati</span>
                                        <span className="cs-badge redeemed-badge">{promo.totalRedeemed} riscattati</span>
                                        {promo.totalPending > 0 && (
                                            <span className="cs-badge pending-badge">{promo.totalPending} in attesa</span>
                                        )}
                                    </div>
                                </div>
                                <span className="cs-expand-icon">{expandedPromo === promo.offerId ? '▲' : '▼'}</span>
                            </div>

                            {/* Barra di avanzamento riscatti */}
                            <div className="cs-progress-bar">
                                <div
                                    className="cs-progress-fill"
                                    style={{ width: `${Math.round((promo.totalRedeemed / promo.totalActivated) * 100)}%` }}
                                />
                            </div>
                            <p className="cs-progress-label">
                                {Math.round((promo.totalRedeemed / promo.totalActivated) * 100)}% dei coupon riscattati
                            </p>

                            {/* Elenco coupon espanso */}
                            {expandedPromo === promo.offerId && (
                                <div className="cs-coupon-table-wrapper">
                                    <table className="cs-coupon-table">
                                        <thead>
                                            <tr>
                                                <th>Codice</th>
                                                <th>Stato</th>
                                                <th>Attivato il</th>
                                                <th>Riscattato il</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {promo.coupons.map(c => (
                                                <tr key={c.id}>
                                                    <td><code className="cs-code">{c.code}</code></td>
                                                    <td>
                                                        <span className={`cs-status ${c.status}`}>
                                                            {c.status === 'redeemed' ? '✅ Riscattato' : '⏳ In attesa'}
                                                        </span>
                                                    </td>
                                                    <td className="cs-date">{formatDate(c.createdAt)}</td>
                                                    <td className="cs-date">{c.redeemedAt ? formatDate(c.redeemedAt) : '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CouponStats;
