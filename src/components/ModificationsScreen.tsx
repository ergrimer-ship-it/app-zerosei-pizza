import './ModificationsScreen.css';

function ModificationsScreen() {
    const modifications = [
        { name: 'Mozzarella di Bufala', price: 2.00, category: 'Formaggi' },
        { name: 'Prosciutto Crudo', price: 2.00, category: 'Salumi' },
        { name: 'Speck', price: 1.50, category: 'Salumi' },
        { name: 'Salame Piccante', price: 1.00, category: 'Salumi' },
        { name: 'Funghi Porcini', price: 2.00, category: 'Verdure' },
        { name: 'Rucola', price: 0.50, category: 'Verdure' },
        { name: 'Scaglie di Grana', price: 1.00, category: 'Formaggi' },
        { name: 'Doppia Mozzarella', price: 1.50, category: 'Formaggi' },
        { name: 'Patatine Fritte', price: 1.50, category: 'Altro' },
        { name: 'Uovo', price: 1.00, category: 'Altro' }
    ];

    // Group by category
    const groupedModifications = modifications.reduce((acc, curr) => {
        if (!acc[curr.category]) {
            acc[curr.category] = [];
        }
        acc[curr.category].push(curr);
        return acc;
    }, {} as Record<string, typeof modifications>);

    return (
        <div className="modifications-screen fade-in">
            <h1 className="screen-title">Listino Aggiunte</h1>
            <p className="screen-subtitle">Personalizza la tua pizza con i nostri ingredienti extra</p>

            <div className="modifications-list">
                {Object.entries(groupedModifications).map(([category, items]) => (
                    <div key={category} className="modification-category">
                        <h2>{category}</h2>
                        <div className="items-grid">
                            {items.map((item, index) => (
                                <div key={index} className="modification-item">
                                    <span className="item-name">{item.name}</span>
                                    <span className="item-price">+€{item.price.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ModificationsScreen;
