import React, { useState, useRef } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import './DriverRegistration.css';

const DriverRegistration = () => {
  const [step, setStep] = useState(1); // 1: Formulario, 2: Captura, 3: Confirmación
  const [loading, setLoading] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const formPreviewRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    cedula: '',
    phone: '',
    email: '',
    house: '',
    street: '',
    address: ''
  });

  const [screenshot, setScreenshot] = useState(null);
  const [error, setError] = useState('');

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
  };

  // Validar formulario
  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('El nombre es requerido');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('El apellido es requerido');
      return false;
    }
    if (!formData.cedula.trim()) {
      setError('La cédula de identidad es requerida');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('El número de teléfono es requerido');
      return false;
    }
    if (!formData.house.trim()) {
      setError('La casa/número es requerido');
      return false;
    }
    if (!formData.street.trim()) {
      setError('La calle es requerida');
      return false;
    }
    if (!formData.address.trim()) {
      setError('La dirección es requerida');
      return false;
    }
    return true;
  };

  // Proceder a captura
  const handleProceedToCapture = () => {
    if (validateForm()) {
      setStep(2);
      setTimeout(() => startCamera(), 500);
    }
  };

  // Iniciar cámara → ahora es captura de formulario
  const startCamera = async () => {
    // Ya no se necesita, se muestra la vista previa directamente
    return;
  };

  // Capturar foto → ahora captura el formulario como imagen
  const captureScreenshot = async () => {
    if (!formPreviewRef.current) {
      setError('Error: No se puede capturar el formulario');
      return;
    }

    try {
      setLoading(true);
      const canvas = await html2canvas(formPreviewRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        allowTaint: true,
        useCORS: true
      });

      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setScreenshot(imageData);
      setLoading(false);
      setStep(3);
    } catch (err) {
      setError('Error al capturar el formulario: ' + err.message);
      setLoading(false);
    }
  };

  // Retomar captura
  const retakeScreenshot = () => {
    setScreenshot(null);
    setStep(2);
    setTimeout(() => startCamera(), 500);
  };

  // Enviar solicitud
  const handleSubmitApplication = async () => {
    if (!screenshot) {
      setError('Debes capturar una foto antes de continuar');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const apiUrl = baseURL.endsWith('/api') ? baseURL : baseURL + '/api';
      const response = await axios.post(
        `${apiUrl}/drivers/applications`,
        {
          ...formData,
          screenshot: screenshot.split(',')[1] // Enviar solo la parte base64
        }
      );

      if (response.data.success) {
        setApplicationId(response.data.data.id);
        setExpiresAt(response.data.data.expiresAt);
        setFormData({
          firstName: '',
          lastName: '',
          cedula: '',
          phone: '',
          email: '',
          house: '',
          street: '',
          address: ''
        });
        setScreenshot(null);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al enviar la solicitud';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };



  // Paso 1: Formulario
  if (step === 1) {
    return (
      <div className="driver-registration-container">
        <div className="registration-card">
          <h1>📋 Solicitud de Registro - Mensajero</h1>
          <p className="subtitle">Completa el formulario con tus datos personales</p>

          <form className="registration-form">
            <div className="form-group">
              <label>Nombre *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Tu nombre"
              />
            </div>

            <div className="form-group">
              <label>Apellido *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Tu apellido"
              />
            </div>

            <div className="form-group">
              <label>Cédula de Identidad *</label>
              <input
                type="text"
                name="cedula"
                value={formData.cedula}
                onChange={handleInputChange}
                placeholder="Ej: 001-1234567-8"
              />
            </div>

            <div className="form-group">
              <label>Teléfono (WhatsApp) *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Ej: +1-829-123-4567"
              />
            </div>

            <div className="form-group">
              <label>Email (Opcional)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="tu@email.com"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Número de Casa *</label>
                <input
                  type="text"
                  name="house"
                  value={formData.house}
                  onChange={handleInputChange}
                  placeholder="Ej: #123"
                />
              </div>

              <div className="form-group">
                <label>Calle *</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  placeholder="Ej: Avenida Principal"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Dirección Completa *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Ej: Sector, Municipio, Provincia"
                rows="3"
              ></textarea>
            </div>

            {error && <div className="error-message">⚠️ {error}</div>}

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleProceedToCapture}
            >
              Siguiente: Capturar Formulario →
            </button>
          </form>

          <div className="info-box">
            <p>ℹ️ Después de este formulario se capturará una imagen de tus datos completados para confirmar.</p>
          </div>
        </div>
      </div>
    );
  }

  // Paso 2: Captura
  if (step === 2) {
    return (
      <div className="driver-registration-container">
        <div className="registration-card">
          {/* RECORDATORIO PROMINENTE */}
          <div className="capture-reminder">
            <div className="reminder-icon">⚠️</div>
            <h2>⚠️ IMPORTANTE - CAPTURA DE FORMULARIO</h2>
            <p className="reminder-text">
              👇 <strong>ESTA FOTO</strong> es la que recibirá el administrador en WhatsApp junto con tu solicitud
            </p>
            <p className="reminder-subtitle">
              Verifica que el formulario se vea claro y legible antes de capturar
            </p>
          </div>

          <h1>📸 Captura del Formulario Completado</h1>
          <p className="subtitle">Aquí está tu información que será enviada al administrador</p>
          {expiresAt && <p className="subtitle">⏰ El token expira el {new Date(expiresAt).toLocaleString('es-DO')}</p>}

          {/* VISTA PREVIA DEL FORMULARIO */}
          <div className="form-preview-container" ref={formPreviewRef}>
            <div className="preview-header">
              <h2>SOLICITUD DE REGISTRO - MENSAJERO</h2>
              <p className="preview-watermark">Documento de Solicitud Oficial</p>
              <p className="preview-date">Fecha y Hora: {new Date().toLocaleString('es-DO')}</p>
            </div>

            <div className="preview-content">
              <div className="preview-section">
                <h3 className="section-title">DATOS PERSONALES</h3>
                <div className="preview-row">
                  <div className="preview-field">
                    <strong>Nombre Completo:</strong> 
                    <span className="field-value">{formData.firstName} {formData.lastName}</span>
                  </div>
                  <div className="preview-field">
                    <strong>Cédula de Identidad:</strong>
                    <span className="field-value">{formData.cedula}</span>
                  </div>
                </div>

                <div className="preview-row">
                  <div className="preview-field">
                    <strong>Teléfono (WhatsApp):</strong>
                    <span className="field-value">{formData.phone}</span>
                  </div>
                  <div className="preview-field">
                    <strong>Email:</strong>
                    <span className="field-value">{formData.email || 'No proporcionado'}</span>
                  </div>
                </div>
              </div>

              <div className="preview-section">
                <h3 className="section-title">DATOS DE DIRECCIÓN</h3>
                <div className="preview-row">
                  <div className="preview-field">
                    <strong>Número de Casa:</strong>
                    <span className="field-value">{formData.house}</span>
                  </div>
                  <div className="preview-field">
                    <strong>Calle:</strong>
                    <span className="field-value">{formData.street}</span>
                  </div>
                </div>

                <div className="preview-row">
                  <div className="preview-field full-width">
                    <strong>Dirección Completa:</strong>
                    <span className="field-value">{formData.address}</span>
                  </div>
                </div>
              </div>

              <div className="preview-footer">
                <p className="footer-stamp">✅ FORMULARIO COMPLETADO Y VERIFICADO</p>
                <p className="footer-note">Esta es una solicitud oficial. La foto será enviada al administrador.</p>
              </div>
            </div>
          </div>

          {error && <div className="error-message">⚠️ {error}</div>}

          <div className="capture-instructions">
            <p>📸 <strong>Haz clic en "Capturar Formulario"</strong> para tomar la foto que se enviará al WhatsApp del administrador</p>
          </div>

          <div className="button-group">
            <button
              type="button"
              className="btn btn-primary btn-large-capture"
              onClick={captureScreenshot}
              disabled={loading}
            >
              {loading ? '⏳ Capturando...' : '📸 CAPTURAR FORMULARIO'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStep(1)}
            >
              ← Volver a Editar
            </button>
          </div>

          <div className="info-box important">
            <p>ℹ️ <strong>Importante:</strong> La captura que realizarás aquí es la que recibirá el administrador por WhatsApp. Asegúrate de que todo se vea claro.</p>
          </div>
        </div>
      </div>
    );
  }

  // Paso 3: Confirmación
  if (step === 3 && !applicationId) {
    return (
      <div className="driver-registration-container">
        <div className="registration-card">
          <h1>✅ Confirmar Solicitud</h1>
          <p className="subtitle">Revisa tu información antes de enviar</p>

          <div className="screenshot-preview">
            <img src={screenshot} alt="Captura" className="preview-image" />
          </div>

          <div className="confirm-details">
            <h3>Datos Registrados:</h3>
            <ul>
              <li><strong>Nombre:</strong> {formData.firstName} {formData.lastName}</li>
              <li><strong>Cédula:</strong> {formData.cedula}</li>
              <li><strong>Teléfono:</strong> {formData.phone}</li>
              <li><strong>Dirección:</strong> {formData.house}, {formData.street}, {formData.address}</li>
            </ul>
          </div>

          {error && <div className="error-message">⚠️ {error}</div>}

          <div className="button-group">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmitApplication}
              disabled={loading}
            >
              {loading ? '⏳ Enviando...' : '✅ Enviar Solicitud'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={retakeScreenshot}
              disabled={loading}
            >
              📸 Retomar Foto
            </button>
          </div>

          <div className="info-box warning">
            <p>⏰ La solicitud será revisada en las próximas 72 horas. Recibirás confirmación por WhatsApp.</p>
          </div>
        </div>
      </div>
    );
  }

  // Confirmación de envío exitoso
  if (applicationId) {
    return (
      <div className="driver-registration-container">
        <div className="registration-card success-card">
          <div className="success-icon">🎉</div>
          <h1>¡Solicitud Enviada Exitosamente!</h1>

          <div className="success-details">
            <p><strong>ID de Solicitud:</strong> {applicationId}</p>
            <p><strong>Estado:</strong> En Revisión (⏳ Solicitud)</p>
            <p><strong>Tiempo de revisión:</strong> 72 horas</p>
            <p><strong>Mensaje enviado a:</strong> {formData.phone}</p>
          </div>

          <div className="timeline">
            <h3>Próximos Pasos:</h3>
            <ol>
              <li>✅ Revisión de tu solicitud (72 horas)</li>
              <li>📱 Recibirás notificación por WhatsApp</li>
              <li>🚀 Acceso a la plataforma si es aprobada</li>
            </ol>
          </div>

          <div className="info-box">
            <p>📌 Conserva tu ID de solicitud para consultar el estado si no recibes confirmación.</p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setApplicationId(null);
              setStep(1);
              setFormData({
                firstName: '',
                lastName: '',
                cedula: '',
                phone: '',
                email: '',
                house: '',
                street: '',
                address: ''
              });
            }}
          >
            ← Nueva Solicitud
          </button>
        </div>
      </div>
    );
  }

  // Confirmación de envío exitoso
  if (applicationId) {
    return (
      <div className="driver-registration-container">
        <div className="registration-card success-card">
          <div className="success-icon">🎉</div>
          <h1>¡Solicitud Enviada Exitosamente!</h1>

          <div className="success-details">
            <p><strong>ID de Solicitud:</strong> {applicationId}</p>
            <p><strong>Estado:</strong> En Revisión (⏳ Solicitud)</p>
            <p><strong>Tiempo de revisión:</strong> 72 horas</p>
            <p><strong>Mensaje enviado a:</strong> {formData.phone}</p>
          </div>

          <div className="timeline">
            <h3>Próximos Pasos:</h3>
            <ol>
              <li>✅ Revisión de tu solicitud (72 horas)</li>
              <li>📱 Recibirás notificación por WhatsApp</li>
              <li>🚀 Acceso a la plataforma si es aprobada</li>
            </ol>
          </div>

          <div className="info-box">
            <p>📌 Conserva tu ID de solicitud para consultar el estado si no recibes confirmación.</p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setApplicationId(null);
              setStep(1);
              setFormData({
                firstName: '',
                lastName: '',
                cedula: '',
                phone: '',
                email: '',
                house: '',
                street: '',
                address: ''
              });
            }}
          >
            ← Nueva Solicitud
          </button>
        </div>
      </div>
    );
  }
};

export default DriverRegistration;
