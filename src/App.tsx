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
import { getUserProfile, updateUserProfile } from './services/dbService';
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
                    let profile = await getUserProfile(firebaseUser.uid);
                    
                    // Se il profilo non c'è, potrebbe essere una registrazione in corso che non ha ancora scritto a DB. 
                    // Aspettiamo 2 secondi e riproviamo prima di forzare la creazione.
                    if (!profile) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        profile = await getUserProfile(firebaseUser.uid);
                    }

                    // TENTATIVO DI RECUPERO AUTOMATICO (per profili orfani o già sovrascritti dal bug precedente)
                    const isUtenteRecuperato = profile && profile.firstName === 'Utente' && profile.lastName === 'Recuperato';
                    
                    if ((!profile || isUtenteRecuperato) && firebaseUser.email) {
                        console.warn('Profilo mancante o Utente Recuperato. Tento il ripristino dai vecchi documenti...');
                        try {
                            const { collection, query, where, getDocs, doc, setDoc, deleteDoc, Timestamp } = await import('firebase/firestore');
                            const { db } = await import('./firebase');
                            const usersRef = collection(db, 'users');
                            
                            // Cerca un profilo orfano con la stessa email
                            let qEmail = query(usersRef, where('email', '==', firebaseUser.email));
                            let emailSnap = await getDocs(qEmail);
                            let originalDoc = emailSnap.docs.find(d => d.id !== firebaseUser.uid && d.data().firstName !== 'Utente');
                            
                            if (!originalDoc) {
                                qEmail = query(usersRef, where('email', '==', firebaseUser.email.toLowerCase()));
                                emailSnap = await getDocs(qEmail);
                                originalDoc = emailSnap.docs.find(d => d.id !== firebaseUser.uid && d.data().firstName !== 'Utente');
                            }

                            if (originalDoc) {
                                console.log('Documento originale trovato! Procedo al ripristino sul nuovo UID.');
                                const oldData = originalDoc.data();
                                await setDoc(doc(db, 'users', firebaseUser.uid), {
                                    ...oldData,
                                    updatedAt: Timestamp.now()
                                }, { merge: true });
                                
                                try { await deleteDoc(doc(db, 'users', originalDoc.id)); } catch(e) { console.error('Fallita cancellazione orfano', e); }
                                profile = await getUserProfile(firebaseUser.uid); // ricarica il profilo aggiornato
                            }
                        } catch (err) {
                            console.error('Errore durante il recupero dei dati orfani:', err);
                        }
                    }

                    if (profile) {
                        setUserProfile(profile);
                        // Aggiorna silenziosamente l'ultimo accesso
                        updateUserProfile(firebaseUser.uid, { lastAccess: new Date() }).catch(e => console.error('Errore sync ultimo accesso:', e));
                    } else {
                        console.warn('Nessun profilo esistente trovato. Creo un profilo incompleto vuoto...');
                        const newProfile = {
                            firstName: 'Ospite',
                            lastName: '',
                            email: firebaseUser.email || '',
                            phone: '',
                            loyaltyPoints: 0,
                            lastAccess: new Date()
                        };
                        try {
                            // Uso merge per evitare di sovrascrivere se per caso è stato creato proprio un istante fa
                            const { doc, setDoc, Timestamp } = await import('firebase/firestore');
                            const { db } = await import('./firebase');
                            await setDoc(doc(db, 'users', firebaseUser.uid), { 
                                ...newProfile, 
                                createdAt: Timestamp.now(), 
                                updatedAt: Timestamp.now() 
                            }, { merge: true });
                            
                            // Set the newly created profile into application state
                            const now = new Date();
                            setUserProfile({ 
                                id: firebaseUser.uid, 
                                ...newProfile,
                                createdAt: now,
                                updatedAt: now
                            });
                        } catch (createErr) {
                            console.error('Errore nella creazione del profilo ospite:', createErr);
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
                            <Route path="/" element={<HomeScreen userProfile={userProfile} />} />
                            <Route path="/menu" element={<MenuScreen />} />
                            <Route path="/menu/:category" element={<ProductListScreen cart={cart} setCart={setCart} />} />
                            <Route path="/product/:id" element={<ProductDetailScreen cart={cart} setCart={setCart} userProfile={userProfile} />} />
                            <Route path="/cart" element={<CartScreen cart={cart} setCart={setCart} userProfile={userProfile} />} />
                            <Route path="/profile" element={<ProfileScreen userProfile={userProfile} setUserProfile={setUserProfile} setCart={setCart} />} />
                            <Route path="/news" element={<NewsOffersScreen userProfile={userProfile} />} />
                            <Route path="/favorites" element={<FavoritesScreen cart={cart} setCart={setCart} userProfile={userProfile} />} />
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
