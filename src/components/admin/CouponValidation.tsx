import { useState } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import './CouponValidation.css';

function CouponValidation() {
    const [code, setCode] = useState('');
    const [validating, setValidating] = useState(false);
    const [message, setMessage] = useState<{
        type: 'success' | 'error' | 'warning';
        text: string;
        details?: string;
    } | null>(null);

    const speak = (text: string) => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel(); // ferma eventuali voci precedenti
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'it-IT';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    };

    const handleValidate = async () => {
        if (!code.trim()) {
            setMessage({
                type: 'error',
                text: '❌ Inserisci un codice',
            });
            return;
        }

        setValidating(true);
        setMessage(null);

        try {
            // Converti in maiuscolo
            const searchCode = code.trim().toUpperCase();

            // Cerca il coupon
            const couponsRef = collection(db, 'GeneratedCoupons');
            const q = query(couponsRef, where('code', '==', searchCode));
            const querySnapshot = await getDocs(q);

            // CASO A: Nessun codice trovato
            if (querySnapshot.empty) {
                setMessage({
                    type: 'error',
                    text: '❌ Codice Inesistente',
                    details: `Il codice "${searchCode}" non è stato trovato nel sistema.`,
                });
                speak('Codice non trovato');
                setValidating(false);
                return;
            }

            // Ottieni il primo (e unico) documento
            const couponDoc = querySnapshot.docs[0];
            const couponData = couponDoc.data();

            // CASO B: Codice già utilizzato
            if (couponData.status === 'redeemed') {
                const redeemedDate = couponData.redeemedAt?.toDate();
                const dateStr = redeemedDate
                    ? redeemedDate.toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    })
                    : 'Data sconosciuta';

                setMessage({
                    type: 'warning',
                    text: '⚠️ ATTENZIONE: Codice già utilizzato in precedenza!',
                    details: `Questo codice è stato già riscattato il ${dateStr}`,
                });
                speak(`Attenzione: codice già utilizzato per ${couponData.offerTitle}`);
                setValidating(false);
                return;
            }

            // CASO B.2: Verifica limite giornaliero (1 riscatto per utente al giorno)
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const userCouponsQuery = query(
                    collection(db, 'GeneratedCoupons'),
                    where('userId', '==', couponData.userId),
                    where('status', '==', 'redeemed'),
                    where('redeemedAt', '>=', today)
                );

                const dailyRedemptions = await getDocs(userCouponsQuery);

                if (!dailyRedemptions.empty) {
                    setMessage({
                        type: 'error',
                        text: '⛔ LIMIT RAGGIUNTO',
                        details: 'Questo cliente ha già utilizzato una promozione oggi. Limite di 1 al giorno.',
                    });
                    setValidating(false);
                    return;
                }
            } catch (err) {
                console.error("Error checking daily limit:", err);
            }

            // CASO C: Codice valido - aggiorna stato
            await updateDoc(doc(db, 'GeneratedCoupons', couponDoc.id), {
                status: 'redeemed',
                redeemedAt: serverTimestamp(),
            });

            // Recupera nome utente da Firestore
            let userName = 'Cliente sconosciuto';
            if (couponData.userId) {
                try {
                    const userSnap = await getDoc(doc(db, 'users', couponData.userId));
                    if (userSnap.exists()) {
                        const u = userSnap.data();
                        userName = u.name || u.displayName || u.email || userName;
                    }
                } catch { /* ignora errori di lookup */ }
            }

            setMessage({
                type: 'success',
                text: '✅ CODICE VALIDO!',
                details: `Offerta: ${couponData.offerTitle} — Cliente: ${userName}`,
            });
            speak(`Codice valido! Offerta ${couponData.offerTitle} per ${userName}`);

            // Pulisci solo il campo codice, il messaggio resta visibile
            setCode('');

        } catch (error) {
            console.error('Error validating coupon:', error);
            setMessage({
                type: 'error',
                text: '❌ Errore nella validazione',
                details: 'Si è verificato un errore. Riprova.',
            });
        }

        setValidating(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleValidate();
        }
    };

    return (
        <div className="coupon-validation">
            <div className="validation-header">
                <h2>🎫 Convalida Coupon</h2>
                <p className="header-description">
                    Inserisci il codice cliente per verificare e convalidare lo sconto
                </p>
            </div>

            <div className="validation-form">
                <div className="input-group">
                    <label htmlFor="coupon-code">Codice Cliente</label>
                    <input
                        id="coupon-code"
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="es: ABC123"
                        className="code-input"
                        maxLength={6}
                        disabled={validating}
                        autoFocus
                    />
                </div>

                <button
                    className="btn btn-primary btn-validate"
                    onClick={handleValidate}
                    disabled={validating || !code.trim()}
                >
                    {validating ? 'Convalida in corso...' : 'CONVALIDA CODICE'}
                </button>
            </div>

            {message && (
                <div className={`validation-message ${message.type}`}>
                    <div className="message-text">{message.text}</div>
                    {message.details && <div className="message-details">{message.details}</div>}
                </div>
            )}

            <div className="help-section">
                <h3>ℹ️ Come funziona</h3>
                <ol>
                    <li>Il cliente mostra il codice da 6 caratteri</li>
                    <li>Inserisci il codice nel campo sopra</li>
                    <li>Click su "CONVALIDA CODICE"</li>
                    <li>Se il codice è valido, autorizza lo sconto</li>
                </ol>
            </div>
        </div>
    );
}

export default CouponValidation;
