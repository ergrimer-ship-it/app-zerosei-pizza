// ============================================
// PRODUCT TYPES
// ============================================

export type ProductCategory = 'pizze-veraci' | 'pizze-classiche' | 'proposte' | 'calzoni' | 'bevande' | 'birre';

export interface Product {
    id: string;
    name: string;
    category: ProductCategory;
    description?: string;
    ingredients?: string[];
    price: number;
    image?: string;
    imageUrl?: string;
    available: boolean;
    featured?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Category {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    order: number;
    imageUrl?: string;
}

// ============================================
// USER & PROFILE TYPES
// ============================================

export interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    loyaltyPoints?: number;
    cassaCloudId?: string; // ID cliente in Cassa in Cloud
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// CART TYPES
// ============================================



export interface Cart {
    items: CartItem[];
    total: number;
}

// ============================================
// DELIVERY & ORDER TYPES
// ============================================

export type DeliveryType = 'pickup' | 'delivery';
export type PaymentMethod = 'cash' | 'pos' | 'satispay';

export interface DeliveryAddress {
    street: string;
    city: string;
    doorbell: string; // Nome e cognome sul campanello
}

export interface OrderDetails {
    deliveryType: DeliveryType;
    pickupTime?: string; // Orario preferito per ritiro
    deliveryAddress?: DeliveryAddress;
    paymentMethod: PaymentMethod;
    notes?: string;
}


// ============================================
// ORDER TYPES
// ============================================

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    notes?: string;
    modifications?: PizzaModification[];
}

export interface Order {
    id: string;
    userId: string;
    userProfile: {
        firstName: string;
        lastName: string;
        phone: string;
        email: string;
    };
    items: OrderItem[];
    total: number;
    status: OrderStatus;
    source?: 'whatsapp' | 'phone' | 'web';
    deliveryAddress?: string | null;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// PIZZA MODIFICATION TYPES
// ============================================

export type ModificationType = 'add' | 'remove' | 'extra';

export interface PizzaModification {
    id: string;
    name: string;
    price: number;
    type: ModificationType;
    available: boolean;
    category?: string;
}

// ============================================
// CART TYPES
// ============================================

export interface CartItem {
    product: Product;
    quantity: number;
    notes?: string;
    modifications?: PizzaModification[];
}
// ============================================

export interface NewsPromotion {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    validFrom: Date;
    validTo: Date;
    active: boolean;
    showAsPopup?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// LOYALTY TYPES (Cassa in Cloud)
// ============================================

export interface LoyaltyCard {
    customerId: string;
    points: number;
    tier?: string;
    lastUpdated: Date;
}

export interface LoyaltyReward {
    id: string;
    name: string;
    description: string;
    pointsRequired: number;
    imageUrl?: string;
    available: boolean;
}

// ============================================
// ADMIN TYPES
// ============================================

export interface AdminUser {
    id: string;
    email: string;
    role: 'admin' | 'staff';
    createdAt: Date;
}

// ============================================
// SETTINGS TYPES
// ============================================

export interface AppSettings {
    phoneNumber: string;
    whatsappNumber: string;
    instagramUrl?: string;
    facebookUrl?: string;
    websiteUrl?: string;
    cassaCloudApiKey?: string;
    cassaCloudApiUrl?: string;
}
