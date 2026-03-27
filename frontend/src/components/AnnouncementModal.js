import React, { useState, useEffect } from 'react';
import '../styles/AnnouncementModal.css';

function AnnouncementModal() {
  const [isVisible, setIsVisible] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setCanClose(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible]);

  const handleClose = () => {
    if (canClose) {
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="announcement-overlay">
      <div className="announcement-modal">
        <button 
          className={`close-btn ${canClose ? 'active' : 'disabled'}`}
          onClick={handleClose}
          disabled={!canClose}
          title={canClose ? 'Cerrar' : `Espera ${secondsLeft}s`}
        >
          <span className="close-icon">✕</span>
          {!canClose && <span className="timer">{secondsLeft}</span>}
        </button>

        <img 
          src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=600&h=400&fit=crop" 
          alt="Anuncio Transporte Willmore" 
          className="announcement-image"
        />
        
        <div className="announcement-content">
          <h2>Entregas Garantizadas</h2>
          <p className="announcement-subtitle">EL MISMO DÍA</p>
          <p className="announcement-text">
            Recogemos y entregamos el mismo día. Eficiencia y rapidez para satisfacer a tus clientes.
          </p>
          <button className="announcement-btn">Saber Más →</button>
        </div>
      </div>
    </div>
  );
}

export default AnnouncementModal;
