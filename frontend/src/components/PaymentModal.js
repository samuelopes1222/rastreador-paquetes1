import React, { useState } from 'react';
import '../styles/PaymentModal.css';

function PaymentModal({ isOpen, packageCode, estimatedCost, onConfirm, onClose }) {
  const [step, setStep] = useState(1); // 1: Instrucciones, 2: Confirmar transferencia, 3: ¿Hiciste la transferencia?
  const [userConfirmedTransfer, setUserConfirmedTransfer] = useState(false); // ¿Usuario dice que hizo transferencia?
  const [transferData, setTransferData] = useState({
    amount: estimatedCost || '',
    reference: '',
    transferDate: new Date().toISOString().split('T')[0],
    voucherImage: null
  });
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = React.useRef(null);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTransferData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConfirmTransfer = async () => {
    if (!transferData.amount) {
      alert('Por favor completa el monto');
      return;
    }

    // Validar que al menos se proporcione referencia O imagen O confirmación de usuario
    const hasReference = transferData.reference && transferData.reference.trim() !== '';
    const hasImage = transferData.voucherImage && transferData.voucherImage.trim() !== '';
    const userSaysCompleted = userConfirmedTransfer;

    if (!hasReference && !hasImage && !userSaysCompleted) {
      alert('Por favor:\n• Proporciona referencia O imagen del comprobante\n• O confirma que ya realizaste la transferencia');
      return;
    }

    setLoading(true);
    try {
      await onConfirm({
        paymentMethod: 'transfer',
        transferAmount: parseFloat(transferData.amount),
        transferReference: hasReference ? transferData.reference.trim() : null,
        transferDate: transferData.transferDate,
        voucherImage: hasImage ? transferData.voucherImage : null,
        clientConfirmedTransfer: userSaysCompleted // Nuevo campo
      });

      // Reset form
      setTransferData({
        amount: estimatedCost || '',
        reference: '',
        transferDate: new Date().toISOString().split('T')[0],
        voucherImage: null
      });
      setStep(1);
    } catch (error) {
      console.error('Error confirmando transferencia:', error);
      alert('Error confirmando transferencia: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppContact = () => {
    const adminWhatsApp = '+18495854292'; // Número del admin desde .env
    const message = encodeURIComponent(
      `Hola, necesito ayuda con el pago de mi paquete ${packageCode}. ¿Me puedes asistir con la transferencia?`
    );
    const whatsappUrl = `https://wa.me/${adminWhatsApp}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleClose = () => {
    setStep(1);
    setTransferData({
      amount: estimatedCost || '',
      reference: '',
      transferDate: new Date().toISOString().split('T')[0],
      voucherImage: null
    });
    setImageLoading(false);
    onClose();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño del archivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen es demasiado grande. Máximo 5MB.');
        return;
      }

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido.');
        return;
      }

      setImageLoading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        setTransferData(prev => ({
          ...prev,
          voucherImage: event.target?.result
        }));
        setImageLoading(false);
      };
      reader.onerror = () => {
        alert('Error al cargar la imagen. Inténtalo de nuevo.');
        setImageLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="payment-modal-overlay" onClick={handleClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={handleClose}>✕</button>

        {step === 1 ? (
          // Paso 1: Instrucciones
          <div className="payment-instructions">
            <h2>💳 Pago por Transferencia</h2>
            <p className="package-code">Paquete: <strong>{packageCode}</strong></p>

            <div className="bank-details">
              <h3>📝 Detalles de Transferencia</h3>
              
              <div className="accounts-container">
                {/* Cuenta 1 */}
                <div className="account-card red-accent">
                  <div className="account-badge">🔴 Ahorro Banreservas</div>
                  
                  <div className="detail-item">
                    <label>Número de Cuenta:</label>
                    <span className="value">9608610867</span>
                    <button 
                      className="copy-btn" 
                      onClick={() => navigator.clipboard.writeText('9608610867')}
                      title="Copiar"
                    >📋</button>
                  </div>

                  <div className="detail-item">
                    <label>Titular:</label>
                    <span className="value">MENYERIS ALFAO</span>
                    <button 
                      className="copy-btn" 
                      onClick={() => navigator.clipboard.writeText('MENYERIS ALFAO')}
                      title="Copiar"
                    >📋</button>
                  </div>

                  <div className="detail-item">
                    <label>Cédula:</label>
                    <span className="value">40203871450</span>
                    <button 
                      className="copy-btn" 
                      onClick={() => navigator.clipboard.writeText('40203871450')}
                      title="Copiar"
                    >📋</button>
                  </div>
                </div>

                {/* Cuenta 2 */}
                <div className="account-card blue-accent">
                  <div className="account-badge">🔵 Corriente Popular</div>
                  
                  <div className="detail-item">
                    <label>Número de Cuenta:</label>
                    <span className="value">850965237</span>
                    <button 
                      className="copy-btn" 
                      onClick={() => navigator.clipboard.writeText('850965237')}
                      title="Copiar"
                    >📋</button>
                  </div>

                  <div className="detail-item">
                    <label>Titular:</label>
                    <span className="value">MENYERIS ALFAO</span>
                    <button 
                      className="copy-btn" 
                      onClick={() => navigator.clipboard.writeText('MENYERIS ALFAO')}
                      title="Copiar"
                    >📋</button>
                  </div>

                  <div className="detail-item">
                    <label>Cédula:</label>
                    <span className="value">40203871450</span>
                    <button 
                      className="copy-btn" 
                      onClick={() => navigator.clipboard.writeText('40203871450')}
                      title="Copiar"
                    >📋</button>
                  </div>
                </div>

                {/* Cuenta 3 */}
                <div className="account-card white-accent">
                  <div className="account-badge">⚪️ Ahorro BHD</div>
                  
                  <div className="detail-item">
                    <label>Número de Cuenta:</label>
                    <span className="value">31618930021</span>
                    <button 
                      className="copy-btn" 
                      onClick={() => navigator.clipboard.writeText('31618930021')}
                      title="Copiar"
                    >📋</button>
                  </div>

                  <div className="detail-item">
                    <label>Titular:</label>
                    <span className="value">JULIAN OVALLES</span>
                    <button 
                      className="copy-btn" 
                      onClick={() => navigator.clipboard.writeText('JULIAN OVALLES')}
                      title="Copiar"
                    >📋</button>
                  </div>

                  <div className="detail-item">
                    <label>Cédula:</label>
                    <span className="value">40247172295</span>
                    <button 
                      className="copy-btn" 
                      onClick={() => navigator.clipboard.writeText('40247172295')}
                      title="Copiar"
                    >📋</button>
                  </div>
                </div>
              </div>

              <div className="detail-item">
                <label>Monto de Cotización de Dirección:</label>
                <span className="value amount-emphasis">RD$ {estimatedCost || '0.00'}</span>
              </div>

              <div className="detail-item">
                <label>Concepto:</label>
                <span className="value">Envío paquete {packageCode}</span>
                <button 
                  className="copy-btn" 
                  onClick={() => navigator.clipboard.writeText(`Envío paquete ${packageCode}`)}
                  title="Copiar"
                >📋</button>
              </div>
            </div>

            <div className="important-note">
              <p>⚠️ <strong>IMPORTANTE:</strong> Utiliza el código del paquete <strong>{packageCode}</strong> como referencia en la transferencia para que podamos identificar tu pago rápidamente.</p>
            </div>

            <button 
              className="btn btn-primary"
              onClick={() => setStep(2)}
            >
              ✓ Ya realicé la transferencia
            </button>

            <button 
              className="btn btn-secondary"
              onClick={handleClose}
            >
              Cancelar
            </button>
          </div>
        ) : (
          // Paso 2: Confirmar transferencia
          <div className="payment-confirmation">
            <h2>✓ Confirmar Transferencia</h2>
            <p className="package-code">Paquete: <strong>{packageCode}</strong></p>

            <form className="transfer-form">
              <div className="form-group">
                <label>Monto Transferido *</label>
                <input
                  type="number"
                  name="amount"
                  value={transferData.amount}
                  onChange={handleInputChange}
                  placeholder="Ej: 500.00"
                  step="0.01"
                  min="0"
                  required
                />
                <small>RD$</small>
              </div>

              <div className="form-group">
                <label>Referencia de Transferencia <span className="optional-text">(Opcional)</span></label>
                <input
                  type="text"
                  name="reference"
                  value={transferData.reference}
                  onChange={handleInputChange}
                  placeholder="Ej: TRANS123456789 o número de comprobante"
                />
              </div>

              <div className="form-group">
                <label>O sube imagen del comprobante <span className="optional-text">(Opcional)</span></label>
                <div className="upload-area">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="btn-upload"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageLoading}
                  >
                    {imageLoading ? '⏳ Cargando...' : '📸 Seleccionar imagen'}
                  </button>
                  {transferData.voucherImage && (
                    <div className="image-preview">
                      <img src={transferData.voucherImage} alt="Comprobante" />
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => setTransferData(prev => ({ ...prev, voucherImage: null }))}
                      >
                        ✕ Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Fecha de Transferencia *</label>
                <input
                  type="date"
                  name="transferDate"
                  value={transferData.transferDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group confirmation-checkbox" style={{
                backgroundColor: '#d4edda',
                border: '2px solid #28a745',
                borderRadius: '8px',
                padding: '12px',
                marginTop: '16px'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: 0 }}>
                  <input
                    type="checkbox"
                    checked={userConfirmedTransfer}
                    onChange={(e) => setUserConfirmedTransfer(e.target.checked)}
                    style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 'bold', color: '#28a745' }}>
                    ✓ Confirmo que ya realicé la transferencia bancaria
                  </span>
                </label>
                <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>
                  Marca esto si completaste la transferencia. Puedes adjuntar referencia o comprobante (opcional).
                </small>
              </div>

              <div className="confirmation-note">
                <p>✓ Con esta información confirmaremos tu pago y activaremos el tracking de tu paquete.</p>
                <p>¿Tienes dudas? <button 
                  type="button" 
                  className="btn-whatsapp"
                  onClick={handleWhatsAppContact}
                  title="Contactar administrador por WhatsApp"
                >
                  💬 Contactar Admin por WhatsApp
                </button></p>
              </div>

              <button
                type="button"
                className="btn btn-success"
                onClick={handleConfirmTransfer}
                disabled={loading || imageLoading}
              >
                {loading ? '⏳ Confirmando...' : imageLoading ? '⏳ Esperando imagen...' : '✓ Confirmar Pago'}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                ← Volver
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentModal;
