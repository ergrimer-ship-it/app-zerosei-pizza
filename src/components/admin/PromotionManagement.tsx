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
    activeDays: number[]; // 0=Dom, 1=Lun, 2=Mar, 3=Mer, 4=Gio, 5=Ven, 6=Sab
    newUsersOnly: boolean;
}

interface PromotionManagementProps {
    mode?: 'promotion' | 'news'; // Optional mode, default to 'promotion' if not specified
}

function PromotionManagement({ mode = 'promotion' }: PromotionManagementProps) {
    const [promotions, setPromotions] = useState<NewsPromotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState<NewsPromotion | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const [formData, setFormData] = useState<PromotionFormData>({
        title: '',
        description: '',
        imageUrl: '',
        validFrom: new Date(),
        validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 giorni
        active: true,
        showAsPopup: false,
        activeDays: [], // vuoto = tutti i giorni
        newUsersOnly: false,
    });

    useEffect(() => {
        loadPromotions();
    }, [mode]);

    const loadPromotions = async () => {
        setLoading(true);
        try {
            const data = await getAllPromotions();
            // Filter by type. If item has no type, assume 'promotion' for backward compatibility
            const filtered = data.filter(p => (p.type || 'promotion') === mode);
            setPromotions(filtered);
        } catch (error) {
            console.error('Error loading items:', error);
            alert('Errore nel caricamento');
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isUploading) {
            alert("Attendi il completamento del caricamento dell'immagine.");
            return;
        }

        try {
            const dataToSave = {
                ...formData,
                type: mode, // Force the current mode
            };

            if (editingPromotion) {
                await updatePromotion(editingPromotion.id, dataToSave);
                alert(`${mode === 'news' ? 'Novità' : 'Promozione'} aggiornata con successo!`);
            } else {
                await createPromotion(dataToSave);
                alert(`${mode === 'news' ? 'Novità' : 'Promozione'} creata con successo!`);
            }
            resetForm();
            loadPromotions();
        } catch (error) {
            console.error('Error saving item:', error);
            alert('Errore nel salvataggio');
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
            activeDays: promotion.activeDays || [],
            newUsersOnly: promotion.newUsersOnly || false,
        });
        setShowForm(true);
    };

    const handleDelete = async (promotion: NewsPromotion) => {
        if (!confirm(`Sei sicuro di voler eliminare "${promotion.title}"?`)) {
            return;
        }
        try {
            await deletePromotion(promotion.id);
            alert('Elemento eliminato con successo!');
            loadPromotions();
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Errore nell\'eliminazione');
        }
    };

    const resetForm = () => {
        setIsUploading(false);
        setFormData({
            title: '',
            description: '',
            imageUrl: '',
            validFrom: new Date(),
            validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            active: true,
            showAsPopup: false,
            activeDays: [],
            newUsersOnly: false,
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
        return <div className="loading">Caricamento...</div>;
    }

    const itemLabel = mode === 'news' ? 'Novità' : 'Promozione';

    return (
        <div className="promotion-management">
            <div className="pm-header">
                <h2>Gestione {mode === 'news' ? 'Novità' : 'Promozioni'}</h2>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        if (showForm) {
                            resetForm(); // chiude e resetta tutto
                        } else {
                            resetForm(); // assicura form pulito anche all'apertura
                            setShowForm(true);
                        }
                    }}
                >
                    {showForm ? '✕ Chiudi' : `+ Nuova ${itemLabel}`}
                </button>
            </div>

            {showForm && (
                <div className="promotion-form-container">
                    <h3>{editingPromotion ? `Modifica ${itemLabel}` : `Nuova ${itemLabel}`}</h3>
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
                                        disabled={isUploading}
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            setIsUploading(true);
                                            try {
                                                const url = await uploadPromotionImage(file);
                                                setFormData(prev => ({ ...prev, imageUrl: url }));
                                            } catch (error) {
                                                console.error('Error uploading image:', error);
                                                alert('Errore nel caricamento dell\'immagine');
                                            } finally {
                                                setIsUploading(false);
                                            }
                                        }}
                                        style={{ marginTop: '8px' }}
                                    />
                                    <small style={{ display: 'block', color: '#666', marginTop: '4px' }}>
                                        Carica un'immagine dal tuo dispositivo (JPG, PNG)
                                    </small>
                                </div>
                                {isUploading && <div style={{ color: '#D4AF37', marginTop: '5px' }}>⏳ Caricamento immagine in corso... attendere...</div>}
                                {formData.imageUrl && !isUploading && (
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
                                    {mode === 'news' ? 'La novità' : 'La promozione'} apparirà come popup all'apertura dell'app
                                </small>
                            </div>
                            <div className="form-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.newUsersOnly}
                                        onChange={e => setFormData({ ...formData, newUsersOnly: e.target.checked })}
                                    />{' '}🆕 Solo nuovi utenti (benvenuto)
                                </label>
                                <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '4px' }}>
                                    Visibile solo agli utenti registrati da meno di 30 giorni, una sola volta
                                </small>
                            </div>
                        </div>
                        <div className="form-group">
                            <label style={{ marginBottom: '8px', display: 'block', fontWeight: 600 }}>
                                📅 Giorni di attivazione
                            </label>
                            <small style={{ color: '#666', display: 'block', marginBottom: '10px' }}>
                                Lascia tutti deselezionati per renderla disponibile ogni giorno
                            </small>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {[
                                    { label: 'Lun', value: 1 },
                                    { label: 'Mar', value: 2 },
                                    { label: 'Mer', value: 3 },
                                    { label: 'Gio', value: 4 },
                                    { label: 'Ven', value: 5 },
                                    { label: 'Sab', value: 6 },
                                    { label: 'Dom', value: 0 },
                                ].map(day => (
                                    <label key={day.value} style={{
                                        display: 'flex', alignItems: 'center', gap: '5px',
                                        padding: '6px 12px', borderRadius: '20px', cursor: 'pointer',
                                        background: formData.activeDays.includes(day.value) ? 'var(--color-primary, #D4AF37)' : '#f0f0f0',
                                        color: formData.activeDays.includes(day.value) ? 'white' : '#333',
                                        fontWeight: 500, fontSize: '0.9rem', transition: 'all 0.2s'
                                    }}>
                                        <input
                                            type="checkbox"
                                            style={{ display: 'none' }}
                                            checked={formData.activeDays.includes(day.value)}
                                            onChange={e => {
                                                const days = e.target.checked
                                                    ? [...formData.activeDays, day.value]
                                                    : formData.activeDays.filter(d => d !== day.value);
                                                setFormData({ ...formData, activeDays: days });
                                            }}
                                        />
                                        {day.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary" disabled={isUploading}>
                                {isUploading ? 'Attendere...' : (editingPromotion ? 'Aggiorna' : 'Crea')} {itemLabel}
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
                                    {promotion.newUsersOnly && (
                                        <span style={{ marginLeft: '6px', fontSize: '0.75rem', background: '#e3f2fd', color: '#1565c0', padding: '2px 7px', borderRadius: '10px', fontWeight: 600 }}>🆕 Nuovi utenti</span>
                                    )}
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
                        <p>Nessuna {mode === 'news' ? 'novità' : 'promozione'} trovata</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PromotionManagement;
