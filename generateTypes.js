import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Determine __dirname in an ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, "build");
const outputFile = path.resolve(__dirname, "dist", "globals.d.ts");
const excludeDir = "modloader";

const walkDir = (dir, callback, namespacePrefix = "") => {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    const relativePath = path.relative(srcDir, fullPath);

    if (file === excludeDir || file.startsWith(".")) {
      return; // Skip excluded directories and hidden files/folders
    }

    if (fs.statSync(fullPath).isDirectory()) {
      const currentNamespace = namespacePrefix
        ? `${namespacePrefix}.${file}`
        : file; // Append dot only if namespacePrefix exists
      walkDir(fullPath, callback, currentNamespace);
    } else {
      callback(fullPath, namespacePrefix);
    }
  });
};

let combinedDeclarations = "";

walkDir(srcDir, (filePath, namespacePrefix) => {
  if (filePath.endsWith(".d.ts")) {
    let fileContent = fs.readFileSync(filePath, "utf-8");
    const imports = {};
    const importRegex =
      /^import\s+([\w*{}\s,]+?)\s+from\s+["']([^"']+)["'];$/gm;
    let match;

    while ((match = importRegex.exec(fileContent)) !== null) {
      const [, importedItems, importPath] = match;
      // Split imported items by comma and trim each item
      const items = importedItems.split(",").map((item) => item.trim());

      // Add each imported item to the imports dictionary with its full path
      items.forEach((item) => {
        imports[item] = importPath;
      });

      // Remove the import statement from fileContent
      fileContent = fileContent.replace(match[0], "");
    }

    console.log(imports);

    combinedDeclarations += `declare namespace PokeRogue${
      namespacePrefix.length > 0 ? "." : ""
    }${namespacePrefix} {\n`;
    combinedDeclarations +=
      fileContent
        .replace(/^/gm, "  ")
        .replace("export default class", "export class") + "\n";
    combinedDeclarations += "}\n\n";
  }
});

fs.writeFileSync(outputFile, combinedDeclarations);
console.log(`Combined .d.ts file created at: ${outputFile}`);
