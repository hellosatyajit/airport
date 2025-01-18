-- Create the airports table
CREATE TABLE airports (
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

-- Create indexes for commonly queried fields
CREATE INDEX idx_airport_name ON airports(name);
CREATE INDEX idx_airport_municipality ON airports(municipality);
CREATE INDEX idx_airport_type ON airports(type);
CREATE INDEX idx_airport_country ON airports(iso_country);