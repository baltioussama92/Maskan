const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  TabStopType, TabStopPosition, UnderlineType
} = require('docx');
const fs = require('fs');
const path = require('path');

// ─── Color palette ───────────────────────────────────────────────────────────
const BLUE      = "1F4E79";   // dark blue – chapter headings
const MID_BLUE  = "2E75B6";   // medium blue – section headings
const LIGHT_BLU = "D5E8F0";   // cell shading
const GRAY_SHAD = "F2F2F2";   // alternate table rows
const BLACK     = "000000";
const WHITE     = "FFFFFF";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const noTopBot = { top: { style: BorderStyle.NONE, size: 0, color: WHITE },
                   bottom: { style: BorderStyle.NONE, size: 0, color: WHITE },
                   left: border, right: border };

function cell(text, opts = {}) {
  const {
    bold = false, shade = null, color = BLACK, colSpan = 1,
    align = AlignmentType.LEFT, vAlign = VerticalAlign.CENTER, width = null, size = 20
  } = opts;
  return new TableCell({
    columnSpan: colSpan,
    verticalAlign: vAlign,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    shading: shade ? { fill: shade, type: ShadingType.CLEAR } : undefined,
    borders,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      alignment: align,
      children: [new TextRun({ text, bold, color, size, font: "Times New Roman" })]
    })]
  });
}

function hCell(text, opts = {}) {
  return cell(text, { bold: true, shade: LIGHT_BLU, color: BLUE, ...opts });
}

function para(text, opts = {}) {
  const {
    heading = null, bold = false, italic = false, size = 24, color = BLACK,
    align = AlignmentType.JUSTIFIED, spacing = { before: 120, after: 120, line: 360, lineRule: "auto" },
    indent = null, underline = false, indent1 = false
  } = opts;
  const runOpts = { text, bold, italic, size, color, font: "Times New Roman" };
  if (underline) runOpts.underline = { type: UnderlineType.SINGLE };
  return new Paragraph({
    heading: heading || undefined,
    alignment: align,
    spacing,
    indent: indent1 ? { left: 720 } : (indent || undefined),
    children: [new TextRun(runOpts)]
  });
}

function h1(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 480, after: 240 },
    children: [new TextRun({
      text, bold: true, size: 36, color: BLUE,
      font: "Arial"
    })]
  });
}

function h2(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 360, after: 180 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: MID_BLUE, space: 1 } },
    children: [new TextRun({
      text, bold: true, size: 28, color: MID_BLUE,
      font: "Arial"
    })]
  });
}

function h3(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, color: BLACK, font: "Times New Roman" })]
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 60, after: 60, line: 360, lineRule: "auto" },
    children: [new TextRun({ text, size: 24, font: "Times New Roman" })]
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function figCaption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 180 },
    children: [
      new TextRun({ text, bold: true, size: 22, italic: true, font: "Times New Roman", color: "444444" })
    ]
  });
}

function imgPlaceholder(figNum, caption) {
  const borderBox = { style: BorderStyle.DASHED, size: 6, color: MID_BLUE };
  return [
    new Table({
      width: { size: 9000, type: WidthType.DXA },
      columnWidths: [9000],
      rows: [new TableRow({ children: [
        new TableCell({
          borders: { top: borderBox, bottom: borderBox, left: borderBox, right: borderBox },
          margins: { top: 200, bottom: 200, left: 200, right: 200 },
          shading: { fill: "EEF4FB", type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 120, after: 60 },
              children: [new TextRun({ text: `[ FIGURE ${figNum} ]`, bold: true, size: 26, color: MID_BLUE, font: "Arial" })]
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 120 },
              children: [new TextRun({ text: `📷 Place screenshot / diagram here`, size: 22, color: "888888", italic: true, font: "Times New Roman" })]
            }),
          ]
        })
      ]})]
    }),
    figCaption(`Figure ${figNum} – ${caption}`),
  ];
}

// ─── Document sections array ──────────────────────────────────────────────────
const children = [];

// ════════════════════════════════════════════════════════════════════════════════
// COVER PAGE
// ════════════════════════════════════════════════════════════════════════════════
children.push(
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 },
    children: [new TextRun({ text: "République Tunisienne", size: 24, font: "Times New Roman" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 },
    children: [new TextRun({ text: "Ministère de l'Enseignement Supérieur et de la Recherche Scientifique", size: 24, font: "Times New Roman" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 },
    children: [new TextRun({ text: "Université de Jendouba", size: 24, font: "Times New Roman" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 300 },
    children: [new TextRun({ text: "Institut Supérieur des Langues Appliquées et d'Informatique de Béja", size: 24, font: "Times New Roman" })] }),

  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 },
    children: [new TextRun({ text: "[ ISLAIB LOGO HERE ]", size: 22, italic: true, color: "888888", font: "Times New Roman" })] }),

  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300, after: 60 },
    children: [new TextRun({ text: "Réf : LA-GLSI 2024/2025", size: 22, font: "Times New Roman" })] }),

  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 480, after: 120 },
    border: { top: { style: BorderStyle.SINGLE, size: 8, color: BLUE } },
    children: [new TextRun({ text: "Rapport de Projet de Fin d'Études", bold: true, size: 36, color: BLUE, font: "Arial" })] }),

  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 },
    children: [new TextRun({ text: "Pour l'obtention du", size: 24, font: "Times New Roman" })] }),

  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 240 },
    children: [new TextRun({ text: "DIPLÔME DE LICENCE EN SCIENCES DE L'INFORMATIQUE", bold: true, size: 26, font: "Times New Roman" })] }),

  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 },
    children: [new TextRun({ text: "Sujet :", size: 26, font: "Times New Roman" })] }),

  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 480 },
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: MID_BLUE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: MID_BLUE } },
    children: [new TextRun({ text: "Plateforme Web de Correspondance entre Patients et Essais Cliniques", bold: true, size: 34, color: BLUE, font: "Arial" })] }),

  new Paragraph({ spacing: { before: 480, after: 60 },
    children: [new TextRun({ text: "Réalisé par :", bold: true, size: 28, font: "Times New Roman" })] }),
  new Paragraph({ spacing: { before: 0, after: 240 },
    children: [new TextRun({ text: "[Votre Nom et Prénom]", size: 26, font: "Times New Roman" })] }),

  new Paragraph({ spacing: { before: 120, after: 60 },
    children: [new TextRun({ text: "Encadré par :", bold: true, size: 28, font: "Times New Roman" })] }),

  new Table({
    width: { size: 8000, type: WidthType.DXA },
    columnWidths: [3000, 5000],
    rows: [
      new TableRow({ children: [
        new TableCell({ borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [new Paragraph({ children: [new TextRun({ text: "Encadrant académique", size: 24, font: "Times New Roman" })] })] }),
        new TableCell({ borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [new Paragraph({ children: [new TextRun({ text: ": [Nom de l'encadrant académique]", size: 24, font: "Times New Roman" })] })] }),
      ]}),
      new TableRow({ children: [
        new TableCell({ borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [new Paragraph({ children: [new TextRun({ text: "Encadrant professionnel", size: 24, font: "Times New Roman" })] })] }),
        new TableCell({ borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [new Paragraph({ children: [new TextRun({ text: ": [Nom de l'encadrant professionnel]", size: 24, font: "Times New Roman" })] })] }),
      ]}),
      new TableRow({ children: [
        new TableCell({ borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [new Paragraph({ children: [new TextRun({ text: "Organisme d'accueil", size: 24, font: "Times New Roman" })] })] }),
        new TableCell({ borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [new Paragraph({ children: [new TextRun({ text: ": [Nom de l'organisme d'accueil]", size: 24, font: "Times New Roman" })] })] }),
      ]}),
    ]
  }),

  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 480, after: 0 },
    border: { top: { style: BorderStyle.SINGLE, size: 8, color: BLUE } },
    children: [new TextRun({ text: "Année universitaire : 2024–2025", size: 24, font: "Times New Roman" })] }),
);

// ════════════════════════════════════════════════════════════════════════════════
// DEDICACE
// ════════════════════════════════════════════════════════════════════════════════
children.push(
  pageBreak(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 480, after: 240 },
    children: [new TextRun({ text: "Dédicace", bold: true, size: 36, color: BLUE, font: "Arial" })] }),
  para("À mes chers parents,", { italic: true, align: AlignmentType.CENTER }),
  para("pour leur amour profond, leurs sacrifices et leur soutien indéfectible tout au long de mon parcours académique.", { italic: true, align: AlignmentType.CENTER }),
  new Paragraph({ spacing: { before: 120, after: 60 } }),
  para("À ma chère famille,", { italic: true, align: AlignmentType.CENTER }),
  para("source constante d'affection, de sérénité et d'encouragement.", { italic: true, align: AlignmentType.CENTER }),
  new Paragraph({ spacing: { before: 120, after: 60 } }),
  para("À mes respectés professeurs et encadrants,", { italic: true, align: AlignmentType.CENTER }),
  para("pour leur guidance, leur patience et leur transmission du savoir.", { italic: true, align: AlignmentType.CENTER }),
  new Paragraph({ spacing: { before: 120, after: 60 } }),
  para("À mes amis précieux,", { italic: true, align: AlignmentType.CENTER }),
  para("compagnons de route fidèles, pour leur soutien quotidien et leur bonne humeur communicative.", { italic: true, align: AlignmentType.CENTER }),
  new Paragraph({ spacing: { before: 240, after: 0 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "— [Votre Prénom] —", bold: true, italic: true, size: 24, color: MID_BLUE, font: "Times New Roman" })] }),
);

// ════════════════════════════════════════════════════════════════════════════════
// REMERCIEMENTS
// ════════════════════════════════════════════════════════════════════════════════
children.push(
  pageBreak(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 240 },
    children: [new TextRun({ text: "Remerciements", bold: true, size: 36, color: BLUE, font: "Arial" })] }),
  para("Je tiens à exprimer ma profonde gratitude envers mon encadrante académique pour son engagement tout au long de ce projet. Son expertise, ses conseils éclairés et sa disponibilité ont joué un rôle essentiel dans la réussite de ce travail."),
  para("J'adresse également mes sincères remerciements à mon encadrant professionnel pour son savoir-faire, sa bienveillance et ses suggestions constructives qui ont rendu cette expérience particulièrement enrichissante."),
  para("J'ai l'honneur de remercier chaleureusement les membres du jury, dont l'implication et le regard attentif apporteront une réelle valeur ajoutée à ce travail. Leur investissement et la pertinence de leurs remarques témoignent de leur engagement dans la valorisation des efforts fournis."),
  para("Mes remerciements s'étendent également à l'ensemble du corps enseignant de l'ISLAIB pour la qualité de la formation dispensée tout au long de ces années d'études."),
  para("Enfin, je tiens à témoigner ma reconnaissance à toutes les personnes qui, directement ou indirectement, ont contribué à la concrétisation de ce projet."),
);

