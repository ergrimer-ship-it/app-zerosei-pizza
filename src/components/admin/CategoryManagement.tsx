import { useState, useEffect } from 'react';
import { Category } from '../../types';
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../../services/dbService';
import './CategoryManagement.css';

interface CategoryFormData {
    name: string;
    description: string;
    icon: string;
    order: number;
    imageUrl: string;
}

function CategoryManagement() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const [formData, setFormData] = useState<CategoryFormData>({
        name: '',
        description: '',
        icon: '',
        order: 0,
        imageUrl: '',
    });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const data = await getAllCategories();
            setCategories(data);
        } catch (error) {
            console.error('Error loading categories:', error);
            alert('Errore nel caricamento delle categorie');
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, formData);
                alert('Categoria aggiornata con successo!');
            } else {
                await createCategory(formData);
                alert('Categoria creata con successo!');
            }
            resetForm();
            loadCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Errore nel salvataggio della categoria');
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            icon: category.icon || '',
            order: category.order,
            imageUrl: category.imageUrl || '',
        });
        setShowForm(true);
    };

    const handleDelete = async (category: Category) => {
        if (!confirm(`Sei sicuro di voler eliminare la categoria "${category.name}"?`)) {
            return;
        }
        try {
            await deleteCategory(category.id);
            alert('Categoria eliminata con successo!');
            loadCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('Errore nell\'eliminazione della categoria');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            icon: '',
            order: 0,
            imageUrl: '',
        });
        setEditingCategory(null);
        setShowForm(false);
    };

    if (loading) {
        return <div className="loading">Caricamento categorie...</div>;
    }

    return (
        <div className="category-management">
            <div className="cm-header">
                <h2>Gestione Categorie</h2>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? '✕ Chiudi' : '+ Nuova Categoria'}
                </button>
            </div>

            {showForm && (
                <div className="category-form-container">
                    <h3>{editingCategory ? 'Modifica Categoria' : 'Nuova Categoria'}</h3>
                    <form onSubmit={handleSubmit} className="category-form">
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
                                <label>Ordine *</label>
                                <input
                                    type="number"
                                    value={formData.order}
                                    onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                    required
                                />
                                <small style={{ color: '#666', fontSize: '0.85rem' }}>
                                    Ordine di visualizzazione nel menu
                                </small>
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
                                <label>Icona</label>
                                <input
                                    type="text"
                                    placeholder="es. 🍕"
                                    value={formData.icon}
                                    onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>URL Immagine</label>
                                <input
                                    type="text"
                                    placeholder="URL dell'immagine della categoria"
                                    value={formData.imageUrl}
                                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary">
                                {editingCategory ? 'Aggiorna' : 'Crea'} Categoria
                            </button>
                            <button type="button" className="btn btn-outline" onClick={resetForm}>
                                Annulla
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="categories-table">
                <table>
                    <thead>
                        <tr>
                            <th>Ordine</th>
                            <th>Nome</th>
                            <th>Descrizione</th>
                            <th>Icona</th>
                            <th>Azioni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map(category => (
                            <tr key={category.id}>
                                <td className="order-cell">{category.order}</td>
                                <td>
                                    <strong>{category.name}</strong>
                                </td>
                                <td>
                                    <div className="category-desc">{category.description || '-'}</div>
                                </td>
                                <td className="icon-cell">{category.icon || '-'}</td>
                                <td className="actions-cell">
                                    <button
                                        className="btn-icon btn-edit"
                                        onClick={() => handleEdit(category)}
                                        title="Modifica"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="btn-icon btn-delete"
                                        onClick={() => handleDelete(category)}
                                        title="Elimina"
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {categories.length === 0 && (
                    <div className="empty-state">
                        <p>Nessuna categoria trovata</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CategoryManagement;
