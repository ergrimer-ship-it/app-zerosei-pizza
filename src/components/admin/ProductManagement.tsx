import { useState, useEffect } from 'react';
import { Product, ProductCategory } from '../../types';
import { getAllProductsForAdmin, createProduct, updateProduct, deleteProduct } from '../../services/dbService';
import './ProductManagement.css';

interface ProductFormData {
    name: string;
    description: string;
    price: number;
    category: ProductCategory;
    image: string;
    available: boolean;
}

function ProductManagement() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        description: '',
        price: 0,
        category: 'pizze-veraci',
        image: '/placeholder-pizza.jpg',
        available: true,
    });

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const data = await getAllProductsForAdmin();
            setProducts(data);
        } catch (error) {
            console.error('Error loading products:', error);
            alert('Errore nel caricamento dei prodotti');
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, formData);
                alert('Prodotto aggiornato con successo!');
            } else {
                await createProduct(formData);
                alert('Prodotto creato con successo!');
            }
            resetForm();
            loadProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Errore nel salvataggio del prodotto');
        }
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
            price: product.price,
            category: product.category,
            image: product.image || '/placeholder-pizza.jpg',
            available: product.available,
        });
        setShowForm(true);
    };

    const handleDelete = async (product: Product) => {
        if (!confirm(`Sei sicuro di voler eliminare "${product.name}"?`)) {
            return;
        }
        try {
            await deleteProduct(product.id);
            alert('Prodotto eliminato con successo!');
            loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Errore nell\'eliminazione del prodotto');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: 0,
            category: 'pizze-veraci',
            image: '/placeholder-pizza.jpg',
            available: true,
        });
        setEditingProduct(null);
        setShowForm(false);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getCategoryLabel = (category: ProductCategory): string => {
        const labels: Record<ProductCategory, string> = {
            'pizze-veraci': 'Pizze Veraci',
            'pizze-classiche': 'Pizze Classiche',
            'proposte': 'Le Nostre Proposte',
            'calzoni': 'Calzoni',
            'bevande': 'Bevande',
            'birre': 'Birre',
        };
        return labels[category];
    };

    if (loading) {
        return <div className="loading">Caricamento prodotti...</div>;
    }

    return (
        <div className="product-management">
            <div className="pm-header">
                <h2>Gestione Prodotti</h2>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? '✕ Chiudi' : '+ Nuovo Prodotto'}
                </button>
            </div>

            {showForm && (
                <div className="product-form-container">
                    <h3>{editingProduct ? 'Modifica Prodotto' : 'Nuovo Prodotto'}</h3>
                    <form onSubmit={handleSubmit} className="product-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Nome *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Prezzo (€) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Descrizione</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Categoria *</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                                    required
                                >
                                    <option value="pizze-veraci">Pizze Veraci</option>
                                    <option value="pizze-classiche">Pizze Classiche</option>
                                    <option value="proposte">Le Nostre Proposte</option>
                                    <option value="calzoni">Calzoni</option>
                                    <option value="bevande">Bevande</option>
                                    <option value="birre">Birre</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>URL Immagine prodotto</label>
                                <input
                                    type="text"
                                    placeholder="Incolla qui il link dell'immagine (es. Google Drive)"
                                    value={formData.image}
                                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                                />
                                <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '4px' }}>
                                    Carica l'immagine su Google Drive e incolla qui il link diretto
                                </small>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.available}
                                    onChange={e => setFormData({ ...formData, available: e.target.checked })}
                                />{' '}Disponibile
                            </label>
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary">
                                {editingProduct ? 'Aggiorna' : 'Crea'} Prodotto
                            </button>
                            <button type="button" className="btn btn-outline" onClick={resetForm}>
                                Annulla
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="pm-search">
                <input
                    type="text"
                    placeholder="Cerca prodotti..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <span className="product-count">{filteredProducts.length} prodotti</span>
            </div>

            <div className="products-table">
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Categoria</th>
                            <th>Prezzo</th>
                            <th>Stato</th>
                            <th>Azioni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(product => (
                            <tr key={product.id}>
                                <td>
                                    <strong>{product.name}</strong>
                                    {product.description && (
                                        <div className="product-desc">{product.description}</div>
                                    )}
                                </td>
                                <td>
                                    <span className="category-badge">{getCategoryLabel(product.category)}</span>
                                </td>
                                <td className="price-cell">€{product.price.toFixed(2)}</td>
                                <td>
                                    <span className={`status-badge ${product.available ? 'available' : 'unavailable'}`}>
                                        {product.available ? 'Disponibile' : 'Non disponibile'}
                                    </span>
                                </td>
                                <td className="actions-cell">
                                    <button
                                        className="btn-icon btn-edit"
                                        onClick={() => handleEdit(product)}
                                        title="Modifica"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="btn-icon btn-delete"
                                        onClick={() => handleDelete(product)}
                                        title="Elimina"
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredProducts.length === 0 && (
                    <div className="empty-state">
                        <p>Nessun prodotto trovato</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProductManagement;
