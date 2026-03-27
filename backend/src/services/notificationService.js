const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

/**
 * Enviar SMS de notificación
 * @param {string} phoneNumber - Número de teléfono en formato +1234567890
 * @param {string} message - Mensaje a enviar
 */
async function sendSMS(phoneNumber, message) {
  try {
    const msgSent = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    
    console.log(`✅ SMS enviado: ${msgSent.sid}`);
    return msgSent;
  } catch (error) {
    console.error('❌ Error enviando SMS:', error);
    throw error;
  }
}

/**
 * Notificar rastreo de paquete
 */
function notifyTracking(phoneNumber, packageCode, status) {
  const statusLabels = {
    'pending': 'en espera',
    'in-transit': 'en tránsito',
    'out-for-delivery': 'saliendo para entrega',
    'delivered': 'entregado',
    'failed': 'fallo en entrega'
  };

  const message = `📦 Tu paquete ${packageCode} está ${statusLabels[status] || status}. Visita https://track.app/${packageCode}`;
  return sendSMS(phoneNumber, message);
}

/**
 * Notificar entrega exitosa
 */
function notifyDelivery(phoneNumber, packageCode, driverName) {
  const message = `✅ ¡Tu paquete ${packageCode} fue entregado por ${driverName}! Gracias por usar nuestro servicio.`;
  return sendSMS(phoneNumber, message);
}

/**
 * Notificar problema en entrega
 */
function notifyDeliveryFailure(phoneNumber, packageCode, reason) {
  const message = `⚠️ No pudimos entregar tu paquete ${packageCode}. Razón: ${reason}. Nos contactaremos pronto.`;
  return sendSMS(phoneNumber, message);
}

/**
 * Enviar mensaje por WhatsApp con imagen
 * @param {string} phoneNumber - Número de teléfono en formato +1234567890
 * @param {string} message - Mensaje a enviar
 * @param {string} imageBase64 - Imagen en base64 (opcional)
 */
async function sendWhatsAppWithImage(phoneNumber, message, imageBase64 = null) {
  try {
    // Asegurarse que el número tenga el formato correcto
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber}`;
    
    let msgSent;
    
    if (imageBase64) {
      // Enviar con imagen
      msgSent = await client.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${formattedPhone}`,
        mediaUrl: [imageBase64] // Puede ser data URL o URL pública
      });
    } else {
      // Enviar solo texto
      msgSent = await client.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${formattedPhone}`
      });
    }
    
    console.log(`✅ WhatsApp enviado: ${msgSent.sid}`);
    return msgSent;
  } catch (error) {
    console.error('❌ Error enviando WhatsApp:', error);
    throw error;
  }
}

/**
 * Convertir Buffer a data URL
 * @param {Buffer} buffer - Buffer de imagen
 * @param {string} mimeType - Tipo MIME (ej: image/png)
 */
function bufferToDataUrl(buffer, mimeType = 'image/jpeg') {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

/**
 * Enviar mensaje con plantilla WhatsApp (Para Admin - Nueva Solicitud)
 * @param {string} nombreMensajero - Nombre del mensajero
 * @param {string} apellidoMensajero - Apellido del mensajero
 * @param {string} telefonoMensajero - Teléfono del mensajero
 * @param {string} cedulaMensajero - Cédula del mensajero
 * @param {string} direccion - Dirección del mensajero
 * @param {string} idSolicitud - ID de la solicitud
 */
async function sendNuevaSolicitudTemplate(nombreMensajero, apellidoMensajero, telefonoMensajero, cedulaMensajero, direccion, idSolicitud) {
  try {
    const adminPhone = process.env.ADMIN_WHATSAPP;
    const templateSid = process.env.TWILIO_TEMPLATE_NUEVA_SOLICITUD;

    console.log('🔍 DEBUG - Enviando notificación...');
    console.log('   ADMIN_WHATSAPP:', adminPhone);
    console.log('   TEMPLATE_SID:', templateSid);
    console.log('   TWILIO_WHATSAPP_NUMBER:', process.env.TWILIO_WHATSAPP_NUMBER);

    const msgSent = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${adminPhone}`,
      contentSid: templateSid,
      contentVariables: JSON.stringify({
        "1": nombreMensajero,
        "2": apellidoMensajero,
        "3": telefonoMensajero,
        "4": cedulaMensajero,
        "5": direccion,
        "6": idSolicitud
      })
    });

    console.log(`✅ Notificación de nueva solicitud enviada al admin: ${msgSent.sid}`);
    return msgSent;
  } catch (error) {
    console.error('❌ Error enviando notificación de nueva solicitud:');
    console.error('   Error Code:', error.code);
    console.error('   Message:', error.message);
    console.error('   Status:', error.status);
    console.error('   Full Error:', error);
    throw error;
  }
}

/**
 * Enviar mensaje con plantilla WhatsApp (Para Mensajero - Bienvenida)
 * @param {string} phoneNumber - Teléfono del mensajero
 * @param {string} nombreMensajero - Nombre del mensajero
 * @param {string} cedulaMensajero - Cédula del mensajero
 */
