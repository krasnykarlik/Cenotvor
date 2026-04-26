import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ARES Proxy Route
  app.post("/api/ares/search", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Missing query" });
      }

      const url = "https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/vyhledat";
      const cleanQuery = query.replace(/\s/g, '');
      const isIco = /^\d+$/.test(cleanQuery) && cleanQuery.length <= 8;

      const payload: any = {
        start: 0,
        pocet: 20
      };

      if (isIco) {
        payload.ico = [cleanQuery.padStart(8, '0')];
      } else {
        payload.obchodniJmeno = query.trim();
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "CenotvurceApp/1.0 (krasnykarlik@gmail.com)"
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorBody = "";
        try {
          errorBody = await response.text();
        } catch (e) {
          errorBody = "Could not read error body";
        }
        
        // Handle "Too many results" gracefully instead of throwing
        if (response.status === 400 && errorBody.includes("VYSTUP_PRILIS_MNOHO_VYSLEDKU")) {
          console.warn("ARES: Too many results for query:", query);
          return res.json([]);
        }

        console.error(`ARES Error Status: ${response.status}, Body: ${errorBody}`);
        throw new Error(`ARES responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.ekonomickeSubjekty || data.ekonomickeSubjekty.length === 0) {
        return res.json([]);
      }

      const results = data.ekonomickeSubjekty.map((s: any) => {
        const sidlo = s.sidlo || {};
        const ulice = sidlo.nazevUlice || sidlo.nazevObce || "";
        let cislo = "";
        
        if (sidlo.cisloDomovni) {
          cislo += sidlo.cisloDomovni;
          if (sidlo.cisloOrientacni) cislo += "/" + sidlo.cisloOrientacni;
        }
        
        const radekUlice = (ulice + " " + cislo).trim();
        
        let psc = sidlo.psc ? String(sidlo.psc) : "";
        if (psc.length === 5) psc = psc.substring(0, 3) + " " + psc.substring(3);
        
        const radekMesto = (psc + " " + (sidlo.nazevObce || "")).trim();
        const fullAddress = sidlo.textovaAdresa || (radekUlice + ", " + radekMesto);

        return {
          obchodniJmeno: s.obchodniJmeno,
          ico: s.ico,
          dic: s.dic || s.dicSkDph || "",
          address: {
            ulice: radekUlice,
            mesto: radekMesto,
            full: fullAddress
          }
        };
      });

      res.json(results);
    } catch (error) {
      console.error("ARES Search Error:", error);
      res.status(500).json({ error: "Failed to search in ARES" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
