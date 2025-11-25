export const lughLore = {
  name: "Lugh",
  title: "L'Éclat et l'Ombre",
  description: "Figure ancestrale des mythes celtes, Lugh symbolise la dualité de la vie : survie et destruction, lumière et ténèbres. Il n’agit pas directement, mais ses histoires façonnent la peur et le respect des mortels.",
  origin: "Il y a plusieurs siècles, dans un temps où les clans vivaient en lutte constante pour survivre dans des terres hostiles. Lugh est plus un symbole qu'un dieu : un idéal de courage, de ruse et de cruauté nécessaire.",
  nature: {
    dualite: "Lugh incarne à la fois la lumière et l’ombre : l’espoir et la peur, la survie et la mort.",
    facettes: [
      "Guide des courageux : inspirant les héros à agir malgré la peur",
      "Ombre des imprudents : rappel brutal que le danger est partout",
      "Icône des rituels : symboles et lieux sacrés lui sont consacrés, pas la magie"
    ],
    capricieux: "Lugh n’intervient jamais réellement ; son influence se ressent dans les décisions des hommes et les contes transmis de génération en génération."
  },
  legend: [
    "Les histoires de Lugh servent à enseigner la prudence et le courage face à la cruauté du monde.",
    "Les villages ignorants de ses récits ont souvent disparu, victimes de famines, guerres ou conflits tribaux.",
    "Chaque conflit, chaque pacte entre clans, chaque survie est un fragment du mythe de Lugh."
  ],
  quotes: [
    "Lugh n’existe pas pour récompenser, mais pour rappeler.",
    "La lumière et l’ombre ne sont pas des dons : elles sont ce que tu sais survivre.",
    "Ni ami, ni ennemi, seulement ce que l’homme se forge lui-même."
  ],
  influence_on_game: "Les choix des joueurs, les alliances et les trahisons reflètent le mythe de Lugh. Les légendes et lieux sacrés influencent la stratégie et la peur, mais aucune magie directe n’intervient.",
  world: {
    sacred_places: [
      { name: "Pierre du Serment", type: "Rituel", description: "Rocher où les chefs se juraient fidélité et loyauté." },
      { name: "Forêt de Nérith", type: "Forêt sacrée", description: "Lieu de rituels anciens, dense et dangereuse." },
      { name: "Cairn des Anciens", type: "Tombeau", description: "Monticule funéraire des chefs tribaux, lieu de pèlerinage." },
      { name: "Marais des Ombres", type: "Lieu interdit", description: "Zone isolée, redoutée pour les disparitions et les dangers naturels." }
    ],
    artifacts: [
      { name: "Torque de Brannor", type: "Symbole de pouvoir", description: "Collier gravé représentant l’autorité et la lignée." },
      { name: "Hache des Serments", type: "Arme rituelle", description: "Scelle les alliances ou exécute les traîtres." },
      { name: "Masques des Veilleurs", type: "Rituel", description: "Masques cérémoniels des anciens gardiens du clan." }
    ],
    timeline: [
      { year: -1000, event: "Premières tribus structurées, rivalités sanglantes et migrations." },
      { year: -750, event: "Brannor unifie plusieurs clans, instaure hiérarchie stricte." },
      { year: -600, event: "Construction des cairns et lieux de rituels symboliques." },
      { year: -400, event: "Luttes internes pour le contrôle des terres fertiles et routes commerciales." },
      { year: -200, event: "Épidémies et famines renforcent traditions et peur des anciens lieux." },
      { year: -50, event: "Tensions entre royaumes et clans rebelles." },
      { year: 0, event: "Aujourd’hui : société sombre, brutale, gouvernée par loyauté et survie." }
    ],
    factions: {
      kingdoms: [
        { name: "Draegor", description: "Région montagneuse, ressources limitées, fort clanisme." },
        { name: "Lhoren", description: "Landes et marais, gouvernée par assemblée de chefs de clans." },
        { name: "Caerth", description: "Vallées fertiles, centre de commerce et de conflits." }
      ],
      clans: [
        { name: "Brannor", description: "Descendants du chef fondateur, symboles de l’autorité." },
        { name: "Feryn", description: "Guerriers nomades, spécialisés dans raids et chasse." },
        { name: "Durn", description: "Experts des marais, souvent mercenaires ou éclaireurs." },
        { name: "Halgard", description: "Peuple des plaines du nord, discipliné et guerrier, connu pour ses raids et alliances." },
        { name: "Vestrin", description: "Clans des collines orientales, réputés pour leur courage et leur stratégie militaire." }
      ],
      secret_societies: [
        { name: "Veilleurs des Cairns", description: "Gardiennes des rites anciens, utilisent légendes pour contrôler la peur." },
        { name: "Frères du Marais", description: "Petites confréries de chasseurs et voleurs, connus pour brutalité." }
      ]
    },
    cities: [
      {
        name: "Kaer Durn",
        kingdom: "Draegor",
        description: "Ville fortifiée dans les montagnes, connue pour ses mines et ses forges.",
        population: "4000",
        characteristics: ["Mineurs", "Guerriers", "Fortifications en pierre"],
        location: { latitude: 53.2, longitude: -2.1 }
      },
      {
        name: "Lhorath",
        kingdom: "Lhoren",
        description: "Ville marchande au bord des marais, centre des échanges et des rituels locaux.",
        population: "6000",
        characteristics: ["Marchands", "Chasseurs", "Marchés flottants"],
        location: { latitude: 52.5, longitude: -1.8 }
      },
      {
        name: "Caer Thal",
        kingdom: "Caerth",
        description: "Capitale fertile de la vallée, siège de la noblesse et des conflits tribaux.",
        population: "8000",
        characteristics: ["Agriculteurs", "Nobles", "Fortifications légères"],
        location: { latitude: 51.9, longitude: -1.5 }
      },
      {
        name: "Marrowen",
        kingdom: "Caerth",
        description: "Petit port fluvial, connu pour ses marchés de pêche et sa pauvreté criante.",
        population: "2000",
        characteristics: ["Pêcheurs", "Petits marchands", "Quartiers insalubres"],
        location: { latitude: 51.7, longitude: -1.3 }
      },
      {
        name: "Norrvik",
        kingdom: "Draegor",
        description: "Ville des plaines du nord, réputée pour ses guerriers et ses marchés militaires.",
        population: "3500",
        characteristics: ["Guerriers des plaines", "Artisans", "Fortifications en bois"],
        location: { latitude: 53.0, longitude: -2.0 }
      },
      {
        name: "Eldhafen",
        kingdom: "Caerth",
        description: "Avant-poste des collines orientales, centre de raids et de commerce stratégique.",
        population: "2500",
        characteristics: ["Guerriers des collines", "Chasseurs", "Tours de guet"],
        location: { latitude: 51.8, longitude: -1.4 }
      }
    ]
  }
};
