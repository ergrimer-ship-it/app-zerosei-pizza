import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import HomeScreen from './components/HomeScreen';
import MenuScreen from './components/MenuScreen';
import ProductListScreen from './components/ProductListScreen';
import ProductDetailScreen from './components/ProductDetailScreen';
import CartScreen from './components/CartScreen';
import ProfileScreen from './components/ProfileScreen';
import NewsOffersScreen from './components/NewsOffersScreen';
import ModificationsScreen from './components/ModificationsScreen';
import FidelityCardScreen from './components/FidelityCardScreen';
import AdminDashboard from './components/AdminDashboard';
import { Cart, UserProfile } from './types';
import { loadCart } from './services/cartService';

function App() {
    const [cart, setCart] = useState<Cart>({ items: [], total: 0 });
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    // Carica carrello e profilo utente all'avvio
    useEffect(() => {
        const savedCart = loadCart();
        setCart(savedCart);

        // Carica profilo utente da localStorage
        const savedProfile = localStorage.getItem('user_profile');
        if (savedProfile) {
            setUserProfile(JSON.parse(savedProfile));
        }
    }, []);

    return (
        <Router>
            <Routes>
                {/* Admin Route - No Layout */}
                <Route path="/admin" element={<AdminDashboard />} />

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
                            <Route path="/modifications" element={<ModificationsScreen />} />
                            <Route path="/fidelity" element={<FidelityCardScreen userProfile={userProfile} />} />
                        </Routes>
                    </Layout>
                } />
            </Routes>
        </Router>
    );
}

export default App;
