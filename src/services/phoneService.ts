import { createOrder } from './dbService';
import { Order } from '../types';

/**
 * Servizio per gestire chiamate telefoniche
 */

// Numero di telefono della pizzeria
const PHONE_NUMBER = '+390456180120';

/**
 * Genera il link tel: per chiamata diretta
 */
export function generatePhoneLink(): string {
    return `tel:${PHONE_NUMBER}`;
}

/**
 * Apre l'app telefono per chiamare la pizzeria e registra l'evento
 */
export async function callPizzeria(): Promise<void> {
    // 1. Apri il telefono immediatamente
    window.location.href = generatePhoneLink();

    // 2. Salva l'evento nel database in background
    try {
        const orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
            userId: 'guest',
            userProfile: {
                firstName: 'Cliente',
                lastName: 'Telefonico',
                phone: '',
                email: ''
            },
            items: [], // Ordine telefonico non ha items tracciati automaticamente
            total: 0,
            status: 'pending',
            source: 'phone',
            notes: 'Ordine telefonico avviato da app'
        };

        await createOrder(orderData);
        console.log('Phone call event saved to Firestore');
    } catch (error) {
        console.error('Error saving phone call event:', error);
    }
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