async function sendBienvenidaTemplate(phoneNumber, nombreMensajero, cedulaMensajero) {
  try {
    const templateSid = process.env.TWILIO_TEMPLATE_BIENVENIDA;
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber}`;

    const msgSent = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${formattedPhone}`,
      contentSid: templateSid,
      contentVariables: JSON.stringify({
        "1": nombreMensajero,
        "2": cedulaMensajero
      })
    });

    console.log(`✅ Mensaje de bienvenida enviado a ${phoneNumber}: ${msgSent.sid}`);
    return msgSent;
  } catch (error) {
    console.error('❌ Error enviando mensaje de bienvenida:', error);
    throw error;
  }
}

/**
 * Enviar comprobante de transferencia al admin
 * @param {string} packageCode - Código del paquete
 * @param {string} voucherImageBase64 - Imagen del comprobante en base64 (opcional)
 * @param {string} senderName - Nombre del remitente
 * @param {string} amount - Monto de la transferencia
 */
async function sendVoucherToAdmin(packageCode, voucherImageBase64, senderName, amount) {
  try {
    const adminPhone = process.env.ADMIN_WHATSAPP;
    
    const message = `📸 *Nuevo Comprobante de Pago* 📸\n\n` +
      `📦 *Paquete:* ${packageCode}\n` +
      `👤 *Cliente:* ${senderName}\n` +
      `💰 *Monto:* RD$ ${amount}\n\n` +
      `⏳ Por favor verificar y confirmar el pago.`;

    const messageConfig = {
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${adminPhone}`,
      body: message
    };

    // Si hay imagen, intentar enviarla
    if (voucherImageBase64 && voucherImageBase64.trim() !== '') {
      // Nota: Twilio mediaUrl espera URLs públicas, no base64
      // Si necesitas enviar la imagen, deberías hostearla primero
      // Por ahora, solo enviamos el mensaje con el código
      console.log(`📎 Imagen del comprobante disponible para paquete ${packageCode}`);
    }

    const msgSent = await client.messages.create(messageConfig);

    console.log(`✅ Comprobante enviado al admin para paquete ${packageCode}: ${msgSent.sid}`);
    return msgSent;
  } catch (error) {
    console.error('❌ Error enviando comprobante al admin:', error);
    throw error;
  }
}

/**
 * Enviar información del paquete al repartidor
 * @param {object} driver - Objeto del repartidor con name, phone
 * @param {object} packageData - Datos del paquete
 */
async function sendPackageToDriver(driver, packageData) {
  try {
    if (!driver || !driver.phone) {
      console.log('⚠️ No hay repartidor o teléfono disponible');
      return null;
    }

    const driverPhone = driver.phone.startsWith('+') ? driver.phone : `+1${driver.phone}`;

    const message = `🚚 *NUEVO PAQUETE ASIGNADO* 🚚\n\n` +
      `📦 *Código:* ${packageData.packageCode}\n\n` +
      `�‍💼 *TU INFORMACIÓN:*\n` +
      `▪️ Repartidor: ${driver.name}\n` +
      `▪️ Teléfono: ${driver.phone}\n\n` +
      `📍 *RECOGIDA (Tienda/Origen):*\n${packageData.originAddress}\n\n` +
      `💼 *Remitente (quien envía):*\n` +
      `👤 ${packageData.sender || 'Cliente'}\n` +
      `📱 ${packageData.senderPhone || 'N/A'}\n\n` +
      `🏠 *ENTREGA (Destinatario):*\n${packageData.destinationAddress}\n\n` +
      `👤 *Cliente (quien recibe):*\n${packageData.recipient}\n` +
      `📱 *Teléfono:* ${packageData.recipientPhone}\n\n` +
      `⏰ Puedes chatear con ellos usando los números arriba. Por favor confirma que recibiste este paquete.`;

    const msgSent = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${driverPhone}`,
      body: message
    });

    console.log(`✅ Paquete enviado al repartidor ${driver.name} (${driver.phone}): ${msgSent.sid}`);
    return msgSent;
  } catch (error) {
    console.error('Error enviando paquete al repartidor:', error);
    // No lanzar error, solo loguear para que no falle la creación del paquete
    return null;
  }
}

/**
 * Enviar instrucciones de pago al cliente remitente
 * @param {string} senderPhone - Teléfono del remitente
 * @param {string} packageCode - Código del paquete
 * @param {string} amount - Monto a pagar
 */
async function sendPaymentInstructionsToSender(senderPhone, packageCode, amount) {
  try {
    if (!senderPhone) {
      console.log('No hay telefono del remitente disponible');
      return null;
    }

    const formattedPhone = senderPhone.startsWith('+') ? senderPhone : `+1${senderPhone}`;

    const message = `Instrucciones de pago\n\n` +
      `Paquete: ${packageCode}\n` +
      `Monto: RD$ ${amount}\n\n` +
      `Por favor confirma tu pago dentro de 24 horas.`;

    const msgSent = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${formattedPhone}`,
      body: message
    });

    console.log(`Instrucciones de pago enviadas al remitente (${senderPhone}): ${msgSent.sid}`);
    return msgSent;
  } catch (error) {
    console.error('Error enviando instrucciones de pago al remitente:', error);
    return null;
  }
}

module.exports = {
  sendSMS,
  sendWhatsAppWithImage,
  sendNuevaSolicitudTemplate,
  sendBienvenidaTemplate,
  sendVoucherToAdmin,
  sendPackageToDriver,
  sendPaymentInstructionsToSender,
  bufferToDataUrl,
  notifyTracking,
  notifyDelivery,
  notifyDeliveryFailure
};
