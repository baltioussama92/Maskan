$driverSync = Join-Path $env:USERPROFILE ".m2\repository\org\mongodb\mongodb-driver-sync\4.11.2\mongodb-driver-sync-4.11.2.jar"
$driverCore = Join-Path $env:USERPROFILE ".m2\repository\org\mongodb\mongodb-driver-core\4.11.2\mongodb-driver-core-4.11.2.jar"
$bson = Join-Path $env:USERPROFILE ".m2\repository\org\mongodb\bson\4.11.2\bson-4.11.2.jar"

foreach ($jar in @($driverSync, $driverCore, $bson)) {
    if (-not (Test-Path $jar)) {
        throw "Missing MongoDB jar: $jar"
    }
}

$classpath = "$driverSync;$driverCore;$bson"

$script = @'
import com.mongodb.client.MongoClients;
import com.mongodb.client.model.UpdateOptions;
import org.bson.Document;
import static com.mongodb.client.model.Filters.eq;

var email = "admin.houserental@gmail.com";
var createdAt = java.util.Date.from(java.time.Instant.parse("2026-05-17T00:00:00.000Z"));

try (var client = MongoClients.create("mongodb://localhost:27017/rental_platform")) {
    var collection = client.getDatabase("rental_platform").getCollection("users");
    var update = new Document("$set", new Document("name", "Admin HouseRental")
            .append("email", email)
            .append("password", "$2a$10$N.SE5WpQuPMA7Rkya7yfhu6pmbXFUhJNOrBWEuh3lUNpWAME8Gsuu")
            .append("role", "ADMIN")
            .append("isVerified", true)
            .append("banned", false)
            .append("wishlistListingIds", java.util.List.of()))
        .append("$setOnInsert", new Document("createdAt", createdAt));

    var result = collection.updateOne(eq("email", email), update, new UpdateOptions().upsert(true));
    System.out.println("Matched: " + result.getMatchedCount());
    System.out.println("Modified: " + result.getModifiedCount());
    System.out.println("UpsertedId: " + result.getUpsertedId());
}
/exit
'@

$tempScript = Join-Path $env:TEMP "seed-admin.jsh"
$script | Set-Content -Path $tempScript -Encoding ASCII

jshell --class-path $classpath $tempScript