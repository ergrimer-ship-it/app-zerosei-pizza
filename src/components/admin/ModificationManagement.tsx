import { useState, useEffect } from 'react';
import { PizzaModification } from '../../types';
import { AVAILABLE_MODIFICATIONS } from '../../data/modifications';
import './ModificationManagement.css';

function ModificationManagement() {
    const [modifications, setModifications] = useState<PizzaModification[]>([]);
    const [editingMod, setEditingMod] = useState<PizzaModification | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState<Partial<PizzaModification>>({
        name: '',
        price: 0,
        type: 'add',
        available: true,
        category: 'Altro'
    });

    useEffect(() => {
        loadModifications();
    }, []);

    const loadModifications = () => {
        setModifications([...AVAILABLE_MODIFICATIONS]);
    };

    const handleEdit = (mod: PizzaModification) => {
        setEditingMod(mod);
        setFormData(mod);
        setIsAdding(false);
    };

    const handleAdd = () => {
        setIsAdding(true);
        setEditingMod(null);
        setFormData({
            id: `m${Date.now()}`,
            name: '',
            price: 0,
            type: 'add',
            available: true,
            category: 'Altro'
        });
    };

    const handleSave = () => {
        if (!formData.name || formData.price === undefined) {
            alert('Compila tutti i campi obbligatori');
            return;
        }

        const newMod: PizzaModification = {
            id: formData.id || `m${Date.now()}`,
            name: formData.name,
            price: formData.price,
            type: formData.type || 'add',
            available: formData.available ?? true,
            category: formData.category || 'Altro'
        };

        if (isAdding) {
            setModifications([...modifications, newMod]);
        } else if (editingMod) {
            setModifications(modifications.map(m => m.id === editingMod.id ? newMod : m));
        }

        // In produzione, qui salveresti su Firestore
        console.log('Modifiche salvate:', newMod);
        alert('Ingrediente salvato! (Nota: in produzione verrebbe salvato su Firestore)');

        handleCancel();
    };

    const handleDelete = (id: string) => {
        if (confirm('Sei sicuro di voler eliminare questo ingrediente?')) {
            setModifications(modifications.filter(m => m.id !== id));
            // In produzione, qui elimineresti da Firestore
            console.log('Ingrediente eliminato:', id);
            alert('Ingrediente eliminato! (Nota: in produzione verrebbe eliminato da Firestore)');
        }
    };

    const handleCancel = () => {
        setEditingMod(null);
        setIsAdding(false);
        setFormData({
            name: '',
            price: 0,
            type: 'add',
            available: true,
            category: 'Altro'
        });
    };

    const toggleAvailability = (id: string) => {
        setModifications(modifications.map(m =>
            m.id === id ? { ...m, available: !m.available } : m
        ));
        // In produzione, qui aggiorneresti su Firestore
    };

    return (
        <div className="modification-management">
            <div className="management-header">
                <h2>Gestione Ingredienti Extra</h2>
                <button className="btn btn-primary" onClick={handleAdd}>
                    + Aggiungi Ingrediente
                </button>
            </div>

            {(isAdding || editingMod) && (
                <div className="modification-form">
                    <h3>{isAdding ? 'Nuovo Ingrediente' : 'Modifica Ingrediente'}</h3>

                    <div className="form-group">
                        <label>Nome *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Es: Mozzarella di Bufala"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Prezzo (€) *</label>
                            <input
                                type="number"
                                step="0.50"
                                min="0"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Categoria *</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                            >
                                <option value="Formaggi">Formaggi</option>
                                <option value="Salumi">Salumi</option>
                                <option value="Verdure">Verdure</option>
                                <option value="Altro">Altro</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={formData.available}
                                onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                            />
                            Disponibile
                        </label>
                    </div>

                    <div className="form-actions">
                        <button className="btn btn-secondary" onClick={handleCancel}>
                            Annulla
                        </button>
                        <button className="btn btn-primary" onClick={handleSave}>
                            Salva
                        </button>
                    </div>
                </div>
            )}

            <div className="modifications-list">
                {['Formaggi', 'Salumi', 'Verdure', 'Altro'].map(category => {
                    const categoryMods = modifications.filter(m => m.category === category);
                    if (categoryMods.length === 0) return null;

                    return (
                        <div key={category} className="category-section">
                            <h3>{category}</h3>
                            <div className="modifications-grid">
                                {categoryMods.map(mod => (
                                    <div key={mod.id} className={`modification-card ${!mod.available ? 'unavailable' : ''}`}>
                                        <div className="mod-info">
                                            <h4>{mod.name}</h4>
                                            <p className="mod-price">€{mod.price.toFixed(2)}</p>
                                            <span className={`availability-badge ${mod.available ? 'available' : 'unavailable'}`}>
                                                {mod.available ? 'Disponibile' : 'Non disponibile'}
                                            </span>
                                        </div>
                                        <div className="mod-actions">
                                            <button
                                                className="btn-icon"
                                                onClick={() => toggleAvailability(mod.id)}
                                                title={mod.available ? 'Disabilita' : 'Abilita'}
                                            >
                                                {mod.available ? '👁️' : '👁️‍🗨️'}
                                            </button>
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleEdit(mod)}
                                                title="Modifica"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-icon delete"
                                                onClick={() => handleDelete(mod.id)}
                                                title="Elimina"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ModificationManagement;
