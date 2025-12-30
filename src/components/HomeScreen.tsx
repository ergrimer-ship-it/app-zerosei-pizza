import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { callPizzeria, getFormattedPhoneNumber } from '../services/phoneService';
import { openWhatsApp } from '../services/whatsappService';
import { loadCart, addToCart } from '../services/cartService';
import { getOrdersByUser, getProductById } from '../services/dbService';
import { Order } from '../types';
import './HomeScreen.css';

interface HomeButton {
    id: string;
    icon: string;
    imageUrl?: string;
    title: string;
    description: string;
    color: string;
    visible: boolean;
    order: number;
}

interface FeatureCard {
    id: string;
    icon: string;
    title: string;
    description: string;
}

interface HomeConfig {
    heroTitle: string;
    heroSubtitle: string;
    buttons: HomeButton[];
    featuresTitle?: string;
    features?: FeatureCard[];
}

const defaultConfig: HomeConfig = {
    heroTitle: 'Benvenuto da ZeroSei 🍕',
    heroSubtitle: 'La migliore pizza napoletana d\'asporto della città',
    featuresTitle: 'Perché scegliere ZeroSei?',
    features: [
        {
            id: 'feature1',
            icon: '🔥',
            title: 'Forno a Legna',
            description: 'Pizza cotta nel tradizionale forno a legna'
        },
        {
            id: 'feature2',
            icon: '🌾',
            title: 'Ingredienti Freschi',
            description: 'Solo ingredienti di prima qualità'
        },
        {
            id: 'feature3',
            icon: '⚡',
            title: 'Servizio Veloce',
            description: 'Pronta in 15-20 minuti'
        },
        {
            id: 'feature4',
            icon: '❤️',
            title: 'Ricetta Napoletana',
            description: 'Autentica tradizione partenopea'
        }
    ],
    buttons: [
        {
            id: 'menu',
            icon: '🍕',
            title: 'Menù',
            description: 'Scopri le nostre pizze',
            color: '#E74C3C',
            visible: true,
            order: 1
        },
        {
            id: 'phone',
            icon: '📞',
            title: 'Chiama Ora',
            description: getFormattedPhoneNumber(),
            color: '#27AE60',
            visible: true,
            order: 2
        },
        {
            id: 'whatsapp',
            icon: '💬',
            title: 'Ordina su WhatsApp',
            description: 'Ordine rapido e facile',
            color: '#25D366',
            visible: true,
            order: 3
        },
        {
            id: 'fidelity',
            icon: '🎁',
            title: 'Fidelity Card',
            description: 'I tuoi punti fedeltà',
            color: '#F39C12',
            visible: true,
            order: 4
        }
    ]
};

