const fs = require("fs");

console.log("🔧 Fixing CSS imports...\n");

// =====================================================
// FIX IMPORT IN INDEX.JS
// =====================================================

if (fs.existsSync("src/index.js")) {
  let content = fs.readFileSync("src/index.js", "utf8");

  // Sostituisci @styles/ con percorso relativo
  content = content.replace(
    "import '@styles/index.css';",
    "import './styles/index.css';"
  );

  fs.writeFileSync("src/index.js", content);
  console.log("✅ Fixed: src/index.js");
  console.log("   Changed: @styles/index.css → ./styles/index.css");
}

// =====================================================
// FIX IMPORT IN APP.JS
// =====================================================

if (fs.existsSync("src/App.js")) {
  let content = fs.readFileSync("src/App.js", "utf8");

  // Rimuovi completamente l'import di App.css (ora è tutto in index.css)
  content = content.replace(
    "import '@styles/App.css';",
    "// CSS now imported via ./styles/index.css"
  );

  // Se c'è ancora il vecchio import, rimuovilo
  content = content.replace(
    "import './App.css';",
    "// CSS now imported via ./styles/index.css"
  );

  fs.writeFileSync("src/App.js", content);
  console.log("✅ Fixed: src/App.js");
  console.log("   Removed App.css import (now included in index.css)");
}

console.log("\n🎉 CSS imports fixed!");
console.log("\n📋 Current imports:");
console.log('   src/index.js → import "./styles/index.css"');
console.log("   src/App.js → no CSS import (all CSS via index.css)");
console.log("\n🚀 Try: npm start");
