import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FavoriteItem, Cart } from '../types';
import { getFavoritesByUser, removeFavorite } from '../services/dbService';
import { addToCart } from '../services/cartService';
import './FavoritesScreen.css';

interface FavoritesScreenProps {
    cart: Cart;
    setCart: (cart: Cart) => void;
}

function FavoritesScreen({ cart, setCart }: FavoritesScreenProps) {
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        const userProfileStr = localStorage.getItem('user_profile');
        if (!userProfileStr) {
            setLoading(false);
            return;
        }

        try {
            const userProfile = JSON.parse(userProfileStr);
            if (userProfile.id) {
                const data = await getFavoritesByUser(userProfile.id);
                setFavorites(data);
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
        setLoading(false);
    };

    const handleRemove = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Rimuovere questo preferito?')) {
            try {
                await removeFavorite(id);
                setFavorites(prev => prev.filter(item => item.id !== id));
            } catch (error) {
                console.error('Error removing favorite:', error);
            }
        }
    };

    const handleAddToCart = (item: FavoriteItem, e: React.MouseEvent) => {
        e.stopPropagation();
        const newCart = addToCart(
            cart,
            item.product,
            1,
            item.notes,
            item.modifications
        );
        setCart(newCart);
        alert('Aggiunto al carrello! 🛒');
    };

    if (loading) return <div className="favorites-screen"><div className="loading">Caricamento...</div></div>;

    const userProfileStr = localStorage.getItem('user_profile');
    if (!userProfileStr) {
        return (
            <div className="favorites-screen fade-in">
                <div className="login-prompt">
                    <span className="lock-icon">🔒</span>
                    <h2>Accedi per vedere i tuoi Preferiti</h2>
                    <p>Salva le tue pizze preferite per ordinarle velocemente!</p>
                    <button className="btn btn-primary" onClick={() => navigate('/profile')}>
                        Accedi / Registrati
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="favorites-screen fade-in">
            <h1 className="screen-title">I Miei Preferiti ❤️</h1>

            {favorites.length === 0 ? (
                <div className="empty-favorites">
                    <p>Non hai ancora salvato nessun preferito.</p>
                    <button className="btn btn-secondary" onClick={() => navigate('/menu')}>
                        Vai al Menù
                    </button>
                </div>
            ) : (
                <div className="favorites-list">
                    {favorites.map((item) => (
                        <div key={item.id} className="favorite-card">
                            <div className="favorite-header">
                                <h3>{item.product.name}</h3>
                                <button
                                    className="remove-btn"
                                    onClick={(e) => handleRemove(item.id, e)}
                                    aria-label="Rimuovi"
                                >
                                    🗑️
                                </button>
                            </div>

                            <div className="favorite-details">
                                {item.modifications && item.modifications.length > 0 && (
                                    <div className="favorite-mods">
                                        <strong>Modifiche:</strong>
                                        <ul>
                                            {item.modifications.map(mod => (
                                                <li key={mod.id}>+ {mod.name}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {item.notes && (
                                    <div className="favorite-notes">
                                        <strong>Note:</strong> {item.notes}
                                    </div>
                                )}
                            </div>

                            <div className="favorite-actions">
                                <button
                                    className="btn btn-secondary edit-fav-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/product/${item.product.id}`, {
                                            state: {
                                                favoriteId: item.id,
                                                initialModifications: item.modifications,
                                                initialNotes: item.notes
                                            }
                                        });
                                    }}
                                >
                                    ✏️ Modifica
                                </button>
                                <button
                                    className="btn btn-primary add-fav-to-cart"
                                    onClick={(e) => handleAddToCart(item, e)}
                                >
                                    Aggiungi al Carrello
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default FavoritesScreen;
