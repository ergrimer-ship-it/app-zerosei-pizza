import { useState, useEffect } from 'react';
import { storage, db } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import CassaCloudSettings from './CassaCloudSettings';
import ThemeCustomizer from './ThemeCustomizer';
import HomeCustomizer from './HomeCustomizer';
import './Settings.css';

type SettingsTab = 'general' | 'home' | 'theme';

function Settings() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [logoUrl, setLogoUrl] = useState('');
    const [logoSize, setLogoSize] = useState(60);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const docRef = doc(db, 'config', 'general');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setLogoUrl(docSnap.data().logoUrl || '');
                setLogoSize(docSnap.data().logoSize || 60);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
        setLoading(false);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const storageRef = ref(storage, `config/logo_${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            setLogoUrl(url);

            // Auto-save after upload
            await saveSettings(url, logoSize);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Errore durante il caricamento dell\'immagine');
        }
        setUploading(false);
    };

    const saveSettings = async (url: string, size: number) => {
        try {
            await setDoc(doc(db, 'config', 'general'), {
                logoUrl: url,
                logoSize: size,
                updatedAt: new Date()
            });
            alert('✅ Impostazioni salvate!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('❌ Errore nel salvataggio');
        }
    };

    const handleSizeChange = async (newSize: number) => {
        setLogoSize(newSize);
        if (logoUrl) {
            await saveSettings(logoUrl, newSize);
        }
    };

    if (loading) {
        return <div className="settings-container"><div className="loading">Caricamento...</div></div>;
    }

    return (
        <div className="settings-container">
            <h2 className="settings-title">⚙️ Impostazioni</h2>

            {/* Tabs Navigation */}
            <div className="settings-tabs">
                <button
                    className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
                    onClick={() => setActiveTab('general')}
                >
                    🏢 Generale
                </button>
                <button
                    className={`settings-tab ${activeTab === 'home' ? 'active' : ''}`}
                    onClick={() => setActiveTab('home')}
                >
                    🏠 Pagina Home
                </button>
                <button
                    className={`settings-tab ${activeTab === 'theme' ? 'active' : ''}`}
                    onClick={() => setActiveTab('theme')}
                >
                    🎨 Tema Globale
                </button>
            </div>

            {/* Tab Content */}
            <div className="settings-tab-content">
                {activeTab === 'general' && (
                    <div className="tab-panel">
                        {/* Logo Upload Section */}
                        <div className="settings-section">
                            <h3>🖼️ Logo Pizzeria</h3>
                            <div className="logo-upload-container">
                                {logoUrl && (
                                    <div className="logo-preview">
                                        <img
                                            src={logoUrl}
                                            alt="Logo"
                                            style={{ height: `${logoSize}px` }}
                                        />
                                    </div>
                                )}
                                <label className="upload-button">
                                    {uploading ? '⏳ Caricamento...' : '📤 Carica Logo'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                        hidden
                                    />
                                </label>
                            </div>

                            {logoUrl && (
                                <div className="logo-size-control">
                                    <label>Dimensione Logo: {logoSize}px</label>
                                    <input
                                        type="range"
                                        min="30"
                                        max="150"
                                        value={logoSize}
                                        onChange={(e) => handleSizeChange(Number(e.target.value))}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Cassa Cloud Settings */}
                        <CassaCloudSettings />
                    </div>
                )}

                {activeTab === 'home' && (
                    <div className="tab-panel">
                        <HomeCustomizer />
                    </div>
                )}

                {activeTab === 'theme' && (
                    <div className="tab-panel">
                        <ThemeCustomizer />
                    </div>
                )}
            </div>
        </div>
    );
}

export default Settings;
