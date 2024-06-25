import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Determine __dirname in an ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, "build");
const outputFile = path.resolve(__dirname, "dist", "globals.d.ts");
const excludeDir = ["modloader", "test"];

function adjustImportPath(filePath, importPath) {
  const buildDir = srcDir;
  const relativeFilePath = path.relative(buildDir, filePath);
  const fileDir = path.dirname(relativeFilePath);

  const absoluteImportPath = path.resolve(fileDir, importPath);

  const adjustedImportPath = path
    .relative("", absoluteImportPath)
    .replace(/\\/g, "/");

  return adjustedImportPath.startsWith(".")
    ? adjustedImportPath
    : "./" + adjustedImportPath;
}

const walkDir = (dir, callback, namespacePrefix = "") => {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);

    if (excludeDir.includes(file) || file.startsWith(".")) {
      return; // Skip excluded directories and hidden files/folders
    }

    if (fs.statSync(fullPath).isDirectory()) {
      const currentNamespace = namespacePrefix
        ? `${namespacePrefix}.${file}`
        : file;
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
    const importRegex = /^import\s+([\s\S]+?)\s+from\s+["']([^"']+)["'];$/gm;
    let match;
    const imports = {};
    while ((match = importRegex.exec(fileContent)) !== null) {
      let [, importedItems, importPath] = match;
      const items = importedItems
        .replace(/[{}]/g, "")
        .replace("default as ", "")
        .split(",")
        .map((item) => item.trim());

      if (!(importPath.startsWith("#") || importPath.startsWith("."))) {
        continue;
      }

      if (importPath.startsWith("#app/")) {
        importPath = importPath.slice(5).split("/");
        importPath.pop();
        importPath = importPath.join(".");
        importPath = `.${importPath}`;
      } else if (importPath.startsWith("#enums/")) {
        importPath = importPath.slice(6).split("/");
        importPath.pop();
        importPath = importPath.join(".");
        importPath = `.enums${importPath}`;
      } else {
        importPath = adjustImportPath(filePath, importPath);
        console.log(importPath);
        importPath = importPath.slice(1);
        importPath = importPath.split("/");
        importPath.pop();
        importPath = importPath.join(".");
      }

      if (importPath === ".") {
        importPath = "";
      }

      console.log(items, importPath);

      items.forEach((item) => {
        imports[item] = importPath;
      });

      fileContent = fileContent.replace(match[0], `//${match[0]}`);
    }

    fileContent = fileContent.replace(
      /extends\s+([A-Za-z0-9_]+)/g,
      (match, baseClassName) => {
        if (imports.hasOwnProperty(baseClassName)) {
          return `extends PokeRogue${imports[baseClassName]}.${baseClassName}`;
        } else {
          return match;
        }
      }
    );

    fileContent = fileContent.replace(
      /([A-Za-z0-9_]+):\s+([A-Za-z0-9_]+)/g,
      (match, propertyName, propertyType) => {
        if (imports.hasOwnProperty(propertyType)) {
          return `${propertyName}: PokeRogue${imports[propertyType]}.${propertyType}`;
        } else {
          return match;
        }
      }
    );

    combinedDeclarations += `declare namespace PokeRogue${
      namespacePrefix ? `.${namespacePrefix}` : ""
    } {\n`;
    combinedDeclarations +=
      fileContent.replace(/^/gm, "  ").replace(/export default/g, "export") +
      "\n";
    combinedDeclarations += "}\n\n";
  }
});

combinedDeclarations = combinedDeclarations.replace(/private/g, "public");

combinedDeclarations = combinedDeclarations.replace(
  /^\s*export\s+\w+;\s*$/gm,
  ""
);

fs.writeFileSync(outputFile, combinedDeclarations);
console.log(`Combined .d.ts file created at: ${outputFile}`);