function HomeScreen() {
    const navigate = useNavigate();
    const [config, setConfig] = useState<HomeConfig>(defaultConfig);
    const [loading, setLoading] = useState(true);
    const [lastOrder, setLastOrder] = useState<Order | null>(null);
    const [reordering, setReordering] = useState(false);

    useEffect(() => {
        loadConfig();
        loadLastOrder();
    }, []);

    const loadConfig = async () => {
        try {
            const docRef = doc(db, 'config', 'home');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setConfig({ ...defaultConfig, ...docSnap.data() as HomeConfig });
            }
        } catch (error) {
            console.error('Error loading home config:', error);
        }
        setLoading(false);
    };

    const loadLastOrder = async () => {
        const userProfileStr = localStorage.getItem('user_profile');
        if (userProfileStr) {
            try {
                const userProfile = JSON.parse(userProfileStr);
                // Use profile ID if available (migliore pratica), otherwise rely on what is saved
                // Since dbService logic uses userId field in orders, we need user.id
                if (userProfile.id) {
                    const orders = await getOrdersByUser(userProfile.id);
                    if (orders && orders.length > 0) {
                        setLastOrder(orders[0]); // First one is latest due to ordering in query
                    }
                }
            } catch (error) {
                console.error('Error loading last order:', error);
            }
        }
    };

    const handleReorder = async () => {
        if (!lastOrder) return;
        setReordering(true);

        try {
            let currentCart = loadCart();
            let itemsAdded = 0;

            for (const item of lastOrder.items) {
                // Fetch fresh product data to check availability and current price
                const product = await getProductById(item.productId);

                if (product && product.available) {
                    currentCart = addToCart(
                        currentCart,
                        product,
                        item.quantity,
                        item.notes,
                        item.modifications
                    );
                    itemsAdded++;
                }
            }

            if (itemsAdded > 0) {
                navigate('/cart');
            } else {
                alert('Impossibile aggiungere gli articoli. I prodotti potrebbero non essere più disponibili.');
            }
        } catch (error) {
            console.error('Error reordering:', error);
            alert('Si è verificato un errore durante il riordino.');
        } finally {
            setReordering(false);
        }
    };

    const handleWhatsAppClick = () => {
        const cart = loadCart();
        const userProfile = localStorage.getItem('user_profile');
        let userInfo;

        if (userProfile) {
            const profile = JSON.parse(userProfile);
            userInfo = {
                name: `${profile.firstName} ${profile.lastName}`,
                phone: profile.phone
            };
        }

        openWhatsApp(cart, userInfo);
    };

    const handlePhoneCall = () => {
        callPizzeria();
    };

    const handleButtonClick = (buttonId: string) => {
        switch (buttonId) {
            case 'menu':
                navigate('/menu');
                break;
            case 'phone':
                handlePhoneCall();
                break;
            case 'whatsapp':
                handleWhatsAppClick();
                break;
            case 'fidelity':
                navigate('/fidelity');
                break;
            case 'news':
                navigate('/news');
                break;
            default:
                break;
        }
    };

    if (loading) {
        return <div className="home-screen fade-in"><div className="loading">Caricamento...</div></div>;
    }

    // Sort buttons by order and filter visible ones
    const visibleButtons = config.buttons
        .filter(btn => btn.visible)
        .sort((a, b) => a.order - b.order);

    return (
        <div className="home-screen fade-in">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h1 className="hero-title">
                        {config.heroTitle}
                    </h1>
                    <p className="hero-subtitle">
                        {config.heroSubtitle}
                    </p>
                </div>
            </section>

            {/* Quick Re-order Section */}
            {lastOrder && (
                <section className="reorder-section fade-in">
                    <div className="reorder-card">
                        <div className="reorder-header">
                            <h2>Tutto come al solito? 🍕</h2>
                            <p>Ordina di nuovo il tuo ultimo ordine con un click!</p>
                        </div>
                        <div className="reorder-summary">
                            <ul className="reorder-items">
                                {lastOrder.items.slice(0, 3).map((item, idx) => (
                                    <li key={idx}>
                                        {item.quantity}x {item.productName}
                                    </li>
                                ))}
                                {lastOrder.items.length > 3 && (
                                    <li className="more-items">e altri {lastOrder.items.length - 3} articoli...</li>
                                )}
                            </ul>
                            <div className="reorder-total">
                                Totale precedente: €{lastOrder.total.toFixed(2)}
                            </div>
                        </div>
                        <button
                            className={`reorder-btn ${reordering ? 'loading' : ''}`}
                            onClick={handleReorder}
                            disabled={reordering}
                        >
                            {reordering ? 'Caricamento...' : 'Ordina di Nuovo 🚀'}
                        </button>
                    </div>
                </section>
            )}

            {/* CTA Buttons */}
            <section className="cta-section">
                <div className="cta-grid">
                    {visibleButtons.map((button) => (
                        <button
                            key={button.id}
                            className="cta-card"
                            style={{
                                background: `linear-gradient(135deg, ${button.color} 0%, ${button.color}dd 100%)`,
                                borderColor: button.color
                            }}
                            onClick={() => handleButtonClick(button.id)}
                        >
                            {button.imageUrl ? (
                                <img
                                    src={button.imageUrl}
                                    alt={button.title}
                                    className="cta-icon-image"
                                />
                            ) : (
                                <span className="cta-icon">{button.icon}</span>
                            )}
                            <h3>{button.title}</h3>
                            <p>{button.description}</p>
                        </button>
                    ))}
                </div>
            </section>

            {/* Info Section */}
            <section className="info-section">
                <h2>{config.featuresTitle || 'Perché scegliere ZeroSei?'}</h2>
                <div className="features-grid">
                    {(config.features || defaultConfig.features || []).map(feature => (
                        <div key={feature.id} className="feature">
                            <span className="feature-icon">{feature.icon}</span>
                            <h4>{feature.title}</h4>
                            <p>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Social Links */}
            <section className="social-section">
                <h3>Seguici sui social</h3>
                <div className="social-buttons">
                    <a
                        href="https://instagram.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-btn instagram"
                    >
                        📷 Instagram
                    </a>
                    <a
                        href="https://facebook.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-btn facebook"
                    >
                        📘 Facebook
                    </a>
                    <a
                        href="https://www.zeroseilapizzadasporto.it"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-btn website"
                    >
                        🌐 Sito Web
                    </a>
                </div>
            </section>
        </div>
    );
}

export default HomeScreen;

