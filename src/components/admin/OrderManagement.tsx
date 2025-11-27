import { useState, useEffect } from 'react';
import { getAllOrders, updateOrderStatus } from '../../services/dbService';
import { Order, OrderStatus } from '../../types';
import './OrderManagement.css';

function OrderManagement() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
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

    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
        try {
            await updateOrderStatus(orderId, newStatus);
            // Update local state
            setOrders(orders.map(o =>
                o.id === orderId ? { ...o, status: newStatus } : o
            ));
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Errore nell\'aggiornamento dello stato');
        }
    };

    const getStatusLabel = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return 'In Attesa';
            case 'confirmed': return 'Confermato';
            case 'preparing': return 'In Preparazione';
            case 'ready': return 'Pronto';
            case 'delivered': return 'Consegnato';
            case 'cancelled': return 'Annullato';
            default: return status;
        }
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return '#ff9800'; // Orange
            case 'confirmed': return '#2196f3'; // Blue
            case 'preparing': return '#9c27b0'; // Purple
            case 'ready': return '#009688'; // Teal
            case 'delivered': return '#4caf50'; // Green
            case 'cancelled': return '#f44336'; // Red
            default: return '#9e9e9e';
        }
    };

    const getSourceIcon = (source?: string) => {
        switch (source) {
            case 'whatsapp': return '💬';
            case 'phone': return '📞';
            case 'web': return '🌐';
            default: return '❓';
        }
    };

    const filteredOrders = filter === 'all'
        ? orders
        : orders.filter(o => o.status === filter);

    // Statistics
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
        revenueToday: todayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
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
                        <h3>Telefono</h3>
                        <p className="stat-value">{stats.phoneToday}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">💶</div>
                    <div className="stat-info">
                        <h3>Incasso Oggi</h3>
                        <p className="stat-value">€{stats.revenueToday.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="om-content">
                <div className="orders-list-container">
                    <div className="filters">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as OrderStatus | 'all')}
                            className="status-filter"
                        >
                            <option value="all">Tutti gli stati</option>
                            <option value="pending">In Attesa</option>
                            <option value="confirmed">Confermati</option>
                            <option value="preparing">In Preparazione</option>
                            <option value="ready">Pronti</option>
                            <option value="delivered">Consegnati</option>
                            <option value="cancelled">Annullati</option>
                        </select>
                    </div>

                    <div className="orders-list">
                        {filteredOrders.length === 0 ? (
                            <div className="empty-state">Nessun ordine trovato</div>
                        ) : (
                            filteredOrders.map(order => (
                                <div
                                    key={order.id}
                                    className={`order-card ${selectedOrder?.id === order.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedOrder(order)}
                                >
                                    <div className="order-card-header">
                                        <span className="order-source" title={order.source}>
                                            {getSourceIcon(order.source)}
                                        </span>
                                        <span className="order-date">
                                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span
                                            className="order-status-badge"
                                            style={{ backgroundColor: getStatusColor(order.status) }}
                                        >
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </div>
                                    <div className="order-card-body">
                                        <h4>{order.userProfile.firstName} {order.userProfile.lastName}</h4>
                                        <p className="order-total">€{order.total.toFixed(2)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {selectedOrder ? (
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

                            <div className="od-actions">
                                <h4>Aggiorna Stato</h4>
                                <div className="status-buttons">
                                    <button
                                        className={`btn-status ${selectedOrder.status === 'confirmed' ? 'active' : ''}`}
                                        onClick={() => handleStatusChange(selectedOrder.id, 'confirmed')}
                                        style={{ borderColor: '#2196f3', color: '#2196f3' }}
                                    >
                                        Conferma
                                    </button>
                                    <button
                                        className={`btn-status ${selectedOrder.status === 'preparing' ? 'active' : ''}`}
                                        onClick={() => handleStatusChange(selectedOrder.id, 'preparing')}
                                        style={{ borderColor: '#9c27b0', color: '#9c27b0' }}
                                    >
                                        In Prep.
                                    </button>
                                    <button
                                        className={`btn-status ${selectedOrder.status === 'ready' ? 'active' : ''}`}
                                        onClick={() => handleStatusChange(selectedOrder.id, 'ready')}
                                        style={{ borderColor: '#009688', color: '#009688' }}
                                    >
                                        Pronto
                                    </button>
                                    <button
                                        className={`btn-status ${selectedOrder.status === 'delivered' ? 'active' : ''}`}
                                        onClick={() => handleStatusChange(selectedOrder.id, 'delivered')}
                                        style={{ borderColor: '#4caf50', color: '#4caf50' }}
                                    >
                                        Consegnato
                                    </button>
                                    <button
                                        className={`btn-status ${selectedOrder.status === 'cancelled' ? 'active' : ''}`}
                                        onClick={() => handleStatusChange(selectedOrder.id, 'cancelled')}
                                        style={{ borderColor: '#f44336', color: '#f44336' }}
                                    >
                                        Annulla
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="order-details-placeholder">
                        <p>Seleziona un ordine per visualizzare i dettagli</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default OrderManagement;
