// Migration script to upload products to Firebase
// Run with: node migrate-products.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

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

// Import products from local file
const products = [
    // Pizze Veraci
    { name: 'Stracciatella', description: 'Pomodoro, pomodorini IN USCITA Crudo di Parma, Stracciatella di Bufala, Basilico', price: 10.00, category: 'pizze-veraci', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Mortazza', description: 'Bufala IN USCITA Rose di Mortadella, stracciatella di Bufala, granella di pistacchio', price: 10.00, category: 'pizze-veraci', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Zero Sei', description: 'Bufala, Porchetta d\'Ariccia, Patate, cipolla caramellata, Scamorza', price: 9.80, category: 'pizze-veraci', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Autunno (stagionale)', description: 'Crema di zucca, bufala, funghi misto bosco IN USCITA rose di speck, grana a scaglie', price: 9.80, category: 'pizze-veraci', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Dolce inverno (stagionale)', description: 'Crema di zucca, bufala, salsiccia, gorgonzola IN USCITA amaretto sbriciolato', price: 9.80, category: 'pizze-veraci', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Sbriciolata', description: 'Bufala, zucchine grigliate, IN USCITA tartare di crudo marinata, pomodorini confitati', price: 9.60, category: 'pizze-veraci', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Made in Sud', description: 'Bufala, porchetta d\'Ariccia IGP, friarelli, \'nduja', price: 9.50, category: 'pizze-veraci', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Tricolore', description: 'Bordo ripieno di ricotta fresca, bufala, salamino piccante, spinaci', price: 9.50, category: 'pizze-veraci', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Saporita', description: 'Bufala, patate al forno, porcini, pancetta affumicata, gratinato', price: 9.50, category: 'pizze-veraci', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Salmone e Lime', description: 'Bufala, philadelphia IN USCITA salmone affumicato, scorza di lime grattugiato', price: 9.00, category: 'pizze-veraci', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Montanara', description: 'Pomodoro, bufala, porcini, mascarpone, IN USCITA speck, grana a scaglie', price: 9.00, category: 'pizze-veraci', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Balsamica', description: 'Bufala, radicchio IN USCITA pancetta arrotolata, grana a scaglie, glassa d\'aceto', price: 9.00, category: 'pizze-veraci', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Kinder (pizza dolce)', description: 'Base nutella, kinder cioccolato, kinder bueno, ferrero rocher, granella di nocciole', price: 9.00, category: 'pizze-veraci', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Calabrese', description: 'Pomodoro, bufala, melanzane a funghetto, \'nduja IN USCITA stracciatella di bufala', price: 8.80, category: 'pizze-veraci', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Mediterranea', description: 'Pomodoro, olive, pomodorini, capperi IN USCITA stracciatella di bufala, basilico', price: 8.60, category: 'pizze-veraci', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Agrodolce', description: 'bufala, radicchio, cipolla caramellata, pancetta affumicata', price: 8.60, category: 'pizze-veraci', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Salsiccia e friarielli', description: 'Bufala, salsiccia, friarielli', price: 8.60, category: 'pizze-veraci', image: '/placeholder-pizza.jpg', available: true },
    { name: 'William\'s', description: 'Bufala, pere, gorgonzola, grana grattugiato IN USCITA prosciutto crudo di Parma', price: 8.60, category: 'pizze-veraci', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Dop', description: 'Pomodoro, bufala, basilico, grana grattugiato, olio evo', price: 8.50, category: 'pizze-veraci', image: '/placeholder-pizza.jpg', available: true },

    // Pizze Classiche
    { name: 'Bresaola rucola e grana', description: 'Pomodoro, Mozzarella IN USCITA bresaola, rucola, grana a scaglie', price: 8.50, category: 'pizze-classiche', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Capricciosa', description: 'Pomodoro, Mozzarella, prosciutto cotto, funghi, olive nere, carciofi', price: 8.00, category: 'pizze-classiche', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Fritte e Wurstel', description: 'Pomodoro, mozzarella, patatine fritte, wurstel', price: 8.00, category: 'pizze-classiche', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Patate e Salsiccia', description: 'Pomodoro, mozzarella, patate al forno, salsiccia', price: 8.00, category: 'pizze-classiche', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Vegetariana', description: 'Pomodoro, mozzarella, verdure miste', price: 7.50, category: 'pizze-classiche', image: '/placeholder-pizza.jpg', available: true },
    { name: '4 Stagioni', description: 'Pomodoro, mozzarella, prosciutto cotto, funghi, acciughe, carciofi', price: 7.50, category: 'pizze-classiche', image: '/placeholder-pizza.jpg', available: true },
    { name: '4 Formaggi', description: 'Pomodoro, mozzarella, emmenthal, gorgonzola, grana grattugiato', price: 7.50, category: 'pizze-classiche', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Mascarpone e crudo', description: 'Pomodoro, mozzarella, mascarpone IN USCITA Prosciutto crudo di Parma', price: 7.50, category: 'pizze-classiche', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Napoletana', description: 'Pomodoro, mozzarella, acciughe, capperi, origano', price: 7.00, category: 'pizze-classiche', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Tonno e cipolla', description: 'Pomodoro, mozzarella, tonno, cipolla', price: 7.00, category: 'pizze-classiche', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Prosciutto e funghi', description: 'Pomodoro, mozzarella, prosciutto cotto, funghi', price: 7.00, category: 'pizze-classiche', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Margherita', description: 'Pomodoro, mozzarella', price: 5.00, category: 'pizze-classiche', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Marinara', description: 'Pomodoro, origano, olio all\'aglio', price: 4.50, category: 'pizze-classiche', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Schiacciata', description: 'Olio, sale, rosmarino', price: 3.50, category: 'pizze-classiche', image: '/placeholder-pizza.jpg', available: true },

    // Le Nostre Proposte
    { name: 'Super', description: 'Pomodoro, Mozzarella, prosciutto cotto, salamino piccante, wurstel, salsiccia, patatine', price: 8.00, category: 'proposte', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Affumicata', description: 'Pomodoro, mozzarella, pancetta affumicata, porcini, salsiccia, grana grattugiato', price: 7.50, category: 'proposte', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Norvegese', description: 'pomodoro, mozzarella, zucchine grigliate, brie, olive nere IN USCITA salmone affumicato', price: 8.80, category: 'proposte', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Lopez', description: 'pomodoro, mozzarella, emmenthal, gorgonzola, salamino piccante, peperoni al forno', price: 8.80, category: 'proposte', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Friulana', description: 'pomodoro, mozzarella, funghi misto bosco, gorgonzola IN USCITA Speck', price: 8.50, category: 'proposte', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Estiva', description: 'pomodoro, mozzarella, mascarpone IN USCITA Prosciutto crudo di Parma, rucola', price: 8.50, category: 'proposte', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Squisita', description: 'pomodoro, mozzarella, peperoni al forno, salsiccia, gorgonzola, olive', price: 8.00, category: 'proposte', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Fumè', description: 'pomodoro, mozzarella, prosciutto cotto, porcini, olive IN USCITA ricotta affumicata', price: 8.00, category: 'proposte', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Trentina', description: 'mozzarella, radicchio, gorgonzola IN USCITA speck e granella di noci', price: 8.00, category: 'proposte', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Casareccia', description: 'pomodoro, mozzarella, salamino piccante, salsiccia, gorgonzola', price: 8.00, category: 'proposte', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Rustica', description: 'pomodoro, mozzarella, patate al forno IN USCITA pancetta arrotolata', price: 8.00, category: 'proposte', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Bufala', description: 'pomodoro, mozzarella di Bufala, pomodorini IN USCITA Basilico fresco e olio EVO', price: 7.80, category: 'proposte', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Tirolese', description: 'pomodoro, mozzarella, emmenthal, funghi IN USCITA Speck', price: 7.80, category: 'proposte', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Arrabbiata', description: 'pomodoro, tonno, olive, capperi, peperoncino IN USCITA pomodori confiti, olio piccante', price: 7.80, category: 'proposte', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Caprese', description: 'Pomodoro IN USCITA mozzarella di Bufala, pomodorini, origano, basilico fresco, olio EVO', price: 7.80, category: 'proposte', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Appetitosa', description: 'pomodoro, mozzarella, zucchine, salsiccia IN USCITA ricotta affumicata', price: 7.50, category: 'proposte', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Contadina', description: 'pomodoro, mozzarella, radicchio, brie, salsiccia', price: 7.50, category: 'proposte', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Gustosa', description: 'mozzarella, prosciutto cotto, patate al forno, brie, grana grattugiato', price: 7.50, category: 'proposte', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Delizia', description: 'mozzarella, melanzane a funghetto, prosciutto cotto, ricotta fresca, basilico', price: 7.50, category: 'proposte', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Delicata', description: 'mozzarella, zucchine grigliate, philadelphia, gratinato', price: 7.50, category: 'proposte', image: '/placeholder-pizza.jpg', available: true },

    // Calzoni
    { name: 'Calzone Classico', description: 'Pomodoro, mozzarella, prosciutto cotto, funghi, ricotta', price: 7.60, category: 'calzoni', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Calzone Napoletano', description: 'Pomodoro, mozzarella, ricotta fresca, salamino piccante, pepe', price: 7.60, category: 'calzoni', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Calzone Vegetariano', description: 'Pomodoro, mozzarella, scamorza, melanzane, zucchine, peperoni', price: 7.60, category: 'calzoni', image: '/placeholder-pizza.jpg', available: true },
    { name: 'Calzone ai formaggi', description: 'Pomodoro, mozzarella, emmenthal, scamorza, gorgonzola', price: 7.60, category: 'calzoni', image: '/placeholder-pizza.jpg', available: true },

    // Bevande
    { name: 'CocaCola lattina 33', description: 'Lattina 33cl', price: 2.50, category: 'bevande', image: '/placeholder-drink.jpg', available: true },
    { name: 'Fanta lattina 33', description: 'Lattina 33cl', price: 2.50, category: 'bevande', image: '/placeholder-drink.jpg', available: true },
    { name: 'CocaCola Zero lattina 33', description: 'Lattina 33cl', price: 2.50, category: 'bevande', image: '/placeholder-drink.jpg', available: true },
    { name: 'Tè Pesca lattina 33', description: 'Lattina 33cl', price: 2.50, category: 'bevande', image: '/placeholder-drink.jpg', available: true },
    { name: 'Tè Limone lattina 33', description: 'Lattina 33cl', price: 2.50, category: 'bevande', image: '/placeholder-drink.jpg', available: true },
    { name: 'Cocacola Bott 1,5 L', description: 'Bottiglia 1,5L', price: 4.00, category: 'bevande', image: '/placeholder-drink.jpg', available: true },
    { name: 'CocaCola Bott Zero 1,5 L', description: 'Bottiglia 1,5L', price: 4.00, category: 'bevande', image: '/placeholder-drink.jpg', available: true },
    { name: 'Fanta Bott 1,5 L', description: 'Bottiglia 1,5L', price: 4.00, category: 'bevande', image: '/placeholder-drink.jpg', available: true },
    { name: 'Acqua bott 0,5', description: 'Bottiglia 0,5L', price: 1.00, category: 'bevande', image: '/placeholder-drink.jpg', available: true },

    // Birre
    { name: 'Becks 33', description: 'Bottiglia 33cl', price: 3.00, category: 'birre', image: '/placeholder-beer.jpg', available: true },
    { name: 'Raffo Grezza 33', description: 'Bottiglia 33cl', price: 3.00, category: 'birre', image: '/placeholder-beer.jpg', available: true },
    { name: 'Ichnusa non filtrata 33', description: 'Bottiglia 33cl', price: 3.00, category: 'birre', image: '/placeholder-beer.jpg', available: true },
    { name: 'Ceres 33', description: 'Bottiglia 33cl', price: 3.50, category: 'birre', image: '/placeholder-beer.jpg', available: true },
    { name: 'Messina Cristalli di sale 3', description: 'Bottiglia 33cl', price: 3.00, category: 'birre', image: '/placeholder-beer.jpg', available: true },
    { name: 'Moretti 66', description: 'Bottiglia 66cl', price: 4.00, category: 'birre', image: '/placeholder-beer.jpg', available: true },
    { name: 'Heineken 66', description: 'Bottiglia 66cl', price: 4.00, category: 'birre', image: '/placeholder-beer.jpg', available: true }
];

async function migrateProducts() {
    console.log(`Starting migration of ${products.length} products...`);

    let successCount = 0;
    let errorCount = 0;

    for (const product of products) {
        try {
            await addDoc(collection(db, 'products'), {
                ...product,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
            successCount++;
            console.log(`✓ Migrated: ${product.name}`);
        } catch (error) {
            errorCount++;
            console.error(`✗ Error migrating ${product.name}:`, error.message);
        }
    }

    console.log(`\n=== Migration Complete ===`);
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Total: ${products.length}`);

    process.exit(0);
}

migrateProducts();
