import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductManagement from './admin/ProductManagement';
import CategoryManagement from './admin/CategoryManagement';
import PromotionManagement from './admin/PromotionManagement';
import OrderManagement from './admin/OrderManagement';
import CassaCloudSettings from './admin/CassaCloudSettings';
import './AdminDashboard.css';

interface AdminDashboardProps {
    onLogout: () => void;
}

function AdminDashboard({ onLogout }: AdminDashboardProps) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('orders');

    const handleLogout = () => {
        onLogout();
        navigate('/admin/login');
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'orders':
                return <OrderManagement />;
            case 'products':
                return <ProductManagement />;
            case 'categories':
                return <CategoryManagement />;
            case 'promotions':
                return <PromotionManagement />;
            case 'settings':
                return <CassaCloudSettings />;
            case 'customers':
                return <div className="placeholder-content">Gestione Clienti (In arrivo)</div>;
            default:
                return <OrderManagement />;
        }
    };

    return (
        <div className="admin-dashboard">
            <div className="admin-sidebar">
                <div className="admin-logo">
                    <h2>ZeroSei Admin</h2>
                </div>
                <nav className="admin-nav">
                    <button
                        className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        📦 Ordini
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
                        onClick={() => setActiveTab('products')}
                    >
                        🍕 Prodotti
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'categories' ? 'active' : ''}`}
                        onClick={() => setActiveTab('categories')}
                    >
                        📂 Categorie
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'promotions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('promotions')}
                    >
                        📢 Promozioni
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}
                        onClick={() => setActiveTab('customers')}
                    >
                        👥 Clienti
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        ⚙️ Impostazioni
                    </button>
                </nav>
                <div className="admin-footer">
                    <button className="btn-logout" onClick={handleLogout}>
                        ← Logout
                    </button>
                </div>
            </div>
            <div className="admin-content">
                {renderContent()}
            </div>
        </div>
    );
}

export default AdminDashboard;
