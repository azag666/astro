// Overrides es-AR (voseo) sobre extra-es.js. Los arrays se reemplazan enteros.
export default {
  focus: {
    espiritual: { text: 'Tu Luna, Neptuno y tu Sol muestran lo que tu alma vino a vivir y por qué a veces te sentís perdid{o|a}.' },
  },

  intro: {
    byFocus: {
      amor: { sub: 'Descubrí por qué siempre atraés al mismo tipo de persona, qué te pide tu Venus y cuáles son tus 3 días más magnéticos de los próximos 30 días.' },
      dinheiro: { sub: 'Mirá de dónde viene tu prosperidad, por dónde se te escapa la plata y tus 3 fechas de oro financieras de los próximos 30 días, calculadas con la posición real de los planetas.' },
      carreira: { sub: 'Descubrí tu verdadera vocación según tu Medio Cielo, qué frena tu crecimiento y los 3 mejores días para actuar en los próximos 30 días.' },
      espiritual: { sub: 'Entendé lo que tu alma vino a vivir, por qué te sentís desconectad{o|a} y qué días del próximo mes te abren puertas.' },
    },
  },

  quiz: {
    branch: {
      dinheiro: { options: { leaks: 'Gano, pero la plata se me va' } },
    },
    insight: {
      amor: 'Los patrones en el amor casi nunca son mala suerte. En la carta astral aparecen en la posición de Venus, de Marte y de tu Casa 7. Cuando entendés lo que te piden, el patrón pierde su fuerza.',
      dinheiro: 'El que trabaja muchísimo y no prospera casi siempre tiene la energía en el lugar equivocado. Júpiter y tu Casa 2 muestran exactamente de dónde viene tu plata y por dónde se te escapa.',
      carreira: 'Esfuerzo sin resultados suele ser talento en la dirección equivocada. Tu Medio Cielo muestra dónde rendís más y Saturno muestra qué te está frenando.',
      espiritual: 'Ese cansancio del alma tiene dirección en tu carta astral. Tu Luna y Neptuno muestran lo que necesitás para volver a sentirte complet{o|a}.',
    },
    email: {
      hint: 'También vas a recibir un aviso antes de cada una de tus fechas de oro.',
    },
  },

  report: {
    factors: {
      amor: [
        { point: 'venus', text: 'En el amor, te entregás {style}.' },
        { point: 'mars', text: 'Te atraen las personas que actúan {style}.' },
        { point: 'house7', fallback: 'moon', text: 'La persona indicada para vos actúa {style}.' },
      ],
      dinheiro: [
        { point: 'jupiter', text: 'Tu suerte financiera crece cuando actuás {style}.' },
        { point: 'house2', fallback: 'sun', text: 'Tu plata llega cuando trabajás {style}.' },
        { point: 'venus', text: 'Atraés valor y oportunidades cuando actuás {style}.' },
      ],
      carreira: [
        { point: 'mc', fallback: 'sun', text: 'Tu vocación se realiza cuando trabajás {style}.' },
        { point: 'saturn', text: 'Tu éxito llega con disciplina, actuando {style}.' },
        { point: 'mars', text: 'Tu ambición se manifiesta {style}.' },
      ],
      espiritual: [
        { point: 'moon', text: 'Tu alma se equilibra cuando vivís {style}.' },
        { point: 'neptune', text: 'Tu intuición se manifiesta {style}.' },
        { point: 'sun', text: 'Tu propósito es vivir {style}.' },
      ],
    },
    golden: {
      sub: 'Calculadas con el tránsito real de los planetas sobre tu carta astral. Anotalas.',
      meaning: {
        amor: { venus: 'Día magnético: te ves más atractiv{o|a} y receptiv{o|a}.', moon: 'Día sensible: el corazón habla más fuerte, aprovechá para declararte.' },
        dinheiro: { sun: 'Día de visibilidad: mostrá tu trabajo y cobrá lo que vale.', moon: 'Día de intuición financiera: confiá en tu olfato para las oportunidades.' },
        carreira: { moon: 'Día de intuición: surgen buenas ideas, anotá todo.' },
        espiritual: { venus: 'Día de sanación emocional: perdoná, limpiá y reconectate.', moon: 'Día de intuición aguda: prestá atención a las señales y a los sueños.' },
      },
      riskText: 'Un tránsito tenso golpea tu carta astral en los próximos 30 días. Evitá decisiones importantes de {focus} ese día.',
    },
    numerology: {
      numbers: {
        4: 'Construcción y solidez. Convertís el esfuerzo en patrimonio.',
        6: 'Amor y responsabilidad. Sos el refugio de los demás.',
        8: 'Poder y prosperidad. Tenés un talento natural para la plata.',
      },
      years: {
        1: 'Año de nuevos comienzos: lo que siembres ahora define los próximos 9 años.',
        3: 'Año de expansión social y creatividad: dejate ver.',
        4: 'Año de trabajo y bases: construí lo que te va a sostener.',
        5: 'Año de cambios y oportunidades inesperadas: decile que sí a lo nuevo.',
        8: 'Año de cosecha material: plata y reconocimiento.',
        9: 'Año de cierres: soltá lo que ya no te sirve.',
      },
    },
    path: {
      element: {
        fire: 'Destrabá la acción. Sin Fuego, planeás de más y actuás de menos. Elegí una decisión que venís postergando y tomala esta semana.',
        earth: 'Poné los pies en la tierra. Sin Tierra, las ideas no se convierten en resultados. Convertí un plan en una rutina simple y diaria.',
        air: 'Hablá. Sin Aire, te lo guardás todo. Decí lo que sentís y lo que querés, aunque parezca arriesgado.',
        water: 'Sentí. Sin Agua, todo lo resolvés con la cabeza. Dale espacio a tu intuición antes de decidir.',
        dominantFire: 'Usá tu Fuego: rendís más cuando liderás y das el primer paso. Dejá de esperar permiso.',
        dominantEarth: 'Usá tu Tierra: rendís más con constancia. Un paso por día vale más que un salto.',
        dominantAir: 'Usá tu Aire: rendís más cuando te comunicás. Tu palabra es tu mejor herramienta.',
        dominantWater: 'Usá tu Agua: rendís más cuando confiás en tu intuición. Tu primera corazonada suele ser la correcta.',
      },
      focus: {
        amor: 'Dejá de esperar que el otro cambie. Tu Venus te pide amar {style}, y quien no sigue ese ritmo no es para vos.',
        dinheiro: 'Tu plata se traba cuando trabajás en contra de tu naturaleza. Tu Júpiter te pide ganar plata {style}.',
      },
      actions: { dinheiro: 'mover tu plata' },
    },
    seen: 'Solo viste el {pct}% de tu carta astral',
  },

  stack: {
    title: 'Todo lo que recibís hoy',
  },

  sales: {
    headlineByFocus: {
      dinheiro: '{name}, tu carta astral muestra dónde está trabada tu plata.',
    },
  },
}
