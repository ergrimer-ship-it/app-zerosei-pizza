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
import FavoritesScreen from './components/FavoritesScreen';
import OfferDetailScreen from './components/OfferDetailScreen';
import FidelityCardScreen from './components/FidelityCardScreen';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { Cart, UserProfile } from './types';
import { loadCart } from './services/cartService';
import { getUserProfile, updateUserProfile, createUserProfileWithUid } from './services/dbService';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useTheme } from './hooks/useTheme';
import DebugProducts from './components/DebugProducts';
import UpdatePrompt from './components/UpdatePrompt';

function App() {
    const [cart, setCart] = useState<Cart>({ items: [], total: 0 });
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

    // Carica tema personalizzato
    useTheme();

    useEffect(() => {
        console.log('App Version: v1.3.0 - Firebase Auth');
        const savedCart = loadCart();
        setCart(savedCart);

        // Verifica autenticazione admin
        const adminAuth = localStorage.getItem('admin_authenticated');
        setIsAdminAuthenticated(adminAuth === 'true');

        // Ascolta lo stato di autenticazione Firebase
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const profile = await getUserProfile(firebaseUser.uid);
                    if (profile) {
                        setUserProfile(profile);
                        // Aggiorna silenziosamente l'ultimo accesso
                        updateUserProfile(firebaseUser.uid, { lastAccess: new Date() }).catch(e => console.error('Errore sync ultimo accesso:', e));
                    } else {
                        console.warn('Utente trovato in Autenticazione ma non nel Database. Ricreo il profilo automaticamente...');
                        const newProfile = {
                            firstName: 'Utente',
                            lastName: 'Recuperato',
                            email: firebaseUser.email || '',
                            phone: '',
                            loyaltyPoints: 0,
                            lastAccess: new Date()
                        };
                        try {
                            await createUserProfileWithUid(firebaseUser.uid, newProfile);
                            // Set the newly created profile into application state
                            const now = new Date();
                            setUserProfile({ 
                                id: firebaseUser.uid, 
                                ...newProfile,
                                createdAt: now,
                                updatedAt: now
                            });
                        } catch (createErr) {
                            console.error('Errore nella rigenerazione del profilo:', createErr);
                            setUserProfile(null);
                            // Fallback sign out se non si riesce a creare
                            auth.signOut();
                        }
                    }
                } catch (err) {
                    console.error('Errore caricamento profilo:', err);
                    setUserProfile(null);
                }
            } else {
                setUserProfile(null);
            }
        });

        return () => unsubscribe();
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
            <UpdatePrompt />
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
                            <Route path="/profile" element={<ProfileScreen userProfile={userProfile} setUserProfile={setUserProfile} setCart={setCart} />} />
                            <Route path="/news" element={<NewsOffersScreen />} />
                            <Route path="/favorites" element={<FavoritesScreen cart={cart} setCart={setCart} />} />
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
