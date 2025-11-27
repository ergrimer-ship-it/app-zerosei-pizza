import { useNavigate } from 'react-router-dom';
import { callPizzeria, getFormattedPhoneNumber } from '../services/phoneService';
import { openWhatsApp } from '../services/whatsappService';
import { loadCart } from '../services/cartService';
import './HomeScreen.css';

function HomeScreen() {
    const navigate = useNavigate();

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
        callPizzeria(); // Call without cart data - just a quick call
    };

    return (
        <div className="home-screen fade-in">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                        <img src="./logo-zerosei.png" alt="ZeroSei Pizza" style={{ height: '120px', width: 'auto' }} />
                    </div>
                    <h1 className="hero-title">
                        Benvenuto da <span className="highlight">ZeroSei</span>
                    </h1>
                    <p className="hero-subtitle">
                        La migliore pizza napoletana d'asporto della città
                    </p>
                </div>
            </section>

            {/* CTA Buttons */}
            <section className="cta-section">
                <div className="cta-grid">
                    <button
                        className="cta-card cta-primary"
                        onClick={() => navigate('/menu')}
                    >
                        <span className="cta-icon">🍕</span>
                        <h3>Menù</h3>
                        <p>Scopri le nostre pizze</p>
                    </button>

                    <button
                        className="cta-card cta-secondary"
                        onClick={handlePhoneCall}
                    >
                        <span className="cta-icon">📞</span>
                        <h3>Chiama Ora</h3>
                        <p>{getFormattedPhoneNumber()}</p>
                    </button>

                    <button
                        className="cta-card cta-whatsapp"
                        onClick={handleWhatsAppClick}
                    >
                        <span className="cta-icon">💬</span>
                        <h3>Ordina su WhatsApp</h3>
                        <p>Ordine rapido e facile</p>
                    </button>

                    <button
                        className="cta-card cta-fidelity"
                        onClick={() => navigate('/fidelity')}
                    >
                        <span className="cta-icon">🎁</span>
                        <h3>Fidelity Card</h3>
                        <p>I tuoi punti fedeltà</p>
                    </button>
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
