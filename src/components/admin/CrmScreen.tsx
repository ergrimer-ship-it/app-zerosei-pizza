import { useState, useEffect, useMemo } from 'react';
import { getAllUsersAdmin, getAllOrdersAdmin, adminDeleteUser, adminUpdateUser } from '../../services/dbService';
import { getLoyaltyPoints, linkCustomerProfile } from '../../services/cassaCloudService';
import { UserProfile, Order } from '../../types';
import './CrmScreen.css';

// ─── Tipi ────────────────────────────────────────────────────────────────────

type Segment = 'vip' | 'fedele' | 'nuovo' | 'a-rischio';

interface CustomerStats {
    orderCount: number;
    totalSpent: number;
    lastOrderDate: Date | null;
    orders: Order[];
}

// Ogni 2€ spesi = 1 punto fidelity → spesa stimata reale = punti × 2
const EURO_PER_POINT = 2;
function estimatedSpend(customer: UserProfile): number {
    return (customer.loyaltyPoints || 0) * EURO_PER_POINT;
}

// ─── Segmentazione ───────────────────────────────────────────────────────────
// Basata su spesa reale (punti × 2€) + frequenza app (lastAccess)

function getSegment(customer: UserProfile): Segment {
    const now = Date.now();
    const daysSinceLastAccess = customer.lastAccess
        ? (now - new Date(customer.lastAccess).getTime()) / 86400000
        : 999;
    const daysSinceRegistration = customer.createdAt
        ? (now - new Date(customer.createdAt).getTime()) / 86400000
        : 0;
    const points = customer.loyaltyPoints || 0;
    const spend = points * EURO_PER_POINT;

    // VIP: ≥40 punti → ≥€80 spesi in pizzeria
    if (points >= 40) return 'vip';
    // A Rischio: è stato cliente (ha punti) ma non apre l'app da >60 giorni
    if (daysSinceLastAccess > 60 && points > 0) return 'a-rischio';
    // Fedele: ≥15 punti → ≥€30 spesi
    if (spend >= 30) return 'fedele';
    // Nuovo: registrato da meno di 30 giorni o nessuna spesa registrata
    if (daysSinceRegistration <= 30 || points === 0) return 'nuovo';
    return 'fedele';
}

