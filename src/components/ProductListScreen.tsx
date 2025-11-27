import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, Cart, ProductCategory } from '../types';
import { addToCart } from '../services/cartService';
import { getProductsByCategory } from '../services/dbService';
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

    useEffect(() => {
        loadProducts();
    }, [category]);

    const loadProducts = async () => {
        setLoading(true);
        console.log('🔍 ProductListScreen: Loading products for category:', category);
        try {
            if (category) {
                const data = await getProductsByCategory(category as ProductCategory);
                console.log('✅ ProductListScreen: Products loaded:', data.length, data);
                setProducts(data);
            } else {
                console.log('⚠️ ProductListScreen: No category specified');
            }
        } catch (error) {
            console.error('❌ ProductListScreen: Error loading products:', error);
        }
        setLoading(false);
    };

    const filteredProducts = products
        .filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.ingredients?.some(ing => ing.toLowerCase().includes(searchTerm.toLowerCase())) ?? false) ||
            (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
        )
        .sort((a, b) => b.price - a.price); // Sort by price descending (most expensive first)

    const getCategoryTitle = (cat: string | undefined) => {
        switch (cat) {
            case 'pizze-veraci': return 'Pizze Veraci';
            case 'pizze-classiche': return 'Pizze Classiche';
            case 'proposte': return 'Le Nostre Proposte';
            case 'calzoni': return 'Calzoni';
            case 'bevande': return 'Bevande';
            case 'birre': return 'Birre';
            default: return 'Prodotti';
        }
    };

    const handleAddToCart = (e: React.MouseEvent, product: Product) => {
        e.stopPropagation();
        const newCart = addToCart(cart, product, 1);
        setCart(newCart);
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
                                <p className="ingredients">{product.description || product.ingredients?.join(', ') || ''}</p>
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
