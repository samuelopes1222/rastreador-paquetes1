import React, { useState } from 'react';
import '../styles/SupportBot.css';
import api from '../services/api';

function SupportBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: '¡Hola! 👋 Bienvenido a Transporte Willmore. ¿En qué puedo ayudarte?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [showForm, setShowForm] = useState(null); // 'queja' o 'paquete'
  const [formData, setFormData] = useState({
    queja: { trackingNumber: '', description: '' },
    paquete: { recipient: '', address: '', weight: '', phone: '' }
  });

  const quickResponses = {
    'hola': '¡Hola! Bienvenido a Transporte Willmore. ¿Cómo te puedo ayudar?',
    'ayuda': 'Puedo ayudarte con:\n• Rastreo de paquetes\n• Crear nuevos envíos\n• Presentar quejas o reclamos\n• Información sobre nuestros servicios\n• Contacto con soporte',
    'rastrear': 'Para rastrear tu paquete, ve a la página de inicio y haz clic en "Rastrear Mi Paquete". Necesitarás tu número de seguimiento.',
    'queja|reclamo|complain': 'entendido',
    'crear paquete|nuevo paquete': 'entendido',
    'servicios': 'Ofrecemos:\n• Entregas el mismo día\n• Rastreo en tiempo real\n• Notificaciones automáticas\n• Garantía de entrega\n• Seguridad de paquetes',
    'contacto': 'Contáctanos por:\n📱 WhatsApp: (849) 585-4292\n📧 Instagram: @transporte_willmore\n💬 Este chat de soporte',
    'gracias': '¡De nada! Si necesitas algo más, aquí estoy. 😊',
    'ok': '¿Hay algo más en lo que pueda ayudarte?',
    'si': '¡Perfecto! Cuéntame, ¿qué necesitas?',
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Agregar mensaje del usuario
    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages([...messages, userMessage]);
    setInputValue('');

    // Generar respuesta del bot después de un delay
    setTimeout(() => {
      const lowerText = inputValue.toLowerCase();
      
      // Detectar intención de hacer queja
      if (lowerText.includes('queja') || lowerText.includes('reclamo') || lowerText.includes('problema') || lowerText.includes('complain')) {
        setShowForm('queja');
        const botMessage = {
          id: messages.length + 2,
          text: '📋 Entendido, voy a ayudarte a registrar tu queja. Necesitaré algunos datos.',
          sender: 'bot',
          timestamp: new Date(),
          type: 'form-notification'
        };
        setMessages(prev => [...prev, botMessage]);
        return;
      }

      // Detectar intención de crear paquete
      if (lowerText.includes('crear') || lowerText.includes('nuevo') || lowerText.includes('paquete') || lowerText.includes('envío')) {
        setShowForm('paquete');
        const botMessage = {
          id: messages.length + 2,
          text: '📦 Perfecto, voy a ayudarte a crear un nuevo paquete. Completa los datos.',
          sender: 'bot',
          timestamp: new Date(),
          type: 'form-notification'
        };
        setMessages(prev => [...prev, botMessage]);
        return;
      }

      const response = generateBotResponse(lowerText);
      const botMessage = {
        id: messages.length + 2,
        text: response,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }, 500);
  };

  const generateBotResponse = (userText) => {
    for (const [key, response] of Object.entries(quickResponses)) {
      if (response === 'entendido') continue;
      if (userText.includes(key)) {
        return response;
      }
    }
    return '¿Podrías darme más detalles? He entendido tu pregunta pero necesito más información. Prueba escribiendo:\n• "rastrear"\n• "crear paquete"\n• "queja"\n• "servicios"\n• "contacto"';
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (showForm === 'queja') {
        // Enviar queja a la API
        const response = await api.post('/complaints', {
          trackingNumber: formData.queja.trackingNumber,
          description: formData.queja.description,
          createdAt: new Date()
        });

        const botMessage = {
          id: messages.length + 1,
          text: `✅ Tu queja ha sido registrada exitosamente.\n📌 Referencia: ${response.data.id || 'COMP-' + Date.now()}\nNos pondremos en contacto pronto.`,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        setFormData({ ...formData, queja: { trackingNumber: '', description: '' } });
      } else if (showForm === 'paquete') {
        // Enviar nuevo paquete a la API
        const response = await api.post('/packages', {
          recipient: formData.paquete.recipient,
          address: formData.paquete.address,
          weight: parseFloat(formData.paquete.weight),
          phone: formData.paquete.phone,
          status: 'pending',
          createdAt: new Date()
        });

        const botMessage = {
          id: messages.length + 1,
          text: `✅ Tu paquete ha sido creado exitosamente.\n📌 Número de seguimiento: ${response.data.trackingNumber || response.data.id}\n🎯 Estado: Pendiente de recogida`,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        setFormData({ ...formData, paquete: { recipient: '', address: '', weight: '', phone: '' } });
      }
      
      setShowForm(null);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: messages.length + 1,
        text: `❌ Hubo un error al procesar tu solicitud. Por favor, intenta de nuevo o contáctanos.`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (showForm === 'queja') {
      setFormData({
        ...formData,
        queja: { ...formData.queja, [name]: value }
      });
    } else if (showForm === 'paquete') {
      setFormData({
        ...formData,
        paquete: { ...formData.paquete, [name]: value }
      });
    }
  };

  return (
    <>
      {isOpen && (
        <div className="support-bot-container">
          <div className="support-bot-header">
            <div className="bot-title">
              <span className="bot-icon">💬</span>
              <span>Soporte Transporte Willmore</span>
            </div>
            <button 
              className="close-btn"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="support-bot-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                <div className="message-content">
                  {msg.text.split('\n').map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {showForm && (
            <form onSubmit={handleFormSubmit} className="support-bot-form">
              {showForm === 'queja' && (
                <>
                  <input
                    type="text"
                    name="trackingNumber"
                    placeholder="Número de seguimiento del paquete"
                    value={formData.queja.trackingNumber}
                    onChange={handleFormChange}
                    required
                    className="form-input"
                  />
                  <textarea
                    name="description"
                    placeholder="Describe tu queja o problema..."
                    value={formData.queja.description}
                    onChange={handleFormChange}
                    required
                    className="form-textarea"
                    rows="4"
                  />
                </>
              )}

              {showForm === 'paquete' && (
                <>
                  <input
                    type="text"
                    name="recipient"
                    placeholder="Nombre del destinatario"
                    value={formData.paquete.recipient}
                    onChange={handleFormChange}
                    required
                    className="form-input"
                  />
                  <input
                    type="text"
                    name="address"
                    placeholder="Dirección de entrega"
                    value={formData.paquete.address}
                    onChange={handleFormChange}
                    required
                    className="form-input"
                  />
                  <input
                    type="number"
                    name="weight"
                    placeholder="Peso (kg)"
                    value={formData.paquete.weight}
                    onChange={handleFormChange}
                    step="0.1"
                    required
                    className="form-input"
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Teléfono del destinatario"
                    value={formData.paquete.phone}
                    onChange={handleFormChange}
                    required
                    className="form-input"
                  />
                </>
              )}

              <div className="form-buttons">
                <button type="submit" className="submit-btn">
                  Enviar ✓
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowForm(null)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {!showForm && (
            <form onSubmit={handleSendMessage} className="support-bot-input">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Escribe tu pregunta..."
                autoFocus
              />
              <button type="submit" className="send-btn">
                Enviar
              </button>
            </form>
          )}
        </div>
      )}

      <button 
        className={`support-bot-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Abrir soporte"
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </>
  );
}

export default SupportBot;
