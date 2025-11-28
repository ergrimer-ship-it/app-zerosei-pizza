import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function checkAllImages() {
    console.log('Checking all products for valid image URLs...');
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);

    if (snapshot.empty) {
        console.log('No products found.');
        return;
    }

    let count = 0;
    let validImages = 0;

    snapshot.forEach(doc => {
        const data = doc.data();
        const image = data.image || '';
        const imageUrl = data.imageUrl || '';

        // Check if it's a real URL (starts with http)
        if (image.startsWith('http') || imageUrl.startsWith('http')) {
            console.log(`Product: ${data.name}`);
            console.log(`  ID: ${doc.id}`);
            console.log(`  image: ${image}`);
            console.log(`  imageUrl: ${imageUrl}`);
            console.log('---');
            validImages++;
        }
        count++;
    });

    console.log(`Total products: ${count}`);
    console.log(`Products with valid image URLs: ${validImages}`);
}

checkAllImages().catch(console.error);
