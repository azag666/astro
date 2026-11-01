// Overrides para Argentina (voseo). Se fusiona en profundidad sobre es.js; los arrays reemplazan completos.
export default {
  signs: {
    aries: { trait: 'empezás lo que los demás solo imaginan' },
    taurus: { trait: 'convertís la constancia en seguridad' },
    gemini: { trait: 'conectás ideas y personas con facilidad' },
    cancer: { trait: 'cuidás y protegés a quien amás' },
    sagittarius: { trait: 'buscás sentido y expansión' },
    libra: { trait: 'buscás equilibrio y belleza en todo' },
    scorpio: { trait: 'llegás a lo profundo donde nadie se anima' },
    capricorn: { trait: 'construís con paciencia y ves más lejos' },
    aquarius: { trait: 'pensás diferente y no te conformás con lo obvio' },
    pisces: { trait: 'sentís lo que los demás todavía no notaron' },
  },

  elements: {
    fire: { missing: 'Falta Fuego en tu carta: podés tenerlo todo planeado y aun así quedarte congelad{o|a} a la hora de actuar.' },
    air: { missing: 'Falta Aire en tu carta: sentís muchísimo, pero explicarles a los demás lo que sentís no siempre es fácil.' },
    water: { missing: 'Falta Agua en tu carta: todo lo resolvés con la cabeza, y a veces el corazón te pasa factura.' },
  },

  planets: {
    moon: { line: 'En lo emocional, reaccionás {style}.' },
    mercury: { area: 'Cómo pensás y te comunicás', line: 'Pensás y te comunicás {style}.' },
    venus: { area: 'Lo que valorás y amás', line: 'En el amor, te entregás {style}.' },
    mars: { line: 'Cuando querés algo, vas por eso {style}.' },
    jupiter: { line: 'Tu suerte crece cuando actuás {style}.' },
    pluto: { line: 'Te transformás {style}.' },
  },

  phases: {
    new: { text: 'Quien nace en Luna Nueva vino a iniciar ciclos. Vos no naciste para seguir caminos ya trazados.' },
  },

  highlights: {
    stellium: { text: 'Tenés 3 o más planetas concentrados en {sign}. Es una configuración poco común que hace que esa energía sea mucho más fuerte en vos que en la mayoría de las personas.' },
    tightAspect: { text: 'Este aspecto es casi perfecto en tu carta (menos de 1,5°). Explica un patrón que se repite en tu vida y que quizá nunca lograste entender.' },
    retro: { text: 'Cuando naciste, {planet} estaba retrógrado. Eso cambia la forma en que esa energía actúa en vos: más hacia adentro, más lenta, más profunda.' },
    locked: 'Desbloquealo para leer',
  },

  focus: {
    amor: { text: 'Venus, Marte y tu Casa 7 muestran cómo amás, a quién atraés y por qué ciertos patrones se repiten.' },
    autoconhecimento: { text: 'Sol, Luna y Ascendente juntos forman tu retrato completo: quién sos, qué sentís y cómo te ve el mundo.' },
  },

  intro: {
    titleAccent: 'explica lo que nadie te explicó.',
    sub: '¿Por qué siempre te trabás en el mismo punto? ¿Por qué atraés al mismo tipo de persona? Respondé el test y descubrí lo que revela tu carta astral, calculada con la posición real de los planetas.',
  },

  quiz: {
    gender: { title: 'Para empezar, ¿cómo te identificás?' },
    insight: {
      amor: 'Los patrones en el amor casi nunca son mala suerte. En la carta astral aparecen en la posición de Venus, de Marte y de tu Casa 7, y cambian por completo cuando entendés lo que te están pidiendo.',
    },
    agree: { title: '¿Te identificás con esta frase?' },
    name: { title: '¿Cómo te llamás?', hint: 'Tu carta se escribe para vos, con tu nombre.' },
    birthDate: { revealText: 'Vos {trait}. Pero el Sol es solo 1 de los 12 puntos de tu carta.' },
    birthTime: { unknownNote: 'No hay problema. Calculamos todo lo que no depende de la hora, y podés enviarla después.' },
    city: { placeholder: 'Escribí el nombre de la ciudad', error: 'No pudimos buscar en este momento. Intentalo de nuevo.' },
    palm: {
      title: '¿Querés cruzar tu carta con la lectura de tu mano?',
      notFound: 'No encontramos una mano en la imagen. Intentalo con la palma bien abierta y más luz.',
    },
    email: {
      hint: 'También recibís las fechas clave de tu próximo mes.',
      invalid: 'Revisá el e-mail',
    },
  },

  palmTypes: {
    fire: { text: 'Palma larga y dedos cortos: actuás por impulso y entusiasmo, y la rutina te aburre.' },
    earth: { text: 'Palma cuadrada y dedos cortos: sos práctic{o|a}, confiable y necesitás ver resultados concretos.' },
    air: { text: 'Palma cuadrada y dedos largos: mente rápida y comunicativa, vivís en el mundo de las ideas.' },
    water: { text: 'Palma larga y dedos largos: sensibilidad e intuición por encima del promedio, lo sentís todo el doble.' },
    indexLonger: 'Tu dedo índice es más largo que el anular: señal clásica de liderazgo, ambición y seguridad en vos mism{o|a}.',
    match: 'Tu mano confirma el elemento que domina tu carta. Esa energía es muy fuerte en vos.',
  },

  sales: {
    headline: '{name}, vos {trait}.',
    genericTitle: 'Dejá de dar vueltas en círculos.',
    get: {
      eyebrow: 'Lo que recibís',
      title: 'Un libro sobre vos, escrito por las estrellas',
    },
    planets: { title: 'Cada planeta revela una parte de vos' },
    bonus: { title: 'Si hacés tu pedido antes de fin de mes, también te llevás' },
    how: {
      steps: [
        { title: 'Tus datos ya están listos', text: 'Usamos las respuestas de tu test. Solo confirmás tu contacto.' },
        { title: 'Calculamos e interpretamos', text: 'Nuestros astrólogos arman y redactan la interpretación de tu carta.' },
        { title: 'Recibila en máximo 48 h', text: 'El PDF completo y los bonos llegan a tu e-mail.' },
      ],
      stepOneGeneric: { title: 'Ingresá tus datos' },
    },
  },

  faq: [
    { q: '¿Qué es una carta astral?', a: 'Es una fotografía del cielo en el momento y lugar exactos de tu nacimiento. La posición de cada planeta en los signos y en las casas describe tu personalidad, tus talentos y los ciclos de tu vida.' },
    { q: 'No sé a qué hora nací. ¿La puedo hacer?', a: 'Sí. Calculamos todo lo que no depende de la hora y usamos el método de rectificación para el Ascendente. También podés enviarnos la hora después.' },
    { q: '¿Cuándo y cómo la recibo?', a: 'En máximo 48 horas, por e-mail, en un PDF de más de 90 páginas. El archivo es tuyo para siempre.' },
    { q: '¿Necesito saber de astrología?', a: 'No. Toda la interpretación está escrita en lenguaje sencillo, con ejemplos de la vida diaria y consejos prácticos.' },
    { q: '¿Y si no me gusta?', a: 'Tenés 7 días de garantía incondicional. Solo respondé al e-mail de entrega y te devolvemos el 100% de tu dinero.' },
    { q: '¿El pago es seguro?', a: 'Sí. El pago se procesa con cifrado y no almacenamos los datos de tu tarjeta.' },
  ],

  // Testimonios ilustrativos para el prototipo. Reemplazalos por reales (con autorización) antes de publicar.
  testimonials: [
    { name: 'Lucía G.', city: 'Córdoba', text: 'Leí el capítulo de la Luna tres veces. Me explicó cosas que sentía y nunca había podido poner en palabras.' },
    { name: 'Martín T.', city: 'Rosario', text: 'La compré sin muchas expectativas y me sorprendió. Lenguaje sencillo, nada de términos complicados.' },
    { name: 'Sofía M.', city: 'Buenos Aires', text: 'Llegó antes de lo prometido. La parte de carrera me ayudó con una decisión que venía postergando hace meses.' },
    { name: 'Florencia R.', city: 'Mendoza', text: 'Ya me había hecho la carta en una app, pero nada se compara con este nivel de detalle.' },
    { name: 'Camila L.', city: 'La Plata', text: 'Se la regalé a mi mamá y le encantó. Ahora quiere la de toda la familia.' },
    { name: 'Nicolás F.', city: 'Mar del Plata', text: 'El diagrama de los próximos meses se volvió mi guía. Lo consulto todas las semanas.' },
  ],

  checkout: {
    fixErrors: 'Revisá los campos marcados arriba.',
    errors: { name: 'Escribí tu nombre', birthDate: 'Ingresá la fecha', city: 'Elegí la ciudad', bank: 'Elegí tu banco' },
    card: { installments: '{n} cuotas de {value} sin interés' },
    pending: {
      qrText: 'Abrí la app {wallet} y escaneá el código.',
      voucherText: 'Presentá esta referencia en cualquier {wallet} y pagá en efectivo. Es válida por 48 horas.',
      transferText: 'Hacé la transferencia desde la app de tu banco. La confirmación es automática.',
      pushTitle: 'Confirmá en tu celular',
    },
  },

  success: {
    support: '¿Dudas? Hablá con soporte',
  },
}
