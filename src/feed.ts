import { parse } from 'papaparse';
import { readFileSync, writeFileSync } from 'fs';

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

const ARMFORCED_KEYWORDS = [
  "AF",
  "Air Force",
  "Army",
  "Military",
  "Naval",
  "Army Airfield",
  "Airfield",
];

function convertCoordinates(coordStr: string) {
  const [latitude, longitude] = coordStr.split(", ").map(parseFloat);
  return { latitude, longitude };
}

function checkIfArmforced(name: string) {
  return ARMFORCED_KEYWORDS.some((keyword) =>
    name.toLowerCase().includes(keyword.toLowerCase())
  );
}

async function importAirportsToD1() {
  const fileContent = readFileSync('./airports.csv', 'utf-8');
  const parsed = parse<Airport>(fileContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    console.error("Error parsing CSV:", parsed.errors);
    return;
  }

  // filter the data if you want to import only specific airports
  const insertStatements = parsed.data.map(airport => {
    const { latitude, longitude } = convertCoordinates(airport.coordinates);
    const is_armforced = checkIfArmforced(airport.name);
    
    return {
      sql: `INSERT INTO airports (
        ident, type, name, elevation_ft, continent, 
        iso_country, iso_region, municipality, gps_code, 
        iata_code, local_code, latitude, longitude, is_armforced
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        airport.ident,
        airport.type,
        airport.name,
        parseInt(isNaN(parseInt(airport.elevation_ft)) ? '0' : airport.elevation_ft),
        airport.continent,
        airport.iso_country,
        airport.iso_region,
        airport.municipality,
        airport.gps_code,
        airport.iata_code,
        airport.local_code,
        latitude,
        longitude,
        is_armforced ? 1 : 0
      ]
    };
  });

  const sqlStatements = insertStatements
    .map(stmt => {
      const escapedParams = stmt.params.map(param => 
        typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` : param
      );
      // @ts-ignore
      return `${stmt.sql.replace(/\?/g, () => escapedParams.shift()!)};`;
    })
    .join('\n');

  writeFileSync('import_data.sql', sqlStatements);
  console.log('Generated import_data.sql, records:', insertStatements.length);
}

importAirportsToD1();