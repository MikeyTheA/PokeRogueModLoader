import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, "src");
const outputFile = path.join(__dirname, "src/modloader/src", "all-modules.ts");

let currentNum = 0;
const directoryImports = {}; // Store imports by directory

function generateImportStatements(dir) {
  let imports = "";

  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    const relativePath = path.relative(srcDir, fullPath);

    if (fs.statSync(fullPath).isDirectory()) {
      imports += generateImportStatements(fullPath);
    } else if (
      file.endsWith(".ts") &&
      !file.endsWith(".d.ts") &&
      !relativePath.includes("locales") &&
      !relativePath.includes("test") &&
      !relativePath.includes("modloader") &&
      !relativePath.includes("@types") &&
      !relativePath.includes("main.ts")
    ) {
      const cleanPath = relativePath
        .replace(/\\/g, "/")
        .replace(/\.(ts|js)$/, "");
      currentNum += 1;

      const importStatement = `import * as a${currentNum} from '../../${cleanPath}';\n`;
      imports += importStatement;

      // Extract default export name from TypeScript file
      const defaultExportName = getDefaultExportName(fullPath);
      if (defaultExportName) {
        imports += `const ${defaultExportName} = a${currentNum}.default;\n`;
      }

      const dirKey = path.dirname(cleanPath).replace(/\\/g, "/");
      if (!directoryImports[dirKey]) {
        directoryImports[dirKey] = [];
      }
      directoryImports[dirKey].push(`${defaultExportName || `a${currentNum}`}`);
    }
  });

  return imports;
}

function getDefaultExportName(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const defaultExportRegex = /export default\s+class\s+(\w+)/;
    const match = fileContent.match(defaultExportRegex);
    if (match) {
      return match[1];
    }
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
  }
  return null;
}

let importStatements = generateImportStatements(srcDir);

importStatements += "let PokeRogue = {};\n";

Object.entries(directoryImports).forEach(([dir, entries]) => {
  const pathParts = dir !== "." ? dir.split("/") : [];
  let pathString = "";

  pathParts.forEach((part, index) => {
    pathString += `['${part}']`;
    const checkExistence = `if (!PokeRogue${pathString}) PokeRogue${pathString} = {};\n`;
    importStatements += checkExistence;
  });

  entries.forEach((entry) => {
    importStatements += `PokeRogue${pathString} = {...PokeRogue${pathString}, ${entry}};\n`;
  });
});

importStatements += "export default PokeRogue;\n";

try {
  fs.writeFileSync(outputFile, importStatements);
  console.log(`All modules imported and exported in: ${outputFile}`);
} catch (err) {
  console.error("Error while writing to outputFile:", err);
}
