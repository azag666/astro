// Capa 2 (es-LATAM): focos por dolor, entregable gratuito, motor, paquete de valor.
// Se fusiona encima del diccionario base. Mismos tokens: {var} y {masc|fem}.
export default {
  focus: {
    amor: { label: 'Amor y relaciones', short: 'amor', text: 'Tu Venus muestra cómo amas. Tu Marte, quién te atrae. Y tu Casa 7 guarda el tipo de persona que se queda, y el motivo de que el mismo patrón vuelva.' },
    dinheiro: { label: 'Dinero y prosperidad', short: 'dinero', text: 'Júpiter, Venus y tu Casa 2 muestran de dónde viene tu dinero, por dónde se te escapa y cuándo llega.' },
    carreira: { label: 'Carrera y propósito profesional', short: 'carrera', text: 'Tu Medio Cielo, Saturno y Marte revelan tu verdadera vocación y lo que está frenando tu crecimiento.' },
    espiritual: { label: 'Salud espiritual y camino de vida', short: 'camino espiritual', text: 'Tu Luna, Neptuno y tu Sol muestran lo que tu alma vino a vivir y por qué a veces te sientes perdid{o|a}.' },
  },

  intro: {
    byFocus: {
      amor: { badge: 'Lectura amorosa gratis', title: 'No es mala suerte en el amor.', accent: 'Es un patrón escrito en tu cielo.', sub: 'Descubre por qué siempre atraes al mismo tipo de persona, con quién combinas de verdad y cuáles son tus 3 días más magnéticos de los próximos 30 días.' },
      dinheiro: { badge: 'Diagnóstico financiero gratis', title: 'El dinero tiene su momento exacto para llegar.', accent: 'Tu carta astral sabe cuál es.', sub: 'Mira de dónde viene tu prosperidad, por dónde se te escapa el dinero y tus 3 fechas de oro financieras de los próximos 30 días, calculadas con la posición real de los planetas.' },
      carreira: { badge: 'Diagnóstico de carrera gratis', title: 'No estás en el lugar equivocado por casualidad.', accent: 'Tu carta astral te muestra hacia dónde ir.', sub: 'Descubre tu verdadera vocación según tu Medio Cielo, qué frena tu crecimiento y los 3 mejores días para actuar en los próximos 30 días.' },
      espiritual: { badge: 'Lectura espiritual gratis', title: 'Ese vacío tiene dirección.', accent: 'Y tu carta astral sabe cuál es.', sub: 'Entiende lo que tu alma vino a vivir, por qué te sientes desconectad{o|a} y qué días del próximo mes te abren puertas.' },
    },
  },

  quiz: {
    focus: { title: '¿Qué área de tu vida necesita una respuesta YA?', hint: 'Tu diagnóstico gratis va a profundizar en ella.' },
    branch: {
      amor: { title: '¿Y cómo está tu corazón hoy?', options: { single: 'Solter{o|a} y cansad{o|a} de repetir patrones', doubt: 'En una relación, pero con dudas', ex: 'No puedo olvidar a alguien', complicated: 'Es complicado' } },
      dinheiro: { title: '¿Qué frase describe tu vida financiera?', options: { leaks: 'Gano, pero el dinero se me va', debt: 'Estoy endeudad{o|a} y sin salida', stuck: 'Trabajo muchísimo y no prospero', more: 'Estoy bien, pero quiero multiplicarlo' } },
      carreira: { title: '¿Y tu vida profesional?', options: { stuck: 'Trabajo muchísimo y no avanzo', business: 'Quiero emprender o cambiar de área', lost: 'No sé cuál es mi vocación', growing: 'Quiero crecer más rápido' } },
      espiritual: { title: '¿Qué es lo que más te pesa hoy?', options: { empty: 'Un vacío que no sé explicar', anxiety: 'Ansiedad y cansancio emocional', purpose: 'No sé cuál es mi propósito', energy: 'Siento energías pesadas a mi alrededor' } },
    },
    insight: {
      eyebrow: 'Esto tiene explicación',
      amor: 'Los patrones en el amor casi nunca son mala suerte. Aparecen en la posición de tu Venus, de tu Marte y de tu Casa 7. En un momento ves lo que cada uno dice de ti, y lo que queda escondido.',
      dinheiro: 'Quien trabaja muchísimo y no prospera casi siempre tiene la energía en el lugar equivocado. Júpiter y tu Casa 2 muestran exactamente de dónde viene tu dinero y por dónde se te escapa.',
      carreira: 'Esfuerzo sin resultados suele ser talento en la dirección equivocada. Tu Medio Cielo muestra dónde rindes más y Saturno muestra qué te está frenando.',
      espiritual: 'Ese cansancio del alma tiene dirección en tu carta astral. Tu Luna y Neptuno muestran lo que necesitas para volver a sentirte complet{o|a}.',
    },
    agree: {
      s1: {
        amor: '“Siento que doy más amor del que recibo.”',
        dinheiro: '“Siento que merezco ganar mucho más de lo que gano hoy.”',
        carreira: '“Siento que tengo un potencial enorme que todavía no he podido usar.”',
        espiritual: '“Siento que vine a este mundo con una misión, pero no sé cuál es.”',
      },
      s2: '“A veces siento que mi vida da vueltas en círculos.”',
    },
    email: {
      title: 'Tu diagnóstico está listo. ¿A dónde te enviamos una copia?',
      hint: 'También recibirás un aviso antes de cada una de tus fechas de oro.',
    },
  },

  analyzing: {
    steps: ['Ubicando tu cielo de nacimiento', 'Calculando la posición real de los 10 planetas', 'Encontrando tu Ascendente y tus casas', 'Cruzando con la lectura de tu mano', 'Calculando tus tránsitos de los próximos 30 días', 'Armando tu diagnóstico'],
  },

  report: {
    eyebrow: 'Diagnóstico gratis',
    title: 'Diagnóstico Astral de {name}',
    generated: 'Generado ahora con la posición real de los astros',
    focusTag: 'Enfoque: {focus}',
    readingTitle: 'Tu lectura de {focus}',
    factors: {
      amor: [
        { point: 'venus', text: 'Tu Venus explica por qué amas {style}. Lo que pide a cambio, y casi nadie te da, está en la carta completa.' },
        { point: 'mars', text: 'Te atraen las personas que actúan {style}. No siempre son las que te hacen bien, y tu carta muestra por qué.' },
        { point: 'house7', fallback: 'moon', text: 'La persona que se queda de verdad actúa {style}. El motivo de que atraigas lo opuesto ya aparece en tu carta…' },
      ],
      dinheiro: [
        { point: 'jupiter', text: 'Tu suerte financiera crece cuando actúas {style}.' },
        { point: 'house2', fallback: 'sun', text: 'Tu dinero llega cuando trabajas {style}.' },
        { point: 'venus', text: 'Atraes valor y oportunidades cuando actúas {style}.' },
      ],
      carreira: [
        { point: 'mc', fallback: 'sun', text: 'Tu vocación se realiza cuando trabajas {style}.' },
        { point: 'saturn', text: 'Tu éxito llega con disciplina, actuando {style}.' },
        { point: 'mars', text: 'Tu ambición se manifiesta {style}.' },
      ],
      espiritual: [
        { point: 'moon', text: 'Tu alma se equilibra cuando vives {style}.' },
        { point: 'neptune', text: 'Tu intuición se manifiesta {style}.' },
        { point: 'sun', text: 'Tu propósito es vivir {style}.' },
      ],
    },
    pointNames: { house7: 'Casa 7', house2: 'Casa 2' },
    golden: {
      title: 'Tus 3 fechas de oro en los próximos 30 días',
      sub: 'Calculadas con el tránsito real de los planetas sobre tu carta astral. Anótalas.',
      transit: '{transit} en {type} con {natal} natal',
      meaning: {
        amor: { jupiter: 'Júpiter abre puertas en el amor: día favorable para conocer a alguien o permitirte algo nuevo.', venus: 'Tu día más magnético: te ves más atractiv{o|a} y receptiv{o|a}.', sun: 'Día de claridad: bueno para esa conversación sobre la relación.', moon: 'Día sensible: el corazón habla más fuerte. Bueno para decir lo que sientes.' },
        dinheiro: { jupiter: 'Ventana de expansión: ideal para negociar, pedir un aumento o invertir.', venus: 'Día de atracción de dinero: las ventas y propuestas fluyen mejor.', sun: 'Día de visibilidad: muestra tu trabajo y cobra lo que vale.', moon: 'Día de intuición financiera: confía en tu olfato para las oportunidades.' },
        carreira: { jupiter: 'Ventana de crecimiento: ideal para entrevistas, propuestas y arrancar proyectos.', venus: 'Día de buenas relaciones: el networking y las alianzas rinden más.', sun: 'Día para destacar: tus resultados se ven más.', moon: 'Día de intuición: surgen buenas ideas, anótalo todo.' },
        espiritual: { jupiter: 'Portal de expansión: ideal para meditar, estudiar y empezar de nuevo.', venus: 'Día de sanación emocional: perdona, limpia y reconéctate.', sun: 'Día de fuerza vital: tu energía está por las nubes.', moon: 'Día de intuición aguda: presta atención a las señales y a los sueños.' },
      },
      risk: 'Atención: detectamos 1 día de riesgo',
      riskText: 'Un tránsito tenso golpea tu carta astral en los próximos 30 días. Evita decisiones importantes de {focus} ese día.',
      riskLocked: 'Fecha revelada en la carta completa',
      moon: 'Próxima Luna Nueva: {date}. El mejor día del mes para sembrar intenciones de {focus}.',
      cta: 'Ver las fechas de oro de los próximos 12 meses',
    },
    numerology: {
      title: 'Tus números',
      lifePath: 'Número de vida',
      personalYear: 'Año personal {year}',
      numbers: {
        1: 'Liderazgo e independencia. Viniste a abrir caminos.',
        2: 'Sensibilidad y compañerismo. Tu fuerza está en las conexiones.',
        3: 'Comunicación y creatividad. Naciste para expresarte.',
        4: 'Construcción y solidez. Conviertes el esfuerzo en patrimonio.',
        5: 'Libertad y cambio. Tu vida avanza a base de giros.',
        6: 'Amor y responsabilidad. Eres el refugio de los demás.',
        7: 'Sabiduría e intuición. Viniste a buscar la verdad.',
        8: 'Poder y prosperidad. Tienes un talento natural para el dinero.',
        9: 'Humanidad y cierre. Viniste a enseñar y a transformar.',
        11: 'Número maestro: intuición e inspiración muy por encima del promedio.',
        22: 'Número maestro: el constructor. Capacidad de lograr cosas grandes.',
        33: 'Número maestro: el maestro del amor. Misión de sanación y servicio.',
      },
      years: {
        1: 'Año de nuevos comienzos: lo que siembres ahora define los próximos 9 años.',
        2: 'Año de paciencia y alianzas: las cosas maduran despacio.',
        3: 'Año de expansión social y creatividad: déjate ver.',
        4: 'Año de trabajo y bases: construye lo que te va a sostener.',
        5: 'Año de cambios y oportunidades inesperadas: dile que sí a lo nuevo.',
        6: 'Año del hogar, del amor y de las responsabilidades.',
        7: 'Año de introspección: las respuestas importantes vienen de adentro.',
        8: 'Año de cosecha material: dinero y reconocimiento.',
        9: 'Año de cierres: suelta lo que ya no te sirve.',
      },
    },
    path: {
      title: 'Tu camino',
      sub: 'Lo que te pide tu carta astral, en 3 pasos.',
      step: 'Paso {n}',
      element: {
        fire: 'Destraba la acción. Sin Fuego, planeas de más y actúas de menos. Elige una decisión que llevas tiempo posponiendo y tómala esta semana.',
        earth: 'Pon los pies en la tierra. Sin Tierra, las ideas no se convierten en resultados. Convierte un plan en una rutina simple y diaria.',
        air: 'Habla. Sin Aire, te lo guardas todo. Di lo que sientes y lo que quieres, aunque parezca arriesgado.',
        water: 'Siente. Sin Agua, todo lo resuelves con la cabeza. Dale espacio a tu intuición antes de decidir.',
        dominantFire: 'Usa tu Fuego: rindes más cuando lideras y das el primer paso. Deja de esperar permiso.',
        dominantEarth: 'Usa tu Tierra: rindes más con constancia. Un paso al día vale más que un salto.',
        dominantAir: 'Usa tu Aire: rindes más cuando te comunicas. Tu palabra es tu mejor herramienta.',
        dominantWater: 'Usa tu Agua: rindes más cuando confías en tu intuición. Tu primera corazonada suele ser la correcta.',
      },
      focus: {
        amor: 'Deja de esperar a que el otro cambie. Tu Venus te pide amar {style}, y quien no sigue ese ritmo difícilmente te hará feliz.',
        dinheiro: 'Tu dinero se traba cuando trabajas en contra de tu naturaleza. Tu Júpiter te pide ganar dinero {style}.',
        carreira: 'Tu vocación no es un puesto, es una forma de trabajar. Tu carta astral te pide actuar {style}.',
        espiritual: 'Tu paz no está afuera. Tu Luna te pide vivir {style}, y eso es lo que reconecta tu alma.',
      },
      timing: 'Tu próxima ventana es el {date}. Es el día en que el cielo está a tu favor para {action}.',
      actions: { amor: 'dar el primer paso en el amor', dinheiro: 'mover tu dinero', carreira: 'dar tu siguiente paso profesional', espiritual: 'empezar de nuevo por dentro' },
      more: 'Y las otras 11 ventanas del año están en tu carta astral completa.',
    },
    seen: 'Solo has visto el {pct}% de tu carta astral',
    seenSub: 'El resto está en tu Carta Astral Completa: cada planeta, cada casa y tu calendario de los próximos 12 meses.',
  },

  engine: {
    eyebrow: 'Tecnología Céu Natal',
    title: 'No es horóscopo. Es cálculo.',
    sub: 'Tu carta astral pasa por 4 capas antes de llegar a ti.',
    steps: [
      { title: 'Astronomía de precisión', text: 'Calculamos la posición de cada planeta en el minuto exacto de tu nacimiento, con precisión de observatorio.' },
      { title: 'Tu punto exacto en la Tierra', text: 'Coordenadas y huso horario histórico de tu ciudad, incluido el horario de verano de la época.' },
      { title: 'Cruce triple', text: 'Astrología, numerología y la lectura de tu mano combinadas en un solo diagnóstico.' },
      { title: 'Interpretación humana', text: 'Astrólogos convierten los cálculos en orientaciones prácticas, en lenguaje sencillo.' },
    ],
  },

  stack: {
    eyebrow: 'Tu paquete',
    title: 'Todo lo que recibes hoy',
    items: [
      { title: 'Carta Astral Completa', text: 'Todos los planetas, las 12 casas, los aspectos y tu retrato completo.' },
      { title: 'Predicción de los próximos 12 meses', text: 'Diagrama energético mes a mes, con fases de impulso y de cuidado.' },
      { title: '{guide}', text: 'Una guía exclusiva de {focus}, hecha a partir de tu carta astral.' },
      { title: 'Calendario de Fechas de Oro', text: 'Tus mejores días para el {focus} en cada mes del próximo año.' },
      { title: 'Carta Numerológica Personal', text: 'Tu número de vida, tu año personal y lo que te piden.' },
    ],
    guides: { amor: 'Código del Amor y la Compatibilidad', dinheiro: 'Código de la Prosperidad', carreira: 'Código de la Carrera', espiritual: 'Código del Alma' },
    total: 'Valor total',
    today: 'Hoy, por solo',
    bonusTag: 'Bono',
  },

  sales: {
    headlineByFocus: {
      amor: '{name}, el motivo de que siempre atraigas al mismo tipo de persona está en tu carta.',
      dinheiro: '{name}, tu carta astral muestra dónde está atorado tu dinero.',
      carreira: '{name}, tu carta astral muestra hacia dónde debería ir tu carrera.',
      espiritual: '{name}, tu carta astral muestra lo que tu alma te está pidiendo.',
    },
    headlineAccent: 'Y tu diagnóstico ya está listo.',
    unlock: 'Quiero mi carta astral completa',
  },
}
