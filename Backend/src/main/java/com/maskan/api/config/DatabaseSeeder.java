package com.maskan.api.config;

import com.maskan.api.entity.Property;
import com.maskan.api.entity.Role;
import com.maskan.api.entity.User;
import com.maskan.api.repository.PropertyRepository;
import com.maskan.api.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;

    public DatabaseSeeder(UserRepository userRepository, PropertyRepository propertyRepository) {
        this.userRepository = userRepository;
        this.propertyRepository = propertyRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Cherche un host existant
        Optional<User> hostOpt = userRepository.findByEmail("host@houserental.tn");
        if (hostOpt.isEmpty()) {
            // Cherche n'importe quel HOST
            List<User> all = userRepository.findAll();
            hostOpt = all.stream().filter(u -> u.getRole() == Role.HOST).findFirst();
        }

        User host;
        if (hostOpt.isPresent()) {
            host = hostOpt.get();
        } else {
            host = User.builder()
                    .name("Host Maskan")
                    .email("host@houserental.tn")
                    .password("$2a$10$N.SE5WpQuPMA7Rkya7yfhu6pmbXFUhJNOrBWEuh3lUNpWAME8Gsuu")
                    .role(Role.HOST)
                    .isVerified(true)
                    .createdAt(Instant.now())
                    .build();
            host = userRepository.save(host);
        }

        String hostId = host.getId();

        // récupérer titres existants pour éviter duplications
        Set<String> existingTitles = new HashSet<>();
        propertyRepository.findByHostId(hostId).forEach(p -> existingTitles.add(p.getTitle()));

        List<Property> listings = List.of(
                Property.builder()
                        .title("S+2 Haut Standing aux Berges du Lac 2")
                        .description("Magnifique appartement S+2 richement meublé situé dans une résidence sécurisée aux Berges du Lac 2. Idéal pour les voyages d'affaires ou les vacances. Salon spacieux, cuisine équipée, Wi-Fi haut débit, et place de parking sous-sol incluse.")
                        .location("Les Berges du Lac 2, Tunis")
                        .latitude(36.8628)
                        .longitude(10.2100)
                        .pricePerNight(new BigDecimal("180"))
                        .currency("TND")
                        .images(List.of())
                        .hostId(hostId)
                        .createdAt(Instant.now())
                        .available(true)
                        .type("Apartment")
                        .badge("Haut standing")
                        .bedrooms(2)
                        .bathrooms(1)
                        .area(95)
                        .houseRules("Non-fumeur. Pas d'animaux. Respect du voisinage.")
                        .amenities(List.of("Wi-Fi","Climatisation","Parking gratuit","Cuisine équipée","Ascenseur","Sécurité 24/7"))
                        .rating(4.8)
                        .reviewCount(42)
                        .pendingApproval(false)
                        .build(),

                Property.builder()
                        .title("Villa avec Piscine à Hammamet Nord")
                        .description("Splendide villa indépendante avec piscine privée à seulement 5 minutes à pied de la plage de Hammamet Nord. Grand jardin gazonné, barbecue, 3 chambres climatisées et un grand salon lumineux. Parfait pour les familles.")
                        .location("Hammamet Nord, Nabeul")
                        .latitude(36.4025)
                        .longitude(10.6189)
                        .pricePerNight(new BigDecimal("450"))
                        .currency("TND")
                        .images(List.of())
                        .hostId(hostId)
                        .createdAt(Instant.now())
                        .available(true)
                        .type("Villa")
                        .badge("Piscine privée")
                        .bedrooms(3)
                        .bathrooms(2)
                        .area(220)
                        .houseRules("Respect du voisinage. Interdiction de fêtes bruyantes après 22h.")
                        .amenities(List.of("Piscine","Wi-Fi","Climatisation","Jardin","Barbecue","Machine à laver","Vue sur mer"))
                        .rating(4.9)
                        .reviewCount(58)
                        .pendingApproval(false)
                        .build(),

                Property.builder()
                        .title("Studio Typique au cœur de Sidi Bou Saïd")
                        .description("Charmant studio au style architectural arabo-andalou (bleu et blanc) situé dans les ruelles pittoresques de Sidi Bou Saïd. Vue panoramique imprenable sur le golfe de Tunis depuis la terrasse. Proche des cafés et des galeries d'art.")
                        .location("Sidi Bou Saïd, Tunis")
                        .latitude(36.8746)
                        .longitude(10.3415)
                        .pricePerNight(new BigDecimal("120"))
                        .currency("TND")
                        .images(List.of())
                        .hostId(hostId)
                        .createdAt(Instant.now())
                        .available(true)
                        .type("Studio")
                        .badge("Style traditionnel")
                        .bedrooms(1)
                        .bathrooms(1)
                        .area(40)
                        .houseRules("Petites escales dans les ruelles — pas d'accessibilité pour personnes à mobilité réduite.")
                        .amenities(List.of("Wi-Fi","Climatisation","Terrasse","Vue panoramique","Cafetière"))
                        .rating(4.7)
                        .reviewCount(31)
                        .pendingApproval(false)
                        .build(),

                Property.builder()
                        .title("S+1 Moderne avec Vue sur Mer à Sousse (Kantaoui)")
                        .description("Appartement S+1 moderne et jamais habité, situé directement sur le port de plaisance El Kantaoui. Accès direct à la plage, résidence gardée avec piscine commune. Idéal pour un couple.")
                        .location("Port El Kantaoui, Sousse")
                        .latitude(35.8833)
                        .longitude(10.6228)
                        .pricePerNight(new BigDecimal("150"))
                        .currency("TND")
                        .images(List.of())
                        .hostId(hostId)
                        .createdAt(Instant.now())
                        .available(true)
                        .type("Apartment")
                        .badge("Vue sur mer")
                        .bedrooms(1)
                        .bathrooms(1)
                        .area(55)
                        .houseRules("Calme demandé après 23h. Nettoyage en supplément si animaux admis.")
                        .amenities(List.of("Wi-Fi","Climatisation","Piscine commune","Accès plage","Balcon","Télévision"))
                        .rating(4.6)
                        .reviewCount(27)
                        .pendingApproval(false)
                        .build()
        );

        for (Property p : listings) {
            if (!existingTitles.contains(p.getTitle())) {
                propertyRepository.save(p);
                System.out.println("Inserted listing: " + p.getTitle());
            } else {
                System.out.println("Skipped existing listing: " + p.getTitle());
            }
        }
    }
}
