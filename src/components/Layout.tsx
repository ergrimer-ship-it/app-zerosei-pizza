import { ReactNode, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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

const tabItems = [
    { path: '/',          label: 'Home',             icon: '🏠' },
    { path: '/menu',      label: 'Menù',             icon: '🍕' },
    { path: '/news',      label: 'Novità e Offerte', icon: '📰' },
    { path: '/fidelity',  label: 'Fidelity Card',    icon: '🎁' },
    { path: '/favorites', label: 'Preferiti',         icon: '❤️' },
];

function Layout({ children, cart, userProfile }: LayoutProps) {
    const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('cachedLogoUrl') || '');
    const [logoSize, setLogoSize] = useState(() => parseInt(localStorage.getItem('cachedLogoSize') || '60'));
    const navigate = useNavigate();
    const location = useLocation();
    const cartItemCount = getCartItemCount(cart);

    useEffect(() => {
        const loadLogo = async () => {
            try {
                const docRef = doc(db, 'config', 'general');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const url = docSnap.data().logoUrl;
                    const size = docSnap.data().logoSize;
                    if (url) { setLogoUrl(url); localStorage.setItem('cachedLogoUrl', url); }
                    if (size) { setLogoSize(size); localStorage.setItem('cachedLogoSize', String(size)); }
                }
            } catch (error) {
                console.error('Error loading logo:', error);
            }
        };
        loadLogo();
    }, []);

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <div className="layout">
            {/* Header */}
            <header className="header">
                <div className="header-content">
                    <div className="header-left">
                        <button
                            className="user-profile-btn"
                            onClick={() => navigate('/profile')}
                            aria-label="Profilo"
                        >
                            <span className="user-icon-mobile">👤</span>
                            <span className="user-name-desktop">
                                {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : '👤 Accedi'}
                            </span>
                        </button>
                    </div>

                    <div className="header-center">
                        <Link to="/" className="logo">
                            {logoUrl && (
                                <img src={logoUrl} alt="ZeroSei Pizza" className="logo-image" style={{ height: `${logoSize}px`, objectFit: 'contain' }} />
                            )}
                        </Link>
                    </div>

                    <div className="header-right">
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
                </div>
            </header>

            {/* Main Content */}
            <main className="main-content">
                {children}
            </main>

            {/* Bottom Tab Bar */}
            <nav className="tab-bar">
                {tabItems.map(item => (
                    <button
                        key={item.path}
                        className={`tab-item ${isActive(item.path) ? 'active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        <span className="tab-icon">{item.icon}</span>
                        <span className="tab-label">{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Promotion Popup */}
            <PromotionPopup />
        </div>
    );
}

export default Layout;
