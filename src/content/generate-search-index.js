import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const articlesDir = path.resolve(__dirname, "./article");
const outputDir = path.resolve(__dirname, "../../public");

try {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Read all markdown files
  const files = fs.readdirSync(articlesDir).filter((f) => f.endsWith(".md"));
  
  if (files.length === 0) {
    console.log("No hay archivos .md en la carpeta de artículos.");
    process.exit(0);
  }

  // Generate search index
  const index = files.map((filename) => {
    const filePath = path.join(articlesDir, filename);
    const content = fs.readFileSync(filePath, "utf8");
    const { data } = matter(content);
    
    return {
      title: data.title || "Sin título",
      description: data.description || "",
      author: data.author || "Autor desconocido",
      category: data.category || "Sin categoría",
      tags: Array.isArray(data.tags) ? data.tags : [],
      slug: filename.replace(/\.md$/, ""),
    };
  });

  // Write search index to public directory
  const outputPath = path.join(outputDir, "search-index.json");
  fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));

  console.log(`✅ Índice de búsqueda generado correctamente con ${index.length} artículos.`);
  console.log(`📁 Archivo creado en: ${outputPath}`);
  
} catch (error) {
  console.error("❌ Error generando el índice de búsqueda:", error);
  process.exit(1);
}