const SEGMENT_META: Record<Segment, { label: string; emoji: string; color: string }> = {
    vip:        { label: 'VIP',      emoji: '🟢', color: '#2e7d32' },
    fedele:     { label: 'Fedele',   emoji: '🔵', color: '#1565c0' },
    nuovo:      { label: 'Nuovo',    emoji: '🟡', color: '#f57f17' },
    'a-rischio':{ label: 'A Rischio',emoji: '🔴', color: '#c62828' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysSince(date?: Date | null): number {
    if (!date) return 999;
    return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

function formatDate(date?: Date | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('it-IT');
}

function waLink(phone: string, name: string): string {
    const clean = phone.replace(/\D/g, '');
    const text = encodeURIComponent(`Ciao ${name}, ti scriviamo dalla Pizzeria ZeroSei! 🍕`);
    return `https://wa.me/39${clean}?text=${text}`;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function CrmScreen() {
    const [customers, setCustomers] = useState<UserProfile[]>([]);
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSegment, setActiveSegment] = useState<Segment | 'tutti'>('tutti');
    const [selectedCustomer, setSelectedCustomer] = useState<UserProfile | null>(null);
    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [users, orders] = await Promise.all([getAllUsersAdmin(), getAllOrdersAdmin()]);
            users.sort((a, b) => {
                const la = a.lastAccess ? new Date(a.lastAccess).getTime() : 0;
                const lb = b.lastAccess ? new Date(b.lastAccess).getTime() : 0;
                if (la !== lb) return lb - la;
                const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return cb - ca;
            });
            setCustomers(users);
            setAllOrders(orders);
        } catch (err) {
            console.error('CRM load error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Calcola stats per ogni cliente in memoria (nessuna query aggiuntiva)
    const statsMap = useMemo<Map<string, CustomerStats>>(() => {
        const map = new Map<string, CustomerStats>();
        for (const order of allOrders) {
            if (!order.userId) continue;
            const existing = map.get(order.userId) ?? { orderCount: 0, totalSpent: 0, lastOrderDate: null, orders: [] };
            existing.orderCount++;
            existing.totalSpent += order.total || 0;
            existing.orders.push(order);
            if (!existing.lastOrderDate || new Date(order.createdAt) > existing.lastOrderDate) {
                existing.lastOrderDate = new Date(order.createdAt);
            }
            map.set(order.userId, existing);
        }
        return map;
    }, [allOrders]);

    // Segmento di ogni cliente
    const segmentMap = useMemo<Map<string, Segment>>(() => {
        const map = new Map<string, Segment>();
        for (const c of customers) {
            map.set(c.id, getSegment(c));
        }
        return map;
    }, [customers]);

    // KPI
    const kpi = useMemo(() => {
        const now = Date.now();
        const thirtyDays = 30 * 86400000;
        return {
            total: customers.length,
            nuovi: customers.filter(c => c.createdAt && now - new Date(c.createdAt).getTime() < thirtyDays).length,
            vip: customers.filter(c => segmentMap.get(c.id) === 'vip').length,
            aRischio: customers.filter(c => segmentMap.get(c.id) === 'a-rischio').length,
        };
    }, [customers, segmentMap]);

    // Filtro ricerca + segmento
    const filtered = useMemo(() => {
        return customers.filter(c => {
            const seg = segmentMap.get(c.id);
            if (activeSegment !== 'tutti' && seg !== activeSegment) return false;
            if (!searchTerm) return true;
            const q = searchTerm.toLowerCase();
            return (
                c.firstName?.toLowerCase().includes(q) ||
                c.lastName?.toLowerCase().includes(q) ||
                c.email?.toLowerCase().includes(q) ||
                c.phone?.includes(searchTerm)
            );
        });
    }, [customers, segmentMap, activeSegment, searchTerm]);

    // ── Azioni ────────────────────────────────────────────────────────────────

    const handleDelete = async (customer: UserProfile) => {
        if (!window.confirm(`Eliminare definitivamente "${customer.firstName} ${customer.lastName}"?\nIl profilo verrà rimosso dall'app ma resterà in Cassa Cloud.`)) return;
        try {
            if (customer.id) {
                await adminDeleteUser(customer.id);
                setCustomers(prev => prev.filter(c => c.id !== customer.id));
                if (selectedCustomer?.id === customer.id) setSelectedCustomer(null);
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('Errore durante l\'eliminazione.');
        }
    };

    const handleSyncAll = async () => {
        if (!window.confirm('Sincronizzare i punti di TUTTI i clienti con Cassa in Cloud?\n\nPotrebbe richiedere alcuni minuti.')) return;
        setSyncing(true);
        setSyncProgress({ current: 0, total: customers.length });
        let updated = [...customers];
        let successCount = 0;

        for (let i = 0; i < customers.length; i++) {
            const customer = customers[i];
            setSyncProgress({ current: i + 1, total: customers.length });
            try {
                let customerId = customer.cassaCloudId;
                if (!customerId) {
                    customerId = await linkCustomerProfile(customer) || undefined;
                    if (customerId && customer.id) {
                        await adminUpdateUser(customer.id, { cassaCloudId: customerId });
                        customer.cassaCloudId = customerId;
                    }
                }
                if (customerId) {
                    const pointsData = await getLoyaltyPoints(customerId);
                    if (pointsData && pointsData.points !== customer.loyaltyPoints && customer.id) {
                        await adminUpdateUser(customer.id, {
                            loyaltyPoints: pointsData.points,
                            loyaltyPointsLastSync: new Date().toISOString()
                        });
                        updated[i] = { ...customer, loyaltyPoints: pointsData.points, cassaCloudId: customerId };
                    }
                }
                successCount++;
            } catch (err) {
                console.error(`Sync error for ${customer.email}:`, err);
            }
            if (i % 5 === 0) await new Promise(r => setTimeout(r, 50));
        }

        setCustomers(updated);
        setSyncing(false);
        alert(`Sincronizzazione completata! ${successCount} clienti elaborati.`);
    };

    const openDrawer = (customer: UserProfile) => {
        setSelectedCustomer(customer);
    };

    // ── Render ────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="crm-screen">
                <div className="crm-loading">
                    <span>⌛</span>
                    <p>Caricamento CRM...</p>
                </div>
            </div>
        );
    }

    const drawerStats = selectedCustomer ? (statsMap.get(selectedCustomer.id) ?? { orderCount: 0, totalSpent: 0, lastOrderDate: null, orders: [] }) : null;
    const drawerSegment = selectedCustomer ? segmentMap.get(selectedCustomer.id) : null;

    return (
        <div className="crm-screen">
            {/* Header */}
            <div className="crm-header">
                <div className="crm-title-row">
                    <h2>CRM Clienti</h2>
                    <div className="crm-header-actions">
                        <button className="btn-icon" onClick={loadData} disabled={syncing} title="Ricarica">🔄</button>
                        <button className="btn btn-primary btn-sm" onClick={handleSyncAll} disabled={syncing}>
                            {syncing ? `Sync ${syncProgress.current}/${syncProgress.total}...` : '☁️ Sincronizza Punti'}
                        </button>
                    </div>
                </div>

                {/* Barra di progresso sync */}
                {syncing && (
                    <div className="crm-sync-bar">
                        <div
                            className="crm-sync-fill"
                            style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                        />
                    </div>
                )}

                {/* KPI Cards */}
                <div className="crm-kpi-row">
                    <div className="crm-kpi-card">
                        <span className="crm-kpi-value">{kpi.total}</span>
                        <span className="crm-kpi-label">Clienti totali</span>
                    </div>
                    <div className="crm-kpi-card">
                        <span className="crm-kpi-value">{kpi.nuovi}</span>
                        <span className="crm-kpi-label">Nuovi (30gg)</span>
                    </div>
                    <div className="crm-kpi-card crm-kpi-vip">
                        <span className="crm-kpi-value">{kpi.vip}</span>
                        <span className="crm-kpi-label">VIP 🟢</span>
                    </div>
                    <div className="crm-kpi-card crm-kpi-rischio">
                        <span className="crm-kpi-value">{kpi.aRischio}</span>
                        <span className="crm-kpi-label">A Rischio 🔴</span>
                    </div>
                </div>

                {/* Filtri segmento */}
                <div className="crm-segment-tabs">
                    {(['tutti', 'vip', 'fedele', 'nuovo', 'a-rischio'] as const).map(seg => (
                        <button
                            key={seg}
                            className={`crm-seg-tab ${activeSegment === seg ? 'active' : ''}`}
                            onClick={() => setActiveSegment(seg)}
                        >
                            {seg === 'tutti' ? 'Tutti' : `${SEGMENT_META[seg].emoji} ${SEGMENT_META[seg].label}`}
                            <span className="crm-seg-count">
                                {seg === 'tutti'
                                    ? customers.length
                                    : customers.filter(c => segmentMap.get(c.id) === seg).length
                                }
                            </span>
                        </button>
                    ))}
                </div>

                {/* Ricerca */}
                <input
                    className="crm-search"
                    type="text"
                    placeholder="Cerca per nome, email o telefono..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Lista clienti */}
            <div className={`crm-body ${selectedCustomer ? 'drawer-open' : ''}`}>
                <div className="crm-list">
                    {filtered.length === 0 ? (
                        <div className="crm-empty">Nessun cliente trovato.</div>
                    ) : (
                        filtered.map(customer => {
                            const seg = segmentMap.get(customer.id) as Segment;
                            const meta = SEGMENT_META[seg];
                            const isSelected = selectedCustomer?.id === customer.id;

                            return (
                                <div
                                    key={customer.id}
                                    className={`crm-card ${isSelected ? 'selected' : ''}`}
                                    onClick={() => openDrawer(customer)}
                                >
                                    <div className="crm-card-left">
                                        <div className="crm-card-avatar" style={{ background: meta.color }}>
                                            {customer.firstName?.[0]}{customer.lastName?.[0]}
                                        </div>
                                    </div>
                                    <div className="crm-card-center">
                                        <div className="crm-card-name">
                                            {customer.firstName} {customer.lastName}
                                            <span
                                                className="crm-segment-badge"
                                                style={{ background: meta.color }}
                                            >
                                                {meta.emoji} {meta.label}
                                            </span>
                                        </div>
                                        <div className="crm-card-meta">
                                            <span>✉️ {customer.email}</span>
                                            {customer.phone && <span>📞 {customer.phone}</span>}
                                        </div>
                                    </div>
                                    <div className="crm-card-right">
                                        <div className="crm-card-points">
                                            ~€{estimatedSpend(customer).toFixed(0)}
                                        </div>
                                        <div className="crm-card-orders">
                                            💎 {customer.loyaltyPoints || 0} pt
                                        </div>
                                        <div className="crm-card-access">
                                            {daysSince(customer.lastAccess) < 999
                                                ? `${daysSince(customer.lastAccess)}gg fa`
                                                : 'Mai'}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Drawer dettaglio cliente */}
                {selectedCustomer && drawerStats && drawerSegment && (
                    <div className="crm-drawer">
                        <div className="crm-drawer-header">
                            <div
                                className="crm-drawer-avatar"
                                style={{ background: SEGMENT_META[drawerSegment].color }}
                            >
                                {selectedCustomer.firstName?.[0]}{selectedCustomer.lastName?.[0]}
                            </div>
                            <div className="crm-drawer-title">
                                <h3>{selectedCustomer.firstName} {selectedCustomer.lastName}</h3>
                                <span
                                    className="crm-segment-badge"
                                    style={{ background: SEGMENT_META[drawerSegment].color }}
                                >
                                    {SEGMENT_META[drawerSegment].emoji} {SEGMENT_META[drawerSegment].label}
                                </span>
                            </div>
                            <button className="crm-drawer-close" onClick={() => setSelectedCustomer(null)}>✕</button>
                        </div>

                        {/* Info contatti */}
                        <div className="crm-drawer-section">
                            <h4>Contatti</h4>
                            <div className="crm-info-row"><span>✉️</span><span>{selectedCustomer.email}</span></div>
                            <div className="crm-info-row"><span>📞</span><span>{selectedCustomer.phone || '—'}</span></div>
                        </div>

                        {/* Statistiche */}
                        <div className="crm-drawer-section">
                            <h4>Attività</h4>
                            <div className="crm-stats-grid">
                                <div className="crm-stat-item">
                                    <span className="crm-stat-val">~€{estimatedSpend(selectedCustomer).toFixed(0)}</span>
                                    <span className="crm-stat-lbl">Spesa stimata</span>
                                </div>
                                <div className="crm-stat-item">
                                    <span className="crm-stat-val">💎 {selectedCustomer.loyaltyPoints || 0}</span>
                                    <span className="crm-stat-lbl">Punti fidelity</span>
                                </div>
                                <div className="crm-stat-item">
                                    <span className="crm-stat-val">{drawerStats.orderCount}</span>
                                    <span className="crm-stat-lbl">Ordini via app</span>
                                </div>
                                <div className="crm-stat-item">
                                    <span className="crm-stat-val">{formatDate(selectedCustomer.lastAccess)}</span>
                                    <span className="crm-stat-lbl">Ultimo accesso</span>
                                </div>
                            </div>
                            <div className="crm-info-row small">
                                <span>📅 Registrato il</span>
                                <span>{formatDate(selectedCustomer.createdAt)}</span>
                            </div>
                            {selectedCustomer.loyaltyPointsLastSync && (
                                <div className="crm-info-row small">
                                    <span>☁️ Sync punti</span>
                                    <span>{formatDate(new Date(selectedCustomer.loyaltyPointsLastSync))}</span>
                                </div>
                            )}
                            <div className="crm-info-row small">
                                <span>🔗 CassaCloud</span>
                                <span>{selectedCustomer.cassaCloudId ? '✅ Collegato' : '⚠️ Non collegato'}</span>
                            </div>
                        </div>

                        {/* Storico ordini */}
                        {drawerStats.orders.length > 0 && (
                            <div className="crm-drawer-section">
                                <h4>Storico Ordini (app)</h4>
                                <div className="crm-orders-list">
                                    {[...drawerStats.orders]
                                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                        .slice(0, 10)
                                        .map(order => (
                                            <div key={order.id} className="crm-order-item">
                                                <div className="crm-order-date">{formatDate(order.createdAt)}</div>
                                                <div className="crm-order-items">
                                                    {order.items.map(i => `${i.productName} x${i.quantity}`).join(', ')}
                                                </div>
                                                <div className="crm-order-total">€{order.total.toFixed(2)}</div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        )}

                        {/* Azioni */}
                        <div className="crm-drawer-actions">
                            {selectedCustomer.phone && (
                                <a
                                    className="btn btn-whatsapp crm-action-btn"
                                    href={waLink(selectedCustomer.phone, selectedCustomer.firstName)}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    💬 Scrivi su WhatsApp
                                </a>
                            )}
                            <button
                                className="btn btn-danger crm-action-btn"
                                onClick={() => handleDelete(selectedCustomer)}
                            >
                                🗑️ Elimina Cliente
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
