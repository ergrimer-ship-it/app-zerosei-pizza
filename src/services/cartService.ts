import { Cart, CartItem, Product } from '../types';

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
 * Calcola il totale del carrello
 */
export function calculateTotal(items: CartItem[]): number {
    return items.reduce((total, item) => {
        return total + (item.product.price * item.quantity);
    }, 0);
}

/**
 * Aggiunge un prodotto al carrello
 */
export function addToCart(cart: Cart, product: Product, quantity: number = 1, notes?: string): Cart {
    const existingItemIndex = cart.items.findIndex(item => item.product.id === product.id);

    let newItems: CartItem[];

    if (existingItemIndex >= 0) {
        // Prodotto già nel carrello, aggiorna quantità
        newItems = [...cart.items];
        newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newItems[existingItemIndex].quantity + quantity,
            notes: notes || newItems[existingItemIndex].notes
        };
    } else {
        // Nuovo prodotto
        newItems = [
            ...cart.items,
            { product, quantity, notes }
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
 */
export function removeFromCart(cart: Cart, productId: string): Cart {
    const newItems = cart.items.filter(item => item.product.id !== productId);

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
export function updateQuantity(cart: Cart, productId: string, quantity: number): Cart {
    if (quantity <= 0) {
        return removeFromCart(cart, productId);
    }

    const newItems = cart.items.map(item => {
        if (item.product.id === productId) {
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
 * Aggiorna le note di un prodotto nel carrello
 */
export function updateNotes(cart: Cart, productId: string, notes: string): Cart {
    const newItems = cart.items.map(item => {
        if (item.product.id === productId) {
            return { ...item, notes };
        }
        return item;
    });

    const newCart: Cart = {
        items: newItems,
        total: cart.total
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

/**
 * Verifica se un prodotto è nel carrello
 */
export function isInCart(cart: Cart, productId: string): boolean {
    return cart.items.some(item => item.product.id === productId);
}

/**
 * Ottiene la quantità di un prodotto specifico nel carrello
 */
export function getProductQuantity(cart: Cart, productId: string): number {
    const item = cart.items.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
}
