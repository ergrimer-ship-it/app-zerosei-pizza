import { useState, useEffect } from 'react';
import { NewsPromotion } from '../../types';
import { getAllPromotions, createPromotion, updatePromotion, deletePromotion, uploadPromotionImage } from '../../services/dbService';
import './PromotionManagement.css';

interface PromotionFormData {
    title: string;
    description: string;
    imageUrl: string;
    validFrom: Date;
    validTo: Date;
    active: boolean;
    showAsPopup: boolean;
}

function PromotionManagement() {
    const [promotions, setPromotions] = useState<NewsPromotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState<NewsPromotion | null>(null);

    const [formData, setFormData] = useState<PromotionFormData>({
        title: '',
        description: '',
        imageUrl: '',
        validFrom: new Date(),
        validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 giorni
        active: true,
        showAsPopup: false,
    });

    useEffect(() => {
        loadPromotions();
    }, []);

    const loadPromotions = async () => {
        setLoading(true);
        try {
            const data = await getAllPromotions();
            setPromotions(data);
        } catch (error) {
            console.error('Error loading promotions:', error);
            alert('Errore nel caricamento delle promozioni');
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPromotion) {
                await updatePromotion(editingPromotion.id, formData);
                alert('Promozione aggiornata con successo!');
            } else {
                await createPromotion(formData);
                alert('Promozione creata con successo!');
            }
            resetForm();
            loadPromotions();
        } catch (error) {
            console.error('Error saving promotion:', error);
            alert('Errore nel salvataggio della promozione');
        }
    };

    const handleEdit = (promotion: NewsPromotion) => {
        setEditingPromotion(promotion);
        setFormData({
            title: promotion.title,
            description: promotion.description,
            imageUrl: promotion.imageUrl || '',
            validFrom: promotion.validFrom,
            validTo: promotion.validTo,
            active: promotion.active,
            showAsPopup: promotion.showAsPopup || false,
        });
        setShowForm(true);
    };

    const handleDelete = async (promotion: NewsPromotion) => {
        if (!confirm(`Sei sicuro di voler eliminare "${promotion.title}"?`)) {
            return;
        }
        try {
            await deletePromotion(promotion.id);
            alert('Promozione eliminata con successo!');
            loadPromotions();
        } catch (error) {
            console.error('Error deleting promotion:', error);
            alert('Errore nell\'eliminazione della promozione');
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            imageUrl: '',
            validFrom: new Date(),
            validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            active: true,
            showAsPopup: false,
        });
        setEditingPromotion(null);
        setShowForm(false);
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatDateForInput = (date: Date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    if (loading) {
        return <div className="loading">Caricamento promozioni...</div>;
    }

    return (
        <div className="promotion-management">
            <div className="pm-header">
                <h2>Gestione Promozioni e News</h2>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? '✕ Chiudi' : '+ Nuova Promozione'}
                </button>
            </div>

            {showForm && (
                <div className="promotion-form-container">
                    <h3>{editingPromotion ? 'Modifica Promozione' : 'Nuova Promozione'}</h3>
                    <form onSubmit={handleSubmit} className="promotion-form">
                        <div className="form-group">
                            <label>Titolo *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Descrizione *</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Immagine</label>
                            <div className="image-upload-container">
                                <input
                                    type="text"
                                    placeholder="URL dell'immagine (o carica file sotto)"
                                    value={formData.imageUrl}
                                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                />
                                <div className="file-upload-wrapper">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            try {
                                                // Show loading indicator locally if needed, or just rely on async
                                                const url = await uploadPromotionImage(file);
                                                setFormData(prev => ({ ...prev, imageUrl: url }));
                                            } catch (error) {
                                                console.error('Error uploading image:', error);
                                                alert('Errore nel caricamento dell\'immagine');
                                            }
                                        }}
                                        style={{ marginTop: '8px' }}
                                    />
                                    <small style={{ display: 'block', color: '#666', marginTop: '4px' }}>
                                        Carica un'immagine dal tuo dispositivo (JPG, PNG)
                                    </small>
                                </div>
                                {formData.imageUrl && (
                                    <div className="image-preview" style={{ marginTop: '10px' }}>
                                        <img
                                            src={formData.imageUrl}
                                            alt="Preview"
                                            style={{ maxHeight: '100px', borderRadius: '4px', border: '1px solid #ddd' }}
                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Valida dal *</label>
                                <input
                                    type="date"
                                    value={formatDateForInput(formData.validFrom)}
                                    onChange={e => setFormData({ ...formData, validFrom: new Date(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Valida fino al *</label>
                                <input
                                    type="date"
                                    value={formatDateForInput(formData.validTo)}
                                    onChange={e => setFormData({ ...formData, validTo: new Date(e.target.value) })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.active}
                                        onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                    />{' '}Attiva
                                </label>
                            </div>
                            <div className="form-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.showAsPopup}
                                        onChange={e => setFormData({ ...formData, showAsPopup: e.target.checked })}
                                    />{' '}Mostra come Popup
                                </label>
                                <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '4px' }}>
                                    La promozione apparirà come popup all'apertura dell'app
                                </small>
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary">
                                {editingPromotion ? 'Aggiorna' : 'Crea'} Promozione
                            </button>
                            <button type="button" className="btn btn-outline" onClick={resetForm}>
                                Annulla
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="promotions-table">
                <table>
                    <thead>
                        <tr>
                            <th>Titolo</th>
                            <th>Periodo</th>
                            <th>Stato</th>
                            <th>Azioni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {promotions.map(promotion => (
                            <tr key={promotion.id}>
                                <td>
                                    <strong>{promotion.title}</strong>
                                    <div className="promotion-desc">{promotion.description}</div>
                                </td>
                                <td>
                                    <div className="date-range">
                                        {formatDate(promotion.validFrom)} - {formatDate(promotion.validTo)}
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-badge ${promotion.active ? 'active' : 'inactive'}`}>
                                        {promotion.active ? 'Attiva' : 'Non attiva'}
                                    </span>
                                </td>
                                <td className="actions-cell">
                                    <button
                                        className="btn-icon btn-edit"
                                        onClick={() => handleEdit(promotion)}
                                        title="Modifica"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="btn-icon btn-delete"
                                        onClick={() => handleDelete(promotion)}
                                        title="Elimina"
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {promotions.length === 0 && (
                    <div className="empty-state">
                        <p>Nessuna promozione trovata</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PromotionManagement;
