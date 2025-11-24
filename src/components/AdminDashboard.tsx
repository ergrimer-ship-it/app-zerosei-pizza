import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

function AdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('orders');

    const stats = {
        todayOrders: 12,
        todayRevenue: 345.50,
        pendingOrders: 3,
        totalCustomers: 156
    };

    return (
        <div className="admin-dashboard fade-in">
            <div className="admin-header">
                <h1>Pannello Amministratore</h1>
                <button className="btn btn-outline" onClick={() => navigate('/')}>
                    Torna al Sito
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <span className="stat-label">Ordini Oggi</span>
                    <span className="stat-value">{stats.todayOrders}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Incasso Oggi</span>
                    <span className="stat-value">€{stats.todayRevenue.toFixed(2)}</span>
                </div>
                <div className="stat-card warning">
                    <span className="stat-label">In Attesa</span>
                    <span className="stat-value">{stats.pendingOrders}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Clienti Totali</span>
                    <span className="stat-value">{stats.totalCustomers}</span>
                </div>
            </div>

            <div className="admin-content">
                <div className="admin-sidebar">
                    <button
                        className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        📦 Ordini
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`}
                        onClick={() => setActiveTab('products')}
                    >
                        🍕 Prodotti
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
                        onClick={() => setActiveTab('categories')}
                    >
                        📂 Categorie
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'promotions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('promotions')}
                    >
                        📢 Promozioni
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'customers' ? 'active' : ''}`}
                        onClick={() => setActiveTab('customers')}
                    >
                        👥 Clienti
                    </button>
                </div>

                <div className="admin-panel">
                    {activeTab === 'orders' && (
                        <div className="placeholder-panel">
                            <h2>Gestione Ordini</h2>
                            <p>Qui potrai visualizzare e gestire gli ordini in arrivo.</p>
                            {/* TODO: Implement Order List */}
                        </div>
                    )}

                    {activeTab === 'products' && (
                        <div className="placeholder-panel">
                            <h2>Gestione Prodotti</h2>
                            <p>Qui potrai aggiungere, modificare o eliminare i prodotti.</p>
                            {/* TODO: Implement Product List */}
                        </div>
                    )}

                    {activeTab === 'categories' && (
                        <div className="placeholder-panel">
                            <h2>Gestione Categorie</h2>
                            <p>Qui potrai gestire le categorie del menù.</p>
                        </div>
                    )}

                    {activeTab === 'promotions' && (
                        <div className="placeholder-panel">
                            <h2>Gestione Promozioni</h2>
                            <p>Qui potrai creare nuove offerte e news.</p>
                        </div>
                    )}

                    {activeTab === 'customers' && (
                        <div className="placeholder-panel">
                            <h2>Gestione Clienti</h2>
                            <p>Qui potrai visualizzare la lista dei clienti registrati.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
