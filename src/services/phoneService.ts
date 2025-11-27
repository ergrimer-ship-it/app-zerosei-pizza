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
 * Apre l'app telefono per chiamare la pizzeria e registra l'ordine
 */
export async function callPizzeria(
    cart?: { items: any[]; total: number },
    userInfo?: { name: string; phone: string },
    orderDetails?: any
): Promise<void> {
    // 1. Salva l'ordine nel database
    try {
        console.log('Saving phone order...');
        // Se non ci sono dati del carrello, salva solo l'evento della chiamata
        if (!cart || cart.items.length === 0) {
            const orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
                userId: 'guest',
                userProfile: {
                    firstName: userInfo?.name.split(' ')[0] || 'Cliente',
                    lastName: userInfo?.name.split(' ').slice(1).join(' ') || 'Telefonico',
                    phone: userInfo?.phone || '',
                    email: ''
                },
                items: [],
                total: 0,
                status: 'pending',
                source: 'phone',
                notes: 'Chiamata telefonica avviata da app'
            };
            await createOrder(orderData);
            console.log('Phone call event saved to Firestore');
        } else {
            // Converti i dati del carrello in OrderItems
            const orderItems = cart.items.map(item => ({
                productId: item.product.id,
                productName: item.product.name,
                quantity: item.quantity,
                price: item.product.price,
                notes: item.notes,
                modifications: item.modifications
            }));

            const orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
                userId: 'guest',
                userProfile: {
                    firstName: userInfo?.name.split(' ')[0] || 'Cliente',
                    lastName: userInfo?.name.split(' ').slice(1).join(' ') || 'Telefonico',
                    phone: userInfo?.phone || '',
                    email: ''
                },
                items: orderItems,
                total: cart.total,
                status: 'pending',
                source: 'phone',
                notes: orderDetails?.notes || 'Ordine telefonico da app',
                deliveryAddress: orderDetails?.deliveryType === 'delivery' && orderDetails?.deliveryAddress
                    ? `${orderDetails.deliveryAddress.street}, ${orderDetails.deliveryAddress.city} - ${orderDetails.deliveryAddress.doorbell}`
                    : undefined
            };

            await createOrder(orderData);
            console.log('Phone order saved to Firestore with cart data');
        }
    } catch (error) {
        console.error('Error saving phone order:', error);
    }

    // 2. Apri il telefono dopo aver salvato (o tentato di salvare)
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
