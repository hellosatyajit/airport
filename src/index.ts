import { Hono } from "hono";
import { z } from "zod";
import { validator } from "hono/validator";
import { cors } from "hono/cors";
import type { D1Database } from "@cloudflare/workers-types";
import { html } from "./html";

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "/*",
  cors({
    origin: "*",
  })
);

const querySchema = z.object({
  q: z.string().optional().default(""),
  name: z.string().optional(),
  city: z.string().optional(),
  type: z
    .enum([
      "airport",
      "heliport",
      "large_airport",
      "medium_airport",
      "small_airport",
    ])
    .optional(),
  country: z.string().length(2).optional(),
  armforced: z.enum(["true", "false"]).optional(),
  ident: z.string().optional(),
  iata: z.string().optional(),
  limit: z.coerce.number().positive().default(10),
  offset: z.coerce.number().nonnegative().default(0),
});

app.get("/", (c) => c.html(html));

app.get(
  "/search",
  validator("query", (v, c) => {
    const parsed = querySchema.safeParse(v);
    if (!parsed.success) {
      return c.json(
        { success: false, message: "Invalid query parameters" },
        400
      );
    }
    return parsed.data;
  }),
  async (c) => {
    const {
      q: searchQuery,
      name,
      city,
      type,
      country,
      armforced,
      ident,
      iata,
      limit,
      offset,
    } = c.req.valid("query");

    let query = `
      WITH scored_results AS (
        SELECT 
          *,
          CASE 
            WHEN ? IS NOT NULL THEN (
              CASE 
                WHEN name LIKE ? THEN 100
                WHEN iata_code LIKE ? THEN 90
                WHEN municipality LIKE ? THEN 80
                WHEN name LIKE ? THEN 50
                WHEN iata_code LIKE ? THEN 40
                WHEN municipality LIKE ? THEN 30
                ELSE 0
              END
            )
            ELSE 0
          END as relevance_score
        FROM airports 
        WHERE 1=1
    `;

    const params: any[] = [];

    params.push(
      searchQuery,
      `${searchQuery}`,
      `${searchQuery}`,
      `${searchQuery}`,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
      `%${searchQuery}%`
    );

    if (name) {
      query += ` AND name LIKE ?`;
      params.push(`%${name}%`);
    }

    if (city) {
      query += ` AND municipality LIKE ?`;
      params.push(`%${city}%`);
    }

    if (type) {
      if (type === "airport") {
        query += ` AND (type = 'large_airport' OR type = 'medium_airport')`;
      } else {
        query += ` AND type = ?`;
        params.push(type);
      }
    }

    if (country) {
      query += ` AND iso_country = ?`;
      params.push(country);
    }

    if (armforced === "true") {
      query += ` AND is_armforced = 1`;
    } else if (armforced === "false") {
      query += ` AND is_armforced = 0`;
    }

    if (ident) {
      query += ` AND ident LIKE ?`;
      params.push(`${ident}`);
    }

    if (iata) {
      query += ` AND iata_code LIKE ?`;
      params.push(`${iata}`);
    }

    query += `
      )
      SELECT id, ident, type, name, elevation_ft, continent, iso_country, iso_region, municipality, gps_code, iata_code, local_code, latitude, longitude, is_armforced 
      FROM scored_results
      WHERE relevance_score > 0 
      ORDER BY relevance_score DESC, name ASC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    try {
      const results = await c.env.DB.prepare(query)
        .bind(...params)
        .all();

      return c.json({
        success: true,
        length: results.results?.length || 0,
        data: results.results,
      });
    } catch (err) {
      console.error(err);
      return c.json(
        {
          success: false,
          message: "An unexpected error occurred. Please try again later.",
        },
        500
      );
    }
  }
);

export default app;
