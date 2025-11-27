import { Cart, CartItem, OrderDetails, Order } from '../types';
import { calculateItemUnitPrice } from './cartService';
import { createOrder } from './dbService';

/**
 * Servizio per generare link WhatsApp con messaggio pre-compilato
 */

// Numero WhatsApp della pizzeria (formato internazionale senza +)
const WHATSAPP_NUMBER = '393792407433';

/**
 * Genera un messaggio WhatsApp formattato con i prodotti del carrello
 */
export function generateWhatsAppMessage(
    cart: Cart,
    userInfo?: { name: string; phone: string },
    orderDetails?: OrderDetails
): string {
    let message = '🍕 *Nuovo Ordine ZeroSei Pizza*\n\n';

    // Informazioni cliente (se disponibili)
    if (userInfo) {
        message += `👤 *Cliente:* ${userInfo.name}\n`;
        message += `📞 *Telefono:* ${userInfo.phone}\n\n`;
    }

    // Tipo di consegna
    if (orderDetails) {
        if (orderDetails.deliveryType === 'pickup') {
            message += '🏪 *Ritiro in Pizzeria*\n';
            if (orderDetails.pickupTime) {
                message += `🕐 *Orario preferito:* ${orderDetails.pickupTime}\n`;
            }
            message += '\n';
        } else {
            message += '🏠 *Consegna a Domicilio*\n';
            if (orderDetails.deliveryAddress) {
                message += `📍 *Indirizzo:* ${orderDetails.deliveryAddress.street}, ${orderDetails.deliveryAddress.city}\n`;
                message += `🔔 *Campanello:* ${orderDetails.deliveryAddress.doorbell}\n`;
            }
            if (orderDetails.pickupTime) {
                message += `🕐 *Orario preferito:* ${orderDetails.pickupTime}\n`;
            }
            message += '\n';
        }
    }

    // Prodotti ordinati
    message += '*Prodotti:*\n';
    cart.items.forEach((item: CartItem, index: number) => {
        const unitPrice = calculateItemUnitPrice(item);
        message += `${index + 1}. *${item.product.name}* x${item.quantity}\n`;

        // Modifiche
        if (item.modifications && item.modifications.length > 0) {
            message += `   ➕ ${item.modifications.map(m => m.name).join(', ')}\n`;
        }

        message += `   💶 €${(unitPrice * item.quantity).toFixed(2)}\n`;

        if (item.notes) {
            message += `   📝 Note: ${item.notes}\n`;
        }
    });

    // Totale
    message += `\n*Totale: €${cart.total.toFixed(2)}*\n`;

    // Nota spese di trasporto per consegna a domicilio
    if (orderDetails?.deliveryType === 'delivery') {
        message += `_(escluse eventuali spese di trasporto)_\n`;
    }
    message += '\n';

    // Metodo di pagamento
    if (orderDetails) {
        let paymentText = '';
        switch (orderDetails.paymentMethod) {
            case 'cash':
                paymentText = 'Contanti';
                break;
            case 'pos':
                paymentText = 'POS';
                break;
            case 'satispay':
                paymentText = 'Satispay';
                break;
        }
        message += `💳 *Pagamento:* ${paymentText}\n`;
    }

    // Note aggiuntive
    if (orderDetails?.notes) {
        message += `\n📝 *Note:* ${orderDetails.notes}`;
    }

    return message;
}

/**
 * Genera il link WhatsApp completo con messaggio pre-compilato
 */
export function generateWhatsAppLink(
    cart: Cart,
    userInfo?: { name: string; phone: string },
    orderDetails?: OrderDetails
): string {
    const message = generateWhatsAppMessage(cart, userInfo, orderDetails);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
}

/**
 * Apre WhatsApp con il messaggio pre-compilato e salva l'ordine nel database
 */
export async function openWhatsApp(
    cart: Cart,
    userInfo?: { name: string; phone: string },
    orderDetails?: OrderDetails
): Promise<void> {
    // 1. Apri WhatsApp immediatamente per evitare blocco popup
    const link = generateWhatsAppLink(cart, userInfo, orderDetails);
    window.open(link, '_blank');

    // 2. Salva l'ordine nel database in background
    try {
        // Costruisci l'oggetto Order
        const orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
            userId: 'guest', // Default per ordini WhatsApp se non autenticato
            userProfile: {
                firstName: userInfo?.name.split(' ')[0] || 'Guest',
                lastName: userInfo?.name.split(' ').slice(1).join(' ') || '',
                phone: userInfo?.phone || '',
                email: '' // Email non disponibile per ordini WhatsApp guest
            },
            items: cart.items.map(item => ({
                productId: item.product.id,
                productName: item.product.name,
                quantity: item.quantity,
                price: calculateItemUnitPrice(item),
                notes: item.notes,
                modifications: item.modifications
            })),
            total: cart.total,
            status: 'pending',
            source: 'whatsapp',
            deliveryAddress: orderDetails?.deliveryAddress
                ? `${orderDetails.deliveryAddress.street}, ${orderDetails.deliveryAddress.city} (Campanello: ${orderDetails.deliveryAddress.doorbell})`
                : undefined,
            notes: orderDetails?.notes
        };

        await createOrder(orderData);
        console.log('Order saved to Firestore');
    } catch (error) {
        console.error('Error saving order to Firestore:', error);
        // Non mostrare errore all'utente perché l'ordine WhatsApp è comunque partito
    }
}

/**
 * Aggiorna il numero WhatsApp della pizzeria
 */
export function setWhatsAppNumber(number: string): void {
    // In produzione, questo dovrebbe essere salvato nelle impostazioni
    console.log('WhatsApp number updated:', number);
}
