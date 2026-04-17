/**
 * Seed historical measurements from the exported Excel data into Firestore.
 *
 * Prerequisites:
 *   1. Download a service account key from Firebase Console →
 *      Project Settings → Service Accounts → Generate new private key
 *   2. Save it as  scripts/serviceAccount.json  (gitignored)
 *   3. Run:  node scripts/seed-measurements.mjs
 *
 * The script is idempotent — it checks for duplicates by date before writing.
 */

import { readFileSync, existsSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ── Firebase Admin ──────────────────────────────────────────────────────────
const admin = require("firebase-admin");

const serviceAccountPath = resolve(__dirname, "serviceAccount.json");
if (!existsSync(serviceAccountPath)) {
  console.error(
    "\nMissing  scripts/serviceAccount.json\n\n" +
    "Download it from:\n" +
    "  Firebase Console → Project Settings → Service Accounts → Generate new private key\n"
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "road-2-sihat",
});

const auth = admin.auth();
const db = admin.firestore();

// ── Data ────────────────────────────────────────────────────────────────────
// Columns: Date, Time, Weight, BMI, Fat%, BodyFatWeight, SkeletalMuscleMass%,
//          SkeletalMuscleWeight, MusclePercent, MuscleWeight, V-fat, Water%,
//          WeightOfWater, Metabolism, ObesityDegree, BoneMass, Protein%,
//          WeightWithoutFat, BodyAge
const RAW = [
  ["17/04/2026","07:11","69.05","23.9","21.3","14.7","39.6","39.6","74.3","51.3","8.5","54.7","37.8","1541.4","9.6","3.0","19.6","54.3","33"],
  ["14/04/2026","09:04","69.10","23.9","21.4","14.8","39.6","39.6","74.3","51.3","9.0","54.7","37.8","1542.1","9.7","3.0","19.6","54.3","33"],
  ["12/04/2026","09:27","68.40","23.7","20.9","14.3","39.8","39.8","74.6","51.1","8.5","54.9","37.5","1532.9","8.6","3.0","19.8","54.1","33"],
  ["10/04/2026","07:45","69.85","24.2","21.8","15.2","39.4","39.4","73.9","51.6","9.0","54.5","38.1","1551.9","10.9","3.0","19.4","54.6","34"],
  ["09/04/2026","07:31","69.95","24.2","21.9","15.3","39.3","39.3","73.9","51.7","9.0","54.5","38.1","1553.2","11.0","3.0","19.4","54.7","34"],
  ["08/04/2026","07:11","69.70","24.1","21.7","15.1","39.4","39.4","74.0","51.6","9.0","54.5","38.0","1550.0","10.6","3.0","19.4","54.6","34"],
  ["07/04/2026","06:51","70.05","24.2","21.9","15.4","39.3","39.3","73.8","51.7","9.0","54.4","38.1","1554.6","11.2","3.0","19.4","54.7","34"],
  ["06/04/2026","07:36","70.25","24.3","22.0","15.5","39.2","39.2","73.7","51.8","9.0","54.4","38.2","1557.2","11.5","3.0","19.3","54.8","34"],
  ["05/04/2026","10:10","70.30","24.3","22.1","15.5","39.2","39.2","73.7","51.8","9.5","54.4","38.2","1557.8","11.6","3.0","19.3","54.8","34"],
  ["04/04/2026","12:34","70.25","24.3","22.0","15.5","39.2","39.2","73.7","51.8","9.0","54.4","38.2","1557.2","11.5","3.0","19.3","54.8","34"],
  ["03/04/2026","07:35","70.00","24.2","21.9","15.3","39.3","39.3","73.8","51.7","9.0","54.5","38.1","1553.9","11.1","3.0","19.4","54.7","34"],
  ["02/04/2026","06:58","70.00","24.2","21.9","15.3","39.3","39.3","73.8","51.7","9.0","54.5","38.1","1553.9","11.1","3.0","19.4","54.7","34"],
  ["01/04/2026","07:29","69.70","24.1","21.7","15.1","39.4","39.4","74.0","51.6","9.0","54.5","38.0","1550.0","10.6","3.0","19.4","54.6","34"],
  ["31/03/2026","07:28","69.35","24.0","21.5","14.9","39.5","39.5","74.2","51.4","9.0","54.6","37.9","1545.4","10.1","3.0","19.5","54.4","33"],
  ["29/03/2026","06:33","69.25","24.0","21.4","14.8","39.6","39.6","74.3","51.4","8.5","54.6","37.8","1548.4","9.9","3.0","19.6","54.4","33"],
  ["27/03/2026","08:23","69.45","24.0","21.5","15.0","39.5","39.5","74.2","51.5","9.0","54.6","37.9","1551.0","10.2","3.0","19.6","54.5","33"],
  ["26/03/2026","07:30","69.35","24.0","21.5","14.9","39.5","39.5","74.2","51.5","8.5","54.6","37.9","1549.7","10.1","3.0","19.6","54.4","33"],
  ["25/03/2026","07:13","69.60","24.1","21.6","15.1","39.5","39.5","74.1","51.6","9.0","54.6","38.0","1553.0","10.5","3.0","19.5","54.5","33"],
  ["15/03/2026","11:38","69.25","24.0","21.4","14.8","39.6","39.6","74.3","51.4","8.5","54.6","37.8","1548.4","9.9","3.0","19.6","54.4","33"],
  ["10/03/2026","06:58","70.45","24.4","22.1","15.6","39.2","39.2","73.7","51.9","9.0","54.4","38.3","1564.2","11.8","3.0","19.3","54.9","34"],
  ["09/03/2026","07:29","70.65","24.4","22.2","15.7","39.1","39.1","73.6","52.0","9.5","54.3","38.4","1566.8","12.1","3.0","19.3","54.9","34"],
  ["04/03/2026","06:45","70.30","24.3","22.0","15.5","39.2","39.2","73.7","51.8","9.0","54.4","38.2","1562.2","11.6","3.0","19.3","54.8","34"],
  ["02/03/2026","07:20","70.45","24.4","22.1","15.6","39.2","39.2","73.7","51.9","9.0","54.4","38.3","1564.2","11.8","3.0","19.3","54.9","34"],
  ["01/03/2026","06:56","71.10","24.6","22.5","16.0","39.0","39.0","73.3","52.1","9.5","54.2","38.5","1572.7","12.9","3.0","19.1","55.1","35"],
  ["26/02/2026","07:08","71.05","24.6","22.5","16.0","39.0","39.0","73.4","52.1","9.5","54.2","38.5","1572.0","12.8","3.0","19.2","55.1","35"],
  ["23/02/2026","06:58","71.40","24.7","22.7","16.2","38.9","38.9","73.2","52.3","9.5","54.1","38.6","1576.7","13.3","3.0","19.1","55.2","35"],
  ["20/02/2026","18:25","71.30","24.7","22.6","16.1","38.9","38.9","73.2","52.2","9.5","54.2","38.6","1575.3","13.2","3.0","19.1","55.2","35"],
  ["18/02/2026","07:25","72.75","25.2","23.4","17.0","38.5","38.5","72.6","52.8","10.0","53.8","39.2","1594.4","15.5","2.9","18.7","55.7","36"],
  ["17/02/2026","10:49","72.10","24.9","23.0","16.6","38.7","38.7","72.9","52.5","10.0","54.0","38.9","1585.9","14.4","3.0","18.9","55.5","36"],
  ["16/02/2026","07:10","73.15","25.3","23.6","17.3","38.4","38.4","72.4","52.9","10.5","53.7","39.3","1599.7","16.1","2.9","18.6","55.9","37"],
  ["14/02/2026","06:39","72.10","24.9","23.0","16.6","38.7","38.7","72.9","52.5","10.0","54.0","38.9","1585.9","14.4","3.0","18.9","55.5","36"],
  ["13/02/2026","07:20","72.35","25.0","23.2","16.8","38.6","38.6","72.7","52.6","10.0","53.9","39.0","1589.1","14.8","3.0","18.8","55.6","36"],
  ["12/02/2026","07:14","72.45","25.1","23.2","16.8","38.6","38.6","72.7","52.7","10.0","53.9","39.0","1590.5","15.0","2.9","18.8","55.6","36"],
  ["11/02/2026","06:45","72.95","25.2","23.5","17.1","38.4","38.4","72.5","52.9","10.0","53.8","39.2","1597.0","15.8","2.9","18.7","55.8","36"],
  ["10/02/2026","06:52","73.45","25.4","23.8","17.4","38.3","38.3","72.2","53.1","10.5","53.7","39.4","1603.6","16.6","2.9","18.6","56.0","37"],
  ["09/02/2026","09:32","73.55","25.4","23.8","17.5","38.3","38.3","72.2","53.1","10.5","53.6","39.5","1604.9","16.7","2.9","18.5","56.0","37"],
  ["08/02/2026","10:42","73.35","25.4","23.7","17.4","38.3","38.3","72.3","53.0","10.5","53.7","39.4","1602.3","16.4","2.9","18.6","56.0","37"],
];

function parseRow(row) {
  const [d, t, weight, bmi, fatPercent, bodyFatWeight,
    skeletalMuscleMassPercent, skeletalMuscleWeight,
    musclePercent, muscleWeight, vFat,
    waterPercent, weightOfWater, metabolism,
    obesityDegree, boneMass, protein,
    weightWithoutFat, bodyAge] = row;

  // Convert DD/MM/YYYY + HH:MM → ISO string
  const [day, month, year] = d.split("/");
  const date = `${year}-${month}-${day}T${t}:00`;

  return {
    date,
    weight: parseFloat(weight),
    bmi: parseFloat(bmi),
    fatPercent: parseFloat(fatPercent),
    bodyFatWeight: parseFloat(bodyFatWeight),
    skeletalMuscleMassPercent: parseFloat(skeletalMuscleMassPercent),
    skeletalMuscleWeight: parseFloat(skeletalMuscleWeight),
    musclePercent: parseFloat(musclePercent),
    muscleWeight: parseFloat(muscleWeight),
    vFat: parseFloat(vFat),
    waterPercent: parseFloat(waterPercent),
    weightOfWater: parseFloat(weightOfWater),
    metabolism: parseFloat(metabolism),
    obesityDegree: parseFloat(obesityDegree),
    boneMass: parseFloat(boneMass),
    protein: parseFloat(protein),
    weightWithoutFat: parseFloat(weightWithoutFat),
    bodyAge: parseInt(bodyAge, 10),
    height: 170,
  };
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const email = "mussyahmi31@gmail.com";

  console.log(`Looking up UID for ${email}...`);
  const userRecord = await auth.getUserByEmail(email);
  const userId = userRecord.uid;
  console.log(`  UID: ${userId}`);

  const colRef = db.collection("users").doc(userId).collection("measurements");

  // Fetch existing dates to avoid duplicates
  const existing = await colRef.get();
  const existingDates = new Set(existing.docs.map((d) => d.data().date));
  console.log(`  Existing measurements: ${existingDates.size}`);

  const measurements = RAW.map(parseRow);
  let added = 0;
  let skipped = 0;

  for (const m of measurements) {
    if (existingDates.has(m.date)) {
      console.log(`  SKIP  ${m.date}`);
      skipped++;
      continue;
    }
    await colRef.add({ ...m, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log(`  ADD   ${m.date}  (${m.weight} kg)`);
    added++;
  }

  console.log(`\nDone — ${added} added, ${skipped} skipped.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
