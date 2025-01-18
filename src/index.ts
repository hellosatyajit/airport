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
  q: z.string().optional(),
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
      limit,
      offset,
    } = c.req.valid("query");

    let query = `SELECT * FROM airports WHERE 1=1`;
    const params: any[] = [];

    if (searchQuery) {
      query += ` AND (name LIKE ? OR municipality LIKE ?)`;
      params.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }

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

    query += ` LIMIT ? OFFSET ?`;
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
