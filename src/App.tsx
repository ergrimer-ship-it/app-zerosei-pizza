import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import HomeScreen from './components/HomeScreen';
import MenuScreen from './components/MenuScreen';
import ProductListScreen from './components/ProductListScreen';
import ProductDetailScreen from './components/ProductDetailScreen';
import CartScreen from './components/CartScreen';
import ProfileScreen from './components/ProfileScreen';
import NewsOffersScreen from './components/NewsOffersScreen';
import OfferDetailScreen from './components/OfferDetailScreen';
import FidelityCardScreen from './components/FidelityCardScreen';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { Cart, UserProfile } from './types';
import { loadCart } from './services/cartService';
import { updateUserProfile } from './services/dbService';
import { useTheme } from './hooks/useTheme';
import DebugProducts from './components/DebugProducts';

function App() {
    const [cart, setCart] = useState<Cart>({ items: [], total: 0 });
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

    // Carica tema personalizzato
    useTheme();

    // Carica carrello, profilo utente e stato admin all'avvio
    useEffect(() => {
        console.log('App Version: v1.1.0 - Batch Updates (Disclaimers & Gamification)');
        const savedCart = loadCart();
        setCart(savedCart);

        // Carica profilo utente da localStorage
        const savedProfile = localStorage.getItem('user_profile');
        if (savedProfile) {
            const profile = JSON.parse(savedProfile);
            setUserProfile(profile);

            // Aggiorna ultimo accesso su Firestore (se c'è un ID valido)
            if (profile.id && !profile.id.startsWith('temp_')) {
                updateUserProfile(profile.id, { lastAccess: new Date() })
                    .catch(err => console.error("Error updating last access:", err));
            }
        }

        // Verifica autenticazione admin
        const adminAuth = localStorage.getItem('admin_authenticated');
        setIsAdminAuthenticated(adminAuth === 'true');
    }, []);

    const handleAdminLogin = () => {
        setIsAdminAuthenticated(true);
    };

    const handleAdminLogout = () => {
        localStorage.removeItem('admin_authenticated');
        setIsAdminAuthenticated(false);
    };

    return (
        <Router>
            <Routes>
                {/* Admin Routes */}
                <Route
                    path="/admin/login"
                    element={
                        isAdminAuthenticated ?
                            <Navigate to="/admin/dashboard" replace /> :
                            <AdminLogin onLogin={handleAdminLogin} />
                    }
                />
                <Route
                    path="/admin/*"
                    element={
                        isAdminAuthenticated ?
                            <AdminDashboard onLogout={handleAdminLogout} /> :
                            <Navigate to="/admin/login" replace />
                    }
                />

                {/* Public Routes - With Layout */}
                <Route path="*" element={
                    <Layout cart={cart} userProfile={userProfile}>
                        <Routes>
                            <Route path="/" element={<HomeScreen />} />
                            <Route path="/menu" element={<MenuScreen />} />
                            <Route path="/menu/:category" element={<ProductListScreen cart={cart} setCart={setCart} />} />
                            <Route path="/product/:id" element={<ProductDetailScreen cart={cart} setCart={setCart} />} />
                            <Route path="/cart" element={<CartScreen cart={cart} setCart={setCart} userProfile={userProfile} />} />
                            <Route path="/profile" element={<ProfileScreen userProfile={userProfile} setUserProfile={setUserProfile} />} />
                            <Route path="/news" element={<NewsOffersScreen />} />
                            <Route path="/offer/:id" element={<OfferDetailScreen userProfile={userProfile} />} />
                            <Route path="/fidelity" element={<FidelityCardScreen userProfile={userProfile} />} />
                            <Route path="/debug" element={<DebugProducts />} />
                        </Routes>
                    </Layout>
                } />
            </Routes>
        </Router>
    );
}

export default App;
