import React from 'react';
import '../styles/PaymentSuccess.css';

function PaymentSuccess({ packageCode, amount, transferDate, onClose }) {
  return (
    <div className="payment-success-overlay">
      <div className="payment-success-card">
        <div className="success-icon">✅</div>
        
        <h1>¡Solicitud Confirmada!</h1>
        
        <div className="success-message">
          <p>Tu pago ha sido registrado exitosamente.</p>
          <p>Tu paquete será procesado muy pronto.</p>
        </div>

        {/* Código del Paquete - Prominente */}
        <div className="package-code-section">
          <label>📦 Tu Código de Paquete</label>
          <div className="code-display">
            <input 
              type="text" 
              value={packageCode} 
              readOnly 
              className="code-input"
            />
            <button 
              className="copy-btn-large"
              onClick={() => {
                navigator.clipboard.writeText(packageCode);
                alert('Código copiado al portapapeles');
              }}
              title="Copiar código"
            >
              📋 Copiar
            </button>
          </div>
          <p className="code-info">Guarda este código para rastrear tu paquete</p>
        </div>

        {/* Detalles del Pago */}
        <div className="payment-details">
          <div className="detail-row">
            <span className="label">Monto Pagado:</span>
            <span className="value">RD$ {amount}</span>
          </div>
          <div className="detail-row">
            <span className="label">Fecha:</span>
            <span className="value">{new Date(transferDate).toLocaleDateString('es-DO')}</span>
          </div>
          <div className="detail-row">
            <span className="label">Estado:</span>
            <span className="value status-confirmed">✓ Confirmado</span>
          </div>
        </div>

        {/* Próximos Pasos */}
        <div className="next-steps">
          <h3>📋 Próximos Pasos:</h3>
          <ol>
            <li>El admin verificará tu comprobante de pago</li>
            <li>Tu paquete será asignado a un repartidor</li>
            <li>Recibirás actualizaciones por WhatsApp</li>
            <li>Tu paquete será recogido pronto</li>
          </ol>
        </div>

        <button 
          className="btn btn-close"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default PaymentSuccess;
