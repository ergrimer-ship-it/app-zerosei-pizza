/**
 * Servizio per gestire chiamate telefoniche
 */

// Numero di telefono della pizzeria
const PHONE_NUMBER = '+393123456789'; // TODO: Sostituire con il numero reale

/**
 * Genera il link tel: per chiamata diretta
 */
export function generatePhoneLink(): string {
    return `tel:${PHONE_NUMBER}`;
}

/**
 * Apre l'app telefono per chiamare la pizzeria
 */
export function callPizzeria(): void {
    window.location.href = generatePhoneLink();
}

/**
 * Ottiene il numero di telefono formattato per visualizzazione
 */
export function getFormattedPhoneNumber(): string {
    // Formatta il numero per visualizzazione (es: +39 312 345 6789)
    return PHONE_NUMBER.replace(/(\+\d{2})(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
}

/**
 * Aggiorna il numero di telefono della pizzeria
 */
export function setPhoneNumber(number: string): void {
    // In produzione, questo dovrebbe essere salvato nelle impostazioni
    console.log('Phone number updated:', number);
}
