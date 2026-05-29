const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  TabStopType, TableOfContents
} = require('docx');
const fs = require('fs');

// ── Colour palette ─────────────────────────────────────────────────────────
const BLUE   = "1F4E79";
const LBLUE  = "2E75B6";
const GREY   = "404040";
const SILVER = "BDD7EE";
const WHITE  = "FFFFFF";
const BLACK  = "000000";
const GREEN  = "375623";

// ── Core helpers ───────────────────────────────────────────────────────────
const hr = (color = LBLUE) => new Paragraph({
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color, space: 1 } },
  spacing: { after: 140 }
});

const sp = (pt = 6) => new Paragraph({ spacing: { after: pt * 20 } });

const body = (text, opts = {}) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 160, line: 360 },
  children: [new TextRun({ text, font: "Times New Roman", size: 24, color: GREY, ...opts })]
});

const bul = (text) => new Paragraph({
  numbering: { reference: "bullets", level: 0 },
  alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 120, line: 360 },
  children: [new TextRun({ text, font: "Times New Roman", size: 24, color: GREY })]
});

const num = (text) => new Paragraph({
  numbering: { reference: "numbers", level: 0 },
  alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 120, line: 360 },
  children: [new TextRun({ text, font: "Times New Roman", size: 24, color: GREY })]
});

// Chapter title with page break before
const chap = (n, title) => [
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text: `Chapitre ${n} : ${title}`, font: "Times New Roman", size: 36, bold: true, color: BLUE })]
  }),
  hr(BLUE),
  sp(4)
];

const sec = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 280, after: 140 },
  children: [new TextRun({ text: t, font: "Times New Roman", size: 28, bold: true, color: LBLUE })]
});

const sub = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 220, after: 100 },
  children: [new TextRun({ text: t, font: "Times New Roman", size: 25, bold: true, color: GREY })]
});

const sub2 = (t) => new Paragraph({
  spacing: { before: 180, after: 80 },
  children: [new TextRun({ text: t, font: "Times New Roman", size: 24, bold: true, color: GREY })]
});

// intro box (blue left border)
const intro = (t) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 200, line: 360 },
  shading: { fill: "EBF3FB", type: ShadingType.CLEAR },
  border: { left: { style: BorderStyle.SINGLE, size: 14, color: LBLUE, space: 8 } },
  indent: { left: 360 },
  children: [new TextRun({ text: t, font: "Times New Roman", size: 24, color: GREY, italics: true })]
});

// conclusion box (green left border)
const concl = (t) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED,
  spacing: { after: 200, line: 360 },
  shading: { fill: "E2EFDA", type: ShadingType.CLEAR },
  border: { left: { style: BorderStyle.SINGLE, size: 14, color: "70AD47", space: 8 } },
  indent: { left: 360 },
  children: [new TextRun({ text: t, font: "Times New Roman", size: 24, color: GREY })]
});

// ── Figure placeholder ────────────────────────────────────────────────────
const fig = (n, cap) => [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 60 },
    border: {
      top:    { style: BorderStyle.DASHED, size: 2, color: "AAAAAA" },
      bottom: { style: BorderStyle.DASHED, size: 2, color: "AAAAAA" },
      left:   { style: BorderStyle.DASHED, size: 2, color: "AAAAAA" },
      right:  { style: BorderStyle.DASHED, size: 2, color: "AAAAAA" }
    },
    children: [new TextRun({ text: `[ INSÉRER FIGURE : ${cap} ]`, font: "Times New Roman", size: 20, color: "888888", italics: true })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 220 },
    children: [new TextRun({ text: `Figure ${n} – ${cap}`, font: "Times New Roman", size: 20, bold: true, color: GREY })]
  })
];

// ── Table helpers ─────────────────────────────────────────────────────────
const bd = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const bds = { top: bd, bottom: bd, left: bd, right: bd };

const tCap = (n, t) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 160, after: 80 },
  children: [new TextRun({ text: `Tableau ${n} – ${t}`, font: "Times New Roman", size: 20, bold: true, color: GREY })]
});

const hc = (t, w) => new TableCell({
  borders: bds, width: { size: w, type: WidthType.DXA },
  shading: { fill: SILVER, type: ShadingType.CLEAR },
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  verticalAlign: VerticalAlign.CENTER,
  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: t, font: "Times New Roman", size: 22, bold: true, color: BLACK })] })]
});

const dc = (t, w) => new TableCell({
  borders: bds, width: { size: w, type: WidthType.DXA },
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  children: [new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: t, font: "Times New Roman", size: 22, color: GREY })] })]
});

// standard 2-col description table for use cases
const ucTable = (rows) => new Table({
  width: { size: 9026, type: WidthType.DXA },
  columnWidths: [2600, 6426],
  rows: [
    new TableRow({ children: [ hc("Élément", 2600), hc("Détail", 6426) ] }),
    ...rows.map(r => new TableRow({ children: [ dc(r[0], 2600), dc(r[1], 6426) ] }))
  ]
});

