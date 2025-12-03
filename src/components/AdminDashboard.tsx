import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductManagement from './admin/ProductManagement';
import CategoryManagement from './admin/CategoryManagement';
import PromotionManagement from './admin/PromotionManagement';
import OrderManagement from './admin/OrderManagement';
import Settings from './admin/Settings';
import ModificationManagement from './admin/ModificationManagement';
import CustomerManagement from './admin/CustomerManagement';
import { useTheme } from '../hooks/useTheme';
import './AdminDashboard.css';

interface AdminDashboardProps {
    onLogout: () => void;
}

function AdminDashboard({ onLogout }: AdminDashboardProps) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('orders');
    const { theme } = useTheme();

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
            case 'modifications':
                return <ModificationManagement />;
            case 'categories':
                return <CategoryManagement />;
            case 'promotions':
                return <PromotionManagement />;
            case 'settings':
                return <Settings />;
            case 'customers':
                return <CustomerManagement />;
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
                        {theme?.iconOrders || '📦'} Ordini
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
                        onClick={() => setActiveTab('products')}
                    >
                        {theme?.iconProducts || '🍕'} Prodotti
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'modifications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('modifications')}
                    >
                        {theme?.iconIngredients || '🧀'} Ingredienti
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'categories' ? 'active' : ''}`}
                        onClick={() => setActiveTab('categories')}
                    >
                        {theme?.iconCategories || '📂'} Categorie
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'promotions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('promotions')}
                    >
                        {theme?.iconPromotions || '📢'} Promozioni
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}
                        onClick={() => setActiveTab('customers')}
                    >
                        {theme?.iconCustomers || '👥'} Clienti
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        {theme?.iconSettings || '⚙️'} Impostazioni
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
