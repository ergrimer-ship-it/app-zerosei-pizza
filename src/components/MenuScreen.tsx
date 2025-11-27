import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCategories } from '../services/dbService';
import type { Category } from '../types';
import './MenuScreen.css';

function MenuScreen() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await getAllCategories();
            setCategories(data);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
        setLoading(false);
    };

    const getCategoryColor = (index: number) => {
        const colors = [
            'var(--color-primary)',
            '#9B59B6',
            'var(--color-secondary)',
            'var(--color-accent)',
            '#3498DB',
            '#F1C40F',
            '#E74C3C',
            '#1ABC9C'
        ];
        return colors[index % colors.length];
    };

    const getCategorySlug = (categoryName: string): string => {
        // Convert category name to slug matching ProductCategory type
        const slugMap: { [key: string]: string } = {
            'Pizze Veraci': 'pizze-veraci',
            'Pizze Classiche': 'pizze-classiche',
            'Le Nostre Proposte': 'proposte',
            'Proposte': 'proposte',
            'Calzoni': 'calzoni',
            'Bevande': 'bevande',
            'Birre': 'birre'
        };
        return slugMap[categoryName] || categoryName.toLowerCase().replace(/\s+/g, '-');
    };

    if (loading) {
        return (
            <div className="menu-screen fade-in">
                <h1 className="screen-title">Il Nostro Menù</h1>
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    Caricamento categorie...
                </div>
            </div>
        );
    }

    return (
        <div className="menu-screen fade-in">
            <h1 className="screen-title">Il Nostro Menù</h1>

            <div className="categories-grid">
                {categories.map((category, index) => (
                    <button
                        key={category.id}
                        className="category-card"
                        onClick={() => navigate(`/menu/${getCategorySlug(category.name)}`)}
                        style={{ '--category-color': getCategoryColor(index) } as any}
                    >
                        <div className="category-icon">{category.icon || '📦'}</div>
                        <div className="category-content">
                            <h3>{category.name}</h3>
                            <p>{category.description || ''}</p>
                        </div>
                        <div className="category-arrow">➜</div>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default MenuScreen;

