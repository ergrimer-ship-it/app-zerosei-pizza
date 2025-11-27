import { useState, useEffect } from 'react';
import { setCassaCloudApiKey, getCassaCloudApiKey, testCassaCloudConnection } from '../../services/cassaCloudService';
import './CassaCloudSettings.css';

function CassaCloudSettings() {
    const [apiKey, setApiKey] = useState('');
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        // Carica la chiave API salvata
        const savedKey = getCassaCloudApiKey();
        if (savedKey) {
            setApiKey(savedKey);
        }
    }, []);

    const handleSave = () => {
        setCassaCloudApiKey(apiKey);
        setTestResult({ success: true, message: 'Chiave API salvata con successo!' });
        setTimeout(() => setTestResult(null), 3000);
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);

        try {
            const result = await testCassaCloudConnection();
            if (result.success) {
                setTestResult({
                    success: true,
                    message: '✅ Connessione a Cassa in Cloud riuscita!'
                });
            } else {
                setTestResult({
                    success: false,
                    message: `❌ Errore: ${result.error}`
                });
            }
        } catch (error: any) {
            setTestResult({
                success: false,
                message: `❌ Errore imprevisto: ${error.message}`
            });
        }

        setTesting(false);
    };
    return (
        <div className="cassa-cloud-settings">
            <h2>Impostazioni Cassa in Cloud</h2>
            <p className="description">
                Configura l'integrazione con Cassa in Cloud per sincronizzare i punti fedeltà dei clienti.
            </p>

            <div className="settings-form">
                <div className="form-group">
                    <label htmlFor="apiKey">Chiave API</label>
                    <input
                        id="apiKey"
                        type="text"
                        className="input"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Inserisci la chiave API di Cassa in Cloud"
                    />
                    <small>Puoi trovare la chiave API nelle impostazioni del tuo account Cassa in Cloud.</small>
                </div>

                <div className="button-group">
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={!apiKey}
                    >
                        💾 Salva
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={handleTest}
                        disabled={!apiKey || testing}
                    >
                        {testing ? '⏳ Test in corso...' : '🔍 Testa Connessione'}
                    </button>
                </div>

                {testResult && (
                    <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                        {testResult.message}
                    </div>
                )}
            </div>

            <div className="info-section">
                <h3>ℹ️ Come configurare</h3>
                <ol>
                    <li>Accedi al tuo account <strong>Cassa in Cloud</strong></li>
                    <li>Vai su <strong>Impostazioni → API Keys</strong></li>
                    <li>Copia la chiave API valida</li>
                    <li>Incollala nel campo sopra e clicca <strong>Salva</strong></li>
                    <li>Clicca <strong>Testa Connessione</strong> per verificare</li>
                </ol>
            </div>

            <div className="api-info">
                <h3>📋 Informazioni API</h3>
                <div className="info-grid">
                    <div className="info-item">
                        <strong>URL Base:</strong>
                        <code>https://my.cassanova.com/api</code>
                    </div>
                    <div className="info-item">
                        <strong>Endpoint Fedeltà:</strong>
                        <code>/fidelitypointsaccounts</code>
                    </div>
                    <div className="info-item">
                        <strong>Autenticazione:</strong>
                        <span>OAuth2 (Bearer Token)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CassaCloudSettings;
