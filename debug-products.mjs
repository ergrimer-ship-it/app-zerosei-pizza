import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Firebase configuration (same as in your app)
const firebaseConfig = {
    apiKey: "AIzaSyDlHE7SkqVZPMPjqnPOdSJCdRvpVlBQdEY",
    authDomain: "app-zerosei-pizza.firebaseapp.com",
    projectId: "app-zerosei-pizza",
    storageBucket: "app-zerosei-pizza.firebasestorage.app",
    messagingSenderId: "1007633730863",
    appId: "1:1007633730863:web:2e8c5e6f4f3e3e3e3e3e3e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugProducts() {
    console.log('🔍 Fetching all products from Firestore...\n');

    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);

    console.log(`📊 Total products found: ${snapshot.docs.length}\n`);

    const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    // Group by category
    const byCategory = {};
    products.forEach(p => {
        const cat = p.category || 'NO_CATEGORY';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(p);
    });

    console.log('📋 Products by category:\n');
    Object.keys(byCategory).forEach(cat => {
        console.log(`\n${cat}: ${byCategory[cat].length} products`);
        byCategory[cat].forEach(p => {
            console.log(`  - ${p.name} (available: ${p.available}, id: ${p.id})`);
        });
    });

    // Check for products with available=true
    const availableProducts = products.filter(p => p.available === true);
    console.log(`\n\n✅ Products with available=true: ${availableProducts.length}`);

    // Check for products with available=false or undefined
    const unavailableProducts = products.filter(p => p.available !== true);
    console.log(`❌ Products with available!=true: ${unavailableProducts.length}`);
    if (unavailableProducts.length > 0) {
        console.log('\nUnavailable products:');
        unavailableProducts.forEach(p => {
            console.log(`  - ${p.name} (available: ${p.available})`);
        });
    }
}

debugProducts().catch(console.error);
