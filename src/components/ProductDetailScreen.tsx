import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, Cart, PizzaModification } from '../types';
import { addToCart } from '../services/cartService';
import { openWhatsApp } from '../services/whatsappService';
import { getProductById } from '../services/dbService';
import { AVAILABLE_MODIFICATIONS } from '../data/modifications';
import './ProductDetailScreen.css';

interface ProductDetailScreenProps {
    cart: Cart;
    setCart: (cart: Cart) => void;
}

function ProductDetailScreen({ cart, setCart }: ProductDetailScreenProps) {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [selectedModifications, setSelectedModifications] = useState<PizzaModification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProduct();
    }, [id]);

    const loadProduct = async () => {
        if (!id) return;
        try {
            const data = await getProductById(id);
            setProduct(data);
        } catch (error) {
            console.error('Error loading product:', error);
        }
        setLoading(false);
    };

    const handleQuantityChange = (delta: number) => {
        const newQuantity = quantity + delta;
        if (newQuantity >= 1) {
            setQuantity(newQuantity);
        }
    };

    const toggleModification = (modification: PizzaModification) => {
        setSelectedModifications(prev => {
            const exists = prev.find(m => m.id === modification.id);
            if (exists) {
                return prev.filter(m => m.id !== modification.id);
            } else {
                return [...prev, modification];
            }
        });
    };

    const getModificationsTotal = () => {
        return selectedModifications.reduce((sum, mod) => sum + mod.price, 0);
    };

    const getTotalPrice = () => {
        if (!product) return 0;
        return (product.price + getModificationsTotal()) * quantity;
    };

    const handleAddToCart = () => {
        if (product) {
            const productWithMods = {
                ...product,
                modifications: selectedModifications
            };
            const newCart = addToCart(cart, productWithMods, quantity, notes);
            setCart(newCart);
            navigate(-1); // Go back
        }
    };

    const handleOrderNow = () => {
        if (product) {
            const productWithMods = {
                ...product,
                modifications: selectedModifications
            };
            const tempCart = {
                items: [{ product: productWithMods, quantity, notes }],
                total: getTotalPrice()
            };

            const userProfile = localStorage.getItem('user_profile');
            let userInfo;

            if (userProfile) {
                const profile = JSON.parse(userProfile);
                userInfo = {
                    name: `${profile.firstName} ${profile.lastName}`,
                    phone: profile.phone
                };
            }

            openWhatsApp(tempCart, userInfo);
        }
    };

    if (loading) return <div className="loading">Caricamento...</div>;
    if (!product) return <div className="error">Prodotto non trovato</div>;

    return (
        <div className="product-detail-screen fade-in">
            <button className="back-btn-floating" onClick={() => navigate(-1)}>
                ←
            </button>

            <div className="product-image-container">
                {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="product-image" />
                ) : (
                    <div className="product-image-placeholder">🍕</div>
                )}
            </div>

            <div className="product-details-content">
                <div className="product-header">
                    <h1>{product.name}</h1>
                    <span className="product-price">€{product.price.toFixed(2)}</span>
                </div>

                <p className="product-ingredients">
                    {product.description || product.ingredients?.join(', ') || 'Nessuna descrizione disponibile'}
                </p>

                {product.category.includes('pizze') && (
                    <div className="modifications-section">
                        <h3>Aggiungi ingredienti</h3>
                        {['Formaggi', 'Salumi', 'Verdure', 'Altro'].map(category => {
                            const categoryMods = AVAILABLE_MODIFICATIONS.filter(m => m.category === category && m.available);
                            if (categoryMods.length === 0) return null;

                            return (
                                <div key={category} className="modification-category">
                                    <h4>{category}</h4>
                                    <div className="modification-grid">
                                        {categoryMods.map(mod => (
                                            <button
                                                key={mod.id}
                                                className={`modification-btn ${selectedModifications.find(m => m.id === mod.id) ? 'selected' : ''}`}
                                                onClick={() => toggleModification(mod)}
                                            >
                                                <span className="mod-name">{mod.name}</span>
                                                <span className="mod-price">+€{mod.price.toFixed(2)}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="notes-section">
                    <label htmlFor="notes">Note per la cucina</label>
                    <textarea
                        id="notes"
                        placeholder="Es: Ben cotta, no basilico..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                    />
                </div>

                <div className="quantity-selector">
                    <button
                        className="qty-btn"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                    >
                        -
                    </button>
                    <span className="qty-value">{quantity}</span>
                    <button
                        className="qty-btn"
                        onClick={() => handleQuantityChange(1)}
                    >
                        +
                    </button>
                </div>

                <div className="action-buttons">
                    <button className="btn btn-primary add-to-cart-btn" onClick={handleAddToCart}>
                        Aggiungi al carrello - €{getTotalPrice().toFixed(2)}
                    </button>

                    <button className="btn btn-whatsapp order-now-btn" onClick={handleOrderNow}>
                        Ordina subito su WhatsApp
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProductDetailScreen;
