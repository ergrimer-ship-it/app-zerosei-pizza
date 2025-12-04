import { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './HomeCustomizer.css';
import './HomeCustomizerImages.css';

interface HomeButton {
    id: string;
    icon: string;
    imageUrl?: string; // URL dell'immagine personalizzata
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
            description: 'Contattaci telefonicamente',
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
        },
        {
            id: 'news',
            icon: '🎉',
            title: 'Novità e Offerte',
            description: 'Scopri le ultime promozioni',
            color: '#9B59B6',
            visible: true,
            order: 5
        }
    ]
};

function HomeCustomizer() {
    const [config, setConfig] = useState<HomeConfig>(defaultConfig);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState<string | null>(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
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

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'config', 'home'), {
                ...config,
                updatedAt: new Date()
            });
            alert('✅ Modifiche salvate con successo!');
        } catch (error) {
            console.error('Error saving config:', error);
            alert('❌ Errore nel salvataggio');
        }
        setSaving(false);
    };

    const handleReset = async () => {
        if (confirm('Sei sicuro di voler ripristinare le impostazioni predefinite?')) {
            setConfig(defaultConfig);
            try {
                await setDoc(doc(db, 'config', 'home'), {
                    ...defaultConfig,
                    updatedAt: new Date()
                });
                alert('🔄 Impostazioni ripristinate!');
            } catch (error) {
                console.error('Error resetting:', error);
            }
        }
    };

    const updateHeroTitle = (value: string) => {
        setConfig(prev => ({ ...prev, heroTitle: value }));
    };

    const updateHeroSubtitle = (value: string) => {
        setConfig(prev => ({ ...prev, heroSubtitle: value }));
    };

    const updateButton = (id: string, field: keyof HomeButton, value: any) => {
        setConfig(prev => ({
            ...prev,
            buttons: prev.buttons.map(btn =>
                btn.id === id ? { ...btn, [field]: value } : btn
            )
        }));
    };

    const toggleButtonVisibility = (id: string) => {
        setConfig(prev => ({
            ...prev,
            buttons: prev.buttons.map(btn =>
                btn.id === id ? { ...btn, visible: !btn.visible } : btn
            )
        }));
    };

    const moveButton = (id: string, direction: 'up' | 'down') => {
        const buttons = [...config.buttons];
        const index = buttons.findIndex(b => b.id === id);

        if (direction === 'up' && index > 0) {
            [buttons[index], buttons[index - 1]] = [buttons[index - 1], buttons[index]];
        } else if (direction === 'down' && index < buttons.length - 1) {
            [buttons[index], buttons[index + 1]] = [buttons[index + 1], buttons[index]];
        }

        // Update order
        buttons.forEach((btn, idx) => {
            btn.order = idx + 1;
        });

        setConfig(prev => ({ ...prev, buttons }));
    };

    const handleImageUpload = async (buttonId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(buttonId);
        try {
            const storageRef = ref(storage, `home-buttons/${buttonId}_${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            updateButton(buttonId, 'imageUrl', url);
            alert('✅ Immagine caricata con successo!');
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('❌ Errore nel caricamento dell\'immagine');
        }
        setUploadingImage(null);
    };

    const removeImage = (buttonId: string) => {
        if (confirm('Vuoi rimuovere l\'immagine e tornare all\'icona emoji?')) {
            updateButton(buttonId, 'imageUrl', undefined);
        }
    };

    if (loading) return <div className="loading">Caricamento...</div>;

    return (
        <div className="home-customizer">
            <div className="customizer-header">
                <h2>🏠 Personalizza Pagina Home</h2>
                <p className="customizer-description">
                    Modifica testi, colori e visibilità dei bottoni della home page
                </p>
            </div>

            {/* Hero Section */}
            <div className="customizer-section">
                <h3>📝 Testi Principali</h3>
                <div className="input-group">
                    <label>Titolo Principale</label>
                    <input
                        type="text"
                        value={config.heroTitle}
                        onChange={(e) => updateHeroTitle(e.target.value)}
                        placeholder="Benvenuto da ZeroSei 🍕"
                    />
                </div>
                <div className="input-group">
                    <label>Sottotitolo</label>
                    <input
                        type="text"
                        value={config.heroSubtitle}
                        onChange={(e) => updateHeroSubtitle(e.target.value)}
                        placeholder="La migliore pizza napoletana..."
                    />
                </div>
            </div>

            {/* Buttons Section */}
            <div className="customizer-section">
                <h3>🎨 Bottoni Home</h3>
                <p className="section-hint">
                    Personalizza i bottoni della home page. Puoi modificare testi, colori, icone e decidere quali mostrare.
                </p>

                <div className="buttons-list">
                    {config.buttons.map((button, index) => (
                        <div key={button.id} className={`button-card ${!button.visible ? 'disabled' : ''}`}>
                            <div className="button-card-header">
                                <div className="button-preview" style={{ backgroundColor: button.color }}>
                                    {button.imageUrl ? (
                                        <img
                                            src={button.imageUrl}
                                            alt={button.title}
                                            className="preview-image"
                                        />
                                    ) : (
                                        <span className="preview-icon">{button.icon}</span>
                                    )}
                                    <div className="preview-text">
                                        <strong>{button.title}</strong>
                                        <small>{button.description}</small>
                                    </div>
                                </div>
                                <div className="button-controls">
                                    <button
                                        className="control-btn"
                                        onClick={() => moveButton(button.id, 'up')}
                                        disabled={index === 0}
                                        title="Sposta su"
                                    >
                                        ↑
                                    </button>
                                    <button
                                        className="control-btn"
                                        onClick={() => moveButton(button.id, 'down')}
                                        disabled={index === config.buttons.length - 1}
                                        title="Sposta giù"
                                    >
                                        ↓
                                    </button>
                                    <button
                                        className={`control-btn ${button.visible ? 'visible' : 'hidden'}`}
                                        onClick={() => toggleButtonVisibility(button.id)}
                                        title={button.visible ? 'Nascondi' : 'Mostra'}
                                    >
                                        {button.visible ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                            </div>

                            <div className="button-card-body">
                                <div className="input-row">
                                    <div className="input-group small">
                                        <label>Icona</label>
                                        <input
                                            type="text"
                                            value={button.icon}
                                            onChange={(e) => updateButton(button.id, 'icon', e.target.value)}
                                            maxLength={2}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Titolo</label>
                                        <input
                                            type="text"
                                            value={button.title}
                                            onChange={(e) => updateButton(button.id, 'title', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Descrizione</label>
                                    <input
                                        type="text"
                                        value={button.description}
                                        onChange={(e) => updateButton(button.id, 'description', e.target.value)}
                                    />
                                </div>

                                {/* Image Upload Section */}
                                <div className="input-group">
                                    <label>Immagine Personalizzata</label>
                                    {button.imageUrl ? (
                                        <div className="image-preview-container">
                                            <img
                                                src={button.imageUrl}
                                                alt={button.title}
                                                className="uploaded-image-preview"
                                            />
                                            <button
                                                type="button"
                                                className="btn-remove-image"
                                                onClick={() => removeImage(button.id)}
                                            >
                                                🗑️ Rimuovi Immagine
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="upload-image-btn">
                                            {uploadingImage === button.id ? '⏳ Caricamento...' : '📸 Carica Immagine'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(button.id, e)}
                                                disabled={uploadingImage === button.id}
                                                hidden
                                            />
                                        </label>
                                    )}
                                    <small className="hint-text">
                                        {button.imageUrl ? 'L\'immagine sostituisce l\'icona emoji' : 'Carica un\'immagine per sostituire l\'emoji'}
                                    </small>
                                </div>

                                <div className="input-group">
                                    <label>Colore</label>
                                    <div className="color-picker-group">
                                        <input
                                            type="color"
                                            value={button.color}
                                            onChange={(e) => updateButton(button.id, 'color', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            value={button.color}
                                            onChange={(e) => updateButton(button.id, 'color', e.target.value)}
                                            className="color-text"
                                        />
                                        <div className="color-presets">
                                            <button
                                                className="preset-color"
                                                style={{ backgroundColor: '#E74C3C' }}
                                                onClick={() => updateButton(button.id, 'color', '#E74C3C')}
                                                title="Rosso"
                                            />
                                            <button
                                                className="preset-color"
                                                style={{ backgroundColor: '#27AE60' }}
                                                onClick={() => updateButton(button.id, 'color', '#27AE60')}
                                                title="Verde"
                                            />
                                            <button
                                                className="preset-color"
                                                style={{ backgroundColor: '#25D366' }}
                                                onClick={() => updateButton(button.id, 'color', '#25D366')}
                                                title="WhatsApp"
                                            />
                                            <button
                                                className="preset-color"
                                                style={{ backgroundColor: '#F39C12' }}
                                                onClick={() => updateButton(button.id, 'color', '#F39C12')}
                                                title="Arancione"
                                            />
                                            <button
                                                className="preset-color"
                                                style={{ backgroundColor: '#3498DB' }}
                                                onClick={() => updateButton(button.id, 'color', '#3498DB')}
                                                title="Blu"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="customizer-actions">
                <button
                    className="btn-reset"
                    onClick={handleReset}
                    disabled={saving}
                >
                    🔄 Ripristina Default
                </button>
                <button
                    className="btn-save"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? '💾 Salvataggio...' : '💾 Salva Modifiche'}
                </button>
            </div>
        </div>
    );
}

export default HomeCustomizer;
