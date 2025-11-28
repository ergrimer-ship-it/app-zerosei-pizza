import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDf7bTYBUCJiVj8L-7nKxuWU8ueGdXc1W0",
    authDomain: "app-zerosei-pizza.firebaseapp.com",
    projectId: "app-zerosei-pizza",
    storageBucket: "app-zerosei-pizza.firebasestorage.app",
    messagingSenderId: "912128427084",
    appId: "1:912128427084:web:9f99ba64f9bd2c97f520e9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkAutunno() {
    console.log('🔍 Searching for "Autunno (stagionale)"...');
    const productsRef = collection(db, 'products');
    // Search by name (exact match might fail if there are spaces/case diffs, so let's fetch all and filter)
    const snapshot = await getDocs(productsRef);

    const product = snapshot.docs.find(doc => doc.data().name.includes('Autunno'));

    if (product) {
        const data = product.data();
        console.log('✅ Found product:', data.name);
        console.log('🆔 ID:', product.id);
        console.log('🖼️  image field:', data.image);
        console.log('🖼️  imageUrl field:', data.imageUrl);
    } else {
        console.log('❌ Product not found');
    }
}

checkAutunno();
