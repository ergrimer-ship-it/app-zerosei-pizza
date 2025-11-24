import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
    Product,
    Category,
    UserProfile,
    Order,
    PizzaModification,
    NewsPromotion,
    ProductCategory
} from '../types';

// ============================================
// PRODUCTS
// ============================================

export async function getAllProducts(): Promise<Product[]> {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('available', '==', true));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
    } as Product));
}

export async function getProductsByCategory(category: ProductCategory): Promise<Product[]> {
    const productsRef = collection(db, 'products');
    const q = query(
        productsRef,
        where('category', '==', category),
        where('available', '==', true)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
    } as Product));
}

export async function getProductById(id: string): Promise<Product | null> {
    const productRef = doc(db, 'products', id);
    const snapshot = await getDoc(productRef);

    if (!snapshot.exists()) {
        return null;
    }

    return {
        id: snapshot.id,
        ...snapshot.data(),
        createdAt: snapshot.data().createdAt?.toDate(),
        updatedAt: snapshot.data().updatedAt?.toDate()
    } as Product;
}

export async function createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const productsRef = collection(db, 'products');
    const docRef = await addDoc(productsRef, {
        ...product,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    });
    return docRef.id;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    const productRef = doc(db, 'products', id);
    await updateDoc(productRef, {
        ...updates,
        updatedAt: Timestamp.now()
    });
}

export async function deleteProduct(id: string): Promise<void> {
    const productRef = doc(db, 'products', id);
    await deleteDoc(productRef);
}

export async function searchProducts(searchTerm: string): Promise<Product[]> {
    const products = await getAllProducts();
    const term = searchTerm.toLowerCase();

    return products.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.ingredients.some(ing => ing.toLowerCase().includes(term))
    );
}

// ============================================
// CATEGORIES
// ============================================

export async function getAllCategories(): Promise<Category[]> {
    const categoriesRef = collection(db, 'categories');
    const q = query(categoriesRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Category));
}

export async function createCategory(category: Omit<Category, 'id'>): Promise<string> {
    const categoriesRef = collection(db, 'categories');
    const docRef = await addDoc(categoriesRef, category);
    return docRef.id;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    const categoryRef = doc(db, 'categories', id);
    await updateDoc(categoryRef, updates);
}

export async function deleteCategory(id: string): Promise<void> {
    const categoryRef = doc(db, 'categories', id);
    await deleteDoc(categoryRef);
}

// ============================================
// USER PROFILES
// ============================================

export async function getUserProfile(id: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', id);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        return null;
    }

    return {
        id: snapshot.id,
        ...snapshot.data(),
        createdAt: snapshot.data().createdAt?.toDate(),
        updatedAt: snapshot.data().updatedAt?.toDate()
    } as UserProfile;
}

export async function createUserProfile(profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const usersRef = collection(db, 'users');
    const docRef = await addDoc(usersRef, {
        ...profile,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    });
    return docRef.id;
}

export async function updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', id);
    await updateDoc(userRef, {
        ...updates,
        updatedAt: Timestamp.now()
    });
}

export async function getUserByPhone(phone: string): Promise<UserProfile | null> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phone', '==', phone), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }

    const doc = snapshot.docs[0];
    return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
    } as UserProfile;
}

// ============================================
// ORDERS
// ============================================

export async function createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ordersRef = collection(db, 'orders');
    const docRef = await addDoc(ordersRef, {
        ...order,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    });
    return docRef.id;
}

export async function getOrderById(id: string): Promise<Order | null> {
    const orderRef = doc(db, 'orders', id);
    const snapshot = await getDoc(orderRef);

    if (!snapshot.exists()) {
        return null;
    }

    return {
        id: snapshot.id,
        ...snapshot.data(),
        createdAt: snapshot.data().createdAt?.toDate(),
        updatedAt: snapshot.data().updatedAt?.toDate()
    } as Order;
}

export async function getOrdersByUser(userId: string): Promise<Order[]> {
    const ordersRef = collection(db, 'orders');
    const q = query(
        ordersRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
    } as Order));
}

export async function getAllOrders(): Promise<Order[]> {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
    } as Order));
}

export async function updateOrderStatus(id: string, status: Order['status']): Promise<void> {
    const orderRef = doc(db, 'orders', id);
    await updateDoc(orderRef, {
        status,
        updatedAt: Timestamp.now()
    });
}

// ============================================
// PIZZA MODIFICATIONS
// ============================================

export async function getAllModifications(): Promise<PizzaModification[]> {
    const modificationsRef = collection(db, 'modifications');
    const q = query(modificationsRef, where('available', '==', true));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as PizzaModification));
}

export async function createModification(modification: Omit<PizzaModification, 'id'>): Promise<string> {
    const modificationsRef = collection(db, 'modifications');
    const docRef = await addDoc(modificationsRef, modification);
    return docRef.id;
}

export async function updateModification(id: string, updates: Partial<PizzaModification>): Promise<void> {
    const modificationRef = doc(db, 'modifications', id);
    await updateDoc(modificationRef, updates);
}

export async function deleteModification(id: string): Promise<void> {
    const modificationRef = doc(db, 'modifications', id);
    await deleteDoc(modificationRef);
}

// ============================================
// NEWS & PROMOTIONS
// ============================================

export async function getActivePromotions(): Promise<NewsPromotion[]> {
    const promotionsRef = collection(db, 'promotions');
    const now = Timestamp.now();
    const q = query(
        promotionsRef,
        where('active', '==', true),
        where('validFrom', '<=', now),
        where('validTo', '>=', now)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        validFrom: doc.data().validFrom?.toDate(),
        validTo: doc.data().validTo?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
    } as NewsPromotion));
}

export async function getAllPromotions(): Promise<NewsPromotion[]> {
    const promotionsRef = collection(db, 'promotions');
    const q = query(promotionsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        validFrom: doc.data().validFrom?.toDate(),
        validTo: doc.data().validTo?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
    } as NewsPromotion));
}

export async function createPromotion(promotion: Omit<NewsPromotion, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const promotionsRef = collection(db, 'promotions');
    const docRef = await addDoc(promotionsRef, {
        ...promotion,
        validFrom: Timestamp.fromDate(promotion.validFrom),
        validTo: Timestamp.fromDate(promotion.validTo),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    });
    return docRef.id;
}

export async function updatePromotion(id: string, updates: Partial<NewsPromotion>): Promise<void> {
    const promotionRef = doc(db, 'promotions', id);
    const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now()
    };

    if (updates.validFrom) {
        updateData.validFrom = Timestamp.fromDate(updates.validFrom);
    }
    if (updates.validTo) {
        updateData.validTo = Timestamp.fromDate(updates.validTo);
    }

    await updateDoc(promotionRef, updateData);
}

export async function deletePromotion(id: string): Promise<void> {
    const promotionRef = doc(db, 'promotions', id);
    await deleteDoc(promotionRef);
}
