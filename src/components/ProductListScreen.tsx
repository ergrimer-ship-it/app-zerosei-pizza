import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, Cart } from '../types';
import { addToCart } from '../services/cartService';
import './ProductListScreen.css';

interface ProductListScreenProps {
    cart: Cart;
    setCart: (cart: Cart) => void;
}

function ProductListScreen({ cart, setCart }: ProductListScreenProps) {
    const { category } = useParams<{ category: string }>();
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Mock data for development
    useEffect(() => {
        // In a real app, this would fetch from dbService
        const mockProducts: Product[] = [
            {
                id: '1',
                name: 'Margherita',
                category: 'pizze-veraci',
                ingredients: ['Pomodoro San Marzano DOP', 'Fior di latte', 'Basilico', 'Olio EVO'],
                price: 6.50,
                available: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: '2',
                name: 'Bufalina',
                category: 'pizze-veraci',
                ingredients: ['Pomodoro San Marzano DOP', 'Mozzarella di Bufala', 'Basilico', 'Olio EVO'],
                price: 8.50,
                available: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: '3',
                name: 'Diavola',
                category: 'pizze-classiche',
                ingredients: ['Pomodoro', 'Fior di latte', 'Salame piccante', 'Basilico'],
                price: 7.50,
                available: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: '4',
                name: 'Capricciosa',
                category: 'pizze-classiche',
                ingredients: ['Pomodoro', 'Fior di latte', 'Prosciutto cotto', 'Funghi', 'Carciofini', 'Olive'],
                price: 8.50,
                available: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: '5',
                name: 'ZeroSei Special',
                category: 'nostre-proposte',
                ingredients: ['Crema di zucca', 'Provola', 'Salsiccia', 'Chips di zucca'],
                price: 10.00,
                available: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: '6',
                name: 'Calzone Classico',
                category: 'calzoni',
                ingredients: ['Ricotta', 'Salame', 'Fior di latte', 'Pomodoro'],
                price: 8.00,
                available: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        const filtered = mockProducts.filter(p => p.category === category);
        setProducts(filtered);
        setLoading(false);
    }, [category]);

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.ingredients.some(ing => ing.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getCategoryTitle = (cat: string | undefined) => {
        switch (cat) {
            case 'pizze-veraci': return 'Pizze Veraci';
            case 'nostre-proposte': return 'Le Nostre Proposte';
            case 'calzoni': return 'Calzoni';
            case 'pizze-classiche': return 'Pizze Classiche';
            default: return 'Prodotti';
        }
    };

    const handleAddToCart = (e: React.MouseEvent, product: Product) => {
        e.stopPropagation();
        const newCart = addToCart(cart, product, 1);
        setCart(newCart);
        // Optional: show toast notification
    };

    return (
        <div className="product-list-screen fade-in">
            <div className="list-header">
                <button className="back-btn" onClick={() => navigate('/menu')}>
                    ← Indietro
                </button>
                <h1>{getCategoryTitle(category)}</h1>
            </div>

            <div className="search-bar">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    placeholder="Cerca pizze o ingredienti..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="loading">Caricamento...</div>
            ) : (
                <div className="products-grid">
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            className="product-card"
                            onClick={() => navigate(`/product/${product.id}`)}
                        >
                            <div className="product-info">
                                <h3>{product.name}</h3>
                                <p className="ingredients">{product.ingredients.join(', ')}</p>
                                <p className="price">€{product.price.toFixed(2)}</p>
                            </div>
                            <button
                                className="add-btn"
                                onClick={(e) => handleAddToCart(e, product)}
                            >
                                +
                            </button>
                        </div>
                    ))}

                    {filteredProducts.length === 0 && (
                        <div className="no-results">
                            <p>Nessun prodotto trovato.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ProductListScreen;
