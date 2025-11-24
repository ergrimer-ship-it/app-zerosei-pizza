import './NewsOffersScreen.css';

function NewsOffersScreen() {
    const news = [
        {
            id: 1,
            title: 'Nuova Pizza del Mese: La Zucca',
            description: 'Vieni a provare la nostra nuova pizza con crema di zucca, provola affumicata e salsiccia fresca.',
            date: '24 Nov 2025',
            image: '🎃'
        },
        {
            id: 2,
            title: 'Consegna Gratuita',
            description: 'Per ordini superiori a 30€ la consegna è gratuita in tutta la zona!',
            date: '20 Nov 2025',
            image: '🛵'
        },
        {
            id: 3,
            title: 'Apertura Straordinaria',
            description: 'Siamo aperti anche a pranzo tutte le domeniche di Dicembre.',
            date: '15 Nov 2025',
            image: '📅'
        }
    ];

    return (
        <div className="news-screen fade-in">
            <h1 className="screen-title">Novità e Offerte</h1>

            <div className="news-grid">
                {news.map(item => (
                    <div key={item.id} className="news-card">
                        <div className="news-icon">{item.image}</div>
                        <div className="news-content">
                            <span className="news-date">{item.date}</span>
                            <h3>{item.title}</h3>
                            <p>{item.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default NewsOffersScreen;
