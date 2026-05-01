import { useState, useEffect } from 'react';
import './InstallPrompt.css';

const STORAGE_KEY = 'pwa_install_dismissed';

function isIOS(): boolean {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        ('standalone' in window.navigator && (window.navigator as any).standalone === true)
    );
}

export default function InstallPrompt() {
    const [showAndroid, setShowAndroid] = useState(false);
    const [showIOS, setShowIOS] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        // Non mostrare se già installata
        if (isInStandaloneMode()) return;
        // Non mostrare se l'utente ha già rifiutato
        if (localStorage.getItem(STORAGE_KEY)) return;

        if (isIOS()) {
            // Su iOS mostra le istruzioni manuali dopo 3 secondi
            const t = setTimeout(() => setShowIOS(true), 3000);
            return () => clearTimeout(t);
        } else {
            // Su Android/Chrome cattura il prompt nativo
            const handler = (e: Event) => {
                e.preventDefault();
                setDeferredPrompt(e);
                setShowAndroid(true);
            };
            window.addEventListener('beforeinstallprompt', handler);
            return () => window.removeEventListener('beforeinstallprompt', handler);
        }
    }, []);

    const dismiss = () => {
        localStorage.setItem(STORAGE_KEY, '1');
        setShowAndroid(false);
        setShowIOS(false);
    };

    const handleInstallAndroid = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            localStorage.setItem(STORAGE_KEY, '1');
        }
        setShowAndroid(false);
        setDeferredPrompt(null);
    };

    // ── Android banner ────────────────────────────────────────────────────────
    if (showAndroid) {
        return (
            <div className="install-banner">
                <div className="install-banner-icon">🍕</div>
                <div className="install-banner-text">
                    <strong>Installa l'app ZeroSei</strong>
                    <span>Accesso rapido dal tuo telefono</span>
                </div>
                <button className="install-banner-btn" onClick={handleInstallAndroid}>
                    Installa
                </button>
                <button className="install-banner-close" onClick={dismiss} aria-label="Chiudi">✕</button>
            </div>
        );
    }

    // ── iOS popup ─────────────────────────────────────────────────────────────
    if (showIOS) {
        return (
            <div className="install-overlay" onClick={dismiss}>
                <div className="install-ios-modal" onClick={e => e.stopPropagation()}>
                    <button className="install-modal-close" onClick={dismiss}>✕</button>
                    <div className="install-ios-icon">🍕</div>
                    <h3>Installa l'app ZeroSei</h3>
                    <p>Aggiungila alla schermata Home per un accesso rapido!</p>

                    <div className="install-ios-steps">
                        <div className="install-ios-step">
                            <span className="install-ios-num">1</span>
                            <span>Tocca</span>
                            <span className="install-ios-icon-share">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
                                    <polyline points="16 6 12 2 8 6"/>
                                    <line x1="12" y1="2" x2="12" y2="15"/>
                                </svg>
                            </span>
                            <span>in basso</span>
                        </div>
                        <div className="install-ios-step">
                            <span className="install-ios-num">2</span>
                            <span>Scegli <strong>"Aggiungi alla schermata Home"</strong></span>
                        </div>
                        <div className="install-ios-step">
                            <span className="install-ios-num">3</span>
                            <span>Tocca <strong>Aggiungi</strong> in alto a destra</span>
                        </div>
                    </div>

                    <div className="install-ios-arrow">▼</div>
                </div>
            </div>
        );
    }

    return null;
}
