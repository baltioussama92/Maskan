// Script de seed pour la collection `properties`
// Utilisation : mongo <connection-string> Backend/scripts/seed-properties.js

(function() {
  // Trouver un hôte existant (préférer role: "HOST")
  let host = db.users.findOne({ role: "HOST" });
  if (!host) {
    host = db.users.findOne({ email: "admin.houserental@gmail.com" });
  }

  if (!host) {
    const res = db.users.insertOne({
      name: "Host Maskan",
      email: "host@houserental.tn",
      // Réutilise un hash bcrypt présent dans le repo pour un mot de passe par défaut
      password: "$2a$10$N.SE5WpQuPMA7Rkya7yfhu6pmbXFUhJNOrBWEuh3lUNpWAME8Gsuu",
      role: "HOST",
      isVerified: true,
      banned: false,
      wishlistListingIds: [],
      createdAt: new Date()
    });
    host = db.users.findOne({ _id: res.insertedId });
    print('Created fallback host: ' + host._id + ' (' + host.email + ')');
  } else {
    print('Using existing host: ' + host._id + ' (' + host.email + ')');
  }

  const hostId = host._id.toString();

  const listings = [
    {
      title: "S+2 Haut Standing aux Berges du Lac 2",
      description: "Magnifique appartement S+2 richement meublé situé dans une résidence sécurisée aux Berges du Lac 2. Idéal pour les voyages d'affaires ou les vacances. Salon spacieux, cuisine équipée, Wi-Fi haut débit, et place de parking sous-sol incluse.",
      location: "Les Berges du Lac 2, Tunis",
      latitude: 36.8628,
      longitude: 10.2100,
      pricePerNight: NumberDecimal("180"),
      currency: "TND",
      images: [],
      hostId: hostId,
      createdAt: new Date(),
      available: true,
      type: "Apartment",
      badge: "Haut standing",
      bedrooms: 2,
      bathrooms: 1,
      area: 95,
      houseRules: "Non-fumeur. Pas d'animaux. Respect du voisinage.",
      amenities: ["Wi-Fi","Climatisation","Parking gratuit","Cuisine équipée","Ascenseur","Sécurité 24/7"],
      rating: 4.8,
      reviewCount: 42,
      pendingApproval: false
    },
    {
      title: "Villa avec Piscine à Hammamet Nord",
      description: "Splendide villa indépendante avec piscine privée à seulement 5 minutes à pied de la plage de Hammamet Nord. Grand jardin gazonné, barbecue, 3 chambres climatisées et un grand salon lumineux. Parfait pour les familles.",
      location: "Hammamet Nord, Nabeul",
      latitude: 36.4025,
      longitude: 10.6189,
      pricePerNight: NumberDecimal("450"),
      currency: "TND",
      images: [],
      hostId: hostId,
      createdAt: new Date(),
      available: true,
      type: "Villa",
      badge: "Piscine privée",
      bedrooms: 3,
      bathrooms: 2,
      area: 220,
      houseRules: "Respect du voisinage. Interdiction de fêtes bruyantes après 22h.",
      amenities: ["Piscine","Wi-Fi","Climatisation","Jardin","Barbecue","Machine à laver","Vue sur mer"],
      rating: 4.9,
      reviewCount: 58,
      pendingApproval: false
    },
    {
      title: "Studio Typique au cœur de Sidi Bou Saïd",
      description: "Charmant studio au style architectural arabo-andalou (bleu et blanc) situé dans les ruelles pittoresques de Sidi Bou Saïd. Vue panoramique imprenable sur le golfe de Tunis depuis la terrasse. Proche des cafés et des galeries d'art.",
      location: "Sidi Bou Saïd, Tunis",
      latitude: 36.8746,
      longitude: 10.3415,
      pricePerNight: NumberDecimal("120"),
      currency: "TND",
      images: [],
      hostId: hostId,
      createdAt: new Date(),
      available: true,
      type: "Studio",
      badge: "Style traditionnel",
      bedrooms: 1,
      bathrooms: 1,
      area: 40,
      houseRules: "Petites escales dans les ruelles — pas d'accessibilité pour personnes à mobilité réduite.",
      amenities: ["Wi-Fi","Climatisation","Terrasse","Vue panoramique","Cafetière"],
      rating: 4.7,
      reviewCount: 31,
      pendingApproval: false
    },
    {
      title: "S+1 Moderne avec Vue sur Mer à Sousse (Kantaoui)",
      description: "Appartement S+1 moderne et jamais habité, situé directement sur le port de plaisance El Kantaoui. Accès direct à la plage, résidence gardée avec piscine commune. Idéal pour un couple.",
      location: "Port El Kantaoui, Sousse",
      latitude: 35.8833,
      longitude: 10.6228,
      pricePerNight: NumberDecimal("150"),
      currency: "TND",
      images: [],
      hostId: hostId,
      createdAt: new Date(),
      available: true,
      type: "Apartment",
      badge: "Vue sur mer",
      bedrooms: 1,
      bathrooms: 1,
      area: 55,
      houseRules: "Calme demandé après 23h. Nettoyage en supplément si animaux admis.",
      amenities: ["Wi-Fi","Climatisation","Piscine commune","Accès plage","Balcon","Télévision"],
      rating: 4.6,
      reviewCount: 27,
      pendingApproval: false
    }
  ];

  const res = db.properties.insertMany(listings);
  print('Inserted properties ids: ' + JSON.stringify(res.insertedIds));
})();
