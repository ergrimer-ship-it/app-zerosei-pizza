import './CassaCloudSettings.css';

/**
 * DEPRECATO: Questo componente non è più utilizzato.
 * L'API Key di Cassa in Cloud è ora configurata in modo sicuro 
 * nelle Firebase Functions tramite Firebase config.
 * 
 * Per configurare: firebase functions:config:set cassanova.api_key="YOUR_KEY"
 */
function CassaCloudSettings() {
    return (
        <div className="cassa-cloud-settings">
            <h2>⚠️ Configurazione Cassa in Cloud</h2>
            <div className="info-section" style={{ padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
                <h3>📌 Configurazione Spostata nel Backend</h3>
                <p>
                    Per motivi di sicurezza, l'API Key di Cassa in Cloud non viene più configurata nel frontend dell'app.
                </p>
                <p style={{ marginTop: '15px' }}>
                    <strong>La configurazione è ora gestita tramite Firebase Functions:</strong>
                </p>
                <ol style={{ marginTop: '10px', marginLeft: '20px' }}>
                    <li>Apri il terminale nella cartella del progetto</li>
                    <li>
                        Esegui il comando:
                        <code style={{ display: 'block', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px', marginTop: '5px', fontFamily: 'monospace' }}>
                            firebase functions:config:set cassanova.api_key="TUA_API_KEY"
                        </code>
                    </li>
                    <li>
                        Deploy delle functions:
                        <code style={{ display: 'block', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px', marginTop: '5px', fontFamily: 'monospace' }}>
                            firebase deploy --only functions
                        </code>
                    </li>
                </ol>
                <p style={{ marginTop: '15px', fontSize: '0.9em', color: '#666' }}>
                    ℹ️ Questa modifica garantisce che l'API Key non sia mai esposta al codice frontend e quindi non sia visibile agli utenti.
                </p>
            </div>

            <div className="api-info" style={{ marginTop: '20px' }}>
                <h3>📋 Informazioni Tecniche</h3>
                <div className="info-grid">
                    <div className="info-item">
                        <strong>Program ID ZeroSei 24/25:</strong>
                        <code>3159</code>
                    </div>
                    <div className="info-item">
                        <strong>URL Base API:</strong>
                        <code>https://api.cassanova.com</code>
                    </div>
                    <div className="info-item">
                        <strong>API Version:</strong>
                        <code>2.0.0</code>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CassaCloudSettings;
