import { useState, useEffect } from 'react';
import { getAllOrders } from '../../services/dbService';
import { Order } from '../../types';
import './OrderManagement.css';

function OrderManagement() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const data = await getAllOrders();
            setOrders(data);
        } catch (error) {
            console.error('Error loading orders:', error);
            alert('Errore nel caricamento degli ordini');
        }
        setLoading(false);
    };

    const getSourceIcon = (source?: string) => {
        switch (source) {
            case 'whatsapp': return '💬';
            case 'phone': return '📞';
            case 'web': return '🌐';
            default: return '❓';
        }
    };

    const getSourceLabel = (source?: string) => {
        switch (source) {
            case 'whatsapp': return 'WhatsApp';
            case 'phone': return 'Chiamata';
            case 'web': return 'Web';
            default: return 'Sconosciuto';
        }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
    });

    const stats = {
        totalToday: todayOrders.length,
        whatsappToday: todayOrders.filter(o => o.source === 'whatsapp').length,
        phoneToday: todayOrders.filter(o => o.source === 'phone').length,
    };

    if (loading) {
        return <div className="loading">Caricamento ordini...</div>;
    }

    return (
        <div className="order-management">
            <div className="om-header">
                <h2>Gestione Ordini</h2>
                <button className="btn btn-outline" onClick={loadOrders}>
                    🔄 Aggiorna
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-info">
                        <h3>Ordini Oggi</h3>
                        <p className="stat-value">{stats.totalToday}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">💬</div>
                    <div className="stat-info">
                        <h3>WhatsApp</h3>
                        <p className="stat-value">{stats.whatsappToday}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📞</div>
                    <div className="stat-info">
                        <h3>Chiamate</h3>
                        <p className="stat-value">{stats.phoneToday}</p>
                    </div>
                </div>
            </div>

            <div className="om-content">
                <div className="orders-list-container">
                    <div className="orders-list">
                        {orders.length === 0 ? (
                            <div className="empty-state">Nessun ordine trovato</div>
                        ) : (
                            orders.map(order => (
                                <div
                                    key={order.id}
                                    className={`order-card ${selectedOrder?.id === order.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                                >
                                    <div className="order-card-header">
                                        <span className="order-source-badge" title={getSourceLabel(order.source)}>
                                            {getSourceIcon(order.source)} {getSourceLabel(order.source)}
                                        </span>
                                        <span className="order-date">
                                            {new Date(order.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                                            {' '}
                                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="order-card-body">
                                        <h4>{order.userProfile.firstName} {order.userProfile.lastName}</h4>
                                        <p className="order-phone">{order.userProfile.phone}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {selectedOrder && (
                    <div className="order-details-panel">
                        <div className="od-header">
                            <h3>Dettaglio Ordine</h3>
                            <button className="close-details" onClick={() => setSelectedOrder(null)}>✕</button>
                        </div>

                        <div className="od-content">
                            <div className="od-section">
                                <h4>Cliente</h4>
                                <p><strong>Nome:</strong> {selectedOrder.userProfile.firstName} {selectedOrder.userProfile.lastName}</p>
                                <p><strong>Telefono:</strong> {selectedOrder.userProfile.phone}</p>
                                <p>
                                    <strong>Canale:</strong>{' '}
                                    {getSourceIcon(selectedOrder.source)} {getSourceLabel(selectedOrder.source)}
                                </p>
                                {selectedOrder.deliveryAddress && (
                                    <p><strong>Indirizzo:</strong> {selectedOrder.deliveryAddress}</p>
                                )}
                            </div>

                            <div className="od-section">
                                <h4>Prodotti</h4>
                                <ul className="od-items">
                                    {selectedOrder.items.map((item, idx) => (
                                        <li key={idx}>
                                            <div className="od-item-main">
                                                <span>{item.quantity}x {item.productName}</span>
                                                <span>€{(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                            {item.modifications && item.modifications.length > 0 && (
                                                <div className="od-item-mods">
                                                    {item.modifications.map(m => `+ ${m.name}`).join(', ')}
                                                </div>
                                            )}
                                            {item.notes && <div className="od-item-notes">📝 {item.notes}</div>}
                                        </li>
                                    ))}
                                </ul>
                                <div className="od-total">
                                    <span>Totale</span>
                                    <span>€{selectedOrder.total.toFixed(2)}</span>
                                </div>
                            </div>

                            {selectedOrder.notes && (
                                <div className="od-section">
                                    <h4>Note Ordine</h4>
                                    <p>{selectedOrder.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default OrderManagement;