// ═══════════════════════════════════════════════════════════════════════════
//  DOCUMENT
// ═══════════════════════════════════════════════════════════════════════════
const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•",
          alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.",
          alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  styles: {
    default: { document: { run: { font: "Times New Roman", size: 24, color: GREY } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Times New Roman", color: BLUE },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Times New Roman", color: LBLUE },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 25, bold: true, font: "Times New Roman", color: GREY },
        paragraph: { spacing: { before: 220, after: 100 }, outlineLevel: 2 } }
    ]
  },
  sections: [
    // ══════════════════════════════════════════════════════════════════
    //  SECTION 1 : PAGE DE GARDE
    // ══════════════════════════════════════════════════════════════════
    {
      properties: {
        page: { size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 } }
      },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
          children: [new TextRun({ text: "Ministère de l'Enseignement Supérieur et de la Recherche Scientifique", font: "Times New Roman", size: 22, color: GREY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
          children: [new TextRun({ text: "Université de Jendouba", font: "Times New Roman", size: 22, color: GREY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 320 },
          children: [new TextRun({ text: "Institut Supérieur des Langues Appliquées et d'Informatique de Béja", font: "Times New Roman", size: 22, color: GREY })] }),

        ...fig("0.1", "Logo ISLAIB (à gauche) — Logo de l'organisme d'accueil (à droite)"),

        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 },
          children: [new TextRun({ text: "Réf : LA-GLSI 2024/2025", font: "Times New Roman", size: 22, color: GREY })] }),

        hr(BLUE),

        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 320, after: 160 },
          children: [new TextRun({ text: "Rapport de Projet de Fin d'Études", font: "Times New Roman", size: 28, bold: true, color: BLUE })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 },
          children: [new TextRun({ text: "Pour l'obtention du", font: "Times New Roman", size: 24, color: GREY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 480 },
          children: [new TextRun({ text: "DIPLÔME DE LICENCE EN SCIENCES DE L'INFORMATIQUE", font: "Times New Roman", size: 26, bold: true, color: BLUE })] }),

        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 140 },
          children: [new TextRun({ text: "Sujet :", font: "Times New Roman", size: 24, bold: true, color: GREY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 480 },
          children: [new TextRun({ text: "MASKAN — Plateforme Web de Location Immobilière Sécurisée", font: "Times New Roman", size: 32, bold: true, color: BLUE })] }),

        new Paragraph({ spacing: { after: 80 },
          children: [new TextRun({ text: "Réalisé par :", font: "Times New Roman", size: 24, bold: true, color: GREY })] }),
        new Paragraph({ spacing: { after: 320 },
          children: [new TextRun({ text: "[Votre Prénom et Nom]", font: "Times New Roman", size: 24, color: GREY })] }),

        new Paragraph({ spacing: { after: 80 },
          children: [new TextRun({ text: "Encadré par :", font: "Times New Roman", size: 24, bold: true, color: GREY })] }),

        new Table({ width: { size: 8200, type: WidthType.DXA }, columnWidths: [3200, 5000],
          rows: [
            new TableRow({ children: [
              new TableCell({ borders: { top:{style:BorderStyle.NONE}, bottom:{style:BorderStyle.NONE}, left:{style:BorderStyle.NONE}, right:{style:BorderStyle.NONE} }, width:{size:3200,type:WidthType.DXA}, margins:{top:60,bottom:60,left:0,right:120}, children:[new Paragraph({children:[new TextRun({text:"Encadrant académique",font:"Times New Roman",size:24,color:GREY})]})] }),
              new TableCell({ borders: { top:{style:BorderStyle.NONE}, bottom:{style:BorderStyle.NONE}, left:{style:BorderStyle.NONE}, right:{style:BorderStyle.NONE} }, width:{size:5000,type:WidthType.DXA}, margins:{top:60,bottom:60,left:80,right:0}, children:[new Paragraph({children:[new TextRun({text:": [Nom de l'encadrant académique]",font:"Times New Roman",size:24,color:GREY})]})] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: { top:{style:BorderStyle.NONE}, bottom:{style:BorderStyle.NONE}, left:{style:BorderStyle.NONE}, right:{style:BorderStyle.NONE} }, width:{size:3200,type:WidthType.DXA}, margins:{top:60,bottom:60,left:0,right:120}, children:[new Paragraph({children:[new TextRun({text:"Encadrant professionnel",font:"Times New Roman",size:24,color:GREY})]})] }),
              new TableCell({ borders: { top:{style:BorderStyle.NONE}, bottom:{style:BorderStyle.NONE}, left:{style:BorderStyle.NONE}, right:{style:BorderStyle.NONE} }, width:{size:5000,type:WidthType.DXA}, margins:{top:60,bottom:60,left:80,right:0}, children:[new Paragraph({children:[new TextRun({text:": [Nom de l'encadrant professionnel]",font:"Times New Roman",size:24,color:GREY})]})] })
            ]}),
            new TableRow({ children: [
              new TableCell({ borders: { top:{style:BorderStyle.NONE}, bottom:{style:BorderStyle.NONE}, left:{style:BorderStyle.NONE}, right:{style:BorderStyle.NONE} }, width:{size:3200,type:WidthType.DXA}, margins:{top:60,bottom:60,left:0,right:120}, children:[new Paragraph({children:[new TextRun({text:"Organisme d'accueil",font:"Times New Roman",size:24,color:GREY})]})] }),
              new TableCell({ borders: { top:{style:BorderStyle.NONE}, bottom:{style:BorderStyle.NONE}, left:{style:BorderStyle.NONE}, right:{style:BorderStyle.NONE} }, width:{size:5000,type:WidthType.DXA}, margins:{top:60,bottom:60,left:80,right:0}, children:[new Paragraph({children:[new TextRun({text:": [Nom de l'organisme d'accueil]",font:"Times New Roman",size:24,color:GREY})]})] })
            ]})
          ]
        }),

        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 },
          children: [new TextRun({ text: "Année universitaire : 2024–2025", font: "Times New Roman", size: 22, color: GREY })] }),
        new Paragraph({ children: [new PageBreak()] })
      ]
    },

    // ══════════════════════════════════════════════════════════════════
    //  SECTION 2 : TOUT LE CONTENU (header/footer actifs)
    // ══════════════════════════════════════════════════════════════════
    {
      properties: {
        page: { size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 } }
      },
      headers: {
        default: new Header({ children: [
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LBLUE, space: 1 } },
            children: [
              new TextRun({ text: "MASKAN — Plateforme Web de Location Immobilière Sécurisée", font: "Times New Roman", size: 18, color: LBLUE }),
              new TextRun({ text: "     |     ISLAIB 2024–2025", font: "Times New Roman", size: 18, color: GREY })
            ]
          })
        ]})
      },
      footers: {
        default: new Footer({ children: [
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: LBLUE, space: 1 } },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Page ", font: "Times New Roman", size: 18, color: GREY }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Times New Roman", size: 18, color: GREY })
            ]
          })
        ]})
      },
      children: [

        // ── DÉDICACES ────────────────────────────────────────────────
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 280 },
          children: [new TextRun({ text: "Dédicaces", font: "Times New Roman", size: 32, bold: true, color: BLUE })] }),
        hr(),
        sp(10),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200, line: 400 },
          children: [new TextRun({ text: "À mes chers parents,", font: "Times New Roman", size: 24, italics: true, color: GREY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200, line: 400 },
          children: [new TextRun({ text: "pour leur amour sans faille, leurs sacrifices inestimables", font: "Times New Roman", size: 24, italics: true, color: GREY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200, line: 400 },
          children: [new TextRun({ text: "et leur soutien indéfectible tout au long de mon parcours.", font: "Times New Roman", size: 24, italics: true, color: GREY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200, line: 400 },
          children: [new TextRun({ text: "À ma famille, source constante d'affection et de sérénité,", font: "Times New Roman", size: 24, italics: true, color: GREY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200, line: 400 },
          children: [new TextRun({ text: "à mes frères et sœurs pour leur présence et leur tendresse fraternelle.", font: "Times New Roman", size: 24, italics: true, color: GREY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200, line: 400 },
          children: [new TextRun({ text: "À mes encadrants, pour leur guidance et leur transmission du savoir.", font: "Times New Roman", size: 24, italics: true, color: GREY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200, line: 400 },
          children: [new TextRun({ text: "À mes amis, compagnons de route fidèles et précieux.", font: "Times New Roman", size: 24, italics: true, color: GREY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400, line: 400 },
          children: [new TextRun({ text: "Puissent ces quelques mots traduire l'immensité de ma gratitude.", font: "Times New Roman", size: 24, bold: true, italics: true, color: BLUE })] }),
        new Paragraph({ children: [new PageBreak()] }),

        // ── REMERCIEMENTS ────────────────────────────────────────────
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 280 },
          children: [new TextRun({ text: "Remerciements", font: "Times New Roman", size: 32, bold: true, color: BLUE })] }),
        hr(), sp(8),
        body("Je tiens à exprimer ma profonde gratitude envers mon encadrant académique pour son engagement constant tout au long de ce projet. Son expertise, ses conseils avisés et sa disponibilité ont joué un rôle essentiel dans l'aboutissement de ce travail."),
        body("J'adresse également mes vifs remerciements à mon encadrant professionnel pour son savoir-faire, sa bienveillance et ses suggestions constructives qui ont rendu cette expérience particulièrement enrichissante."),
        body("J'ai l'honneur de remercier chaleureusement les membres du jury dont l'implication et le regard attentif apporteront une réelle valeur ajoutée à ce travail. Leur engagement témoigne de leur dévouement à la valorisation des efforts fournis par les étudiants."),
        body("Mes remerciements s'étendent à l'ensemble du corps enseignant de l'ISLAIB pour la qualité de la formation dispensée, ainsi qu'à tous mes collègues et amis qui ont contribué, de près ou de loin, à la réalisation de ce projet."),
        new Paragraph({ children: [new PageBreak()] }),

        // ── RÉSUMÉ ───────────────────────────────────────────────────
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 280 },
          children: [new TextRun({ text: "Résumé", font: "Times New Roman", size: 32, bold: true, color: BLUE })] }),
        hr(), sp(8),
        body("Ce rapport présente le développement de Maskan, une plateforme web full-stack de location immobilière sécurisée conçue pour le marché tunisien, réalisée dans le cadre d'un Projet de Fin d'Études à l'ISLAIB. Adoptant la méthodologie Agile Scrum et organisée en cinq sprints de développement, la solution couvre l'intégralité du cycle de location : authentification JWT et gestion des profils (Sprint 1), publication d'annonces géolocalisées et workflow de réservation (Sprint 2), intégration des paiements sécurisés avec mécanisme d'escrow QR (Sprint 3), messagerie temps réel WebSocket/STOMP, notifications et système d'avis (Sprint 4), back-office d'administration et modération avancée (Sprint 5). La plateforme repose sur une architecture three-tier moderne : React 18 + Vite 5 pour le frontend, Spring Boot 3.2 + Spring Security pour le backend, et MongoDB comme système de persistance. Ce projet a permis de consolider des compétences techniques en architecture logicielle, sécurité applicative, développement full-stack et gestion de projet agile."),
        sp(8),
        body("Mots-clés : Location immobilière, Marketplace, React, Spring Boot, MongoDB, JWT, KYC, WebSocket, Scrum, Tunisie.", { bold: true }),
        new Paragraph({ children: [new PageBreak()] }),

        // ── ABSTRACT ─────────────────────────────────────────────────
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 280 },
          children: [new TextRun({ text: "Abstract", font: "Times New Roman", size: 32, bold: true, color: BLUE })] }),
        hr(), sp(8),
        new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 160, line: 360 },
          children: [new TextRun({ text: "This report presents the development of Maskan, a full-stack secure property rental marketplace designed for the Tunisian market, developed as a Final Year Project at ISLAIB. Adopting the Agile Scrum methodology and structured around five development sprints, the solution covers the complete rental lifecycle: JWT authentication and profile management (Sprint 1), geolocated property listings and booking workflow (Sprint 2), secure payment integration with QR escrow mechanism (Sprint 3), real-time WebSocket/STOMP messaging, notifications and review system (Sprint 4), administration back-office and advanced moderation (Sprint 5). The platform is built on a modern three-tier architecture: React 18 + Vite 5 for the frontend, Spring Boot 3.2 + Spring Security for the backend, and MongoDB as the persistence layer. This project consolidated technical skills in software architecture, application security, full-stack development and agile project management.", font: "Times New Roman", size: 24, color: GREY })] }),
        sp(8),
        new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 160 },
          children: [new TextRun({ text: "Keywords: Property rental, Marketplace, React, Spring Boot, MongoDB, JWT, KYC, WebSocket, Scrum, Tunisia.", font: "Times New Roman", size: 24, bold: true, color: GREY })] }),
        new Paragraph({ children: [new PageBreak()] }),

        // ── LISTE DES FIGURES ─────────────────────────────────────────
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 280 },
          children: [new TextRun({ text: "Liste des figures", font: "Times New Roman", size: 32, bold: true, color: BLUE })] }),
        hr(), sp(8),
        ...[
          ["Figure 0.1", "Logo ISLAIB et logo de l'organisme d'accueil", "i"],
          ["Figure 1.1", "Analyse comparative des plateformes existantes (tableau)", "4"],
          ["Figure 1.2", "Le framework Scrum — cycle itératif et artefacts", "8"],
          ["Figure 1.3", "Les rôles dans une équipe Scrum", "8"],
          ["Figure 2.1", "Diagramme de cas d'utilisation général — Maskan", "14"],
          ["Figure 2.2", "Diagramme de classes d'analyse — entités MongoDB", "15"],
          ["Figure 2.3", "Architecture logicielle MVC — Spring Boot (Controller→Service→Repository)", "17"],
          ["Figure 2.4", "Architecture physique three-tier — Frontend / Backend / MongoDB", "18"],
          ["Figure 2.5", "Diagramme de Gantt — Planification des cinq sprints", "22"],
          ["Figure 3.1", "Diagramme de cas d'utilisation raffiné — Sprint 1 (Auth & Profils)", "26"],
          ["Figure 3.2", "Diagramme de séquence — S'inscrire (Register)", "28"],
          ["Figure 3.3", "Diagramme de séquence — S'authentifier (Login + JWT)", "29"],
          ["Figure 3.4", "Diagramme de séquence — Vérification OTP email (KYC Step 1)", "30"],
          ["Figure 3.5", "Interfaces Sprint 1 : Connexion / Inscription / Profil utilisateur", "31"],
          ["Figure 3.6", "Interface Sprint 1 : Page de vérification KYC (email OTP)", "32"],
          ["Figure 4.1", "Diagramme de cas d'utilisation raffiné — Sprint 2 (Annonces & Réservations)", "36"],
          ["Figure 4.2", "Diagramme de séquence — Créer une annonce (Host)", "38"],
          ["Figure 4.3", "Diagramme de séquence — Réserver un bien (Guest)", "39"],
          ["Figure 4.4", "Interface Sprint 2 : Page d'exploration des annonces avec filtres", "41"],
          ["Figure 4.5", "Interface Sprint 2 : Formulaire de création d'annonce + carte MapLibre", "42"],
          ["Figure 4.6", "Interface Sprint 2 : Page de détail d'annonce + formulaire de réservation", "43"],
          ["Figure 4.7", "Interface Sprint 2 : Dashboard Guest (historique réservations)", "44"],
          ["Figure 5.1", "Diagramme de cas d'utilisation raffiné — Sprint 3 (Paiements)", "48"],
          ["Figure 5.2", "Diagramme de séquence — Pipeline de paiement + génération QR escrow", "50"],
          ["Figure 5.3", "Diagramme de séquence — Validation check-in par QR code (Host)", "51"],
          ["Figure 5.4", "Interface Sprint 3 : Page checkout (CARD / CASH)", "52"],
          ["Figure 5.5", "Interface Sprint 3 : Affichage QR code de check-in (Guest)", "53"],
          ["Figure 5.6", "Interface Sprint 3 : Scanner QR code (Host)", "53"],
          ["Figure 6.1", "Diagramme de cas d'utilisation raffiné — Sprint 4 (Notifications & Messagerie)", "57"],
          ["Figure 6.2", "Diagramme de séquence — Envoi d'un message WebSocket STOMP", "59"],
          ["Figure 6.3", "Diagramme de séquence — Soumettre un avis", "60"],
          ["Figure 6.4", "Interface Sprint 4 : Module de messagerie temps réel", "61"],
          ["Figure 6.5", "Interface Sprint 4 : Notifications (cloche + panel)", "62"],
          ["Figure 6.6", "Interface Sprint 4 : Formulaire de dépôt d'avis + affichage des avis", "63"],
          ["Figure 7.1", "Diagramme de cas d'utilisation raffiné — Sprint 5 (Administration)", "67"],
          ["Figure 7.2", "Diagramme de séquence — Validation KYC par Admin", "69"],
          ["Figure 7.3", "Diagramme de séquence — Modération d'une annonce", "70"],
          ["Figure 7.4", "Interface Sprint 5 : Tableau de bord Admin (KPIs)", "71"],
          ["Figure 7.5", "Interface Sprint 5 : Gestion des utilisateurs + bannissement", "72"],
          ["Figure 7.6", "Interface Sprint 5 : Validation des demandes KYC Host", "73"],
          ["Figure 7.7", "Interface Sprint 5 : Modération des annonces en attente", "74"],
        ].map(([ref, cap, pg]) => new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: 9026, leader: TabStopType.DOT }],
          spacing: { after: 100 },
          children: [
            new TextRun({ text: ref, font: "Times New Roman", size: 22, bold: true, color: GREY }),
            new TextRun({ text: " – " + cap, font: "Times New Roman", size: 22, color: GREY }),
            new TextRun({ text: "\t" + pg, font: "Times New Roman", size: 22, color: GREY })
          ]
        })),
        new Paragraph({ children: [new PageBreak()] }),

        // ── LISTE DES TABLEAUX ────────────────────────────────────────
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 280 },
          children: [new TextRun({ text: "Liste des tableaux", font: "Times New Roman", size: 32, bold: true, color: BLUE })] }),
        hr(), sp(8),
        ...[
          ["Tableau 1.1", "Analyse comparative des solutions existantes", "5"],
          ["Tableau 1.2", "Comparatif méthodes agiles vs méthodes classiques", "7"],
          ["Tableau 2.1", "Comparatif SQL vs NoSQL pour Maskan", "16"],
          ["Tableau 2.2", "Environnement matériel", "19"],
          ["Tableau 2.3", "Stack technologique complète (environnement logiciel)", "20"],
          ["Tableau 2.4", "Product Backlog Maskan (17 User Stories)", "23"],
          ["Tableau 2.5", "Structure et objectifs des cinq sprints", "24"],
          ["Tableau 3.1", "Backlog du Sprint 1", "26"],
          ["Tableau 3.2", "Description textuelle — Cas d'utilisation « S'inscrire »", "27"],
          ["Tableau 3.3", "Description textuelle — Cas d'utilisation « Se connecter »", "28"],
          ["Tableau 3.4", "Description textuelle — Cas d'utilisation « Vérifier son email (OTP) »", "29"],
          ["Tableau 4.1", "Backlog du Sprint 2", "35"],
          ["Tableau 4.2", "Description textuelle — Cas d'utilisation « Créer une annonce »", "37"],
          ["Tableau 4.3", "Description textuelle — Cas d'utilisation « Réserver un bien »", "38"],
          ["Tableau 5.1", "Backlog du Sprint 3", "47"],
          ["Tableau 5.2", "Description textuelle — Cas d'utilisation « Payer une réservation »", "49"],
          ["Tableau 5.3", "Description textuelle — Cas d'utilisation « Valider le check-in (QR) »", "50"],
          ["Tableau 6.1", "Backlog du Sprint 4", "56"],
          ["Tableau 6.2", "Description textuelle — Cas d'utilisation « Envoyer un message »", "58"],
          ["Tableau 6.3", "Description textuelle — Cas d'utilisation « Déposer un avis »", "59"],
          ["Tableau 7.1", "Backlog du Sprint 5", "66"],
          ["Tableau 7.2", "Description textuelle — Cas d'utilisation « Approuver une vérification KYC »", "68"],
          ["Tableau 7.3", "Description textuelle — Cas d'utilisation « Modérer une annonce »", "69"],
        ].map(([ref, cap, pg]) => new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: 9026, leader: TabStopType.DOT }],
          spacing: { after: 100 },
          children: [
            new TextRun({ text: ref, font: "Times New Roman", size: 22, bold: true, color: GREY }),
            new TextRun({ text: " – " + cap, font: "Times New Roman", size: 22, color: GREY }),
            new TextRun({ text: "\t" + pg, font: "Times New Roman", size: 22, color: GREY })
          ]
        })),
        new Paragraph({ children: [new PageBreak()] }),

        // ── LISTE DES ABRÉVIATIONS ────────────────────────────────────
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 280 },
          children: [new TextRun({ text: "Liste des abréviations", font: "Times New Roman", size: 32, bold: true, color: BLUE })] }),
        hr(), sp(8),
        new Table({
          width: { size: 9026, type: WidthType.DXA }, columnWidths: [2000, 7026],
          rows: [
            new TableRow({ children: [ hc("Abréviation", 2000), hc("Signification", 7026) ] }),
            ...([
              ["API",    "Application Programming Interface"],
              ["CORS",   "Cross-Origin Resource Sharing"],
              ["CRUD",   "Create, Read, Update, Delete"],
              ["DTO",    "Data Transfer Object"],
              ["HTTP",   "HyperText Transfer Protocol"],
              ["JWT",    "JSON Web Token"],
              ["KYC",    "Know Your Customer — Vérification d'identité"],
              ["MVC",    "Modèle-Vue-Contrôleur"],
              ["MVP",    "Minimum Viable Product"],
              ["NoSQL",  "Not Only SQL"],
              ["OTP",    "One-Time Password — Mot de passe à usage unique"],
              ["RBAC",   "Role-Based Access Control — Contrôle d'accès par rôles"],
              ["REST",   "Representational State Transfer"],
              ["SPA",    "Single-Page Application"],
              ["SMTP",   "Simple Mail Transfer Protocol"],
              ["STOMP",  "Simple Text Oriented Messaging Protocol"],
              ["UML",    "Unified Modeling Language"],
              ["URI",    "Uniform Resource Identifier"],
              ["UUID",   "Universally Unique Identifier"],
              ["WS",     "WebSocket"],
              ["QR",     "Quick Response (Code-barres 2D)"],
            ]).map(([a, f]) => new TableRow({ children: [ dc(a, 2000), dc(f, 7026) ] }))
          ]
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // ── SOMMAIRE (TOC) ────────────────────────────────────────────
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 280 },
          children: [new TextRun({ text: "Table des matières", font: "Times New Roman", size: 32, bold: true, color: BLUE })] }),
        hr(), sp(4),
        new TableOfContents("Table des matières", {
          hyperlink: true,
          headingStyleRange: "1-3",
          stylesWithLevels: [
            { styleName: "Heading1", level: 1 },
            { styleName: "Heading2", level: 2 },
            { styleName: "Heading3", level: 3 }
          ]
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // ══════════════════════════════════════════════════════════════
        //  INTRODUCTION GÉNÉRALE
        // ══════════════════════════════════════════════════════════════
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 280 },
          children: [new TextRun({ text: "Introduction Générale", font: "Times New Roman", size: 32, bold: true, color: BLUE })] }),
        hr(BLUE), sp(6),
        body("La transformation numérique redéfinit en profondeur les pratiques quotidiennes dans de nombreux secteurs, notamment celui de l'immobilier locatif. En Tunisie, la recherche d'un logement à louer reste aujourd'hui un processus largement informel, peu transparent et potentiellement risqué pour toutes les parties impliquées. Les annonces dispersées sur les réseaux sociaux, l'absence de vérification d'identité des parties, le manque de mécanismes de paiement sécurisés et l'inexistence d'un cadre de communication structuré entre locataires et propriétaires constituent autant de lacunes qui nuisent à la confiance et à l'efficacité du marché."),
        body("Face à ce constat, la problématique centrale de ce travail est la suivante : comment concevoir une plateforme numérique qui réponde aux besoins réels du marché locatif tunisien, en garantissant la sécurité des transactions, la vérification des identités, la fluidité des échanges et la transparence du processus de réservation ?"),
        body("C'est dans ce contexte que s'inscrit le projet Maskan, une plateforme web full-stack de location immobilière sécurisée, conçue spécifiquement pour le marché tunisien. Maskan ambitionne de digitaliser et de sécuriser l'ensemble du cycle locatif, depuis la découverte du bien jusqu'à la remise des clés, en intégrant la vérification KYC des utilisateurs, la réservation en ligne, un mécanisme de paiement avec escrow QR, et la messagerie temps réel."),
        body("Ce projet, développé dans le cadre du Projet de Fin d'Études pour l'obtention du diplôme de Licence en Sciences de l'Informatique à l'ISLAIB, s'appuie sur les technologies React 18 et Spring Boot 3.2 avec MongoDB comme système de persistance. La méthodologie Agile Scrum a guidé l'organisation itérative du développement sur cinq sprints."),
        body("Ce rapport s'articule autour de sept chapitres. Le premier pose le cadre général du projet et justifie les choix méthodologiques. Le second (Sprint 0) définit les besoins, l'architecture et la planification. Les chapitres 3 à 7 décrivent chacun un sprint de développement en exposant le backlog, les cas d'utilisation, les diagrammes de séquence et les interfaces réalisées."),
        new Paragraph({ children: [new PageBreak()] }),

        // ══════════════════════════════════════════════════════════════
        //  CHAPITRE 1 : CADRE GÉNÉRAL
        // ══════════════════════════════════════════════════════════════
        ...chap("1", "Cadre général du projet"),
        intro("Ce chapitre présente le cadre organisationnel du projet, analyse le marché locatif numérique tunisien et ses lacunes, expose la solution Maskan et justifie les choix méthodologiques et technologiques retenus."),
        sp(6),

        sec("1.1  Introduction"),
        body("Le marché immobilier locatif tunisien est caractérisé par une forte demande, notamment dans les grandes agglomérations (Tunis, Sfax, Sousse, Hammamet, La Marsa), et par un déficit numérique significatif. Les interactions entre propriétaires et locataires reposent encore majoritairement sur des canaux informels, sans garantie de sécurité ni traçabilité. Le projet Maskan s'inscrit dans une démarche de digitalisation responsable de ce secteur, en proposant une marketplace sécurisée et adaptée aux spécificités du marché local."),

        sec("1.2  Contexte du projet"),
        body("Le développement du numérique en Tunisie s'accélère avec un taux de pénétration d'Internet dépassant 70% en 2024. Le secteur de l'immobilier locatif représente un volume de transactions important, mais souffre d'une absence de standardisation et de sécurisation des processus. L'essor des smartphones et l'adoption croissante des services en ligne créent une opportunité réelle pour une plateforme comme Maskan, capable de fluidifier et de sécuriser les relations entre propriétaires et locataires via une interface digitale intuitive."),
        body("Ce projet a été réalisé dans le cadre du stage de fin d'études à l'ISLAIB, offrant l'opportunité d'appliquer les compétences acquises en développement logiciel à un problème concret du marché tunisien."),
        ...fig("1.1", "Logo de l'organisme d'accueil"),

        sec("1.3  Étude de l'existant"),
        tCap("1.1", "Analyse comparative des plateformes de location existantes"),
        new Table({
          width: { size: 9026, type: WidthType.DXA }, columnWidths: [2000, 2500, 2263, 2263],
          rows: [
            new TableRow({ children: [ hc("Plateforme", 2000), hc("Avantages", 2500), hc("Inconvénients", 2263), hc("Lacunes clés", 2263) ] }),
            new TableRow({ children: [ dc("Airbnb (international)", 2000), dc("UX avancée, paiement intégré, KYC partiel", 2500), dc("Non adapté au marché tunisien, frais élevés, pas de support cash", 2263), dc("Localisation TN, cash, OTP +216", 2263) ] }),
            new TableRow({ children: [ dc("Annonces.tn / Taylor", 2000), dc("Couverture nationale, gratuit, simple", 2500), dc("Aucune vérification, pas de réservation, arnaques fréquentes", 2263), dc("KYC, paiement, messagerie sécurisée", 2263) ] }),
            new TableRow({ children: [ dc("Facebook Marketplace", 2000), dc("Très large audience, gratuit", 2500), dc("Aucune sécurité, informel, pas de suivi", 2263), dc("Tous les modules de confiance", 2263) ] }),
            new TableRow({ children: [ dc("Jumia House TN", 2000), dc("Annonces professionnelles, filtres de base", 2500), dc("Pas de réservation ni de messagerie intégrée", 2263), dc("Workflow de réservation, chat", 2263) ] }),
          ]
        }),
        sp(4),

        sub("1.3.1  Critique de l'existant"),
        body("L'analyse des solutions existantes met en évidence plusieurs lacunes communes : l'absence totale de vérification d'identité (KYC) pour les propriétaires et les locataires, rendant impossible la lutte contre les arnaques ; l'inexistence d'un mécanisme de réservation sécurisé avec gestion d'état et traçabilité ; l'absence de messagerie intégrée entre les parties ; l'absence de système de check-in sécurisé garantissant la remise effective des clés ; et le manque d'adaptation aux spécificités locales (paiement cash, numéros tunisiens +216, villes tunisiennes géolocalisées). Ces lacunes génèrent un climat de méfiance et constituent un frein majeur à la digitalisation du secteur locatif tunisien."),

        sec("1.4  Problématique"),
        body("Comment concevoir et développer une plateforme web de location immobilière sécurisée, adaptée au marché tunisien, qui intègre une vérification d'identité fiable des utilisateurs, un workflow de réservation transparent, un mécanisme de paiement sécurisé avec garantie de remise des clés, et des outils de communication en temps réel, afin d'établir un environnement de confiance entre propriétaires et locataires ?"),

        sec("1.5  Solution proposée : Plateforme Maskan"),
        body("Maskan répond aux lacunes identifiées en articulant sa proposition de valeur autour de six piliers fondamentaux :"),
        bul("Vérification d'identité (KYC) : email OTP (15 min d'expiration) + upload de documents officiels, validé par un administrateur avant toute promotion au rôle Host."),
        bul("Workflow de réservation sécurisé : machine à états formalisée (PENDING → CONFIRMED → AWAITING_PAYMENT → PAID_AWAITING_CHECKIN → COMPLETED / CANCELLED / REJECTED)."),
        bul("Mécanisme d'escrow QR : le paiement est retenu jusqu'à la validation physique du check-in par présentation et scan du QR code unique généré post-paiement."),
        bul("Messagerie temps réel : WebSocket STOMP, sessions authentifiées par JWT, messages persistés en MongoDB pour l'historique."),
        bul("Notifications multicanales : notifications internes (4 types : BOOKING, KYC, PAYMENT, SYSTEM) + emails HTML asynchrones (@Async Spring Mail)."),
        bul("Administration complète : back-office de modération des utilisateurs, des annonces, des vérifications KYC, des rapports, des finances et des tickets de support."),

        sec("1.6  Choix méthodologiques et technologiques"),
        sub("1.6.1  Méthodologie de développement (Agile Scrum)"),
        body("Face à la complexité et à l'étendue fonctionnelle du projet Maskan, le framework Agile Scrum a été retenu comme méthodologie de développement. Scrum structure le travail en sprints courts (deux à trois semaines), permettant des livraisons incrémentales, une adaptation continue aux retours, et une maîtrise des risques par réduction progressive des incertitudes."),
        tCap("1.2", "Comparatif méthodes agiles vs méthodes classiques"),
        new Table({
          width: { size: 9026, type: WidthType.DXA }, columnWidths: [2500, 3263, 3263],
          rows: [
            new TableRow({ children: [ hc("Critère", 2500), hc("Méthodes classiques (Waterfall)", 3263), hc("Méthodes agiles (Scrum)", 3263) ] }),
            new TableRow({ children: [ dc("Planification", 2500), dc("Complète et rigide en amont", 3263), dc("Adaptative, par itérations courtes", 3263) ] }),
            new TableRow({ children: [ dc("Flexibilité", 2500), dc("Faible — changements très coûteux", 3263), dc("Élevée — feedback intégré en continu", 3263) ] }),
            new TableRow({ children: [ dc("Livraisons", 2500), dc("Unique, en fin de projet", 3263), dc("Incrémentales, à chaque sprint", 3263) ] }),
            new TableRow({ children: [ dc("Convient à", 2500), dc("Projets aux exigences très stables", 3263), dc("Projets innovants à périmètre évolutif", 3263) ] }),
          ]
        }),
        sp(4),
        ...fig("1.2", "Le framework Scrum — cycle itératif Sprint Planning / Daily Scrum / Sprint Review / Retrospective"),
        ...fig("1.3", "L'équipe Scrum : Product Owner, Scrum Master, équipe de développement"),

        sub("1.6.2  Langage de modélisation (UML)"),
        body("Le langage de modélisation UML (Unified Modeling Language) a été retenu pour documenter et communiquer l'architecture et les comportements du système. Trois types de diagrammes UML sont utilisés dans ce rapport : les diagrammes de cas d'utilisation (pour formaliser les interactions acteurs-système), les diagrammes de classes d'analyse (pour modéliser les entités et leurs relations), et les diagrammes de séquence (pour décrire les flux dynamiques d'interactions entre les couches de l'application)."),

        sec("1.7  Conclusion"),
        concl("Ce chapitre a posé le cadre général du projet Maskan : analyse du marché locatif tunisien et de ses lacunes, définition de la problématique, présentation de la solution et justification des choix méthodologiques (Scrum) et de modélisation (UML). Ces fondements préparent l'analyse détaillée des besoins et l'architecture du système développée dans le chapitre suivant (Sprint 0)."),

        // ══════════════════════════════════════════════════════════════
        //  CHAPITRE 2 : SPRINT 0
        // ══════════════════════════════════════════════════════════════
        ...chap("2", "Sprint 0 (Phase de Préparation)"),
        intro("Ce chapitre couvre la phase de préparation : spécification des besoins, modélisation du contexte global, définition de l'architecture et planification des cinq sprints de développement."),
        sp(6),

        sec("2.1  Introduction"),
        body("Le Sprint 0 est la phase fondatrice du projet. Sans produire de fonctionnalités livrables, il établit toutes les bases nécessaires au développement : identification des acteurs et de leurs besoins, modélisation du domaine métier, choix architecturaux, sélection des technologies et planification détaillée. Cette rigueur préparatoire est essentielle pour garantir la cohérence et la qualité des développements ultérieurs."),

        sec("2.2  Spécification des besoins"),
        sub("2.2.1  Identification des acteurs"),
        body("Le système Maskan implique quatre acteurs principaux dont les rôles sont clairement définis :"),
        bul("Guest (Locataire) : utilisateur recherchant, réservant et payant des logements. Accès après inscription. Peut devenir Host après vérification KYC."),
        bul("Host (Propriétaire) : utilisateur publiant et gérant ses annonces. Accès conditionné à l'approbation KYC par l'Admin. Valide les check-ins."),
        bul("Admin : gestionnaire global de la plateforme. Accès total à la modération, aux vérifications, aux finances et aux paramètres système. Compte créé par seed."),
        bul("Système : acteur implicite gérant les traitements automatisés (JWT, notifications asynchrones, génération QR, calcul des agrégats)."),

        sub("2.2.2  Besoins fonctionnels"),
        body("Les besoins fonctionnels décrivent l'ensemble des actions que le système doit permettre à chaque acteur d'accomplir :"),
        bul("Gestion des comptes : inscription, connexion JWT, récupération de mot de passe, gestion du profil (avatar, bio, préférences), wishlist."),
        bul("Vérification KYC : OTP email (expiration 15 min), upload documents officiels + selfie, workflow d'approbation/rejet admin avec notification."),
        bul("Gestion des annonces : CRUD complet pour les Hosts, upload de photos, sélection GPS via carte interactive MapLibre, approbation admin optionnelle."),
        bul("Recherche et découverte : recherche simple et avancée (filtres localisation, prix, type, chambres, disponibilité), carte interactive, détail annonce."),
        bul("Réservation sécurisée : pipeline d'états (PENDING→CONFIRMED→AWAITING_PAYMENT→PAID_AWAITING_CHECKIN→COMPLETED), calcul prix automatique."),
        bul("Paiement et escrow QR : checkout CARD/CASH, simulation d'intent, génération checkInSecretCode UUID, validation physique Host→COMPLETED."),
        bul("Messagerie temps réel : WebSocket STOMP, persistance MongoDB, autorisation conditionnelle (relation booking ou connexion acceptée)."),
        bul("Avis et notation : création d'avis (guard: booking COMPLETED), mise à jour agrégats Property (averageRating, reviewCount)."),
        bul("Notifications : internes (4 types), emails HTML asynchrones (6 templates), marquage lu/non-lu."),
        bul("Administration : gestion utilisateurs, modération annonces/messages, validation KYC, rapports, finance, analytics, tickets support, CMS, paramètres."),

        sub("2.2.3  Besoins non fonctionnels"),
        body("Les contraintes de qualité que le système doit respecter sont les suivantes :"),
        bul("Sécurité : JWT stateless, RBAC @PreAuthorize, BCrypt pour les mots de passe, CORS configuré, validation Jakarta des DTOs, blocage des utilisateurs bannis."),
        bul("Performance : index MongoDB sur les champs de recherche fréquents, dénormalisation des agrégats de notation, lazy loading React, mémoïsation composants."),
        bul("Fiabilité : GlobalExceptionHandler pour des réponses HTTP cohérentes, gestion des erreurs avec codes HTTP sémantiques (400/401/403/404/500)."),
        bul("Maintenabilité : architecture en couches (Controller→Service→Repository), séparation DTOs/entités, code documenté avec Javadoc."),
        bul("Scalabilité : architecture stateless facilitant l'ajout de nœuds, stockage fichiers extensible vers S3, WebSocket découplé du flux REST."),
        bul("Accessibilité : interface responsive Tailwind CSS, support desktop et mobile, animations Framer Motion pour l'UX."),

        sec("2.3  Modélisation du contexte global"),
        sub("2.3.1  Diagramme de cas d'utilisation général"),
        ...fig("2.1", "Diagramme de cas d'utilisation général — acteurs Guest, Host, Admin et Système"),
        body("Le diagramme ci-dessus représente l'ensemble des fonctionnalités du système regroupées par acteur. Le Guest accède à la recherche, à la réservation, au paiement et à la messagerie. Le Host gère ses annonces, accepte/rejette les réservations et valide les check-ins. L'Admin supervise l'ensemble de la plateforme. Le Système assure les traitements automatisés."),

        sub("2.3.2  Diagramme de classes d'analyse"),
        ...fig("2.2", "Diagramme de classes d'analyse — entités MongoDB : User, Property, Booking, Message, Review, Notification, HostVerification, EmailVerificationToken"),
        body("Le diagramme de classes illustre les huit collections MongoDB principales et leurs relations. L'entité User est centrale : un Host possède plusieurs Property (via hostId), un Guest possède plusieurs Booking (via guestId). Un Booking référence une Property et un User. Un Review appartient à une Property et à un User. Un Message lie deux Users. Une Notification appartient à un User. Une HostVerification est associée à un User."),

        sec("2.4  Architecture du système"),
        sub("2.4.1  Architecture logicielle (Modèle MVC)"),
        ...fig("2.3", "Architecture logicielle MVC — Spring Boot : Controller (REST) → Service (métier) → Repository (MongoDB)"),
        body("Le backend Maskan adopte une architecture en couches conforme au pattern MVC enrichi. Les Controllers exposent les endpoints REST (/api/**) et délèguent le traitement aux Services. Les Services concentrent la logique métier, la validation et l'orchestration des workflows. Les Repositories (Spring Data MongoDB) assurent l'accès à la base de données. Les DTOs assurent la séparation entre le modèle de transport API et le modèle de persistance. Les couches transversales (Security, Exception, Config) opèrent de manière orthogonale à toutes les couches."),

        sub("2.4.2  Architecture physique"),
        ...fig("2.4", "Architecture physique three-tier : Navigateur (SPA React) ↔ Serveur (Spring Boot) ↔ Base de données (MongoDB)"),
        body("L'architecture physique de Maskan suit un modèle three-tier classique. Le tier présentation est une SPA React déployée sur un serveur statique (Vite build). Le tier applicatif est un serveur Spring Boot exposant des API REST et des endpoints WebSocket. Le tier persistance est une instance MongoDB hébergeant les huit collections de la plateforme. La communication frontend-backend passe par HTTP/REST pour les opérations standard et par WebSocket/STOMP pour la messagerie temps réel. L'authentification est gérée par un token JWT transmis dans l'en-tête Authorization."),

        sec("2.5  Environnement de travail"),
        sub("2.5.1  Environnement matériel"),
        tCap("2.2", "Environnement matériel"),
        new Table({
          width: { size: 6000, type: WidthType.DXA }, columnWidths: [2500, 3500],
          rows: [
            new TableRow({ children: [ hc("Composant", 2500), hc("Spécification", 3500) ] }),
            ...([["Système d'exploitation","Windows 11 / Ubuntu 22.04 LTS"],["Processeur","Intel Core i5 11ème génération ou équivalent"],["RAM","16 Go DDR4"],["Stockage","512 Go SSD NVMe"],["Réseau","Connexion haut débit (développement local)"]]).map(r => new TableRow({ children: [ dc(r[0], 2500), dc(r[1], 3500) ] }))
          ]
        }),
        sp(6),

        sub("2.5.2  Environnement logiciel et technologies"),
        body("La pile technologique de Maskan (désignée par l'acronyme ReSB — React, Spring Boot, MongoDB) a été sélectionnée pour sa robustesse, sa maturité et sa complémentarité. Contrairement au stack MERN (MongoDB, Express, React, Node.js), Maskan opte pour Spring Boot comme backend, offrant une sécurité applicative de niveau entreprise (Spring Security), une validation robuste (Jakarta Validation) et un écosystème mature pour les API REST et WebSocket."),
        tCap("2.3", "Stack technologique complète de Maskan"),
        new Table({
          width: { size: 9026, type: WidthType.DXA }, columnWidths: [1800, 2500, 4726],
          rows: [
            new TableRow({ children: [ hc("Catégorie", 1800), hc("Technologie / Version", 2500), hc("Rôle dans Maskan", 4726) ] }),
            ...([
              ["Frontend","React 18 + Vite 5","SPA, routing React Router, rendu composants, build optimisé HMR"],
              ["Frontend","Tailwind CSS 3","Design system utility-first, responsive, dark mode"],
              ["Frontend","Framer Motion","Animations page, transitions composants, micro-interactions"],
              ["Frontend","Axios","Client HTTP avec intercepteur JWT automatique et gestion erreurs"],
              ["Frontend","MapLibre GL + react-map-gl","Carte interactive, sélection coordonnées GPS par clic/drag"],
              ["Frontend","qrcode.react","Génération et affichage QR code check-in côté Guest"],
              ["Frontend","@yudiel/react-qr-scanner","Scan QR code check-in côté Host"],
              ["Backend","Java 17 + Spring Boot 3.2","Serveur applicatif, API REST, orchestration logique métier"],
              ["Backend","Spring Security + JJWT","Auth stateless JWT, RBAC @PreAuthorize, filtre JwtAuthFilter"],
              ["Backend","Spring Data MongoDB","Repositories, requêtes dérivées, accès collections"],
              ["Backend","Spring WebSocket (STOMP)","Messagerie temps réel bidirectionnelle, auth JWT socket"],
              ["Backend","Spring Mail + @Async","Emails HTML non-bloquants, thread pool asynchrone"],
              ["Backend","Jakarta Validation","Validation DTOs : @NotBlank, @Email, @Min, @Max"],
              ["BDD","MongoDB","8 collections documents JSON, index composites, agrégats"],
              ["Outils","IntelliJ IDEA","IDE Java / Spring Boot"],
              ["Outils","VS Code","IDE JavaScript / React / TypeScript"],
              ["Outils","Postman","Tests endpoints REST, collections d'API"],
              ["Outils","Git + GitHub","Versioning, branches feature, pull requests"],
              ["Outils","Draw.io","Modélisation UML (use cases, séquences, classes)"],
              ["Outils","Maven (mvnw)","Build Java, gestion dépendances, packaging JAR"],
            ]).map(r => new TableRow({ children: [ dc(r[0], 1800), dc(r[1], 2500), dc(r[2], 4726) ] }))
          ]
        }),

        sec("2.6  Planification du projet"),
        sub("2.6.1  Le Backlog Produit"),
        body("Le Product Backlog liste l'ensemble des User Stories priorisées du projet Maskan. Chaque story est associée à un Epic, une priorité (Élevée / Moyenne / Faible) et une estimation en points de complexité."),
        tCap("2.4", "Product Backlog Maskan"),
        new Table({
          width: { size: 9026, type: WidthType.DXA }, columnWidths: [500, 1600, 4626, 1000, 1300],
          rows: [
            new TableRow({ children: [ hc("ID", 500), hc("Epic", 1600), hc("User Story", 4626), hc("Priorité", 1000), hc("Points", 1300) ] }),
            ...([
              ["1","Auth","En tant qu'utilisateur, je peux m'inscrire et me connecter avec un JWT.","Élevée","5"],
              ["2","Profil","En tant qu'utilisateur, je peux gérer mon profil, avatar et préférences.","Élevée","3"],
              ["3","KYC","En tant que Guest, je peux vérifier mon email via OTP pour valider mon compte.","Élevée","3"],
              ["4","KYC","En tant que Guest, je peux soumettre mes documents pour devenir Host.","Élevée","5"],
              ["5","Annonces","En tant que Host, je peux créer/modifier/supprimer mes annonces avec photos et GPS.","Élevée","8"],
              ["6","Annonces","En tant que Guest, je peux rechercher des biens avec filtres avancés.","Élevée","5"],
              ["7","Réservation","En tant que Guest, je peux réserver un bien et suivre l'état de ma réservation.","Élevée","8"],
              ["8","Réservation","En tant que Host, je peux confirmer ou rejeter les demandes de réservation.","Élevée","3"],
              ["9","Paiement","En tant que Guest, je peux payer ma réservation (CARD/CASH) et recevoir un QR code.","Élevée","8"],
              ["10","Paiement","En tant que Host, je peux valider le check-in via le QR code du Guest.","Élevée","5"],
              ["11","Messagerie","En tant qu'utilisateur, je peux envoyer/recevoir des messages en temps réel.","Moyenne","8"],
              ["12","Notifications","En tant qu'utilisateur, je reçois des notifications internes et par email.","Moyenne","5"],
              ["13","Avis","En tant que Guest, je peux laisser un avis sur un bien après séjour complété.","Moyenne","3"],
              ["14","Wishlist","En tant que Guest, je peux ajouter des biens à ma liste de favoris.","Faible","2"],
              ["15","Admin","En tant qu'Admin, je peux gérer les utilisateurs et leurs accès.","Élevée","5"],
              ["16","Admin","En tant qu'Admin, je peux valider les demandes de vérification KYC.","Élevée","3"],
              ["17","Admin","En tant qu'Admin, je peux modérer les annonces et les rapports.","Moyenne","5"],
            ]).map(r => new TableRow({ children: [ dc(r[0],500), dc(r[1],1600), dc(r[2],4626), dc(r[3],1000), dc(r[4],1300) ] }))
          ]
        }),
        sp(6),

        sub("2.6.2  Planification des sprints"),
        ...fig("2.5", "Diagramme de Gantt — Planification des cinq sprints (Sprint 0 à Sprint 5)"),
        tCap("2.5", "Structure et objectifs des cinq sprints"),
        new Table({
          width: { size: 9026, type: WidthType.DXA }, columnWidths: [1800, 3613, 3613],
          rows: [
            new TableRow({ children: [ hc("Sprint", 1800), hc("Objectifs", 3613), hc("Livrables", 3613) ] }),
            ...([
              ["Sprint 0\nPréparation","Analyse besoins, architecture, backlog, planification","Document d'analyse, diagrammes UML, env. configuré"],
              ["Sprint 1\nAuth & Profils","Inscription, connexion JWT, profils, vérification OTP email","Modules Auth, Profil, KYC email opérationnels"],
              ["Sprint 2\nAnnonces & Réservations","CRUD annonces GPS, recherche avancée, workflow réservation","Modules Listings, Search, Booking fonctionnels"],
              ["Sprint 3\nPaiements & QR","Checkout CARD/CASH, génération QR, validation check-in","Module Payment + CheckIn Escrow opérationnel"],
              ["Sprint 4\nNotifications & Avis","WebSocket messagerie, notifications email, système d'avis","Modules Messaging, Notifications, Reviews"],
              ["Sprint 5\nAdministration","Back-office complet, KYC admin, modération, analytics","Back-office Admin complet, tableaux de bord"],
            ]).map(r => new TableRow({ children: [ dc(r[0],1800), dc(r[1],3613), dc(r[2],3613) ] }))
          ]
        }),

        sec("2.7  Conclusion"),
        concl("Ce chapitre a établi les fondations du projet Maskan : acteurs et besoins identifiés, système modélisé en UML, architecture définie (MVC three-tier), stack technologique sélectionnée et cinq sprints planifiés. Ces bases solides garantissent une progression cohérente et maîtrisée du développement. Les chapitres suivants décrivent la réalisation de chaque sprint."),

        // ══════════════════════════════════════════════════════════════
        //  CHAPITRE 3 : SPRINT 1 — AUTH & PROFILS
        // ══════════════════════════════════════════════════════════════
        ...chap("3", "Étude et Réalisation du Sprint 1 (Authentification et Gestion des Profils)"),
        intro("Ce chapitre présente la réalisation du Sprint 1 : inscription, connexion JWT, gestion des profils utilisateurs et vérification email KYC par OTP."),
        sp(6),

        sec("3.1  Introduction"),
        body("Le Sprint 1 établit le socle identitaire de Maskan. Sans authentification sécurisée et gestion des profils, aucune fonctionnalité de la plateforme ne peut être construite de manière fiable. Ce sprint livre les mécanismes d'inscription, de connexion avec génération de JWT, de gestion du profil utilisateur et la première étape du processus KYC : la vérification de l'adresse email par OTP."),

        sec("3.2  Backlog du Sprint 1"),
        tCap("3.1", "Backlog du Sprint 1"),
        new Table({
          width: { size: 9026, type: WidthType.DXA }, columnWidths: [3200, 4326, 1500],
          rows: [
            new TableRow({ children: [ hc("User Story", 3200), hc("Tâches principales", 4326), hc("Estimation (j)", 1500) ] }),
            ...([
              ["En tant qu'utilisateur, je m'inscris sur la plateforme.", "Créer entité User + DTO RegisterRequest, API POST /auth/register, hashage BCrypt, validation Jakarta", "2"],
              ["En tant qu'utilisateur, je me connecte et obtiens un JWT.", "API POST /auth/login, JwtService (génération + validation), CustomUserDetailsService, intercepteur Axios", "2"],
              ["En tant qu'utilisateur, je gère mon profil.", "API GET/PUT /users/me, formulaire React profil, upload avatar (POST /uploads/images), préférences JSON", "3"],
              ["En tant que Guest, je vérifie mon email par OTP.", "Entité EmailVerificationToken, API /verifications/email/send-otp et /verify-otp, email HTML template", "3"],
              ["En tant qu'Admin, j'approuve/rejette la vérification identité.", "API /admin/guest-verifications/{id}/approve|reject, promotion rôle GUEST→HOST, notification", "2"],
            ]).map(r => new TableRow({ children: [ dc(r[0],3200), dc(r[1],4326), dc(r[2],1500) ] }))
          ]
        }),

        sec("3.3  Analyse et spécification des besoins"),
        sub("3.3.1  Diagramme de cas d'utilisation détaillé"),
        ...fig("3.1", "Diagramme de cas d'utilisation raffiné Sprint 1 — S'inscrire, Se connecter, Gérer profil, Vérifier email OTP"),

        sub("3.3.2  Description textuelle des cas d'utilisation"),
        sub2("Cas d'utilisation : S'inscrire"),
        tCap("3.2", "Description textuelle — S'inscrire"),
        ucTable([
          ["Cas d'utilisation","S'inscrire sur la plateforme"],
          ["Acteur principal","Tout visiteur non authentifié"],
          ["Objectif","Créer un compte utilisateur (rôle GUEST) pour accéder aux fonctionnalités de la plateforme."],
          ["Pré-conditions","L'adresse email n'est pas déjà utilisée. Tous les champs obligatoires sont renseignés."],
          ["Post-conditions","Compte créé avec mot de passe hashé BCrypt. Rôle = GUEST. JWT retourné. Redirection vers le dashboard."],
          ["Scénario de base","1. L'utilisateur accède à la page d'inscription.\n2. Saisit nom, email, mot de passe.\n3. Frontend appelle POST /api/auth/register.\n4. Backend vérifie l'unicité de l'email.\n5. Mot de passe hashé BCrypt.\n6. Utilisateur sauvegardé en MongoDB avec rôle GUEST.\n7. JWT généré et retourné.\n8. Frontend stocke le token, redirige vers le dashboard."],
          ["Scénario d'exception","Email déjà utilisé → 400 \"Email already in use\". Champs invalides → 400 avec détail de validation."],
        ]),
        sp(4),

        sub2("Cas d'utilisation : Se connecter"),
        tCap("3.3", "Description textuelle — Se connecter"),
        ucTable([
          ["Cas d'utilisation","Se connecter à la plateforme"],
          ["Acteur principal","Utilisateur inscrit"],
          ["Objectif","Obtenir un JWT valide pour accéder aux fonctionnalités authentifiées."],
          ["Pré-conditions","Le compte existe et n'est pas banni."],
          ["Post-conditions","JWT retourné, stocké dans localStorage. Session stateless établie côté frontend."],
          ["Scénario de base","1. Saisie email + mot de passe.\n2. POST /api/auth/login.\n3. Backend charge l'utilisateur par email (CustomUserDetailsService).\n4. Vérification BCrypt du mot de passe.\n5. Vérification statut non banni.\n6. JWT signé généré (expiration configurable).\n7. Retour {token, user} au frontend."],
          ["Scénario d'exception","Identifiants incorrects → 401. Compte banni → 403 \"Account banned\"."],
        ]),
        sp(4),

        sub2("Cas d'utilisation : Vérifier son email (OTP)"),
        tCap("3.4", "Description textuelle — Vérification email OTP"),
        ucTable([
          ["Cas d'utilisation","Vérifier son adresse email par OTP"],
          ["Acteur principal","Guest authentifié"],
          ["Objectif","Confirmer la possession de l'adresse email pour augmenter le niveau de vérification KYC."],
          ["Pré-conditions","Utilisateur authentifié, email non encore vérifié."],
          ["Post-conditions","emailVerified = true. verificationLevel incrémenté. Accès étendu aux fonctionnalités."],
          ["Scénario de base","1. Guest demande l'OTP via POST /api/verifications/email/send-otp.\n2. Backend génère un OTP numérique, le stocke comme String (préservation des zéros initiaux) avec expiration 15 min.\n3. Email HTML avec OTP envoyé via Spring Mail.\n4. Guest saisit l'OTP reçu et soumet POST /api/verifications/email/verify-otp.\n5. Backend valide le code et l'expiration.\n6. emailVerified = true, verificationLevel mis à jour."],
          ["Scénario d'exception","OTP expiré → 400 \"OTP expired\". Code incorrect → 400 \"Invalid OTP\"."],
        ]),

        sec("3.4  Conception dynamique"),
        sub("3.4.1  Diagrammes de séquence"),
        ...fig("3.2", "Diagramme de séquence — S'inscrire : Utilisateur → Frontend → AuthController → UserService → MongoDB"),
        ...fig("3.3", "Diagramme de séquence — Se connecter : Utilisateur → Frontend → AuthController → JwtService → JWT retourné"),
        ...fig("3.4", "Diagramme de séquence — Vérification OTP email : Guest → EmailVerificationController → Spring Mail → verify → User.emailVerified"),

        sec("3.5  Réalisation"),
        sub("3.5.1  Interfaces développées"),
        ...fig("3.5", "Interfaces Sprint 1 : Page Connexion / Page Inscription / Page Profil utilisateur (avatar, bio, préférences)"),
        body("La page de connexion propose un formulaire épuré avec validation côté client (email valide, mot de passe ≥ 8 caractères). La création de compte permet la saisie des informations de base avec confirmation du mot de passe. La page de profil offre une interface complète : upload d'avatar, édition de la biographie, gestion des préférences (langue, devise) et des paramètres de confidentialité. Un indicateur de niveau de vérification KYC (0 à 3) guide l'utilisateur dans les étapes de validation."),
        ...fig("3.6", "Interface Sprint 1 : Page de vérification KYC — Étape 1 (email OTP) avec indicateur de progression"),
        body("La page KYC guide l'utilisateur en étapes progressives. L'étape 1 (vérification email) affiche un formulaire de saisie du code OTP reçu par email, avec un compteur de validité de 15 minutes et un bouton de renvoi. Le code est stocké et comparé comme chaîne de caractères pour éviter toute troncature des zéros initiaux."),

        sec("3.6  Conclusion"),
        concl("Le Sprint 1 a livré les fondations identitaires de Maskan : authentification JWT stateless et sécurisée, gestion complète des profils utilisateurs et première étape du processus KYC (vérification email OTP). Ces modules constituent la base sur laquelle tous les autres sprints s'appuient pour contrôler l'accès aux fonctionnalités."),

        // ══════════════════════════════════════════════════════════════
        //  CHAPITRE 4 : SPRINT 2 — ANNONCES & RÉSERVATIONS
        // ══════════════════════════════════════════════════════════════
        ...chap("4", "Étude et Réalisation du Sprint 2 (Gestion des Annonces et Réservations)"),
        intro("Ce chapitre présente la réalisation du Sprint 2 : publication et gestion des annonces géolocalisées par les hôtes, moteur de recherche avancé et workflow complet de réservation."),
        sp(6),

        sec("4.1  Introduction"),
        body("Le Sprint 2 constitue le cœur du marketplace de Maskan. Il livre deux fonctionnalités centrales : la gestion des annonces immobilières (publication avec géolocalisation GPS, photos et informations détaillées) et le système de réservation (pipeline d'états formalisé de PENDING à CONFIRMED). Ces deux modules doivent fonctionner de manière cohérente et sécurisée, avec des vérifications croisées (disponibilité, chevauchement de dates, propriété des ressources)."),

        sec("4.2  Backlog du Sprint 2"),
        tCap("4.1", "Backlog du Sprint 2"),
        new Table({
          width: { size: 9026, type: WidthType.DXA }, columnWidths: [3200, 4326, 1500],
          rows: [
            new TableRow({ children: [ hc("User Story", 3200), hc("Tâches principales", 4326), hc("Estimation (j)", 1500) ] }),
            ...([
              ["En tant que Host, je crée et gère mes annonces.", "Entité Property, CRUD /listings, upload images (POST /uploads/images), MapLibre GPS capture, validation", "5"],
              ["En tant que Guest, je recherche des biens.", "API /listings/search et /listings/search/advanced (filtres prix, type, dispo), ExploreListings React", "4"],
              ["En tant que Guest, je consulte le détail d'une annonce.", "API GET /listings/{id}, page détail React (galerie, carte, équipements, calendrier dispo, avis)", "3"],
              ["En tant que Guest, je réserve un bien.", "Entité Booking, POST /bookings (validation dates + chevauchement), calcul prix, notification Host", "4"],
              ["En tant que Host, je gère les demandes de réservation.", "PATCH /bookings/{id}/status (CONFIRMED/REJECTED), transition CONFIRMED→AWAITING_PAYMENT", "3"],
              ["En tant que Guest, je gère ma wishlist.", "API /wishlist (GET/POST/DELETE), toggle favoris, WishlistPage React", "2"],
            ]).map(r => new TableRow({ children: [ dc(r[0],3200), dc(r[1],4326), dc(r[2],1500) ] }))
          ]
        }),

        sec("4.3  Analyse et spécification des besoins"),
        sub("4.3.1  Diagramme de cas d'utilisation détaillé"),
        ...fig("4.1", "Diagramme de cas d'utilisation raffiné Sprint 2 — Créer annonce, Rechercher, Réserver, Confirmer/Rejeter"),

        sub("4.3.2  Description textuelle des cas d'utilisation"),
        sub2("Cas d'utilisation : Créer une annonce"),
        tCap("4.2", "Description textuelle — Créer une annonce (Host)"),
        ucTable([
          ["Cas d'utilisation","Créer et publier une annonce immobilière"],
          ["Acteur principal","Host (authentifié, rôle HOST)"],
          ["Objectif","Publier un bien immobilier sur la plateforme pour le rendre visible aux Guests."],
          ["Pré-conditions","Utilisateur authentifié avec rôle HOST. Vérification KYC approuvée par l'Admin."],
          ["Post-conditions","Annonce sauvegardée en MongoDB avec hostId. Images stockées sous uploads/. Annonce visible dans les résultats de recherche."],
          ["Scénario de base","1. Host remplit le formulaire (titre, description, localisation, prix/nuit, type, chambres, salles de bain, superficie, équipements, règlement).\n2. Clique sur la carte MapLibre pour capturer latitude/longitude.\n3. Télécharge jusqu'à 10 photos (POST /api/uploads/images).\n4. Soumet POST /api/listings.\n5. Backend valide et persiste l'entité Property.\n6. Annonce visible sur la page d'exploration."],
          ["Scénario d'exception","Champs obligatoires manquants → 400. Token HOST absent → 403."],
        ]),
        sp(4),

        sub2("Cas d'utilisation : Réserver un bien"),
        tCap("4.3", "Description textuelle — Réserver un bien (Guest)"),
        ucTable([
          ["Cas d'utilisation","Créer une demande de réservation"],
          ["Acteur principal","Guest authentifié"],
          ["Objectif","Réserver un bien pour une période donnée et attendre la confirmation du Host."],
          ["Pré-conditions","Guest authentifié. Bien disponible pour les dates sélectionnées. Pas de réservation active conflictuelle."],
          ["Post-conditions","Réservation créée avec statut PENDING. Prix total calculé (pricePerNight × jours × guests). Notification interne envoyée au Host."],
          ["Scénario de base","1. Guest sélectionne les dates de check-in et check-out.\n2. Saisit le nombre de voyageurs.\n3. POST /api/bookings avec {listingId, checkInDate, checkOutDate, guests}.\n4. Backend valide : checkOut > checkIn, pas de chevauchement (statuts PENDING/CONFIRMED/AWAITING_PAYMENT/PAID_AWAITING_CHECKIN).\n5. totalPrice = pricePerNight × nbJours × guests.\n6. Booking sauvegardé status=PENDING. Notification → Host."],
          ["Scénario d'exception","Dates invalides → 400. Chevauchement → 409. Bien non disponible → 400."],
        ]),

        sec("4.4  Conception dynamique"),
        sub("4.4.1  Diagrammes de séquence"),
        ...fig("4.2", "Diagramme de séquence — Créer une annonce : Host → ListingController → PropertyService → MongoDB + ImageStorage"),
        ...fig("4.3", "Diagramme de séquence — Réserver un bien : Guest → BookingController → BookingServiceImpl (validation dates + overlap) → MongoDB → NotificationService → Host"),

        sec("4.5  Réalisation"),
        sub("4.5.1  Interfaces développées"),
        ...fig("4.4", "Interface Sprint 2 : Page d'exploration des annonces (grille cards + panneau filtres avancés)"),
        body("La page d'exploration affiche les annonces en mode grille responsive avec vignettes photos, note moyenne, localisation, type et prix par nuit. Le panneau de filtres avancés (localisation, fourchette de prix, type de bien, nombre de chambres, disponibilité) permet un ciblage précis. La recherche est déclenchée dynamiquement à chaque changement de filtre."),
        ...fig("4.5", "Interface Sprint 2 : Formulaire de création d'annonce Host — onglets infos / photos / localisation MapLibre"),
        ...fig("4.6", "Interface Sprint 2 : Page de détail d'une annonce (galerie, équipements, carte, calendrier, formulaire réservation)"),
        ...fig("4.7", "Interface Sprint 2 : Dashboard Guest — historique réservations avec états colorés et actions disponibles"),

        sec("4.6  Conclusion"),
        concl("Le Sprint 2 a livré le cœur du marketplace Maskan : publication d'annonces géolocalisées avec upload photos, moteur de recherche avancé multi-critères, page de détail complète et workflow de réservation sécurisé avec gestion des conflits de dates. Ces fonctionnalités constituent la valeur principale visible de la plateforme pour les utilisateurs finaux."),

        // ══════════════════════════════════════════════════════════════
        //  CHAPITRE 5 : SPRINT 3 — PAIEMENTS
        // ══════════════════════════════════════════════════════════════
        ...chap("5", "Étude et Réalisation du Sprint 3 (Intégration des Paiements Sécurisés)"),
        intro("Ce chapitre présente la réalisation du Sprint 3 : checkout CARD/CASH, mécanisme d'escrow avec génération de QR code, et validation physique du check-in par le Host."),
        sp(6),

        sec("5.1  Introduction"),
        body("Le Sprint 3 implémente le composant le plus différenciant de Maskan sur le plan de la sécurité : le mécanisme de paiement avec escrow QR. L'idée centrale est de garantir que le propriétaire ne reçoit les fonds que si et seulement si le locataire se présente physiquement pour le check-in, éliminant ainsi les risques d'arnaque de part et d'autre. Ce mécanisme s'inspire des systèmes d'escrow classiques, adapté à un contexte de location immobilière à court terme."),

        sec("5.2  Backlog du Sprint 3"),
        tCap("5.1", "Backlog du Sprint 3"),
        new Table({
          width: { size: 9026, type: WidthType.DXA }, columnWidths: [3200, 4326, 1500],
          rows: [
            new TableRow({ children: [ hc("User Story", 3200), hc("Tâches principales", 4326), hc("Estimation (j)", 1500) ] }),
            ...([
              ["En tant que Guest, je paie ma réservation.", "Entité PaymentMethod, API POST /payments/checkout/{id}, simulation intent, génération UUID checkInSecretCode, transition AWAITING_PAYMENT→PAID_AWAITING_CHECKIN", "4"],
              ["En tant que Host, je valide le check-in par QR code.", "API POST /bookings/{id}/verify-checkin, validation {secretCode}, vérification rôle+propriété+statut, transition→COMPLETED", "3"],
              ["En tant que Guest, je gère mes méthodes de paiement.", "Entité PaymentMethod (brand, last4, expMonth, expYear), CRUD API, interface gestion cartes", "3"],
              ["En tant qu'utilisateur, je suis l'état de la transaction.", "Timeline état réservation React, notifications transitions état, récépissé paiement", "2"],
            ]).map(r => new TableRow({ children: [ dc(r[0],3200), dc(r[1],4326), dc(r[2],1500) ] }))
          ]
        }),

        sec("5.3  Analyse et spécification des besoins"),
        sub("5.3.1  Diagramme de cas d'utilisation détaillé"),
        ...fig("5.1", "Diagramme de cas d'utilisation raffiné Sprint 3 — Payer réservation, Gérer méthodes paiement, Valider check-in QR"),

        sub("5.3.2  Description textuelle des cas d'utilisation"),
        sub2("Cas d'utilisation : Payer une réservation (Checkout)"),
        tCap("5.2", "Description textuelle — Payer une réservation"),
        ucTable([
          ["Cas d'utilisation","Effectuer le paiement d'une réservation confirmée"],
          ["Acteur principal","Guest authentifié"],
          ["Objectif","Procéder au paiement de la réservation et obtenir le code de check-in QR pour la remise des clés."],
          ["Pré-conditions","Booking en statut AWAITING_PAYMENT. Guest propriétaire du booking. Méthode de paiement sélectionnée (CARD ou CASH)."],
          ["Post-conditions","stripePaymentIntentId généré (simulé). checkInSecretCode UUID généré et stocké. Booking → PAID_AWAITING_CHECKIN. QR code affiché au Guest. Notification Host."],
          ["Scénario de base","1. Guest accède à la page de checkout.\n2. Sélectionne le mode de paiement (CARD ou CASH).\n3. Confirme le paiement via POST /api/payments/checkout/{bookingId}.\n4. Backend vérifie propriété du booking et statut AWAITING_PAYMENT.\n5. Génère stripePaymentIntentId (simulé : 'pi_sim_' + UUID).\n6. Génère checkInSecretCode (UUID unique).\n7. Booking → PAID_AWAITING_CHECKIN.\n8. QR code encodant le secret affiché au Guest."],
          ["Scénario d'exception","Booking non en AWAITING_PAYMENT → 409. Guest non propriétaire → 403."],
        ]),
        sp(4),

        sub2("Cas d'utilisation : Valider le check-in par QR code"),
        tCap("5.3", "Description textuelle — Validation check-in QR (Host)"),
        ucTable([
          ["Cas d'utilisation","Valider la remise des clés via le code QR du Guest"],
          ["Acteur principal","Host (propriétaire de l'annonce)"],
          ["Objectif","Confirmer la remise physique des clés au Guest et déclencher le virement vers le propriétaire (payout simulé)."],
          ["Pré-conditions","Booking en statut PAID_AWAITING_CHECKIN. Host propriétaire de l'annonce concernée."],
          ["Post-conditions","Booking → COMPLETED. payoutTriggered = true. Notification Guest. Fonds Host libérés (logique escrow)."],
          ["Scénario de base","1. Host scanne ou saisit le code QR présenté par le Guest.\n2. POST /api/bookings/{id}/verify-checkin avec {secretCode}.\n3. Backend vérifie : rôle HOST, propriété du listing, statut PAID_AWAITING_CHECKIN, correspondance secretCode.\n4. Booking → COMPLETED.\n5. Réponse {payoutTriggered: true} retournée.\n6. Notification Guest : séjour confirmé."],
          ["Scénario d'exception","Code incorrect → 400. Statut incorrect → 409. Host non propriétaire → 403."],
        ]),

        sec("5.4  Conception dynamique"),
        sub("5.4.1  Diagrammes de séquence"),
        ...fig("5.2", "Diagramme de séquence — Pipeline de paiement escrow : Guest → PaymentController → PaymentServiceImpl → génération QR code → MongoDB → PAID_AWAITING_CHECKIN"),
        ...fig("5.3", "Diagramme de séquence — Validation check-in QR : Host → BookingController → BookingServiceImpl (vérif. code) → COMPLETED → NotificationService"),

        sec("5.5  Réalisation"),
        sub("5.5.1  Interfaces développées"),
        ...fig("5.4", "Interface Sprint 3 : Page Checkout — récapitulatif réservation, sélection mode paiement CARD/CASH, confirmation"),
        body("La page de checkout affiche le récapitulatif complet de la réservation (bien, dates, durée, nombre de voyageurs, prix total calculé). L'utilisateur sélectionne son mode de paiement (CARD avec saisie des informations de carte ou CASH pour paiement en espèces). La confirmation déclenche l'appel à l'API de paiement et affiche le QR code de check-in."),
        ...fig("5.5", "Interface Sprint 3 : Page QR code de check-in Guest — code unique encodé, instructions de présentation au Host"),
        ...fig("5.6", "Interface Sprint 3 : Interface de scan QR Host — validation du code, confirmation COMPLETED"),

        sec("5.6  Conclusion"),
        concl("Le Sprint 3 a implémenté le mécanisme d'escrow QR qui constitue le différenciateur principal de Maskan en matière de sécurité des transactions. La génération d'un code UUID unique post-paiement, transmis physiquement lors du check-in et validé par le Host, garantit que le paiement n'est libéré qu'à la confirmation effective de la remise des clés. Ce Sprint marque l'achèvement du workflow transactionnel complet de la plateforme."),

        // ══════════════════════════════════════════════════════════════
        //  CHAPITRE 6 : SPRINT 4 — NOTIFICATIONS & INTERACTIONS
        // ══════════════════════════════════════════════════════════════
        ...chap("6", "Étude et Réalisation du Sprint 4 (Système de Notifications et Interactions)"),
        intro("Ce chapitre présente la réalisation du Sprint 4 : messagerie temps réel WebSocket/STOMP, système de notifications multicanal (interne + email asynchrone) et module d'avis et de notation."),
        sp(6),

        sec("6.1  Introduction"),
        body("Le Sprint 4 enrichit Maskan de ses fonctionnalités d'interaction sociale et de communication. La messagerie temps réel permet aux Guests et Hosts de communiquer directement au sein de la plateforme. Le système de notifications multicanal (interne et email) maintient tous les utilisateurs informés des évolutions importantes (confirmation de réservation, paiement, check-in, validation KYC). Le module d'avis et de notation construit la réputation des propriétaires et des biens, élément de confiance fondamental pour tout marketplace."),

        sec("6.2  Backlog du Sprint 4"),
        tCap("6.1", "Backlog du Sprint 4"),
        new Table({
          width: { size: 9026, type: WidthType.DXA }, columnWidths: [3200, 4326, 1500],
          rows: [
            new TableRow({ children: [ hc("User Story", 3200), hc("Tâches principales", 4326), hc("Estimation (j)", 1500) ] }),
            ...([
              ["En tant qu'utilisateur, j'envoie des messages en temps réel.", "Config WebSocketConfig + STOMP, entité Message, API /messages, hook useWebSocket React, persistance MongoDB", "5"],
              ["En tant qu'utilisateur, je reçois des notifications internes.", "Entité Notification (4 types), API /notifications (GET, PATCH markRead, PATCH markAll), NotificationBell React", "3"],
              ["En tant qu'utilisateur, je reçois des emails automatisés.", "@Async EmailService (6 templates HTML), config thread pool async, 4 types d'événements déclencheurs", "4"],
              ["En tant que Guest, je dépose un avis après séjour.", "Entité Review, guard canUserReviewProperty (booking COMPLETED), POST /reviews, update aggregat averageRating", "3"],
              ["En tant qu'utilisateur, je consulte les connexions.", "Entité ConnectionRequest, API /connections (request/accept/pending/list), contrôle messagerie", "2"],
            ]).map(r => new TableRow({ children: [ dc(r[0],3200), dc(r[1],4326), dc(r[2],1500) ] }))
          ]
        }),

        sec("6.3  Analyse et spécification des besoins"),
        sub("6.3.1  Diagramme de cas d'utilisation détaillé"),
        ...fig("6.1", "Diagramme de cas d'utilisation raffiné Sprint 4 — Envoyer message, Gérer notifications, Déposer un avis"),

        sub("6.3.2  Description textuelle des cas d'utilisation"),
        sub2("Cas d'utilisation : Envoyer et recevoir des messages"),
        tCap("6.2", "Description textuelle — Messagerie WebSocket temps réel"),
        ucTable([
          ["Cas d'utilisation","Envoyer et recevoir des messages en temps réel"],
          ["Acteur principal","Tout utilisateur authentifié (Guest ou Host)"],
          ["Objectif","Permettre une communication directe et instantanée entre Guest et Host au sein de la plateforme."],
          ["Pré-conditions","Les deux utilisateurs ont une relation (booking existant ou connexion acceptée). Session WebSocket STOMP établie avec JWT valide."],
          ["Post-conditions","Message sauvegardé en MongoDB avec senderId, receiverId, content, createdAt. Message livré en temps réel via STOMP au destinataire connecté."],
          ["Scénario de base","1. Utilisateur ouvre la conversation avec un contact.\n2. Frontend établit la connexion WebSocket avec token JWT en header.\n3. Utilisateur saisit un message et valide.\n4. Message publié sur le topic STOMP /app/message.\n5. Backend (MessageController) persiste le message en MongoDB.\n6. Message relayé sur /user/{receiverId}/queue/messages.\n7. Destinataire reçoit le message en temps réel dans son interface."],
          ["Scénario d'exception","Connexion WebSocket perdue : reconnexion automatique. Utilisateur non autorisé → 403."],
        ]),
        sp(4),

        sub2("Cas d'utilisation : Dépôt d'un avis"),
        tCap("6.3", "Description textuelle — Déposer un avis"),
        ucTable([
          ["Cas d'utilisation","Soumettre un avis sur un bien après séjour"],
          ["Acteur principal","Guest authentifié"],
          ["Objectif","Évaluer le bien loué et contribuer à la réputation de la plateforme."],
          ["Pré-conditions","Guest a un booking avec status = COMPLETED pour ce bien. Aucun avis préalable pour ce booking."],
          ["Post-conditions","Review sauvegardée. averageRating et reviewCount de la Property recalculés et mis à jour (dénormalisation). Notification au Host."],
          ["Scénario de base","1. Guest accède à sa réservation complétée.\n2. Clique sur 'Laisser un avis'.\n3. Sélectionne une note (1 à 5 étoiles) et rédige un commentaire.\n4. POST /api/reviews avec {propertyId, rating, comment}.\n5. Backend vérifie l'éligibilité via canUserReviewProperty.\n6. Review persistée. averageRating recalculé. reviewCount incrémenté.\n7. Confirmation d'enregistrement affichée."],
          ["Scénario d'exception","Booking non COMPLETED → 403. Avis déjà soumis → 409."],
        ]),

        sec("6.4  Conception dynamique"),
        sub("6.4.1  Diagrammes de séquence"),
        ...fig("6.2", "Diagramme de séquence — Messagerie STOMP : Utilisateur → WebSocketSession → MessageController → MongoDB → STOMP Topic → Destinataire"),
        ...fig("6.3", "Diagramme de séquence — Déposer un avis : Guest → ReviewController → canUserReview() → Review sauvegardée → Property.averageRating mis à jour"),

        sec("6.5  Réalisation"),
        sub("6.5.1  Interfaces développées"),
        ...fig("6.4", "Interface Sprint 4 : Module messagerie — liste conversations (gauche) + fenêtre chat avec historique (droite)"),
        body("Le module de messagerie s'appuie sur Spring WebSocket + STOMP pour les connexions persistantes bidirectionnelles. L'interface affiche la liste des conversations avec le dernier message et l'heure. La fenêtre de chat présente l'historique des messages avec bulles différenciées (envoyé/reçu), les avatars des participants et un indicateur de connexion en temps réel."),
        ...fig("6.5", "Interface Sprint 4 : Système de notifications — cloche avec badge compteur / panel liste notifications (BOOKING, KYC, PAYMENT)"),
        body("Le système de notifications opère sur deux canaux complémentaires. Les notifications internes (visibles via la cloche) couvrent quatre types : BOOKING (changements d'état de réservation), KYC (progression de vérification), PAYMENT (confirmation paiement/check-in) et SYSTEM (annonces plateforme). Les notifications email HTML (@Async) sont déclenchées asynchroniquement pour ne pas impacter le temps de réponse des API."),
        ...fig("6.6", "Interface Sprint 4 : Section avis d'une annonce — étoiles moyennes, compteur, liste avis / Formulaire soumission avis"),

        sec("6.6  Conclusion"),
        concl("Le Sprint 4 a enrichi Maskan de ses composantes sociales et communicationnelles : messagerie temps réel WebSocket/STOMP, système de notifications multicanal asynchrone et module d'avis contribuant à la réputation de la plateforme. La mise à jour dénormalisée des agrégats de notation garantit des lectures O(1) sur les pages de listing, adaptée aux patterns d'accès d'un marketplace."),

        // ══════════════════════════════════════════════════════════════
        //  CHAPITRE 7 : SPRINT 5 — ADMINISTRATION
        // ══════════════════════════════════════════════════════════════
        ...chap("7", "Étude et Réalisation du Sprint 5 (Administration et Gestion des Rôles Spécialisés)"),
        intro("Ce chapitre présente la réalisation du Sprint 5 : back-office d'administration complet couvrant la gouvernance des utilisateurs, la validation KYC, la modération des annonces et les tableaux de bord analytiques."),
        sp(6),

        sec("7.1  Introduction"),
        body("Le Sprint 5 finalise Maskan en livrant le back-office administrateur, composante essentielle pour la gouvernance et la viabilité d'un marketplace. Sans outils d'administration, la plateforme ne pourrait pas assurer la qualité du contenu, la sécurité des échanges ni la confiance des utilisateurs. Ce sprint implémente l'ensemble des fonctionnalités d'administration : gestion des utilisateurs, validation des vérifications KYC, modération des annonces, gestion des rapports et litiges, tableaux de bord financiers et analytiques, et gestion du support."),

        sec("7.2  Backlog du Sprint 5"),
        tCap("7.1", "Backlog du Sprint 5"),
        new Table({
          width: { size: 9026, type: WidthType.DXA }, columnWidths: [3200, 4326, 1500],
          rows: [
            new TableRow({ children: [ hc("User Story", 3200), hc("Tâches principales", 4326), hc("Estimation (j)", 1500) ] }),
            ...([
              ["En tant qu'Admin, je gère les utilisateurs.", "API /admin/users (list, ban/unban, update, delete, overview, history, messages, listings, bookings, earnings), dashboard React", "5"],
              ["En tant qu'Admin, je valide les vérifications KYC.", "API /admin/guest-verifications et /admin/host-demands (list, detail, approve/reject avec reason), interface documents", "4"],
              ["En tant qu'Admin, je modère les annonces.", "API /admin/listings/pending, approve/reject, interface modération avec prévisualisation", "3"],
              ["En tant qu'Admin, je gère rapports et litiges.", "Entités AdminReport + AdminChatModerationAction, CRUD API, actions (warn/suspend/ban/refund), notes internes", "4"],
              ["En tant qu'Admin, je gère les tickets de support.", "Entité SupportTicket + MessageEntry, API list/detail/patch/addMessage, interface assignation et réponse", "3"],
              ["En tant qu'Admin, je consulte les analytics.", "API /dashboard/admin/summary, agrégations MongoDB (revenus, bookings, users, villes top), graphiques React", "4"],
              ["En tant qu'Admin, je gère les paramètres plateforme.", "Entités AdminSettings + AdminContent, API read/update, formulaires admin (commission, maintenance, CMS)", "3"],
            ]).map(r => new TableRow({ children: [ dc(r[0],3200), dc(r[1],4326), dc(r[2],1500) ] }))
          ]
        }),

        sec("7.3  Analyse et spécification des besoins"),
        sub("7.3.1  Diagramme de cas d'utilisation détaillé"),
        ...fig("7.1", "Diagramme de cas d'utilisation raffiné Sprint 5 — Administration : Users, KYC, Annonces, Rapports, Analytics, Paramètres"),

        sub("7.3.2  Description textuelle des cas d'utilisation"),
        sub2("Cas d'utilisation : Tableau de bord administrateur"),
        tCap("7.2", "Description textuelle — Approuver une demande de vérification KYC"),
        ucTable([
          ["Cas d'utilisation","Approuver une demande de vérification d'identité (KYC Host)"],
          ["Acteur principal","Administrateur"],
          ["Objectif","Valider l'identité d'un utilisateur souhaitant obtenir le rôle Host pour publier des annonces."],
          ["Pré-conditions","Admin authentifié. Demande HostVerification avec status = PENDING existante. Documents uploadés par l'utilisateur."],
          ["Post-conditions","HostVerification.status = APPROVED. User.role = HOST. User.identityStatus = 'approved'. Notification email et interne envoyée à l'utilisateur."],
          ["Scénario de base","1. Admin consulte la liste des demandes en attente via /admin/host-demands?status=PENDING.\n2. Ouvre le détail de la demande (documents visibles via /uploads/verifications/{userId}/).\n3. Examine les pièces justificatives.\n4. Valide via PATCH /admin/guest-verifications/{userId}/approve.\n5. Backend met à jour atomiquement le statut et le rôle.\n6. Notification email + interne envoyée à l'utilisateur."],
          ["Scénario d'exception","Demande déjà traitée → 409. Documents manquants → Admin peut rejeter avec motif."],
        ]),
        sp(4),

        sub2("Cas d'utilisation : Modérer une annonce"),
        tCap("7.3", "Description textuelle — Modération d'une annonce"),
        ucTable([
          ["Cas d'utilisation","Modérer une annonce en attente de validation"],
          ["Acteur principal","Administrateur"],
          ["Objectif","Valider ou rejeter une annonce immobilière soumise par un Host avant sa publication."],
          ["Pré-conditions","Admin authentifié. Annonce avec pendingApproval = true existante."],
          ["Post-conditions","Si approuvée : pendingApproval = false, annonce visible dans les recherches. Si rejetée : annonce supprimée ou marquée rejetée. Notification Host."],
          ["Scénario de base","1. Admin consulte la liste des annonces en attente via /admin/listings/pending.\n2. Consulte les détails (photos, description, localisation, prix).\n3. Approuve via PATCH /admin/listings/{id}/verify.\n4. Backend retire le flag pendingApproval.\n5. Annonce disponible dans les résultats de recherche publics."],
          ["Scénario d'exception","Annonce déjà validée → 409. Contenu inapproprié → rejet avec motif notifié au Host."],
        ]),

        sec("7.4  Conception dynamique"),
        sub("7.4.1  Diagrammes de séquence"),
        ...fig("7.2", "Diagramme de séquence — Validation KYC Host : Admin → AdminController → UserService (update role + status) → MongoDB → NotificationService"),
        ...fig("7.3", "Diagramme de séquence — Modération annonce : Admin → AdminController → PropertyService (pendingApproval=false) → MongoDB → Notification Host"),

        sec("7.5  Réalisation"),
        sub("7.5.1  Interfaces développées"),
        ...fig("7.4", "Interface Sprint 5 : Tableau de bord Admin — KPIs (utilisateurs, réservations actives, revenus période, taux occupation)"),
        body("Le tableau de bord administrateur synthétise les indicateurs clés de performance de la plateforme. Les KPIs couvrent le nombre total d'utilisateurs (avec delta période), les réservations en cours et complétées, le chiffre d'affaires de la période et le taux d'occupation moyen des annonces. Des graphiques de tendance visualisent l'évolution sur les 30 derniers jours."),
        ...fig("7.5", "Interface Sprint 5 : Gestion des utilisateurs — tableau paginé avec filtres, actions ban/unban, vue détail"),
        body("L'interface de gestion des utilisateurs affiche la liste paginée avec colonnes nom, email, rôle, statut de vérification, date de création et statut (actif/banni). Des filtres permettent de cibler par rôle, statut ou période. L'action de bannissement est réversible et déclenche un blocage immédiat de la session JWT via le filtre JwtAuthenticationFilter."),
        ...fig("7.6", "Interface Sprint 5 : Validation KYC — liste demandes en attente avec prévisualisation documents (ID officiel + selfie)"),
        ...fig("7.7", "Interface Sprint 5 : Modération annonces — liste annonces pendingApproval avec prévisualisation photos et actions Approuver/Rejeter"),

        sec("7.6  Conclusion"),
        concl("Le Sprint 5 complète Maskan avec un back-office d'administration complet et robuste, couvrant la gouvernance des utilisateurs, la validation des vérifications KYC, la modération des annonces, la gestion des rapports et du support, ainsi que les tableaux de bord analytiques. Ce sprint finalise la plateforme en livrant tous les outils nécessaires à son exploitation opérationnelle."),

        // ══════════════════════════════════════════════════════════════
        //  CONCLUSION GÉNÉRALE
        // ══════════════════════════════════════════════════════════════
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 280 },
          children: [new TextRun({ text: "Conclusion Générale et Perspectives", font: "Times New Roman", size: 32, bold: true, color: BLUE })] }),
        hr(BLUE), sp(6),

        body("Le projet Maskan, développé dans le cadre du Projet de Fin d'Études pour l'obtention de la Licence en Sciences de l'Informatique à l'ISLAIB, constitue une réponse concrète, techniquement aboutie et académiquement rigoureuse aux lacunes du marché locatif numérique tunisien."),
        body("Sur le plan fonctionnel, Maskan couvre l'intégralité du cycle de location immobilière sécurisée : inscription et authentification JWT, vérification d'identité KYC en deux étapes, publication d'annonces géolocalisées, workflow de réservation à états formalisé, paiement avec mécanisme d'escrow QR, messagerie temps réel, système d'avis et notation, et back-office d'administration complet. Cette couverture fonctionnelle exhaustive répond directement aux six lacunes identifiées lors de l'analyse de l'existant."),
        body("Sur le plan technique, l'architecture three-tier adoptée (React 18 SPA + Spring Boot 3.2 REST/WebSocket + MongoDB) démontre sa robustesse et sa cohérence. Les principes de séparation des responsabilités, de sécurité stateless (JWT + RBAC), de traitement asynchrone (@Async) et d'optimisation des lectures (dénormalisation des agrégats, indexation MongoDB) garantissent une base solide pour une mise en production réelle."),
        body("Sur le plan méthodologique, l'adoption du framework Scrum a permis une progression maîtrisée et incrémentale, avec des livrables fonctionnels à l'issue de chacun des cinq sprints. Cette pratique développe des compétences professionnelles essentielles : planification, gestion des priorités, communication technique et adaptation continue."),
        body("Les perspectives d'évolution de Maskan sont nombreuses et prometteuses. Sur le plan technique : intégration d'un gateway de paiement réel (Stripe SDK), déploiement des fichiers sur un stockage cloud (AWS S3), conteneurisation Docker pour un déploiement reproductible (docker-compose MongoDB + Backend + Frontend), et activation de l'OTP WhatsApp via Twilio pour le marché tunisien. Sur le plan fonctionnel : moteur de recommandation basé sur l'historique des recherches, détection de fraude par analyse comportementale, application mobile React Native, et tableau de bord analytics avancé avec visualisations temps réel. Ces évolutions s'inscrivent naturellement dans l'architecture existante, témoignant de la qualité des choix architecturaux opérés."),
        new Paragraph({ children: [new PageBreak()] }),

        // ══════════════════════════════════════════════════════════════
        //  BIBLIOGRAPHIE
        // ══════════════════════════════════════════════════════════════
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 280 },
          children: [new TextRun({ text: "Bibliographie et Nétographie", font: "Times New Roman", size: 32, bold: true, color: BLUE })] }),
        hr(BLUE), sp(6),

        ...[
          "[1] Schwaber K., Sutherland J. The Scrum Guide. Scrum.org, 2020. Disponible sur : https://www.scrum.org/resources/scrum-guide, (Consulté le 05/03/2025).",
          "[2] React. React Documentation — Building User Interfaces [en ligne]. Meta, 2024. Disponible sur : https://react.dev, (Consulté le 10/03/2025).",
          "[3] Vite. Vite — Next Generation Frontend Tooling [en ligne]. Evan You, 2024. Disponible sur : https://vitejs.dev, (Consulté le 10/03/2025).",
          "[4] Spring Framework. Spring Boot Reference Documentation 3.2 [en ligne]. Pivotal/VMware, 2024. Disponible sur : https://docs.spring.io/spring-boot/docs/3.2.x/reference/htmlsingle/, (Consulté le 10/03/2025).",
          "[5] Spring Security. Spring Security Reference [en ligne]. Pivotal, 2024. Disponible sur : https://docs.spring.io/spring-security/reference/, (Consulté le 12/03/2025).",
          "[6] MongoDB. MongoDB Manual — Document Database [en ligne]. MongoDB Inc., 2024. Disponible sur : https://www.mongodb.com/docs/manual/, (Consulté le 12/03/2025).",
          "[7] JJWT. Java JWT — JSON Web Tokens for Java [en ligne]. Stormpath/Auth0, 2024. Disponible sur : https://github.com/jwtk/jjwt, (Consulté le 15/03/2025).",
          "[8] Spring WebSocket. WebSocket Support — Spring Framework [en ligne]. Pivotal, 2024. Disponible sur : https://docs.spring.io/spring-framework/reference/web/websocket.html, (Consulté le 15/03/2025).",
          "[9] Tailwind CSS. Tailwind CSS Documentation [en ligne]. Adam Wathan, 2024. Disponible sur : https://tailwindcss.com/docs, (Consulté le 18/03/2025).",
          "[10] MapLibre GL. MapLibre GL JS Documentation [en ligne]. MapLibre, 2024. Disponible sur : https://maplibre.org/maplibre-gl-js/docs/, (Consulté le 18/03/2025).",
          "[11] Fowler M. Patterns of Enterprise Application Architecture. Addison-Wesley Professional, 2002. ISBN : 978-0-321-12742-6.",
          "[12] Postman. Postman API Platform [en ligne]. Postman Inc., 2024. Disponible sur : https://www.postman.com, (Consulté le 20/03/2025).",
          "[13] GitHub. GitHub Documentation [en ligne]. GitHub Inc., 2024. Disponible sur : https://docs.github.com, (Consulté le 20/03/2025).",
          "[14] Draw.io. Draw.io Diagramming Tool [en ligne]. JGraph Ltd, 2024. Disponible sur : https://www.drawio.com, (Consulté le 01/03/2025).",
          "[15] Overleaf. Overleaf — LaTeX Editor [en ligne]. Overleaf Ltd, 2024. Disponible sur : https://www.overleaf.com, (Consulté le 01/03/2025).",
        ].map(r => new Paragraph({
          spacing: { after: 120, line: 320 },
          indent: { left: 720, hanging: 720 },
          children: [new TextRun({ text: r, font: "Times New Roman", size: 22, color: GREY })]
        })),
        new Paragraph({ children: [new PageBreak()] }),

        // ══════════════════════════════════════════════════════════════
        //  ANNEXES
        // ══════════════════════════════════════════════════════════════
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 280 },
          children: [new TextRun({ text: "Annexes", font: "Times New Roman", size: 32, bold: true, color: BLUE })] }),
        hr(BLUE), sp(6),

        sec("Annexe A — Schéma des collections MongoDB"),
        body("Cette annexe présente la liste détaillée des attributs de chaque collection MongoDB utilisée dans Maskan, telle que documentée dans le code source du projet."),
        tCap("A.1", "Entités MongoDB principales et leurs attributs clés"),
        new Table({
          width: { size: 9026, type: WidthType.DXA }, columnWidths: [1800, 4026, 3200],
          rows: [
            new TableRow({ children: [ hc("Collection", 1800), hc("Attributs principaux", 4026), hc("Relations", 3200) ] }),
            ...([
              ["users","id, name, email, password (BCrypt), role (ADMIN/HOST/GUEST), banned, emailVerified, identityStatus, verificationLevel, avatar, wishlistListingIds","Possède N Property (hostId), N Booking (guestId), N Message, N Notification"],
              ["properties","id, title, description, location, latitude, longitude, pricePerNight, currency, images[], hostId, available, type, bedrooms, bathrooms, amenities[], averageRating, reviewCount, pendingApproval","Appartient à 1 User (hostId), Référencée par N Booking, N Review"],
              ["bookings","id, listingId, guestId, checkInDate, checkOutDate, status (PENDING/CONFIRMED/AWAITING_PAYMENT/PAID_AWAITING_CHECKIN/COMPLETED/CANCELLED/REJECTED), paymentMethod, totalPrice, stripePaymentIntentId, checkInSecretCode","Appartient à 1 Property et 1 User (guestId)"],
              ["messages","id, senderId, receiverId, content, createdAt","Lie 2 User"],
              ["reviews","id, propertyId, authorId, authorName, rating (1-5), comment, createdAt","Appartient à 1 Property et 1 User"],
              ["notifications","id, recipientId, title, message, type (BOOKING/SYSTEM/KYC/PAYMENT), isRead, createdAt","Appartient à 1 User"],
              ["host_verifications","id, userId, status (PENDING/APPROVED/REJECTED), governmentIdFiles[], selfieFile, submittedAt, reviewedAt, rejectionReason","Appartient à 1 User"],
              ["email_verification_tokens","id, email, otpCode (String), expiryDate (15 min)","Lié à 1 User par email"],
            ]).map(r => new TableRow({ children: [ dc(r[0],1800), dc(r[1],4026), dc(r[2],3200) ] }))
          ]
        }),
        sp(8),

        sec("Annexe B — Endpoints REST principaux"),
        body("Cette annexe liste les principaux endpoints REST de l'API Maskan, organisés par module fonctionnel."),
        tCap("B.1", "Endpoints REST Maskan — résumé par module"),
        new Table({
          width: { size: 9026, type: WidthType.DXA }, columnWidths: [2200, 3026, 3800],
          rows: [
            new TableRow({ children: [ hc("Endpoint", 2200), hc("Méthode + Route", 3026), hc("Accès", 3800) ] }),
            ...([
              ["Authentification","POST /api/auth/register","Public"],
              ["Authentification","POST /api/auth/login","Public"],
              ["Profil","GET + PUT /api/users/me","Authentifié"],
              ["Annonces","GET /api/listings (search, advanced)","Public"],
              ["Annonces","POST /api/listings","HOST / PROPRIETOR"],
              ["Réservations","POST /api/bookings","GUEST / TENANT"],
              ["Réservations","PATCH /api/bookings/{id}/status","HOST / ADMIN"],
              ["Check-in","POST /api/bookings/{id}/verify-checkin","HOST / PROPRIETOR"],
              ["Paiement","POST /api/payments/checkout/{id}","GUEST / TENANT"],
              ["KYC Email","POST /api/verifications/email/send-otp","Authentifié"],
              ["KYC Docs","POST /api/verifications/guest/identity","Authentifié (multipart)"],
              ["Messagerie","POST + GET /api/messages","Authentifié"],
              ["Avis","POST /api/reviews","GUEST / HOST"],
              ["Notifications","GET + PATCH /api/notifications","Authentifié"],
              ["Admin","GET /api/admin/users","ADMIN seulement"],
              ["Admin KYC","PATCH /api/admin/guest-verifications/{id}/approve|reject","ADMIN seulement"],
            ]).map(r => new TableRow({ children: [ dc(r[0],2200), dc(r[1],3026), dc(r[2],3800) ] }))
          ]
        }),
      ]
    }
  ]
});

// Generate
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/mnt/user-data/outputs/MASKAN_PFE_RAPPORT_V2.docx", buf);
  console.log("✅ Report V2 generated!");
}).catch(e => { console.error("❌", e); process.exit(1); });
