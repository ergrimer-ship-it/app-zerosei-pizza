import { useRegisterSW } from 'virtual:pwa-register/react';
import './UpdatePrompt.css';

function UpdatePrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisteredSW(swUrl, r) {
            console.log(`Service Worker registered: ${swUrl}`);
            if (r) {
                setInterval(async () => {
                    if (!(!r.installing && !r.waiting)) return;
                    if (('connection' in navigator) && !navigator.onLine) return;

                    const resp = await fetch(swUrl, {
                        cache: 'no-store',
                        headers: {
                            'cache': 'no-store',
                            'cache-control': 'no-cache',
                        },
                    });

                    if (resp?.status === 200) {
                        await r.update();
                    }
                }, 60 * 60 * 1000); // Check every hour
            }
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    if (!offlineReady && !needRefresh) return null;

    return (
        <div className="update-prompt-container">
            <div className="update-prompt-toast">
                <div className="update-prompt-message">
                    {offlineReady
                        ? "App pronta per l'uso offline."
                        : "È disponibile una nuova versione!"}
                </div>
                {needRefresh && (
                    <button
                        className="update-prompt-button"
                        onClick={() => updateServiceWorker(true)}
                    >
                        Aggiorna
                    </button>
                )}
                <button className="update-prompt-close" onClick={close}>
                    Chiudi
                </button>
            </div>
        </div>
    );
}

export default UpdatePrompt;
