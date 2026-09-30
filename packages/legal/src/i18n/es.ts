import { type LegalDocSet, tgLink } from '../shared';

export const es: LegalDocSet = {
  privacy: {
    title: 'Política de privacidad',
    intro:
      'CaloSnap («la aplicación») te ayuda a llevar un registro de lo que comes. Esta política explica qué datos recopilamos, cómo los utilizamos y cómo puedes eliminarlos.',
    sections: [
      {
        h: 'Datos que recopilamos',
        p: [
          'Cuenta: nombre, número de teléfono y contraseña (almacenada únicamente como hash con sal).',
          'Perfil: edad, sexo, estatura, peso, nivel de actividad, objetivo y meta diaria de calorías.',
          'Diario: los alimentos y porciones que registras, así como los registros de agua y peso.',
          'Fotos: las fotos de comidas y de etiquetas nutricionales que envías para su análisis, y una foto de perfil opcional.',
          'Condiciones de salud (opcional): las condiciones que seleccionas en tu perfil (p. ej., diabetes, hipertensión). Se utilizan únicamente para personalizar las alertas y sugerencias sobre alimentos.',
          'Nutricionista IA y Chef IA: tus mensajes, listas de ingredientes o fotos del refrigerador se envían a nuestro servidor para generar una respuesta y no se almacenan allí. El historial de chat se guarda solo en tu dispositivo y se borra al cerrar sesión.',
          'Estado de la suscripción: las compras las procesan App Store / Google Play; nunca vemos ni almacenamos los datos de tu tarjeta.',
        ],
      },
      {
        h: 'Cómo utilizamos los datos',
        p: [
          'Para calcular calorías y macronutrientes, mantener tu diario y establecer objetivos personales.',
          'Las fotos se envían a Google Gemini para reconocer los alimentos.',
          'Para el Nutricionista IA, el Chef IA y las alertas de salud, se envían a Google Gemini tus mensajes, ingredientes, el contenido de las comidas y los datos de perfil necesarios para personalizar la respuesta (objetivo, meta diaria, condiciones de salud). Tu nombre y número de teléfono no se envían.',
          'No mostramos anuncios, nunca vendemos tus datos y no te rastreamos en otras aplicaciones.',
        ],
      },
      {
        h: 'Servicios de terceros',
        p: [
          'Google Gemini (análisis de fotos y asistentes de IA), Cloudinary (almacenamiento de imágenes), RevenueCat (estado de la suscripción), Railway (servidor y base de datos), Open Food Facts (búsqueda por código de barras; solo se envía el código de barras).',
          'Los productos envasados que agregas (nombre e información nutricional) pasan a ser visibles para otros usuarios; no contienen datos personales.',
        ],
      },
      {
        h: 'Conservación y eliminación',
        p: [
          'Los datos se conservan mientras tu cuenta esté activa.',
          'Perfil → «Eliminar cuenta» elimina de forma inmediata y permanente tu cuenta y todos los datos relacionados (perfil, diario, registros, fotos).',
        ],
      },
      { h: 'Menores', p: ['La aplicación no está dirigida a menores de 13 años.'] },
      { h: 'Contacto', p: [`${tgLink('Escríbenos por Telegram')}.`] },
    ],
  },
  terms: {
    title: 'Términos de uso',
    intro: 'Al usar CaloSnap, aceptas estos términos.',
    sections: [
      {
        h: 'No constituye consejo médico',
        p: [
          'La aplicación tiene fines exclusivamente informativos y no sustituye el consejo de un médico o nutricionista.',
          'Los valores de calorías y nutrientes estimados por la IA son aproximados y pueden ser incorrectos.',
          'El Nutricionista IA, el Chef IA y las alertas de salud ofrecen únicamente orientación general: no diagnostican ni prescriben medicamentos ni dosis de insulina. Si tienes diabetes u otra condición de salud, sigue las indicaciones de tu médico.',
        ],
      },
      {
        h: 'Suscripción a CaloSnap Pro',
        p: [
          'Las suscripciones son semanales, mensuales o anuales; el precio se muestra antes de la compra y se cobra a tu cuenta de App Store o Google Play.',
          'La suscripción se renueva automáticamente, salvo que se cancele al menos 24 horas antes de que finalice el período en curso.',
          'Puedes gestionarla o cancelarla en la configuración de tu cuenta de App Store o Google Play. Eliminar tu cuenta de CaloSnap no cancela la suscripción.',
          'Cualquier parte no utilizada de una prueba gratuita se pierde al comprar una suscripción.',
        ],
      },
      {
        h: 'Contenido del usuario',
        p: ['Los datos de productos que agregues deben ser precisos. Podemos eliminar entradas incorrectas o abusivas.'],
      },
      {
        h: 'Responsabilidad',
        p: ['La aplicación se proporciona «tal cual». En la medida en que lo permita la ley, no somos responsables de daños indirectos.'],
      },
      { h: 'Contacto', p: [`${tgLink('Escríbenos por Telegram')}.`] },
    ],
  },
  'delete-account': {
    title: 'Eliminar tu cuenta',
    intro: 'Puedes eliminar tu cuenta de CaloSnap y todos los datos relacionados en cualquier momento.',
    sections: [
      {
        h: 'Desde la aplicación (recomendado)',
        p: ['Abre CaloSnap → Perfil → «Eliminar cuenta» → introduce tu contraseña y confirma. La eliminación es inmediata.'],
      },
      {
        h: 'Si no puedes acceder a la aplicación',
        p: [`${tgLink('Escríbenos por Telegram')} indicando el número de teléfono con el que te registraste. Las solicitudes se completan en un plazo de 7 días.`],
      },
      {
        h: 'Qué se elimina',
        p: [
          'Tu cuenta, perfil, diario, historial de agua y peso, fotos escaneadas y foto de perfil se eliminan de forma permanente.',
          'Los productos envasados que agregaste (sin datos personales) permanecen en el catálogo compartido.',
          'Las suscripciones deben cancelarse por separado en App Store / Google Play.',
        ],
      },
    ],
  },
};
