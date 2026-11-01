// Camada 2 (pt-BR): focos por dor, entregável gratuito, motor, pacote de valor.
// Mesclado por cima do dicionário-base. Tokens iguais: {var} e {masc|fem}.
export default {
  focus: {
    amor: { label: 'Amor e relacionamentos', short: 'amor', text: 'Vênus, Marte e a sua Casa 7 mostram como você ama, quem você atrai e por que o mesmo padrão insiste em voltar.' },
    dinheiro: { label: 'Dinheiro e prosperidade', short: 'dinheiro', text: 'Júpiter, Vênus e a sua Casa 2 mostram de onde o seu dinheiro vem, onde ele escapa e quando ele chega.' },
    carreira: { label: 'Carreira e propósito profissional', short: 'carreira', text: 'Seu Meio do Céu, Saturno e Marte revelam a sua vocação real e o que está travando o seu crescimento.' },
    espiritual: { label: 'Saúde espiritual e caminho de vida', short: 'caminho espiritual', text: 'A sua Lua, Netuno e o seu Sol mostram o que a sua alma veio viver e por que às vezes você se sente perdid{o|a}.' },
  },

  intro: {
    byFocus: {
      amor: { badge: 'Leitura amorosa gratuita', title: 'Não é azar no amor.', accent: 'É um padrão escrito no seu céu.', sub: 'Descubra por que você atrai sempre o mesmo tipo de pessoa, o que a sua Vênus pede e quais são os seus 3 dias mais magnéticos dos próximos 30 dias.' },
      dinheiro: { badge: 'Diagnóstico financeiro gratuito', title: 'O dinheiro tem hora certa para chegar.', accent: 'O seu mapa sabe qual é.', sub: 'Veja de onde vem a sua prosperidade, onde o seu dinheiro escapa e as 3 datas de ouro financeiras dos próximos 30 dias, calculadas com a posição real dos planetas.' },
      carreira: { badge: 'Diagnóstico de carreira gratuito', title: 'Você não está no lugar errado por acaso.', accent: 'Seu mapa mostra para onde ir.', sub: 'Descubra a sua vocação real pelo seu Meio do Céu, o que trava o seu crescimento e os 3 melhores dias para agir nos próximos 30 dias.' },
      espiritual: { badge: 'Leitura espiritual gratuita', title: 'Esse vazio tem endereço.', accent: 'E o seu mapa sabe qual é.', sub: 'Entenda o que a sua alma veio viver, por que você se sente desconectad{o|a} e quais dias do próximo mês abrem portas para você.' },
    },
  },

  quiz: {
    focus: { title: 'Qual área da sua vida precisa de resposta AGORA?', hint: 'Seu diagnóstico gratuito vai se aprofundar nela.' },
    branch: {
      amor: { title: 'E como está o seu coração hoje?', options: { single: 'Solteir{o|a} e cansad{o|a} de repetir padrões', doubt: 'Num relacionamento, mas com dúvidas', ex: 'Não consigo esquecer alguém', complicated: 'É complicado' } },
      dinheiro: { title: 'Qual frase descreve a sua vida financeira?', options: { leaks: 'Ganho, mas o dinheiro some', debt: 'Estou endividad{o|a} e sem saída', stuck: 'Trabalho muito e não prospero', more: 'Estou bem, mas quero multiplicar' } },
      carreira: { title: 'E a sua vida profissional?', options: { stuck: 'Trabalho muito e não saio do lugar', business: 'Quero empreender ou mudar de área', lost: 'Não sei qual é a minha vocação', growing: 'Quero crescer mais rápido' } },
      espiritual: { title: 'O que mais pesa em você hoje?', options: { empty: 'Um vazio que não sei explicar', anxiety: 'Ansiedade e cansaço emocional', purpose: 'Não sei qual é o meu propósito', energy: 'Sinto energias pesadas ao meu redor' } },
    },
    insight: {
      eyebrow: 'Isso tem explicação',
      amor: 'Padrões no amor quase nunca são azar. No mapa astral, eles aparecem na posição de Vênus, de Marte e da sua Casa 7. Quando você entende o que eles pedem, o padrão perde a força.',
      dinheiro: 'Quem trabalha muito e não prospera quase sempre está com a energia no lugar errado. Júpiter e a sua Casa 2 mostram exatamente de onde o seu dinheiro vem e por onde ele escapa.',
      carreira: 'Esforço sem resultado costuma ser talento na direção errada. Seu Meio do Céu mostra onde você rende mais e Saturno mostra o que está te segurando.',
      espiritual: 'Esse cansaço da alma tem endereço no seu mapa. A sua Lua e Netuno mostram do que você precisa para voltar a se sentir inteir{o|a}.',
    },
    agree: {
      s1: {
        amor: '“Sinto que dou mais amor do que recebo.”',
        dinheiro: '“Sinto que mereço ganhar muito mais do que ganho hoje.”',
        carreira: '“Sinto que tenho um potencial enorme que ainda não consegui usar.”',
        espiritual: '“Sinto que vim para este mundo com uma missão, mas não sei qual.”',
      },
      s2: '“Às vezes parece que a minha vida anda em círculos.”',
    },
    email: {
      title: 'Seu diagnóstico está pronto. Para onde enviamos uma cópia?',
      hint: 'Você também recebe um aviso antes de cada uma das suas datas de ouro.',
    },
  },

  analyzing: {
    steps: ['Localizando seu céu de nascimento', 'Calculando a posição real dos 10 planetas', 'Encontrando seu Ascendente e suas casas', 'Cruzando com a leitura da sua mão', 'Calculando seus trânsitos dos próximos 30 dias', 'Montando o seu diagnóstico'],
  },

  report: {
    eyebrow: 'Diagnóstico gratuito',
    title: 'Diagnóstico Astral de {name}',
    generated: 'Gerado agora com a posição real dos astros',
    focusTag: 'Foco: {focus}',
    readingTitle: 'Sua leitura de {focus}',
    factors: {
      amor: [
        { point: 'venus', text: 'No amor, você se entrega {style}.' },
        { point: 'mars', text: 'Você se sente atraíd{o|a} por quem age {style}.' },
        { point: 'house7', fallback: 'moon', text: 'A pessoa certa para você age {style}.' },
      ],
      dinheiro: [
        { point: 'jupiter', text: 'Sua sorte financeira cresce quando você age {style}.' },
        { point: 'house2', fallback: 'sun', text: 'O seu dinheiro vem quando você trabalha {style}.' },
        { point: 'venus', text: 'Você atrai valor e oportunidades agindo {style}.' },
      ],
      carreira: [
        { point: 'mc', fallback: 'sun', text: 'Sua vocação se realiza quando você trabalha {style}.' },
        { point: 'saturn', text: 'Seu sucesso vem com disciplina, agindo {style}.' },
        { point: 'mars', text: 'Sua ambição se manifesta {style}.' },
      ],
      espiritual: [
        { point: 'moon', text: 'Sua alma se equilibra quando você vive {style}.' },
        { point: 'neptune', text: 'Sua intuição se manifesta {style}.' },
        { point: 'sun', text: 'Seu propósito é viver {style}.' },
      ],
    },
    pointNames: { house7: 'Casa 7', house2: 'Casa 2' },
    golden: {
      title: 'Suas 3 datas de ouro nos próximos 30 dias',
      sub: 'Calculadas com o trânsito real dos planetas sobre o seu mapa. Anote.',
      transit: '{transit} em {type} com {natal} natal',
      meaning: {
        amor: { jupiter: 'Sorte grande no amor: ótimo para conhecer alguém novo.', venus: 'Dia de magnetismo: você fica mais atraente e receptiv{o|a}.', sun: 'Dia de clareza: ótimo para conversar sobre a relação.', moon: 'Dia sensível: o coração fala mais alto, aproveite para se declarar.' },
        dinheiro: { jupiter: 'Janela de expansão: ótimo para negociar, pedir aumento ou investir.', venus: 'Dia de atração de dinheiro: vendas e propostas fluem melhor.', sun: 'Dia de visibilidade: mostre o seu trabalho e cobre o que vale.', moon: 'Dia de intuição financeira: confie no seu faro para oportunidades.' },
        carreira: { jupiter: 'Janela de crescimento: ótimo para entrevistas, propostas e começar projetos.', venus: 'Dia de boas relações: networking e parcerias rendem mais.', sun: 'Dia de destaque: seus resultados ficam mais visíveis.', moon: 'Dia de intuição: boas ideias aparecem, anote tudo.' },
        espiritual: { jupiter: 'Portal de expansão: ótimo para meditar, estudar e recomeçar.', venus: 'Dia de cura emocional: perdoe, limpe e se reconecte.', sun: 'Dia de força vital: sua energia está em alta.', moon: 'Dia de intuição aguçada: preste atenção nos sinais e nos sonhos.' },
      },
      risk: 'Atenção: detectamos 1 dia de risco',
      riskText: 'Um trânsito tenso atinge o seu mapa nos próximos 30 dias. Evite decisões importantes de {focus} nesse dia.',
      riskLocked: 'Data revelada no mapa completo',
      moon: 'Próxima Lua Nova: {date}. O melhor dia do mês para plantar intenções de {focus}.',
      cta: 'Ver as datas de ouro dos próximos 12 meses',
    },
    numerology: {
      title: 'Seus números',
      lifePath: 'Número de vida',
      personalYear: 'Ano pessoal {year}',
      numbers: {
        1: 'Liderança e independência. Você veio para abrir caminhos.',
        2: 'Sensibilidade e parceria. Sua força está nas conexões.',
        3: 'Comunicação e criatividade. Você nasceu para se expressar.',
        4: 'Construção e solidez. Você transforma esforço em patrimônio.',
        5: 'Liberdade e mudança. Sua vida avança em viradas.',
        6: 'Amor e responsabilidade. Você é o porto seguro dos outros.',
        7: 'Sabedoria e intuição. Você veio para buscar a verdade.',
        8: 'Poder e prosperidade. Você tem talento natural para o dinheiro.',
        9: 'Humanidade e encerramento. Você veio para ensinar e transformar.',
        11: 'Número mestre: intuição e inspiração muito acima da média.',
        22: 'Número mestre: o construtor. Capacidade de realizar coisas grandes.',
        33: 'Número mestre: o mestre do amor. Missão de cura e serviço.',
      },
      years: {
        1: 'Ano de recomeço: o que você plantar agora define os próximos 9 anos.',
        2: 'Ano de paciência e parcerias: as coisas amadurecem devagar.',
        3: 'Ano de expansão social e criatividade: apareça.',
        4: 'Ano de trabalho e base: construa o que vai te sustentar.',
        5: 'Ano de mudanças e oportunidades inesperadas: diga sim ao novo.',
        6: 'Ano do lar, do amor e das responsabilidades.',
        7: 'Ano de introspecção: respostas importantes vêm de dentro.',
        8: 'Ano de colheita material: dinheiro e reconhecimento.',
        9: 'Ano de encerramentos: solte o que não serve mais.',
      },
    },
    path: {
      title: 'O seu caminho',
      sub: 'O que o seu mapa pede, em 3 passos.',
      step: 'Passo {n}',
      element: {
        fire: 'Destrave a ação. Sem Fogo, você planeja demais e age de menos. Escolha uma decisão que você vem adiando e tome esta semana.',
        earth: 'Coloque os pés no chão. Sem Terra, ideias não viram resultado. Transforme um plano em uma rotina simples e diária.',
        air: 'Fale. Sem Ar, você guarda tudo para si. Diga o que sente e o que quer, mesmo que pareça arriscado.',
        water: 'Sinta. Sem Água, você resolve tudo com a cabeça. Abra espaço para a sua intuição antes de decidir.',
        dominantFire: 'Use o seu Fogo: você rende mais quando lidera e começa. Pare de esperar permissão.',
        dominantEarth: 'Use a sua Terra: você rende mais com constância. Um passo por dia vale mais do que um salto.',
        dominantAir: 'Use o seu Ar: você rende mais quando se comunica. Sua palavra é a sua maior ferramenta.',
        dominantWater: 'Use a sua Água: você rende mais quando confia na intuição. Seu primeiro sentimento costuma estar certo.',
      },
      focus: {
        amor: 'Pare de esperar o outro mudar. Sua Vênus pede que você ame {style}, e quem não acompanha esse ritmo não é para você.',
        dinheiro: 'Seu dinheiro trava quando você trabalha contra a sua natureza. Seu Júpiter pede que você ganhe dinheiro {style}.',
        carreira: 'Sua vocação não é um cargo, é um jeito de trabalhar. Seu mapa pede que você atue {style}.',
        espiritual: 'Sua paz não está fora. Sua Lua pede que você viva {style}, e é isso que reconecta a sua alma.',
      },
      timing: 'Sua próxima janela é {date}. É o dia em que o céu está a seu favor para {action}.',
      actions: { amor: 'dar o primeiro passo no amor', dinheiro: 'mexer no seu dinheiro', carreira: 'dar o próximo passo profissional', espiritual: 'recomeçar por dentro' },
      more: 'E as outras 11 janelas do ano estão no seu mapa completo.',
    },
    seen: 'Você viu só {pct}% do seu mapa',
    seenSub: 'O resto está no seu Mapa Astral Completo: cada planeta, cada casa e o seu calendário dos próximos 12 meses.',
  },

  engine: {
    eyebrow: 'Tecnologia Céu Natal',
    title: 'Não é horóscopo. É cálculo.',
    sub: 'O seu mapa passa por 4 camadas antes de chegar até você.',
    steps: [
      { title: 'Astronomia de precisão', text: 'Calculamos a posição de cada planeta no minuto exato do seu nascimento, com precisão de observatório.' },
      { title: 'Seu ponto exato na Terra', text: 'Coordenadas e fuso histórico da sua cidade, incluindo horário de verão da época.' },
      { title: 'Cruzamento triplo', text: 'Astrologia, numerologia e a leitura da sua mão combinadas em um só diagnóstico.' },
      { title: 'Interpretação humana', text: 'Astrólogos transformam os cálculos em orientações práticas, em linguagem simples.' },
    ],
  },

  stack: {
    eyebrow: 'O seu pacote',
    title: 'Tudo o que você recebe hoje',
    items: [
      { title: 'Mapa Astral Completo', text: 'Todos os planetas, as 12 casas, aspectos e o seu retrato completo.' },
      { title: 'Previsão dos próximos 12 meses', text: 'Diagrama energético mês a mês, com fases de alta e de cuidado.' },
      { title: '{guide}', text: 'Um guia exclusivo para {focus}, feito a partir do seu mapa.' },
      { title: 'Calendário das Datas de Ouro', text: 'Os seus melhores dias para {focus} em cada mês do próximo ano.' },
      { title: 'Carta Numerológica Pessoal', text: 'Seu número de vida, seu ano pessoal e o que eles pedem de você.' },
    ],
    guides: { amor: 'Código do Amor', dinheiro: 'Código da Prosperidade', carreira: 'Código da Carreira', espiritual: 'Código da Alma' },
    total: 'Valor total',
    today: 'Hoje, por apenas',
    bonusTag: 'Bônus',
  },

  sales: {
    headlineByFocus: {
      amor: '{name}, o seu mapa mostra por que o amor trava.',
      dinheiro: '{name}, o seu mapa mostra onde o seu dinheiro está preso.',
      carreira: '{name}, o seu mapa mostra para onde a sua carreira deveria ir.',
      espiritual: '{name}, o seu mapa mostra o que a sua alma está pedindo.',
    },
    headlineAccent: 'E o seu diagnóstico já está pronto.',
    unlock: 'Quero meu mapa completo',
  },
}
