import { Cart, CartItem } from '../types';

/**
 * Servizio per generare link WhatsApp con messaggio pre-compilato
 */

// Numero WhatsApp della pizzeria (formato internazionale senza +)
const WHATSAPP_NUMBER = '393123456789'; // TODO: Sostituire con il numero reale

/**
 * Genera un messaggio WhatsApp formattato con i prodotti del carrello
 */
export function generateWhatsAppMessage(cart: Cart, userInfo?: { name: string; phone: string }): string {
    let message = '🍕 *Nuovo Ordine ZeroSei Pizza*\n\n';

    // Informazioni cliente (se disponibili)
    if (userInfo) {
        message += `👤 *Cliente:* ${userInfo.name}\n`;
        message += `📞 *Telefono:* ${userInfo.phone}\n\n`;
    }

    // Prodotti ordinati
    message += '*Prodotti:*\n';
    cart.items.forEach((item: CartItem, index: number) => {
        message += `${index + 1}. *${item.product.name}* x${item.quantity}\n`;
        message += `   💶 €${(item.product.price * item.quantity).toFixed(2)}\n`;
        if (item.notes) {
            message += `   📝 Note: ${item.notes}\n`;
        }
    });

    // Totale
    message += `\n*Totale: €${cart.total.toFixed(2)}*\n\n`;
    message += '💳 Pagamento: Contanti alla consegna';

    return message;
}

/**
 * Genera il link WhatsApp completo con messaggio pre-compilato
 */
export function generateWhatsAppLink(cart: Cart, userInfo?: { name: string; phone: string }): string {
    const message = generateWhatsAppMessage(cart, userInfo);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
}

/**
 * Apre WhatsApp con il messaggio pre-compilato
 */
export function openWhatsApp(cart: Cart, userInfo?: { name: string; phone: string }): void {
    const link = generateWhatsAppLink(cart, userInfo);
    window.open(link, '_blank');
}

/**
 * Aggiorna il numero WhatsApp della pizzeria
 */
export function setWhatsAppNumber(number: string): void {
    // In produzione, questo dovrebbe essere salvato nelle impostazioni
    console.log('WhatsApp number updated:', number);
}
