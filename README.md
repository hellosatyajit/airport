# Airport API Documentation

## Overview

The Airport API provides a RESTful interface to query airport data, including details like airport type, location, and whether it is used for armed forces.

## Features

- Query airports by name, city, country, and type.
- Filter results for airports used by armed forces.
- Paginated responses for large datasets.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your system.
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) set up and configured.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/hellosatyajit/airport.git
   cd airport
   ```
2. Install dependencies:
   ```bash
   bun install
   ```

### Setting Up the Database

The data is sourced from [datasets/airport-codes](https://github.com/datasets/airport-codes). Follow these steps to set up the database and deploy the project:


1. Create the Database
   ```bash
   wrangler d1 create airports_db
   ```

2. Add the `database_id` to `wrangler.toml`
   ```bash
   wrangler secret put DB_ID

   echo "DB_ID=your-database-id" >> .env
   ```

3. Execute the Schema
   ```bash
   wrangler d1 execute airports_db --file=./schema.sql
   ```

4. Feed Data
   ```bash
   bun feed
   ```

5. Import Additional Data
   ```bash
   wrangler d1 execute airports_db --file=./import_data.sql
   ```

6. Deploy the Project
   ```bash
   wrangler deploy
   ```

### Running the API

#### Development Mode

Start the server in development mode:

```bash
wrangler dev src/index.ts
```

The server will be available at `http://127.0.0.1:8787` by default.

#### Deploy

Deploy the workers to Cloudflare

```bash
wrangler deploy
```

## API Endpoints

### Root Endpoint

**GET /**

- Description: Displays a welcome message.
- Response:
  ```json
  "Welcome to Airport API"
  ```

### Search Airports

**GET /search**

- Description: Search for airports based on query parameters.
- Query Parameters:
  | Parameter | Type | Description |
  |---------------|-----------|-----------------------------------------------------------------------------|
  | q | string | Search term for airport name or municipality. |
  | name | string | Filter by airport name. |
  | city | string | Filter by municipality. |
  | type | enum | Filter by type: `airport`, `heliport`, `large_airport`, `medium_airport`, `small_airport`. |
  | country | string | 2-letter ISO country code. |
  | armforced | enum | Filter by armed forces usage: `true` or `false`. |
  | limit | number | Number of results to return (default: 10). |
  | offset | number | Offset for pagination (default: 0). |

- Example Request:
  ```http
  GET /search?q=Ahmedabad
  ```
- Example Response:
  ```json
  {
    "success": true,
    "length": 1,
    "data": [
      {
        "id": 76890,
        "ident": "VAAH",
        "type": "medium_airport",
        "name": "Sardar Vallabh Bhai Patel International Airport",
        "elevation_ft": 189,
        "continent": "AS",
        "iso_country": "IN",
        "iso_region": "IN-GJ",
        "municipality": "Ahmedabad",
        "gps_code": "VAAH",
        "iata_code": "AMD",
        "local_code": "",
        "latitude": 23.0772,
        "longitude": 72.634697,
        "is_armforced": 0
      }
    ]
  }
  ```

### Error Handling

If invalid query parameters are provided, the API returns a 400 status code with an error message:

```json
{
  "success": false,
  "message": "Invalid query parameters"
}
```

In case of server errors, a 500 status code is returned:

```json
{
  "success": false,
  "message": "An unexpected error occurred. Please try again later."
}
```

## Database Schema

The `airports` table contains the following fields:
| Field | Type | Description |
|----------------|---------|------------------------------------|
| id | INTEGER | Autoincrement primary key for each record. |
| ident | TEXT | Unique identifier for the airport. |
| type | TEXT | Type of the airport. |
| name | TEXT | Name of the airport. |
| elevation_ft | INTEGER | Elevation in feet. |
| continent | TEXT | Continent code. |
| iso_country | TEXT | ISO country code. |
| iso_region | TEXT | ISO region code. |
| municipality | TEXT | Municipality/city name. |
| gps_code | TEXT | GPS code of the airport. |
| iata_code | TEXT | IATA code of the airport. |
| local_code | TEXT | Local code of the airport. |
| latitude | REAL | Latitude coordinate. |
| longitude | REAL | Longitude coordinate. |
| is_armforced | BOOLEAN | Whether the airport is for armed forces. |

## Contributing

Feel free to open issues or submit pull requests for improvements or bug fixes.

## Acknowledgments

Data sourced from [datasets/airport-codes](https://github.com/datasets/airport-codes).
