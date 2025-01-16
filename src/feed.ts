import { Database } from "bun:sqlite";
import Papa from "papaparse";

interface Airport {
  ident: string;
  type: string;
  name: string;
  elevation_ft: string;
  continent: string;
  iso_country: string;
  iso_region: string;
  municipality: string;
  gps_code: string;
  iata_code: string;
  local_code: string;
  coordinates: string;
}

const db = new Database("airports.sqlite");

const ARMFORCED_KEYWORDS = [
  "AF",
  "Air Force",
  "Army",
  "Military",
  "Naval",
  "Army Airfield",
  "Airfield",
];
const CREATE_TABLE_QUERY = `
    CREATE TABLE IF NOT EXISTS airports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ident TEXT,
        type TEXT,
        name TEXT,
        elevation_ft INTEGER,
        continent TEXT,
        iso_country TEXT,
        iso_region TEXT,
        municipality TEXT,
        gps_code TEXT,
        iata_code TEXT,
        local_code TEXT,
        latitude REAL,
        longitude REAL,
        is_armforced BOOLEAN DEFAULT FALSE
    );
`;
const INSERT_AIRPORT_QUERY = `
    INSERT OR REPLACE INTO airports (ident, type, name, elevation_ft, continent, iso_country, iso_region, municipality, gps_code, iata_code, local_code, latitude, longitude, is_armforced)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

function convertCoordinates(coordStr: string) {
  const [latitude, longitude] = coordStr.split(", ").map(parseFloat);
  return { latitude, longitude };
}

function checkIfArmforced(name: string) {
  return ARMFORCED_KEYWORDS.some((keyword) =>
    name.toLowerCase().includes(keyword.toLowerCase())
  );
}

async function importAirportsFromCSV(filePath: string) {
  try {
    const fileContent = await Bun.file(filePath).text();
    const parsed = Papa.parse<Airport>(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      console.error("Error parsing CSV:", parsed.errors);
      return;
    }

    db.run("BEGIN");
    db.run("DROP TABLE IF EXISTS airports");
    db.run(CREATE_TABLE_QUERY);

    const rowsToInsert = parsed.data.map(
      ({
        ident,
        type,
        name,
        elevation_ft,
        continent,
        iso_country,
        iso_region,
        municipality,
        gps_code,
        iata_code,
        local_code,
        coordinates,
      }) => {
        const { latitude, longitude } = convertCoordinates(coordinates);
        const is_armforced = checkIfArmforced(name);
        return [
          ident,
          type,
          name,
          parseInt(elevation_ft),
          continent,
          iso_country,
          iso_region,
          municipality,
          gps_code,
          iata_code,
          local_code,
          latitude,
          longitude,
          is_armforced,
        ];
      }
    );

    for (const row of rowsToInsert) {
      db.run(INSERT_AIRPORT_QUERY, row);
    }

    db.run("COMMIT");
    console.log(`Successfully imported ${parsed.data.length} airports.`);
  } catch (err) {
    console.error("Error importing data:", err);
  }
}

const csvFilePath = "./airports.csv";
await importAirportsFromCSV(csvFilePath);
