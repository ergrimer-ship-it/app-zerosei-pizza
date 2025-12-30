import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import https from 'https';
import fs from 'fs';
import path from 'path';

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

async function fetchAndDownloadLogo() {
    try {
        console.log('Fetching logo URL from config/general...');
        const docRef = doc(db, 'config', 'general');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const logoUrl = docSnap.data().logoUrl;
            if (logoUrl) {
                console.log('Found URL:', logoUrl);
                downloadImage(logoUrl, 'public/icons/icon-192.png');
                downloadImage(logoUrl, 'public/icons/icon-512.png');
            } else {
                console.error('Logo URL not found in config/general');
            }
        } else {
            console.error('config/general document does not exist');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function downloadImage(url, dest) {
    const file = fs.createWriteStream(dest);
    https.get(url, function (response) {
        response.pipe(file);
        file.on('finish', function () {
            file.close(() => {
                console.log(`Downloaded to ${dest}`);
                process.exit(0);
            });
        });
    }).on('error', function (err) {
        fs.unlink(dest);
        console.error(`Error downloading ${dest}:`, err.message);
    });
}

fetchAndDownloadLogo();
