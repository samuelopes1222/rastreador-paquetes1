import React, { useState } from 'react';
import '../styles/AnnouncementCarousel.css';

function AnnouncementCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const announcements = [
    {
      id: 1,
      title: 'Entregas Garantizadas',
      subtitle: 'EL MISMO DÍA',
      text: 'Recogemos y entregamos el mismo día. Eficiencia y rapidez para satisfacer a tus clientes.',
      image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=600&h=400&fit=crop',
      color: '#0066CC'
    },
    {
      id: 2,
      title: 'Con Mensajeros sin Control',
      text: 'El mensajero desapareció del mapa y se líquidó. Se extravió o rompió un paquete y nadie sabe quien fue.',
      image: 'https://images.unsplash.com/photo-1578575437103-fdb4370b8e9f?w=600&h=400&fit=crop',
      color: '#DC143C'
    },
    {
      id: 3,
      title: 'Con Transporte Willmore',
      text: 'Seguimiento en tiempo real, soporte y garantía de entrega. Seguridad y depósitos garantizados el mismo día o cualquier banco.',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
      color: '#0066CC'
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % announcements.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  return (
    <div className="announcement-carousel">
      <div className="carousel-container">
        {announcements.map((announcement, index) => (
          <div
            key={announcement.id}
            className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
            style={{ backgroundColor: announcement.color + '20' }}
          >
            <div className="carousel-content">
              <div className="carousel-text">
                <h3 className="carousel-title">{announcement.title}</h3>
                {announcement.subtitle && (
                  <p className="carousel-subtitle">{announcement.subtitle}</p>
                )}
                <p className="carousel-description">{announcement.text}</p>
              </div>
              <img 
                src={announcement.image} 
                alt={announcement.title}
                className="carousel-image"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="carousel-controls">
        <button className="carousel-btn prev" onClick={prevSlide} title="Anterior">
          ◀ Anterior
        </button>
        <div className="carousel-dots">
          {announcements.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
        <button className="carousel-btn next" onClick={nextSlide} title="Siguiente">
          Siguiente ▶
        </button>
      </div>
    </div>
  );
}

export default AnnouncementCarousel;
