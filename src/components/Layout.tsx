import { ReactNode, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cart, UserProfile } from '../types';
import { getCartItemCount } from '../services/cartService';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import PromotionPopup from './PromotionPopup';
import './Layout.css';

interface LayoutProps {
    children: ReactNode;
    cart: Cart;
    userProfile: UserProfile | null;
}

function Layout({ children, cart }: LayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [logoUrl, setLogoUrl] = useState('');
    const navigate = useNavigate();
    const cartItemCount = getCartItemCount(cart);

    useEffect(() => {
        const loadLogo = async () => {
            try {
                const docRef = doc(db, 'config', 'general');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().logoUrl) {
                    setLogoUrl(docSnap.data().logoUrl);
                }
            } catch (error) {
                console.error('Error loading logo:', error);
            }
        };
        loadLogo();
    }, []);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const closeSidebar = () => setSidebarOpen(false);

    const menuItems = [
        { path: '/', label: 'Home', icon: '🏠' },
        { path: '/menu', label: 'Menù', icon: '🍕' },
        { path: '/news', label: 'Novità e Offerte', icon: '📰' },
        { path: '/fidelity', label: 'Fidelity Card', icon: '🎁' },
        { path: '/profile', label: 'Profilo', icon: '👤' },
    ];

    return (
        <div className="layout">
            {/* Header */}
            <header className="header">
                <div className="header-content">
                    <button className="menu-btn" onClick={toggleSidebar} aria-label="Menu">
                        <span className="menu-icon">☰</span>
                    </button>

                    <Link to="/" className="logo">
                        {logoUrl ? (
                            <img src={logoUrl} alt="ZeroSei Pizza" className="logo-image" style={{ height: '40px', objectFit: 'contain' }} />
                        ) : (
                            <>
                                <span className="logo-text">ZeroSei</span>
                                <span className="logo-emoji">🍕</span>
                            </>
                        )}
                    </Link>

                    <button
                        className="cart-btn"
                        onClick={() => navigate('/cart')}
                        aria-label="Carrello"
                    >
                        <span className="cart-icon">🛒</span>
                        {cartItemCount > 0 && (
                            <span className="cart-badge">{cartItemCount}</span>
                        )}
                    </button>
                </div>
            </header>

            {/* Sidebar */}
            <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={closeSidebar} />
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2>Menu</h2>
                    <button className="close-btn" onClick={closeSidebar}>✕</button>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="sidebar-link"
                            onClick={closeSidebar}
                        >
                            <span className="sidebar-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="social-links">
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link">
                            📷 Instagram
                        </a>
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link">
                            📘 Facebook
                        </a>
                        <a href="https://zerosei.it" target="_blank" rel="noopener noreferrer" className="social-link">
                            🌐 Sito Web
                        </a>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {children}
            </main>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-content">
                    <p>&copy; 2025 ZeroSei Pizza. Tutti i diritti riservati.</p>
                </div>
            </footer>

            {/* Promotion Popup */}
            <PromotionPopup />
        </div>
    );
}

export default Layout;