// ════════════════════════════════════════════════════════════════════════════════
// LISTE DES ABREVIATIONS
// ════════════════════════════════════════════════════════════════════════════════
children.push(
  pageBreak(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 240 },
    children: [new TextRun({ text: "Liste des abréviations", bold: true, size: 36, color: BLUE, font: "Arial" })] }),
  new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [2200, 6800],
    rows: [
      new TableRow({ children: [hCell("Abréviation", { width: 2200 }), hCell("Définition", { width: 6800 })] }),
      new TableRow({ children: [cell("API", { width: 2200 }), cell("Application Programming Interface", { width: 6800 })] }),
      new TableRow({ children: [cell("CRUD", { width: 2200, shade: GRAY_SHAD }), cell("Create, Read, Update, Delete", { width: 6800, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("IA", { width: 2200 }), cell("Intelligence Artificielle", { width: 6800 })] }),
      new TableRow({ children: [cell("ICD-10", { width: 2200, shade: GRAY_SHAD }), cell("International Classification of Diseases, 10th Revision", { width: 6800, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("JWT", { width: 2200 }), cell("JSON Web Token", { width: 6800 })] }),
      new TableRow({ children: [cell("NLP", { width: 2200, shade: GRAY_SHAD }), cell("Natural Language Processing (Traitement du Langage Naturel)", { width: 6800, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("NLP", { width: 2200 }), cell("Named Entity Recognition (Reconnaissance d'entités nommées)", { width: 6800 })] }),
      new TableRow({ children: [cell("ORM", { width: 2200, shade: GRAY_SHAD }), cell("Object-Relational Mapping", { width: 6800, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("PFE", { width: 2200 }), cell("Projet de Fin d'Études", { width: 6800 })] }),
      new TableRow({ children: [cell("PHI", { width: 2200, shade: GRAY_SHAD }), cell("Protected Health Information (Informations de santé protégées)", { width: 6800, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("REST", { width: 2200 }), cell("Representational State Transfer", { width: 6800 })] }),
      new TableRow({ children: [cell("SPA", { width: 2200, shade: GRAY_SHAD }), cell("Single Page Application", { width: 6800, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("UML", { width: 2200 }), cell("Unified Modeling Language", { width: 6800 })] }),
    ]
  }),
);

// ════════════════════════════════════════════════════════════════════════════════
// INTRODUCTION GENERALE
// ════════════════════════════════════════════════════════════════════════════════
children.push(
  pageBreak(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 240 },
    children: [new TextRun({ text: "Introduction Générale", bold: true, size: 36, color: BLUE, font: "Arial" })] }),

  para("Dans un contexte mondial marqué par l'accélération de la recherche médicale, les essais cliniques représentent un maillon essentiel du progrès thérapeutique. Ces études permettent d'évaluer l'efficacité et la sécurité de nouveaux traitements avant leur mise sur le marché. Pourtant, leur succès dépend largement de la capacité à recruter des patients éligibles dans des délais raisonnables — un défi qui reste aujourd'hui l'un des principaux obstacles au développement de nouveaux médicaments."),

  para("En effet, selon plusieurs études du secteur, plus de 80 % des essais cliniques accusent des retards liés au recrutement insuffisant de patients. Ce phénomène s'explique en grande partie par la complexité des critères d'éligibilité, la dispersion des informations entre différentes bases de données, et l'absence d'outils automatisés permettant de croiser efficacement les profils médicaux des patients avec les caractéristiques des essais disponibles."),

  para("Face à ces constats, ce projet de fin d'études propose la conception et le développement d'une plateforme web intelligente de correspondance entre patients et essais cliniques. Cette plateforme, baptisée Clinical Trial Matcher, vise à automatiser le processus de triage initial en calculant un score de compatibilité déterministe et auditable entre le profil médical d'un patient et les critères d'éligibilité d'un essai clinique."),

  para("La solution repose sur une architecture full-stack moderne : un backend développé en FastAPI (Python), une base de données PostgreSQL avec support JSONB, et un frontend réactif en React 18 avec TypeScript. Elle intègre également des capacités de traitement du langage naturel (NLP) pour l'extraction automatique des critères d'éligibilité, ainsi qu'une interface avec l'API Google Gemini pour générer des explications intelligibles destinées aux patients."),

  para("Ce rapport s'articule autour de cinq chapitres complémentaires. Le premier chapitre présente le contexte général du projet, incluant l'organisme d'accueil, la problématique, l'étude de l'existant et la méthodologie adoptée. Le second chapitre expose le Sprint 0 dédié à l'analyse des besoins et à l'architecture globale du système. Les chapitres trois, quatre et cinq décrivent respectivement les trois sprints de développement : la mise en place des fonctionnalités d'authentification et de gestion des profils, l'algorithme de correspondance et l'intégration NLP, et enfin les fonctionnalités avancées incluant les explications par IA et le tableau de bord analytique."),
);

// ════════════════════════════════════════════════════════════════════════════════
// CHAPITRE 1
// ════════════════════════════════════════════════════════════════════════════════
children.push(
  pageBreak(),
  h1("Chapitre 1 : Contexte général du projet"),
  h2("1.1 Introduction"),
  para("Ce chapitre présente le cadre organisationnel et contextuel dans lequel s'inscrit le présent projet de fin d'études. Il expose la problématique à l'origine du développement de la plateforme Clinical Trial Matcher, analyse les solutions existantes sur le marché, et décrit la méthodologie de gestion de projet adoptée pour conduire le développement de manière structurée et itérative."),

  h2("1.2 Présentation de l'organisme d'accueil"),
  h3("1.2.1 Contexte du stage"),
  para("Ce projet a été réalisé dans le cadre d'un stage de fin d'études. L'organisme d'accueil opère dans le secteur du développement logiciel et des technologies de l'information, avec une orientation particulière vers les solutions de santé numérique. Il accompagne des structures médicales et des équipes de recherche dans leur transition numérique, en proposant des outils sur mesure répondant précisément aux besoins identifiés."),

  para("[ COMMENTAIRE : Insérer ici le logo et une présentation détaillée de votre organisme d'accueil réel : nom, statut juridique, date de création, domaines d'activité, organigramme du département d'accueil. ]", { italic: true, color: "CC0000" }),

  h3("1.2.2 Secteur d'activité"),
  para("Le projet s'inscrit dans le secteur de l'analyse de données de santé, de l'intelligence artificielle appliquée à la médecine, et de l'informatique médicale. Ce secteur est caractérisé par une croissance soutenue, tirée notamment par la numérisation des dossiers médicaux, le développement des essais cliniques décentralisés, et l'émergence des plateformes de santé numérique accessibles au grand public."),

  h2("1.3 Contexte du projet"),
  h3("1.3.1 Problématique"),
  para("Le recrutement de patients pour les essais cliniques représente aujourd'hui l'un des défis les plus critiques de la recherche biomédicale. Plusieurs problèmes structurels sont identifiés :"),
  bullet("Critères d'éligibilité complexes : les essais cliniques définissent des critères d'inclusion et d'exclusion détaillés (âge, conditions médicales, biomarqueurs, traitements en cours), dont la vérification manuelle est longue et sujette à des erreurs."),
  bullet("Dispersion de l'information : les bases de données d'essais cliniques (ClinicalTrials.gov) contiennent des milliers d'entrées exprimées en langage naturel non structuré, rendant la recherche manuelle fastidieuse."),
  bullet("Absence d'outils automatisés : les plateformes existantes offrent principalement des fonctions de recherche par mots-clés sans véritable moteur de correspondance intelligent."),
  bullet("Enjeux de confidentialité : le traitement de données de santé impose des contraintes réglementaires strictes (consentement éclairé, protection des données personnelles)."),
  para("Face à ces constats, le projet Clinical Trial Matcher vise à concevoir une solution automatisée et transparente qui calcule un score de compatibilité entre le profil médical d'un patient et les critères d'éligibilité de chaque essai clinique disponible."),

  h3("1.3.2 Étude de l'existant"),
  para("Plusieurs solutions existent pour faciliter la recherche d'essais cliniques, mais chacune présente des limitations importantes :"),
  new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [2000, 3500, 3500],
    rows: [
      new TableRow({ children: [hCell("Plateforme", { width: 2000 }), hCell("Avantages", { width: 3500 }), hCell("Inconvénients", { width: 3500 })] }),
      new TableRow({ children: [
        cell("ClinicalTrials.gov", { width: 2000 }),
        cell("Base de données exhaustive, accès public, mise à jour régulière", { width: 3500 }),
        cell("Interface de recherche limitée aux mots-clés, aucun score de compatibilité, pas de profil patient", { width: 3500 }),
      ]}),
      new TableRow({ children: [
        cell("TrialSpark", { width: 2000, shade: GRAY_SHAD }),
        cell("Matching automatisé, interface moderne", { width: 3500, shade: GRAY_SHAD }),
        cell("Solution propriétaire et coûteuse, non accessible aux petites structures, boîte noire algorithmique", { width: 3500, shade: GRAY_SHAD }),
      ]}),
      new TableRow({ children: [
        cell("ResearchMatch", { width: 2000 }),
        cell("Orienté patient, inscription simplifiée", { width: 3500 }),
        cell("Couverture géographique limitée, algorithme de matching peu transparent", { width: 3500 }),
      ]}),
    ]
  }),
  new Paragraph({ spacing: { before: 60, after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Tableau 1.1 – Comparaison des plateformes existantes", bold: true, size: 22, font: "Times New Roman" })] }),

  h3("1.3.3 Critique de l'existant"),
  para("L'analyse des solutions existantes révèle plusieurs lacunes communes. Le filtrage par mots-clés reste dominant, au détriment d'un matching intelligent prenant en compte la richesse sémantique des critères médicaux. Les algorithmes de scoring sont opaques et non auditables, ce qui pose un problème dans un contexte médical où la transparence est primordiale. Par ailleurs, la gestion du consentement patient et la protection des données de santé sont rarement traitées de manière rigoureuse."),

  h3("1.3.4 Solution proposée"),
  para("La plateforme Clinical Trial Matcher répond à ces limites en proposant un moteur de scoring déterministe et auditable basé sur quatre dimensions : la correspondance des conditions médicales (40 %), la compatibilité de l'âge (25 %), la localisation géographique (20 %) et la compatibilité de genre (15 %). Le système intègre également un pipeline NLP pour l'extraction automatique des critères d'éligibilité et une interface IA (Google Gemini) pour fournir des explications intelligibles aux patients."),

  h2("1.4 Choix méthodologique et formalisme adopté"),
  h3("1.4.1 Les méthodes agiles"),
  para("La gestion agile de projets est une approche itérative qui se concentre sur les livraisons continues et l'intégration du feedback à chaque itération. Elle favorise la collaboration, l'adaptation au changement et la livraison rapide de valeur. Dans un projet impliquant des besoins évolutifs liés aux domaines médical et informatique, cette approche s'avère particulièrement adaptée."),

  h3("1.4.2 Comparatif entre méthodes agiles et classiques"),
  new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [1800, 3600, 3600],
    rows: [
      new TableRow({ children: [hCell("Critère", { width: 1800 }), hCell("Méthodes agiles (Scrum)", { width: 3600 }), hCell("Méthodes classiques (Cycle en V)", { width: 3600 })] }),
      new TableRow({ children: [cell("Flexibilité", { width: 1800 }), cell("Haute – adaptation continue aux changements", { width: 3600 }), cell("Faible – modifications difficiles après validation", { width: 3600 })] }),
      new TableRow({ children: [cell("Documentation", { width: 1800, shade: GRAY_SHAD }), cell("Légère, centrée sur la valeur", { width: 3600, shade: GRAY_SHAD }), cell("Exhaustive, formalisée dès le début", { width: 3600, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("Livraisons", { width: 1800 }), cell("Fréquentes, par itérations courtes (sprints)", { width: 3600 }), cell("Unique, en fin de projet", { width: 3600 })] }),
      new TableRow({ children: [cell("Risques", { width: 1800, shade: GRAY_SHAD }), cell("Réduits grâce aux livraisons fréquentes", { width: 3600, shade: GRAY_SHAD }), cell("Élevés si les besoins changent en cours de route", { width: 3600, shade: GRAY_SHAD })] }),
    ]
  }),
  new Paragraph({ spacing: { before: 60, after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Tableau 1.2 – Comparatif entre méthodes agiles et classiques", bold: true, size: 22, font: "Times New Roman" })] }),

  h3("1.4.3 Le framework Scrum : formalisme adopté"),
  para("Scrum est un framework agile qui structure le travail en itérations de durée fixe appelées sprints (généralement 2 à 4 semaines). Il définit trois rôles principaux : le Product Owner (garant de la vision produit), le Scrum Master (facilitateur), et l'équipe de développement. Quatre cérémonies rythment le processus :"),
  bullet("Sprint Planning : réunion en début de sprint pour définir les tâches à accomplir."),
  bullet("Daily Scrum : réunion quotidienne de 15 minutes pour synchroniser l'équipe."),
  bullet("Sprint Review : présentation du travail accompli aux parties prenantes."),
  bullet("Sprint Retrospective : analyse interne pour identifier les améliorations à apporter."),

  ...imgPlaceholder("1.1", "Le framework Scrum et ses cérémonies"),

  para("Pour ce projet, nous avons adopté une organisation en trois sprints de développement, précédés d'un Sprint 0 dédié à l'analyse et à la planification. Cette structure permet une progression cohérente du système tout en maintenant une flexibilité face aux ajustements nécessaires."),

  h2("1.5 Conclusion"),
  para("Ce chapitre a présenté le cadre organisationnel et méthodologique du projet Clinical Trial Matcher, en identifiant les enjeux clés du recrutement clinique et en justifiant l'adoption du framework Scrum. Ces éléments fondamentaux préparent l'analyse détaillée des besoins et spécifications techniques développée au chapitre suivant."),
);

// ════════════════════════════════════════════════════════════════════════════════
// CHAPITRE 2
// ════════════════════════════════════════════════════════════════════════════════
children.push(
  pageBreak(),
  h1("Chapitre 2 : Sprint 0 – Analyse et planification du projet"),
  h2("2.1 Introduction"),
  para("Ce chapitre constitue le Sprint 0 du projet. Il couvre l'analyse complète des besoins fonctionnels et non fonctionnels, la définition du backlog produit, la planification des sprints, le choix de l'architecture logicielle et les outils de travail adoptés. Ces éléments posent les fondations techniques et organisationnelles sur lesquelles repose l'ensemble du développement."),

  h2("2.2 Identification des acteurs"),
  para("La plateforme Clinical Trial Matcher intègre quatre acteurs aux rôles distincts et complémentaires :"),
  bullet("Patient : acteur central de la plateforme. Il crée son profil médical (données démographiques, conditions, médicaments, biomarqueurs), consulte les essais correspondants, visualise les scores de compatibilité et bénéficie des explications générées par IA."),
  bullet("Médecin : consulte les profils des patients qui lui sont assignés, visualise leurs correspondances d'essais cliniques et émet des recommandations médicales."),
  bullet("Chercheur : soumet de nouveaux essais cliniques pour validation, consulte les statistiques d'utilisation et dispose d'un outil de test automatisé (SmokeFlow) pour évaluer la pipeline de correspondance."),
  bullet("Administrateur : supervise l'ensemble de la plateforme, gère les utilisateurs, approuve ou rejette les essais soumis, consulte les journaux d'audit et déclenche la synchronisation des essais depuis ClinicalTrials.gov."),

  h2("2.3 Identification des besoins"),
  h3("2.3.1 Besoins fonctionnels"),
  para("Les besoins fonctionnels décrivent l'ensemble des actions que le système doit permettre aux différents acteurs d'effectuer :"),
  bullet("Authentification et gestion des comptes : inscription, connexion sécurisée, gestion des rôles, rotation des tokens de rafraîchissement, réinitialisation de mot de passe, verrouillage de compte après tentatives échouées."),
  bullet("Gestion des profils patients : création et modification d'un profil multi-étapes (données démographiques, conditions médicales avec codes ICD-10, médicaments actifs, biomarqueurs), importation de dossiers FHIR R4, téléchargement de documents médicaux."),
  bullet("Gestion des essais cliniques : synchronisation automatique depuis ClinicalTrials.gov, soumission d'essais par les chercheurs, validation par l'administrateur, recherche et filtrage avancé."),
  bullet("Moteur de correspondance : calcul d'un score composite sur quatre dimensions (conditions, âge, localisation, genre), persistance des résultats avec versionnage du score, génération d'alertes pour les correspondances de haute qualité."),
  bullet("Explications IA : génération d'explications intelligibles via Google Gemini, résumé de la compatibilité patient-essai, recommandations médicales contextuelles."),
  bullet("Tableau de bord analytique : statistiques de correspondance, tendances des essais, indicateurs de performance par rôle (patient, médecin, chercheur, administrateur)."),
  bullet("Gestion des alertes et notifications : alertes automatiques pour nouvelles correspondances, mises à jour d'essais, archivage des alertes lues."),

  h3("2.3.2 Besoins non fonctionnels"),
  para("Les besoins non fonctionnels définissent les contraintes de qualité et de performance que la solution doit respecter :"),
  bullet("Sécurité : hachage des mots de passe avec bcrypt, tokens JWT en mémoire uniquement (jamais en localStorage), cookie HTTP-only pour le token de rafraîchissement, contrôle d'accès basé sur les rôles (RBAC), consentement obligatoire avant tout traitement de données de santé, journaux d'audit complets."),
  bullet("Reproductibilité : versionnage du score de correspondance (SCORING_VERSION = 'v2'), poids déterministes et seuils documentés, résultats auditables."),
  bullet("Performance : traitement par lots des essais (100 essais par page), indexation Elasticsearch avec fallback vers la base de données, temps de réponse cible inférieur à 2 secondes pour les actions principales."),
  bullet("Maintenabilité : architecture orientée services, séparation claire entre les couches API, service, CRUD et modèle, couverture par tests automatisés."),
  bullet("Accessibilité : interface multilingue (français, anglais, arabe, espagnol), design responsive, thèmes clair et sombre."),

  h2("2.4 Backlog produit"),
  para("Le backlog produit est la liste structurée et priorisée de toutes les fonctionnalités à développer. Il est organisé en epics regroupant des user stories concrètes et réalisables."),
  new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [400, 2000, 5400, 1200],
    rows: [
      new TableRow({ children: [hCell("ID", { width: 400 }), hCell("Epic", { width: 2000 }), hCell("User Story", { width: 5400 }), hCell("Priorité", { width: 1200 })] }),
      new TableRow({ children: [cell("1", { width: 400 }), cell("Authentification", { width: 2000 }), cell("En tant qu'utilisateur, je peux m'inscrire, me connecter et récupérer mon mot de passe de façon sécurisée.", { width: 5400 }), cell("Élevée", { width: 1200 })] }),
      new TableRow({ children: [cell("2", { width: 400, shade: GRAY_SHAD }), cell("Gestion du profil patient", { width: 2000, shade: GRAY_SHAD }), cell("En tant que patient, je peux créer et modifier mon profil médical en plusieurs étapes (démographie, conditions, médicaments, documents).", { width: 5400, shade: GRAY_SHAD }), cell("Élevée", { width: 1200, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("3", { width: 400 }), cell("Gestion des essais", { width: 2000 }), cell("En tant qu'administrateur, je peux synchroniser, approuver et gérer les essais cliniques depuis ClinicalTrials.gov.", { width: 5400 }), cell("Élevée", { width: 1200 })] }),
      new TableRow({ children: [cell("4", { width: 400, shade: GRAY_SHAD }), cell("Moteur de correspondance", { width: 2000, shade: GRAY_SHAD }), cell("En tant que patient, je peux déclencher le calcul des correspondances et visualiser mes résultats triés par score.", { width: 5400, shade: GRAY_SHAD }), cell("Élevée", { width: 1200, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("5", { width: 400 }), cell("Explications IA", { width: 2000 }), cell("En tant que patient, je peux accéder à une explication intelligible de ma compatibilité avec un essai, générée par IA.", { width: 5400 }), cell("Moyenne", { width: 1200 })] }),
      new TableRow({ children: [cell("6", { width: 400, shade: GRAY_SHAD }), cell("Import FHIR", { width: 2000, shade: GRAY_SHAD }), cell("En tant que patient, je peux importer mon dossier médical au format FHIR R4 pour pré-remplir mon profil.", { width: 5400, shade: GRAY_SHAD }), cell("Moyenne", { width: 1200, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("7", { width: 400 }), cell("Alertes et notifications", { width: 2000 }), cell("En tant que patient, je reçois des alertes pour les nouvelles correspondances avec un score supérieur à 70.", { width: 5400 }), cell("Moyenne", { width: 1200 })] }),
      new TableRow({ children: [cell("8", { width: 400, shade: GRAY_SHAD }), cell("Analytique & tableau de bord", { width: 2000, shade: GRAY_SHAD }), cell("En tant que chercheur, je peux consulter des statistiques globales sur les correspondances et les tendances des essais.", { width: 5400, shade: GRAY_SHAD }), cell("Faible", { width: 1200, shade: GRAY_SHAD })] }),
    ]
  }),
  new Paragraph({ spacing: { before: 60, after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Tableau 2.1 – Backlog produit", bold: true, size: 22, font: "Times New Roman" })] }),

  h2("2.5 Planification du projet"),
  h3("2.5.1 Planification des sprints"),
  para("Le projet est organisé en quatre phases (Sprint 0 à Sprint 3), chacune avec des objectifs et livrables bien définis :"),
  new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [2200, 3400, 3400],
    rows: [
      new TableRow({ children: [hCell("Sprint", { width: 2200 }), hCell("Objectifs", { width: 3400 }), hCell("Livrables", { width: 3400 })] }),
      new TableRow({ children: [cell("Sprint 0 (Planification)", { width: 2200 }), cell("Analyse des besoins, architecture, backlog, choix technologiques", { width: 3400 }), cell("Backlog produit, diagrammes UML, architecture technique", { width: 3400 })] }),
      new TableRow({ children: [cell("Sprint 1 (Fonctionnalités de base)", { width: 2200, shade: GRAY_SHAD }), cell("Authentification sécurisée, gestion des profils patients, gestion des utilisateurs", { width: 3400, shade: GRAY_SHAD }), cell("Module d'authentification, wizard multi-étapes, CRUD profil", { width: 3400, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("Sprint 2 (Moteur de correspondance)", { width: 2200 }), cell("Synchronisation des essais, algorithme de scoring, pipeline NLP", { width: 3400 }), cell("Moteur de matching v2, extraction NLP, persistance des scores", { width: 3400 })] }),
      new TableRow({ children: [cell("Sprint 3 (Fonctionnalités avancées)", { width: 2200, shade: GRAY_SHAD }), cell("Explications IA, tableaux de bord analytiques, import FHIR, alertes", { width: 3400, shade: GRAY_SHAD }), cell("Interface Gemini, analytics, import FHIR, système d'alertes", { width: 3400, shade: GRAY_SHAD })] }),
    ]
  }),
  new Paragraph({ spacing: { before: 60, after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Tableau 2.2 – Structure et planification des sprints", bold: true, size: 22, font: "Times New Roman" })] }),

  ...imgPlaceholder("2.1", "Diagramme de planification des sprints (roadmap Jira/Gantt)"),

  h3("2.5.2 Diagramme des cas d'utilisation global"),
  para("La figure ci-dessous présente le diagramme de cas d'utilisation global du système, illustrant les interactions entre les quatre acteurs (Patient, Médecin, Chercheur, Administrateur) et les principales fonctionnalités de la plateforme."),
  ...imgPlaceholder("2.2", "Diagramme de cas d'utilisation global"),

  h2("2.6 Architecture de la base de données"),
  h3("2.6.1 Choix technologique : PostgreSQL"),
  para("Le choix de PostgreSQL comme système de gestion de base de données repose sur plusieurs facteurs déterminants. Sa conformité aux normes ACID garantit l'intégrité transactionnelle des données de santé. Son support natif des types JSONB permet de stocker efficacement des structures semi-structurées (critères NLP extraits, détails des scores, métadonnées des essais) sans sacrifier les performances. Enfin, son écosystème mature et sa compatibilité avec SQLAlchemy et Alembic facilitent la gestion des migrations de schéma."),

  new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [2000, 3500, 3500],
    rows: [
      new TableRow({ children: [hCell("Critère", { width: 2000 }), hCell("PostgreSQL (choix retenu)", { width: 3500 }), hCell("MongoDB (alternative)", { width: 3500 })] }),
      new TableRow({ children: [cell("Modèle", { width: 2000 }), cell("Relationnel avec support JSONB", { width: 3500 }), cell("Documentaire NoSQL", { width: 3500 })] }),
      new TableRow({ children: [cell("Intégrité", { width: 2000, shade: GRAY_SHAD }), cell("Forte (contraintes ACID, clés étrangères)", { width: 3500, shade: GRAY_SHAD }), cell("Limitée (cohérence éventuelle)", { width: 3500, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("Flexibilité", { width: 2000 }), cell("JSONB pour données semi-structurées", { width: 3500 }), cell("Très haute (schéma libre)", { width: 3500 })] }),
      new TableRow({ children: [cell("Migrations", { width: 2000, shade: GRAY_SHAD }), cell("Alembic (versionnées)", { width: 3500, shade: GRAY_SHAD }), cell("Migrations manuelles", { width: 3500, shade: GRAY_SHAD })] }),
    ]
  }),
  new Paragraph({ spacing: { before: 60, after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Tableau 2.3 – Comparaison PostgreSQL vs MongoDB", bold: true, size: 22, font: "Times New Roman" })] }),

  h3("2.6.2 Schéma de la base de données"),
  para("La base de données comprend 16 tables organisées autour d'entités principales. Les clés primaires sont des UUID v4 pour tous les enregistrements. Les colonnes JSONB sont utilisées pour les données semi-structurées : critères d'éligibilité extraits, détails de scoring et résumés de tâches."),
  ...imgPlaceholder("2.3", "Diagramme Entité-Association (ERD) de la base de données"),

  h2("2.7 Architecture logicielle"),
  h3("2.7.1 Architecture globale du système"),
  para("La plateforme repose sur une architecture client-serveur à trois tiers : un frontend React SPA (Single Page Application), un backend FastAPI, et une couche de persistance PostgreSQL avec Elasticsearch optionnel. Cette séparation claire des responsabilités favorise la maintenabilité et l'évolutivité du système."),
  ...imgPlaceholder("2.4", "Architecture globale du système (diagramme de déploiement)"),

  h3("2.7.2 Architecture du backend"),
  para("Le backend suit une architecture en couches :"),
  bullet("Couche API (endpoints) : 14 modules de routage FastAPI couvrant l'authentification, les patients, les essais, les correspondances, les alertes, l'analytique, les fichiers, le FHIR, la recherche et l'administration."),
  bullet("Couche Service : logique métier isolée dans plus de 15 modules de service (matching, NLP, synchronisation, analytics, alerte, recherche, etc.)."),
  bullet("Couche CRUD : 8 modules de CRUD abstraits encapsulant les requêtes SQLAlchemy."),
  bullet("Couche Modèle : définitions SQLAlchemy des 16 tables de la base de données."),

  h2("2.8 Environnement de travail"),
  h3("2.8.1 Environnement matériel"),
  new Table({
    width: { size: 6000, type: WidthType.DXA },
    columnWidths: [2000, 4000],
    rows: [
      new TableRow({ children: [hCell("Composant", { width: 2000 }), hCell("Spécification", { width: 4000 })] }),
      new TableRow({ children: [cell("Machine", { width: 2000 }), cell("[Modèle de votre ordinateur]", { width: 4000 })] }),
      new TableRow({ children: [cell("Système d'exploitation", { width: 2000, shade: GRAY_SHAD }), cell("[Windows / macOS / Linux]", { width: 4000, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("Processeur", { width: 2000 }), cell("[Modèle du processeur]", { width: 4000 })] }),
      new TableRow({ children: [cell("RAM", { width: 2000, shade: GRAY_SHAD }), cell("[Capacité en Go]", { width: 4000, shade: GRAY_SHAD })] }),
    ]
  }),
  new Paragraph({ spacing: { before: 60, after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Tableau 2.4 – Environnement matériel", bold: true, size: 22, font: "Times New Roman" })] }),

  h3("2.8.2 Environnement logiciel"),
  new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [2500, 2000, 4500],
    rows: [
      new TableRow({ children: [hCell("Outil / Technologie", { width: 2500 }), hCell("Version", { width: 2000 }), hCell("Rôle dans le projet", { width: 4500 })] }),
      new TableRow({ children: [cell("FastAPI (Python)", { width: 2500 }), cell("0.109+", { width: 2000 }), cell("Framework backend, serveur API REST", { width: 4500 })] }),
      new TableRow({ children: [cell("SQLAlchemy + Alembic", { width: 2500, shade: GRAY_SHAD }), cell("2.0+", { width: 2000, shade: GRAY_SHAD }), cell("ORM et gestion des migrations de schéma", { width: 4500, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("PostgreSQL", { width: 2500 }), cell("15", { width: 2000 }), cell("Base de données relationnelle principale", { width: 4500 })] }),
      new TableRow({ children: [cell("React 18 + TypeScript", { width: 2500, shade: GRAY_SHAD }), cell("18.2 / 5.2", { width: 2000, shade: GRAY_SHAD }), cell("Framework frontend SPA", { width: 4500, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("Vite", { width: 2500 }), cell("8.0", { width: 2000 }), cell("Outil de build et serveur de développement", { width: 4500 })] }),
      new TableRow({ children: [cell("Tailwind CSS", { width: 2500, shade: GRAY_SHAD }), cell("3.4", { width: 2000, shade: GRAY_SHAD }), cell("Framework CSS utilitaire", { width: 4500, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("Elasticsearch", { width: 2500 }), cell("8.11.1", { width: 2000 }), cell("Moteur de recherche plein texte (optionnel)", { width: 4500 })] }),
      new TableRow({ children: [cell("Docker Compose", { width: 2500, shade: GRAY_SHAD }), cell("3", { width: 2000, shade: GRAY_SHAD }), cell("Conteneurisation et orchestration locale", { width: 4500, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("Google Gemini API", { width: 2500 }), cell("1.5", { width: 2000 }), cell("Explications IA et normalisation des conditions", { width: 4500 })] }),
      new TableRow({ children: [cell("Visual Studio Code", { width: 2500, shade: GRAY_SHAD }), cell("-", { width: 2000, shade: GRAY_SHAD }), cell("Environnement de développement intégré", { width: 4500, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("Postman", { width: 2500 }), cell("-", { width: 2000 }), cell("Test et documentation des API", { width: 4500 })] }),
      new TableRow({ children: [cell("Draw.io", { width: 2500, shade: GRAY_SHAD }), cell("-", { width: 2000, shade: GRAY_SHAD }), cell("Création des diagrammes UML", { width: 4500, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("GitHub", { width: 2500 }), cell("-", { width: 2000 }), cell("Gestion de version et collaboration", { width: 4500 })] }),
    ]
  }),
  new Paragraph({ spacing: { before: 60, after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Tableau 2.5 – Environnement logiciel", bold: true, size: 22, font: "Times New Roman" })] }),

  h2("2.9 Conclusion"),
  para("Ce chapitre a posé les fondations du projet Clinical Trial Matcher en identifiant les acteurs, les besoins fonctionnels et non fonctionnels, et en élaborant le backlog produit et l'architecture technique. La planification structurée en quatre sprints, couplée aux choix technologiques justifiés, prépare une mise en œuvre rigoureuse et progressive. Le chapitre suivant détaillera le Sprint 1, dédié à l'implémentation des fonctionnalités d'authentification et de gestion des profils."),
);

// ════════════════════════════════════════════════════════════════════════════════
// CHAPITRE 3
// ════════════════════════════════════════════════════════════════════════════════
children.push(
  pageBreak(),
  h1("Chapitre 3 : Sprint 1 – Authentification et gestion des profils"),
  h2("3.1 Introduction"),
  para("Ce chapitre présente le Sprint 1 du projet, consacré à l'implémentation des fonctionnalités fondamentales : l'authentification sécurisée, la gestion des comptes utilisateurs selon quatre rôles distincts, et le wizard multi-étapes de création de profil patient. Ces composants constituent le socle sur lequel repose l'ensemble des fonctionnalités métier de la plateforme."),

  h2("3.2 Backlog du sprint"),
  new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [3500, 4000, 1500],
    rows: [
      new TableRow({ children: [hCell("User Story", { width: 3500 }), hCell("Tâches principales", { width: 4000 }), hCell("Estimation (jours)", { width: 1500 })] }),
      new TableRow({ children: [cell("En tant qu'utilisateur, je peux m'inscrire, me connecter et récupérer mon mot de passe.", { width: 3500 }), cell("Implémenter JWT + cookie HTTP-only, bcrypt, verrouillage de compte, rotation des tokens.", { width: 4000 }), cell("4", { width: 1500, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("En tant que patient, je peux créer mon profil médical en plusieurs étapes.", { width: 3500, shade: GRAY_SHAD }), cell("Développer le wizard 4 étapes (démographie, conditions, médicaments, documents + consentement).", { width: 4000, shade: GRAY_SHAD }), cell("5", { width: 1500, shade: GRAY_SHAD, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("En tant qu'administrateur, je peux gérer les utilisateurs et consulter les logs d'audit.", { width: 3500 }), cell("CRUD utilisateurs, changement de rôle, déverrouillage de compte, journalisation des actions.", { width: 4000 }), cell("3", { width: 1500, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("En tant que patient, je peux importer mon dossier médical depuis un fichier FHIR.", { width: 3500, shade: GRAY_SHAD }), cell("Implémenter le parseur FHIR R4, extraction des données démographiques et conditions, pré-remplissage du wizard.", { width: 4000, shade: GRAY_SHAD }), cell("3", { width: 1500, shade: GRAY_SHAD, align: AlignmentType.CENTER })] }),
    ]
  }),
  new Paragraph({ spacing: { before: 60, after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Tableau 3.1 – Backlog du Sprint 1", bold: true, size: 22, font: "Times New Roman" })] }),

  h2("3.3 Spécification des besoins"),
  h3("3.3.1 Diagramme des cas d'utilisation raffiné du Sprint 1"),
  ...imgPlaceholder("3.1", "Diagramme des cas d'utilisation raffiné du Sprint 1"),

  h3("3.3.2 Description textuelle : cas d'utilisation « S'authentifier »"),
  new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [2200, 6800],
    rows: [
      new TableRow({ children: [hCell("Cas d'utilisation", { width: 2200 }), hCell("S'authentifier", { width: 6800 })] }),
      new TableRow({ children: [cell("Acteurs", { width: 2200 }), cell("Patient, Médecin, Chercheur, Administrateur", { width: 6800 })] }),
      new TableRow({ children: [cell("Objectif", { width: 2200, shade: GRAY_SHAD }), cell("Permettre à un utilisateur de se connecter à la plateforme et d'obtenir un token d'accès JWT valide.", { width: 6800, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("Pré-condition", { width: 2200 }), cell("L'utilisateur possède un compte actif et non verrouillé.", { width: 6800 })] }),
      new TableRow({ children: [cell("Post-conditions", { width: 2200, shade: GRAY_SHAD }), cell("Un token JWT est émis et stocké en mémoire. Un cookie HTTP-only de rafraîchissement est déposé par le serveur.", { width: 6800, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("Scénario nominal", { width: 2200 }), cell("1. L'utilisateur saisit son email et son mot de passe.\n2. Le serveur vérifie les informations et l'état du compte.\n3. En cas de succès, un token JWT est retourné et un cookie HTTP-only est déposé.\n4. L'utilisateur est redirigé vers son tableau de bord selon son rôle.", { width: 6800 })] }),
      new TableRow({ children: [cell("Scénario d'exception", { width: 2200, shade: GRAY_SHAD }), cell("Après 5 tentatives échouées : le compte est verrouillé pendant 15 minutes et un message d'erreur explicite est affiché.", { width: 6800, shade: GRAY_SHAD })] }),
    ]
  }),
  new Paragraph({ spacing: { before: 60, after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Tableau 3.2 – Description textuelle du cas d'utilisation « S'authentifier »", bold: true, size: 22, font: "Times New Roman" })] }),

  h3("3.3.3 Description textuelle : cas d'utilisation « Créer un profil patient »"),
  new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [2200, 6800],
    rows: [
      new TableRow({ children: [hCell("Cas d'utilisation", { width: 2200 }), hCell("Créer un profil patient", { width: 6800 })] }),
      new TableRow({ children: [cell("Acteur", { width: 2200 }), cell("Patient", { width: 6800 })] }),
      new TableRow({ children: [cell("Objectif", { width: 2200, shade: GRAY_SHAD }), cell("Permettre au patient de saisir ses informations médicales complètes pour alimenter le moteur de correspondance.", { width: 6800, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("Pré-condition", { width: 2200 }), cell("L'utilisateur est authentifié et n'a pas encore créé de profil. Il doit accepter le consentement au traitement de ses données.", { width: 6800 })] }),
      new TableRow({ children: [cell("Post-conditions", { width: 2200, shade: GRAY_SHAD }), cell("Le profil est créé et un record de consentement est enregistré. Le patient est redirigé vers son tableau de bord.", { width: 6800, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("Scénario nominal", { width: 2200 }), cell("1. Étape 1 (Démographie) : saisie de la date de naissance, genre, poids, taille, localisation. Validation : date de naissance et genre obligatoires.\n2. Étape 2 (Conditions) : ajout des conditions médicales avec codes ICD-10 optionnels.\n3. Étape 3 (Médicaments) : ajout des médicaments actifs avec posologie.\n4. Étape 4 (Documents + Consentement) : téléchargement de documents médicaux optionnel, acceptation obligatoire du consentement.\n5. Soumission : enregistrement séquentiel via l'API (consentement → profil → conditions → médicaments).", { width: 6800 })] }),
      new TableRow({ children: [cell("Scénario d'exception", { width: 2200, shade: GRAY_SHAD }), cell("Le bouton « Compléter le profil » reste désactivé tant que le consentement n'est pas coché.", { width: 6800, shade: GRAY_SHAD })] }),
    ]
  }),
  new Paragraph({ spacing: { before: 60, after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Tableau 3.3 – Description textuelle du cas d'utilisation « Créer un profil patient »", bold: true, size: 22, font: "Times New Roman" })] }),

  h2("3.4 Diagrammes de séquence du Sprint 1"),
  h3("3.4.1 Diagramme de séquence : « S'authentifier »"),
  para("Le diagramme suivant illustre la séquence complète d'authentification, de la saisie des identifiants jusqu'à l'émission du token JWT et la redirection vers le tableau de bord."),
  ...imgPlaceholder("3.2", "Diagramme de séquence du cas d'utilisation « S'authentifier »"),

  h3("3.4.2 Diagramme de séquence : « Créer un profil patient »"),
  ...imgPlaceholder("3.3", "Diagramme de séquence du cas d'utilisation « Créer un profil patient »"),

  h2("3.5 Réalisation"),
  h3("3.5.1 Interfaces : Authentification"),
  para("L'interface d'authentification propose deux formulaires distincts : un pour les patients et un pour les administrateurs. Elle intègre un mécanisme de rafraîchissement silencieux au démarrage de l'application — avant le montage du router — qui tente de renouveler le token JWT via le cookie HTTP-only. Si le cookie est absent ou expiré, l'utilisateur est redirigé vers la page de connexion."),
  ...imgPlaceholder("3.4", "Interface de connexion patient"),
  ...imgPlaceholder("3.5", "Interface de réinitialisation du mot de passe"),

  h3("3.5.2 Interfaces : Wizard de création du profil patient"),
  para("Le wizard multi-étapes est implémenté comme un composant React unique qui conserve l'état de toutes les étapes en mémoire sans aucune requête serveur intermédiaire. Les données ne sont transmises au serveur qu'à la validation finale. Un rail visuel indique la progression : étapes complétées (coche verte), étape courante (active), étapes à venir (grisées)."),
  ...imgPlaceholder("3.6", "Étape 1 du wizard – Données démographiques"),
  ...imgPlaceholder("3.7", "Étape 2 du wizard – Conditions médicales avec recherche ICD-10"),
  ...imgPlaceholder("3.8", "Étape 4 – Documents et case à cocher de consentement"),

  h3("3.5.3 Interfaces : Administration des utilisateurs"),
  para("L'interface d'administration liste tous les utilisateurs avec leurs rôles, statuts et dates de création. L'administrateur peut modifier les rôles, désactiver, verrouiller ou supprimer des comptes. Chaque action est journalisée dans la table audit_logs avec l'acteur, la cible et les métadonnées (ancien rôle, nouveau rôle, raison de désactivation)."),
  ...imgPlaceholder("3.9", "Interface d'administration – Gestion des utilisateurs"),

  h2("3.6 Conclusion"),
  para("Le Sprint 1 a permis de mettre en place les briques fondamentales de la plateforme : un système d'authentification robuste basé sur JWT avec rotation de tokens, un wizard de profil patient complet en quatre étapes avec gestion du consentement, et un panneau d'administration avec journalisation des actions. Ces composants constituent le socle sur lequel s'appuieront les fonctionnalités métier des sprints suivants."),
);

// ════════════════════════════════════════════════════════════════════════════════
// CHAPITRE 4
// ════════════════════════════════════════════════════════════════════════════════
children.push(
  pageBreak(),
  h1("Chapitre 4 : Sprint 2 – Moteur de correspondance et pipeline NLP"),
  h2("4.1 Introduction"),
  para("Ce chapitre présente le cœur technologique de la plateforme : le moteur de correspondance déterministe et le pipeline de traitement du langage naturel (NLP). Ces deux composants constituent l'apport scientifique principal du projet, en transformant des données médicales non structurées en scores de compatibilité quantifiables, transparents et reproductibles."),

  h2("4.2 Backlog du sprint"),
  new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [3500, 4000, 1500],
    rows: [
      new TableRow({ children: [hCell("User Story", { width: 3500 }), hCell("Tâches principales", { width: 4000 }), hCell("Estimation (jours)", { width: 1500 })] }),
      new TableRow({ children: [cell("En tant qu'administrateur, je peux synchroniser les essais cliniques depuis ClinicalTrials.gov.", { width: 3500 }), cell("Implémenter le client HTTPX vers l'API v2, parser et stocker les essais en base, gérer les logs de synchronisation.", { width: 4000 }), cell("4", { width: 1500, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("En tant que patient, je peux déclencher le calcul des correspondances avec les essais disponibles.", { width: 3500, shade: GRAY_SHAD }), cell("Développer le moteur de scoring (4 dimensions), la normalisation du texte, le coefficient de Dice, la détection des disqualificateurs.", { width: 4000, shade: GRAY_SHAD }), cell("6", { width: 1500, shade: GRAY_SHAD, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("En tant que chercheur, je peux extraire automatiquement les critères d'éligibilité des essais.", { width: 3500 }), cell("Implémenter le pipeline NLP (scispaCy, regex, BioBERT), stocker les entités extraites en JSONB.", { width: 4000 }), cell("5", { width: 1500, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("En tant que patient, je peux rechercher des essais par mots-clés et filtres avancés.", { width: 3500, shade: GRAY_SHAD }), cell("Intégrer Elasticsearch, implémenter le fallback DB avec recherche ilike, développer l'interface de filtrage.", { width: 4000, shade: GRAY_SHAD }), cell("3", { width: 1500, shade: GRAY_SHAD, align: AlignmentType.CENTER })] }),
    ]
  }),
  new Paragraph({ spacing: { before: 60, after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Tableau 4.1 – Backlog du Sprint 2", bold: true, size: 22, font: "Times New Roman" })] }),

  h2("4.3 Spécification des besoins"),
  h3("4.3.1 Diagramme des cas d'utilisation raffiné du Sprint 2"),
  ...imgPlaceholder("4.1", "Diagramme des cas d'utilisation raffiné du Sprint 2"),

  h3("4.3.2 Description textuelle : cas d'utilisation « Calculer les correspondances »"),
  new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [2200, 6800],
    rows: [
      new TableRow({ children: [hCell("Cas d'utilisation", { width: 2200 }), hCell("Calculer les correspondances patient-essais", { width: 6800 })] }),
      new TableRow({ children: [cell("Acteur", { width: 2200 }), cell("Patient", { width: 6800 })] }),
      new TableRow({ children: [cell("Objectif", { width: 2200, shade: GRAY_SHAD }), cell("Calculer un score de compatibilité entre le profil médical du patient et chacun des essais cliniques en statut « Recruiting ».", { width: 6800, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("Pré-condition", { width: 2200 }), cell("Le patient possède un profil complet avec au moins une condition médicale active. Des essais sont disponibles en base.", { width: 6800 })] }),
      new TableRow({ children: [cell("Post-conditions", { width: 2200, shade: GRAY_SHAD }), cell("Les correspondances avec un score ≥ 40.0 sont persistées en base. Les correspondances obsolètes (score < 40.0) sont supprimées. Des alertes sont générées pour les scores ≥ 70.0.", { width: 6800, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("Scénario nominal", { width: 2200 }), cell("1. Le patient clique sur « Rafraîchir les correspondances ».\n2. L'API appelle match_patient_to_all_trials().\n3. Le service charge le profil et enrichit les synonymes via Gemini.\n4. Les essais sont traités par lots de 100 (statut Recruiting).\n5. Pour chaque essai, un score composite est calculé selon 4 dimensions.\n6. Les correspondances sont insérées ou mises à jour en base.\n7. Les résultats sont retournés triés par score décroissant.", { width: 6800 })] }),
    ]
  }),
  new Paragraph({ spacing: { before: 60, after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Tableau 4.2 – Description textuelle du cas d'utilisation « Calculer les correspondances »", bold: true, size: 22, font: "Times New Roman" })] }),

  h2("4.4 Algorithme de correspondance – Spécification détaillée"),
  h3("4.4.1 Formule de scoring composite"),
  para("Le moteur de correspondance (SCORING_VERSION = 'v2') calcule un score global sur 100 points selon la formule pondérée suivante :"),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120 },
    shading: { fill: "EEF4FB", type: ShadingType.CLEAR },
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: MID_BLUE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: MID_BLUE } },
    children: [new TextRun({ text: "Score_global = (Score_condition × 0,40) + (Score_âge × 0,25) + (Score_localisation × 0,20) + (Score_genre × 0,15)", bold: true, size: 24, color: BLUE, font: "Times New Roman" })]
  }),
  para("Un seuil d'acceptation de 40,0 points est appliqué : seules les correspondances dépassant ce seuil sont persistées en base. Un plafonnement à 20,0 points est appliqué lorsqu'un essai dispose de données de conditions structurées mais que le score de condition du patient est inférieur à 15,0, afin d'éviter que des coïncidences purement démographiques ne remontent dans les résultats."),

  new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [2200, 1200, 5600],
    rows: [
      new TableRow({ children: [hCell("Dimension", { width: 2200 }), hCell("Poids", { width: 1200 }), hCell("Logique de calcul", { width: 5600 })] }),
      new TableRow({ children: [cell("Score condition", { width: 2200 }), cell("40 %", { width: 1200, align: AlignmentType.CENTER }), cell("Passe 0 (ICD-10) → Passe 1 (NLP) → Passe 2 (conditions normalisées) → Passe 3 (corpus texte). Coefficient de Dice ≥ 25 pour valider une correspondance. Boost par médicaments inférés (plafonné à score+20).", { width: 5600 })] }),
      new TableRow({ children: [cell("Score âge", { width: 2200, shade: GRAY_SHAD }), cell("25 %", { width: 1200, shade: GRAY_SHAD, align: AlignmentType.CENTER }), cell("100 si dans les bornes [min_age, max_age] ou aucune borne. 80 si 1-2 ans hors borne. 50 si 3-5 ans hors borne. 0 si > 5 ans hors borne.", { width: 5600, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("Score localisation", { width: 2200 }), cell("20 %", { width: 1200, align: AlignmentType.CENTER }), cell("100 si la ville ou le pays de l'essai correspond à la localisation du patient (sous-chaîne bidirectionnelle). 50 si l'essai n'a pas de localisation. 30 si le patient n'a pas de localisation. 20 sinon.", { width: 5600 })] }),
      new TableRow({ children: [cell("Score genre", { width: 2200, shade: GRAY_SHAD }), cell("15 %", { width: 1200, shade: GRAY_SHAD, align: AlignmentType.CENTER }), cell("100 si l'essai accepte tous les genres (ALL/BOTH) ou si le genre du patient correspond. 50 si le genre du patient est inconnu. 0 en cas de discordance → disqualificateur immédiat.", { width: 5600, shade: GRAY_SHAD })] }),
    ]
  }),
  new Paragraph({ spacing: { before: 60, after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Tableau 4.3 – Détail du calcul des quatre dimensions du score", bold: true, size: 22, font: "Times New Roman" })] }),

  h3("4.4.2 Disqualificateurs automatiques"),
  para("Deux conditions forcent le score global à 0,0, indépendamment des autres dimensions, avec enregistrement du motif dans le champ disqualification_reasons :"),
  bullet("Discordance de genre : score_genre == 0.0 et l'essai ne cible pas ALL/BOTH."),
  bullet("Conflit médicamenteux : le patient prend un médicament figurant dans la liste excluded_medications de l'essai (intersection exacte sur identifiants en majuscules)."),

  h3("4.4.3 Niveaux de confiance"),
  new Table({
    width: { size: 7000, type: WidthType.DXA },
    columnWidths: [2000, 2500, 2500],
    rows: [
      new TableRow({ children: [hCell("Niveau", { width: 2000 }), hCell("Score global", { width: 2500 }), hCell("Signification", { width: 2500 })] }),
      new TableRow({ children: [cell("Élevée (high)", { width: 2000 }), cell("≥ 60,0", { width: 2500, align: AlignmentType.CENTER }), cell("Correspondance forte, à explorer en priorité", { width: 2500 })] }),
      new TableRow({ children: [cell("Moyenne (medium)", { width: 2000, shade: GRAY_SHAD }), cell("40,0 – 59,9", { width: 2500, shade: GRAY_SHAD, align: AlignmentType.CENTER }), cell("Correspondance partielle, à vérifier avec un médecin", { width: 2500, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("Basse (low)", { width: 2000 }), cell("< 40,0", { width: 2500, align: AlignmentType.CENTER }), cell("Non persistée, essai filtré automatiquement", { width: 2500 })] }),
    ]
  }),
  new Paragraph({ spacing: { before: 60, after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Tableau 4.4 – Niveaux de confiance des correspondances", bold: true, size: 22, font: "Times New Roman" })] }),

  h2("4.5 Pipeline NLP d'extraction des critères d'éligibilité"),
  h3("4.5.1 Architecture du pipeline"),
  para("Le pipeline NLP traite le texte des critères d'éligibilité de chaque essai clinique (inclusion et exclusion) et produit une structure JSON stockée dans le champ JSONB extracted_entities. Il est conçu avec une dégradation gracieuse : chaque couche est activée uniquement si ses dépendances sont disponibles, sans lever d'exception bloquante."),

  ...imgPlaceholder("4.2", "Architecture du pipeline NLP en trois couches avec dégradation gracieuse"),

  h3("4.5.2 Couches d'extraction"),
  new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [1800, 2400, 4800],
    rows: [
      new TableRow({ children: [hCell("Couche", { width: 1800 }), hCell("Technologie", { width: 2400 }), hCell("Entités extraites", { width: 4800 })] }),
      new TableRow({ children: [cell("1 – NER médical", { width: 1800 }), cell("scispaCy (en_core_sci_md)", { width: 2400 }), cell("Entités DISEASE et CONDITION : noms de maladies, syndromes, conditions cliniques identifiés par le modèle de langue médical.", { width: 4800 })] }),
      new TableRow({ children: [cell("2 – Extraction par règles", { width: 1800, shade: GRAY_SHAD }), cell("Expressions régulières", { width: 2400, shade: GRAY_SHAD }), cell("Plages d'âge (pattern : N to M years), bornes simples (aged ≥ N), biomarqueurs (EGFR, HER2), conditions communes (cancer, diabetes, hypertension...).", { width: 4800, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("3 – Embeddings", { width: 1800 }), cell("BioBERT (dmis-lab/biobert-base-cased-v1.1)", { width: 2400 }), cell("Termes biomédicaux significatifs extraits par tokenisation en sous-mots et reconstruction des word-pieces (jusqu'à 20 termes uniques par critère).", { width: 4800 })] }),
    ]
  }),
  new Paragraph({ spacing: { before: 60, after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Tableau 4.5 – Couches du pipeline NLP et entités extraites", bold: true, size: 22, font: "Times New Roman" })] }),

  h2("4.6 Diagrammes de séquence du Sprint 2"),
  h3("4.6.1 Diagramme de séquence : « Calculer les correspondances »"),
  ...imgPlaceholder("4.3", "Diagramme de séquence du cas d'utilisation « Calculer les correspondances »"),

  h3("4.6.2 Diagramme de séquence : « Synchroniser les essais cliniques »"),
  ...imgPlaceholder("4.4", "Diagramme de séquence du cas d'utilisation « Synchroniser les essais cliniques »"),

  h2("4.7 Réalisation"),
  h3("4.7.1 Interface : Liste des correspondances"),
  para("L'interface de correspondances affiche les essais triés par score décroissant. Chaque carte présente le titre de l'essai, son identifiant NCT, le score global, les sous-scores par dimension sous forme de barres visuelles, le niveau de confiance (élevé/moyen) et des boutons d'action (sauvegarder, ignorer, voir les détails)."),
  ...imgPlaceholder("4.5", "Interface de la liste des correspondances avec score breakdown"),

  h3("4.7.2 Interface : Modal de détail d'un essai"),
  para("Le modal de détail présente l'ensemble des informations de l'essai (phase, statut, investigateur principal, critères d'éligibilité) ainsi que le détail complet du score de correspondance avec la justification de chaque dimension."),
  ...imgPlaceholder("4.6", "Modal de détail d'un essai avec score breakdown détaillé"),

  h3("4.7.3 Interface : Recherche et filtrage des essais"),
  para("L'interface de recherche exploite Elasticsearch (avec fallback vers la recherche SQL ILIKE) pour permettre aux utilisateurs de filtrer les essais par condition médicale, phase, statut, et localisation."),
  ...imgPlaceholder("4.7", "Interface de recherche et filtrage des essais cliniques"),

  h2("4.8 Conclusion"),
  para("Le Sprint 2 constitue le cœur scientifique et technique du projet. Le moteur de correspondance déterministe à quatre dimensions, combiné au pipeline NLP multi-couches, transforme des données médicales textuelles en scores quantifiables et auditables. La dégradation gracieuse du pipeline NLP garantit la robustesse du système même sans les dépendances optionnelles (scispaCy, BioBERT). Le chapitre suivant présentera les fonctionnalités avancées qui enrichissent l'expérience utilisateur sur la base de ce moteur."),
);

// ════════════════════════════════════════════════════════════════════════════════
// CHAPITRE 5
// ════════════════════════════════════════════════════════════════════════════════
children.push(
  pageBreak(),
  h1("Chapitre 5 : Sprint 3 – Fonctionnalités avancées et IA"),
  h2("5.1 Introduction"),
  para("Ce dernier sprint intègre les fonctionnalités qui transforment la plateforme d'un outil de matching en une véritable solution de santé numérique intelligente : les explications IA via Google Gemini, les tableaux de bord analytiques par rôle, l'import de dossiers médicaux FHIR R4, le système d'alertes automatiques et les améliorations de l'expérience utilisateur (thèmes, internationalisation, SmokeFlow pour les chercheurs)."),

  h2("5.2 Backlog du sprint"),
  new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [3500, 4000, 1500],
    rows: [
      new TableRow({ children: [hCell("User Story", { width: 3500 }), hCell("Tâches principales", { width: 4000 }), hCell("Estimation (jours)", { width: 1500 })] }),
      new TableRow({ children: [cell("En tant que patient, je peux obtenir une explication IA de ma compatibilité avec un essai.", { width: 3500 }), cell("Intégrer Gemini API côté frontend, construire un prompt structuré, afficher l'explication dans le modal de détail.", { width: 4000 }), cell("3", { width: 1500, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("En tant que chercheur, je dispose d'un tableau de bord analytique.", { width: 3500, shade: GRAY_SHAD }), cell("Développer les endpoints analytics (stats par rôle), intégrer des graphiques Recharts dans le frontend.", { width: 4000, shade: GRAY_SHAD }), cell("4", { width: 1500, shade: GRAY_SHAD, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("En tant que patient, je peux importer mon dossier depuis un fichier FHIR R4.", { width: 3500 }), cell("Implémenter le parseur fhir.resources, extraire les données démographiques et conditions, pré-remplir le wizard.", { width: 4000 }), cell("3", { width: 1500, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("En tant que patient, je reçois des alertes pour les nouvelles correspondances.", { width: 3500, shade: GRAY_SHAD }), cell("Déclencher des alertes pour score ≥ 70, implémenter la lecture et l'archivage, afficher le badge de notification.", { width: 4000, shade: GRAY_SHAD }), cell("2", { width: 1500, shade: GRAY_SHAD, align: AlignmentType.CENTER })] }),
      new TableRow({ children: [cell("En tant que chercheur, je peux tester la pipeline de matching (SmokeFlow).", { width: 3500 }), cell("Développer l'interface SmokeFlow, intégrer OpenRouter pour l'évaluation LLM, afficher les résultats de test.", { width: 4000 }), cell("3", { width: 1500, align: AlignmentType.CENTER })] }),
    ]
  }),
  new Paragraph({ spacing: { before: 60, after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Tableau 5.1 – Backlog du Sprint 3", bold: true, size: 22, font: "Times New Roman" })] }),

  h2("5.3 Spécification des besoins"),
  h3("5.3.1 Diagramme des cas d'utilisation raffiné du Sprint 3"),
  ...imgPlaceholder("5.1", "Diagramme des cas d'utilisation raffiné du Sprint 3"),

  h3("5.3.2 Description textuelle : cas d'utilisation « Obtenir une explication IA »"),
  new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [2200, 6800],
    rows: [
      new TableRow({ children: [hCell("Cas d'utilisation", { width: 2200 }), hCell("Obtenir une explication IA", { width: 6800 })] }),
      new TableRow({ children: [cell("Acteur", { width: 2200 }), cell("Patient", { width: 6800 })] }),
      new TableRow({ children: [cell("Objectif", { width: 2200, shade: GRAY_SHAD }), cell("Générer une explication en langage naturel de la compatibilité entre le patient et un essai clinique.", { width: 6800, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("Pré-condition", { width: 2200 }), cell("Le patient a un profil complet et une correspondance calculée pour l'essai sélectionné.", { width: 6800 })] }),
      new TableRow({ children: [cell("Post-conditions", { width: 2200, shade: GRAY_SHAD }), cell("L'explication est affichée dans le modal de détail de l'essai. Elle inclut une analyse de la compatibilité, les points forts et les facteurs de risque.", { width: 6800, shade: GRAY_SHAD })] }),
      new TableRow({ children: [cell("Scénario nominal", { width: 2200 }), cell("1. Le patient clique sur « Analyser avec l'IA » dans le modal de l'essai.\n2. Le frontend construit un prompt incluant : résumé du profil patient, détails de l'essai, critères d'éligibilité et score de correspondance.\n3. Le prompt est envoyé à l'API Gemini.\n4. La réponse est affichée sous forme d'explication structurée.", { width: 6800 })] }),
    ]
  }),
  new Paragraph({ spacing: { before: 60, after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Tableau 5.2 – Description textuelle du cas d'utilisation « Obtenir une explication IA »", bold: true, size: 22, font: "Times New Roman" })] }),

  h2("5.4 Diagrammes de séquence du Sprint 3"),
  h3("5.4.1 Diagramme de séquence : « Obtenir une explication IA »"),
  ...imgPlaceholder("5.2", "Diagramme de séquence du cas d'utilisation « Obtenir une explication IA »"),

  h3("5.4.2 Diagramme de séquence : « Importer un dossier FHIR »"),
  ...imgPlaceholder("5.3", "Diagramme de séquence du cas d'utilisation « Importer un dossier FHIR R4 »"),

  h2("5.5 Réalisation"),
  h3("5.5.1 Interface : Explication IA dans le modal de détail"),
  para("L'intégration de Google Gemini permet de générer, à la demande du patient, une explication en langage naturel de sa compatibilité avec un essai. Le service geminiService.ts côté frontend construit un prompt structuré qui inclut le profil résumé du patient (âge, conditions actives, médicaments), les données de l'essai (phase, objectif, critères clés), et les sous-scores de correspondance. La réponse de Gemini est affichée directement dans le modal de l'essai."),
  ...imgPlaceholder("5.4", "Modal de détail d'un essai avec l'explication générée par Gemini"),

  h3("5.5.2 Interface : Tableau de bord patient"),
  para("Le tableau de bord patient affiche une vue synthétique de son activité sur la plateforme : nombre de correspondances actives, distribution par niveau de confiance (élevée/moyenne), historique des alertes non lues, et accès rapide aux essais favoris. Des indicateurs visuels (barres et cercles de score) facilitent l'interprétation des résultats."),
  ...imgPlaceholder("5.5", "Tableau de bord patient avec indicateurs de correspondance"),

  h3("5.5.3 Interface : Tableau de bord chercheur et analytique"),
  para("Le tableau de bord chercheur présente des statistiques agrégées sur les correspondances (distribution des scores, taux de couverture par condition, tendances des essais en cours de recrutement). Des graphiques Recharts permettent une visualisation interactive des données. Les chercheurs disposent également de l'outil SmokeFlow pour tester manuellement la pipeline de matching sur un profil et un essai donnés."),
  ...imgPlaceholder("5.6", "Tableau de bord chercheur avec graphiques analytiques"),
  ...imgPlaceholder("5.7", "Interface SmokeFlow – Test manuel de la pipeline de matching"),

  h3("5.5.4 Interface : Import FHIR et gestion des alertes"),
  para("L'interface d'import FHIR permet au patient de télécharger un fichier Bundle FHIR R4 ou de saisir l'URL d'un serveur HAPI FHIR pour récupérer son dossier. Le parseur extrait automatiquement les données démographiques (date de naissance, genre) et les conditions médicales pour pré-remplir les étapes correspondantes du wizard. Le système d'alertes notifie le patient dès qu'une nouvelle correspondance de haute confiance (score ≥ 70) est disponible."),
  ...imgPlaceholder("5.8", "Interface d'import FHIR R4 dans le wizard patient"),
  ...imgPlaceholder("5.9", "Interface de gestion des alertes avec badge de notification"),

  h2("5.6 Conclusion"),
  para("Le Sprint 3 a enrichi la plateforme de fonctionnalités qui en font un véritable outil de santé numérique : les explications en langage naturel générées par IA rendent les scores compréhensibles pour le patient, les tableaux de bord analytiques apportent de la valeur aux professionnels de santé, et l'import FHIR facilite l'intégration avec les systèmes d'information hospitaliers existants. L'ensemble de ces composants, développés en trois sprints, constitue une solution complète, sécurisée et extensible."),
);

// ════════════════════════════════════════════════════════════════════════════════
// CONCLUSION GENERALE
// ════════════════════════════════════════════════════════════════════════════════
children.push(
  pageBreak(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 240 },
    children: [new TextRun({ text: "Conclusion Générale et Perspectives", bold: true, size: 36, color: BLUE, font: "Arial" })] }),

  para("Ce projet de fin d'études a permis de concevoir, développer et valider une plateforme web intelligente de correspondance entre patients et essais cliniques. La plateforme Clinical Trial Matcher répond à une problématique médicale concrète — la difficulté de recruter des patients éligibles pour les essais cliniques — en proposant une solution automatisée, transparente et auditable."),

  para("Sur le plan technique, le projet a abouti à la création d'un système full-stack robuste articulé autour d'un backend FastAPI avec PostgreSQL, d'un frontend React 18 en TypeScript, d'un moteur de scoring déterministe à quatre dimensions, et d'un pipeline NLP multi-couches. Les principaux apports scientifiques et techniques sont les suivants :"),
  bullet("Un algorithme de scoring composite reproductible basé sur le coefficient de Dice pour la correspondance des conditions médicales, intégrant un mécanisme d'expansion par synonymes et d'inférence à partir des médicaments."),
  bullet("Un pipeline NLP à dégradation gracieuse combinant scispaCy, des expressions régulières et BioBERT, permettant l'extraction structurée des critères d'éligibilité depuis le texte brut des essais."),
  bullet("Un système d'authentification sécurisé reposant sur JWT avec rotation des tokens de rafraîchissement via cookie HTTP-only, garantissant la protection des données de santé des patients."),
  bullet("L'intégration de Google Gemini pour générer des explications intelligibles des scores de correspondance, rendant les résultats accessibles aux patients non spécialistes."),

  para("Sur le plan méthodologique, l'adoption du framework Scrum a permis une livraison progressive et itérative des fonctionnalités, avec un feedback continu et des ajustements réguliers. Les trois sprints de développement ont permis de couvrir l'ensemble du périmètre fonctionnel défini dans le backlog produit."),

  para("Ce projet a également été une opportunité précieuse de consolider des compétences techniques transversales : développement full-stack, conception de bases de données relationnelles, intégration d'API externes, traitement du langage naturel, et sécurité des applications web. Sur le plan personnel, il a renforcé l'autonomie, la rigueur et la capacité à gérer un projet informatique de bout en bout."),

  h2("Perspectives d'amélioration"),
  para("Plusieurs axes d'évolution sont envisagés pour les versions futures de la plateforme :"),
  bullet("Matching sémantique vectoriel : intégration de la recherche hybride combinant scores BM25 (lexical) et embeddings vectoriels (sémantique) pour améliorer la précision de la correspondance des conditions médicales."),
  bullet("Matching basé sur les biomarqueurs : extension du moteur de scoring pour prendre en compte les biomarqueurs génétiques (EGFR, HER2, BRCA) dans le calcul de la compatibilité."),
  bullet("Géolocalisation précise : remplacement de la correspondance textuelle de localisation par un calcul de distance géographique (haversine) pour mieux estimer l'accessibilité des essais."),
  bullet("Tableau de bord décisionnel avancé : intégration d'un pipeline ETL et d'outils de Business Intelligence (Power BI, Metabase) pour les administrateurs et les équipes de recherche."),
  bullet("Application mobile : développement d'une version mobile via React Native pour améliorer l'accessibilité de la plateforme pour les patients."),
  bullet("Conformité réglementaire renforcée : certification RGPD, conformité HIPAA, et intégration avec les systèmes HL7 FHIR des établissements de santé."),
);

// ════════════════════════════════════════════════════════════════════════════════
// BIBLIOGRAPHIE
// ════════════════════════════════════════════════════════════════════════════════
children.push(
  pageBreak(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 240 },
    children: [new TextRun({ text: "Références bibliographiques", bold: true, size: 36, color: BLUE, font: "Arial" })] }),

  para("[1] Tipton, K., Naci, H., et al. (2022). « Clinical trial recruitment challenges and strategies ». New England Journal of Medicine, vol. 386, pp. 1345-1354. Disponible sur : https://www.nejm.org, (Consulté le 15/04/2025)."),
  para("[2] Fassbender, A., et al. (2019). « Online patient recruitment in clinical trials: systematic review and meta-analysis ». Journal of Medical Internet Research, vol. 21, n° 11. Disponible sur : https://www.jmir.org, (Consulté le 17/04/2025)."),
  para("[3] FastAPI Documentation. https://fastapi.tiangolo.com/. (Consulté le 10/03/2025)."),
  para("[4] SQLAlchemy Documentation. https://docs.sqlalchemy.org/. (Consulté le 12/03/2025)."),
  para("[5] React Documentation. https://react.dev/. (Consulté le 15/03/2025)."),
  para("[6] ClinicalTrials.gov API v2. https://clinicaltrials.gov/data-api/api. (Consulté le 20/03/2025)."),
  para("[7] Neumann, M., King, D., Beltagy, I., Ammar, W. (2019). « ScispaCy: Fast and Robust Models for Biomedical Natural Language Processing ». arXiv:1902.07669. Disponible sur : https://arxiv.org, (Consulté le 25/03/2025)."),
  para("[8] Lee, J., et al. (2020). « BioBERT: a pre-trained biomedical language representation model ». Bioinformatics, vol. 36, n° 4. Oxford University Press. Disponible sur : https://academic.oup.com, (Consulté le 28/03/2025)."),
  para("[9] Google Gemini API Documentation. https://ai.google.dev/. (Consulté le 05/04/2025)."),
  para("[10] HL7 FHIR R4 Specification. https://hl7.org/fhir/R4/. (Consulté le 08/04/2025)."),
  para("[11] Elasticsearch Documentation 8.x. https://www.elastic.co/docs. (Consulté le 10/04/2025)."),
  para("[12] Schwaber, K. & Sutherland, J. (2020). « The Scrum Guide ». Scrum.org. Disponible sur : https://www.scrum.org/resources/scrum-guide. (Consulté le 01/03/2025)."),
  para("[13] OWASP Foundation. (2021). « OWASP Top Ten 2021 ». Disponible sur : https://owasp.org/www-project-top-ten/. (Consulté le 20/04/2025)."),
  para("[14] PostgreSQL Global Development Group. (2023). « PostgreSQL 15 Documentation ». Disponible sur : https://www.postgresql.org/docs/15/. (Consulté le 15/03/2025)."),
  para("[15] Vite Documentation. https://vitejs.dev/. (Consulté le 18/03/2025)."),
);

// ════════════════════════════════════════════════════════════════════════════════
// RESUME / ABSTRACT
// ════════════════════════════════════════════════════════════════════════════════
children.push(
  pageBreak(),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 120 },
    children: [new TextRun({ text: "Résumé", bold: true, size: 30, color: BLUE, font: "Arial" })] }),
  para("Ce rapport présente le développement de la plateforme Clinical Trial Matcher, réalisée dans le cadre du Projet de Fin d'Études pour l'obtention de la Licence en Sciences de l'Informatique à l'ISLAIB. La plateforme vise à automatiser la correspondance entre les profils médicaux des patients et les critères d'éligibilité des essais cliniques. Développée selon la méthodologie Scrum en trois sprints, la solution repose sur une architecture full-stack (FastAPI, PostgreSQL, React 18, TypeScript) et intègre un moteur de scoring déterministe à quatre dimensions (conditions médicales 40 %, âge 25 %, localisation 20 %, genre 15 %), un pipeline NLP multi-couches pour l'extraction automatique des critères d'éligibilité, et des explications en langage naturel générées par Google Gemini. Les résultats démontrent la faisabilité d'une approche reproductible et auditable pour le pré-triage automatisé des essais cliniques."),
  new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun({ text: "Mots-clés : essais cliniques, correspondance patient-essai, scoring déterministe, NLP médical, FastAPI, React, FHIR R4, Google Gemini.", bold: true, size: 22, font: "Times New Roman" })] }),

  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 120 },
    children: [new TextRun({ text: "Abstract", bold: true, size: 30, color: BLUE, font: "Arial" })] }),
  para("This report presents the development of the Clinical Trial Matcher platform, built as a Final Year Project (PFE) for the Bachelor's Degree in Computer Science at ISLAIB. The platform aims to automate the matching between patient medical profiles and clinical trial eligibility criteria. Developed using the Scrum methodology across three sprints, the solution relies on a full-stack architecture (FastAPI, PostgreSQL, React 18, TypeScript) and integrates a deterministic four-dimension scoring engine (medical conditions 40%, age 25%, location 20%, gender 15%), a multi-layer NLP pipeline for automatic eligibility criteria extraction, and natural language explanations generated by Google Gemini. The results demonstrate the feasibility of a reproducible and auditable approach for the automated pre-screening of clinical trials."),
  new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun({ text: "Keywords: clinical trials, patient-trial matching, deterministic scoring, medical NLP, FastAPI, React, FHIR R4, Google Gemini.", bold: true, size: 22, font: "Times New Roman" })] }),
);

// ════════════════════════════════════════════════════════════════════════════════
// BUILD DOCUMENT
// ════════════════════════════════════════════════════════════════════════════════
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } }, run: { font: "Symbol", size: 24 } }
        }]
      }
    ]
  },
  styles: {
    default: {
      document: { run: { font: "Times New Roman", size: 24 } }
    },
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: MID_BLUE, space: 1 } },
          children: [
            new TextRun({ text: "Clinical Trial Matcher – Rapport de PFE | ISLAIB 2024-2025", size: 18, color: "888888", font: "Arial" }),
          ]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: MID_BLUE, space: 1 } },
          children: [
            new TextRun({ text: "Page ", size: 18, color: "888888", font: "Arial" }),
            new TextRun({ text: "" }),
          ]
        })]
      })
    },
    children
  }]
});

Packer.toBuffer(doc).then(buf => {
  const outDir = path.join(__dirname, 'outputs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'PFE_Report_Clinical_Trial_Matcher.docx');
  fs.writeFileSync(outPath, buf);
  console.log("✅ Report generated successfully.");
}).catch(e => { console.error(e); process.exit(1); });
