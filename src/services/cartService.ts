import { Cart, CartItem, Product, PizzaModification } from '../types';

const CART_STORAGE_KEY = 'zerosei_cart';

/**
 * Servizio per gestire il carrello della spesa
 * Usa localStorage per persistenza
 */

/**
 * Carica il carrello dal localStorage
 */
export function loadCart(): Cart {
    try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading cart:', error);
    }

    return { items: [], total: 0 };
}

/**
 * Salva il carrello nel localStorage
 */
export function saveCart(cart: Cart): void {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
        console.error('Error saving cart:', error);
    }
}

/**
 * Calcola il prezzo unitario di un item (prodotto + modifiche)
 */
export function calculateItemUnitPrice(item: CartItem): number {
    const modificationsPrice = item.modifications
        ? item.modifications.reduce((sum, mod) => sum + mod.price, 0)
        : 0;
    return item.product.price + modificationsPrice;
}

/**
 * Calcola il totale del carrello
 */
export function calculateTotal(items: CartItem[]): number {
    return items.reduce((total, item) => {
        const unitPrice = calculateItemUnitPrice(item);
        return total + (unitPrice * item.quantity);
    }, 0);
}

/**
 * Genera una chiave unica per le modifiche per confronto
 */
function getModificationsKey(modifications?: PizzaModification[]): string {
    if (!modifications || modifications.length === 0) return '';
    return modifications
        .map(m => m.id)
        .sort()
        .join('|');
}

/**
 * Aggiunge un prodotto al carrello
 */
export function addToCart(
    cart: Cart,
    product: Product,
    quantity: number = 1,
    notes?: string,
    modifications?: PizzaModification[]
): Cart {
    const modificationsKey = getModificationsKey(modifications);

    const existingItemIndex = cart.items.findIndex(item => {
        const itemModKey = getModificationsKey(item.modifications);
        return item.product.id === product.id && itemModKey === modificationsKey;
    });

    let newItems: CartItem[];

    if (existingItemIndex >= 0) {
        // Prodotto identico (stesse modifiche) già nel carrello, aggiorna quantità
        newItems = [...cart.items];
        newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newItems[existingItemIndex].quantity + quantity,
            notes: notes ? (newItems[existingItemIndex].notes ? `${newItems[existingItemIndex].notes}, ${notes}` : notes) : newItems[existingItemIndex].notes
        };
    } else {
        // Nuovo prodotto o combinazione diversa
        newItems = [
            ...cart.items,
            { product, quantity, notes, modifications }
        ];
    }

    const newCart: Cart = {
        items: newItems,
        total: calculateTotal(newItems)
    };

    saveCart(newCart);
    return newCart;
}

/**
 * Rimuove un prodotto dal carrello
 * Nota: Rimuove l'item specifico (con quelle modifiche)
 */
export function removeFromCart(cart: Cart, productIndex: number): Cart {
    const newItems = cart.items.filter((_, index) => index !== productIndex);

    const newCart: Cart = {
        items: newItems,
        total: calculateTotal(newItems)
    };

    saveCart(newCart);
    return newCart;
}

/**
 * Aggiorna la quantità di un prodotto nel carrello
 */
export function updateQuantity(cart: Cart, productIndex: number, quantity: number): Cart {
    if (quantity <= 0) {
        return removeFromCart(cart, productIndex);
    }

    const newItems = cart.items.map((item, index) => {
        if (index === productIndex) {
            return { ...item, quantity };
        }
        return item;
    });

    const newCart: Cart = {
        items: newItems,
        total: calculateTotal(newItems)
    };

    saveCart(newCart);
    return newCart;
}

/**
 * Svuota il carrello
 */
export function clearCart(): Cart {
    const emptyCart: Cart = { items: [], total: 0 };
    saveCart(emptyCart);
    return emptyCart;
}

/**
 * Ottiene il numero totale di articoli nel carrello
 */
export function getCartItemCount(cart: Cart): number {
    return cart.items.reduce((count, item) => count + item.quantity, 0);
}
