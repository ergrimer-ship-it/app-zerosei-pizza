import { useState, useEffect } from 'react';
import { storage, db } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import CassaCloudSettings from './CassaCloudSettings';
import './Settings.css';

function Settings() {
    const [logoUrl, setLogoUrl] = useState('');
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
            await saveSettings(url);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Errore durante il caricamento dell\'immagine');
        }
        setUploading(false);
    };

    const saveSettings = async (url: string) => {
        try {
            await setDoc(doc(db, 'config', 'general'), {
                logoUrl: url,
                updatedAt: new Date()
            }, { merge: true });
            alert('Logo aggiornato con successo!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Errore nel salvataggio delle impostazioni');
        }
    };

    if (loading) return <div className="loading">Caricamento...</div>;

    return (
        <div className="settings-container">
            <h2>Impostazioni Generali</h2>

            <div className="setting-section">
                <h3>Logo Applicazione</h3>
                <p className="setting-description">
                    Carica un logo da mostrare nell'intestazione del sito al posto del testo.
                </p>

                <div className="logo-upload-container">
                    <div className="current-logo">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo attuale" className="logo-preview" />
                        ) : (
                            <div className="logo-placeholder">Nessun logo</div>
                        )}
                    </div>

                    <div className="upload-controls">
                        <label className="upload-btn">
                            {uploading ? 'Caricamento...' : 'Carica Nuovo Logo'}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={uploading}
                                hidden
                            />
                        </label>
                    </div>
                </div>
            </div>

            <hr className="settings-divider" />

            <CassaCloudSettings />
        </div>
    );
}

export default Settings;
