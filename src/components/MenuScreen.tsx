import { useNavigate } from 'react-router-dom';
import './MenuScreen.css';

function MenuScreen() {
    const navigate = useNavigate();

    const categories = [
        {
            id: 'pizze-veraci',
            name: 'Pizze Veraci',
            image: '🍕',
            description: 'La vera pizza napoletana',
            color: 'var(--color-primary)'
        },
        {
            id: 'nostre-proposte',
            name: 'Le Nostre Proposte',
            image: '👨‍🍳',
            description: 'Creazioni speciali del pizzaiolo',
            color: 'var(--color-secondary)'
        },
        {
            id: 'calzoni',
            name: 'Calzoni',
            image: '🥟',
            description: 'Ripieni al forno o fritti',
            color: 'var(--color-accent)'
        },
        {
            id: 'pizze-classiche',
            name: 'Pizze Classiche',
            image: '🍅',
            description: 'I grandi classici italiani',
            color: '#9B59B6'
        }
    ];

    return (
        <div className="menu-screen fade-in">
            <h1 className="screen-title">Il Nostro Menù</h1>

            <div className="categories-grid">
                {categories.map(category => (
                    <button
                        key={category.id}
                        className="category-card"
                        onClick={() => navigate(`/menu/${category.id}`)}
                        style={{ '--category-color': category.color } as any}
                    >
                        <div className="category-icon">{category.image}</div>
                        <div className="category-content">
                            <h3>{category.name}</h3>
                            <p>{category.description}</p>
                        </div>
                        <div className="category-arrow">➜</div>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default MenuScreen;
