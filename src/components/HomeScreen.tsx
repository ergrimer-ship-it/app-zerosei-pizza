import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { callPizzeria, getFormattedPhoneNumber } from '../services/phoneService';
import { openWhatsApp } from '../services/whatsappService';
import { loadCart } from '../services/cartService';
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

interface HomeConfig {
    heroTitle: string;
    heroSubtitle: string;
    buttons: HomeButton[];
}

const defaultConfig: HomeConfig = {
    heroTitle: 'Benvenuto da ZeroSei 🍕',
    heroSubtitle: 'La migliore pizza napoletana d\'asporto della città',
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

    useEffect(() => {
        loadConfig();
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
                // TODO: Navigate to news/promotions page
                navigate('/menu'); // Temporary: redirect to menu
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
                <h2>Perché scegliere ZeroSei?</h2>
                <div className="features-grid">
                    <div className="feature">
                        <span className="feature-icon">🔥</span>
                        <h4>Forno a Legna</h4>
                        <p>Pizza cotta nel tradizionale forno a legna</p>
                    </div>
                    <div className="feature">
                        <span className="feature-icon">🌾</span>
                        <h4>Ingredienti Freschi</h4>
                        <p>Solo ingredienti di prima qualità</p>
                    </div>
                    <div className="feature">
                        <span className="feature-icon">⚡</span>
                        <h4>Servizio Veloce</h4>
                        <p>Pronta in 15-20 minuti</p>
                    </div>
                    <div className="feature">
                        <span className="feature-icon">❤️</span>
                        <h4>Ricetta Napoletana</h4>
                        <p>Autentica tradizione partenopea</p>
                    </div>
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
                        href="https://zerosei.it"
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

