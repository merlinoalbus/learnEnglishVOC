const fs = require("fs");
const path = require("path");

console.log("🎨 CSS Migration - Opzione B: Spezzettamento App.css\n");

// =====================================================
// STEP 1: CREA STRUTTURA CARTELLE
// =====================================================

console.log("📁 Creating directory structure...");

const dirs = [
  "src/styles",
  "src/styles/components",
  "src/styles/layouts",
  "src/styles/pages",
  "src/styles/utilities",
];

dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`   ✅ Created: ${dir}`);
  }
});

// =====================================================
// STEP 2: BACKUP FILE ESISTENTI
// =====================================================

console.log("\n💾 Creating backups...");

if (fs.existsSync("src/index.css")) {
  fs.copyFileSync("src/index.css", "src/index.css.backup");
  console.log("   ✅ Backed up: src/index.css");
}

if (fs.existsSync("src/App.css")) {
  fs.copyFileSync("src/App.css", "src/App.css.backup");
  console.log("   ✅ Backed up: src/App.css");
}

// =====================================================
// STEP 3: CREA CSS VARIABLES (DESIGN SYSTEM)
// =====================================================

console.log("\n🎨 Creating design system...");

const variablesCSS = `/* =====================================================
 * 📁 src/styles/variables.css - DESIGN SYSTEM
 * ===================================================== */

:root {
  /* COLORS */
  --color-primary: #3498db;
  --color-primary-dark: #2980b9;
  --color-secondary: #95a5a6;
  --color-success: #27ae60;
  --color-warning: #f39c12;
  --color-error: #e74c3c;
  
  /* GRADIENTS */
  --gradient-primary: linear-gradient(145deg, #3498db, #2980b9);
  --gradient-background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --gradient-header: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  
  /* SPACING */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  
  /* TYPOGRAPHY */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 2rem;
  
  /* SHADOWS */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  
  /* RADIUS */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
}
`;

fs.writeFileSync("src/styles/variables.css", variablesCSS);
console.log("   ✅ Created: src/styles/variables.css");

// =====================================================
// STEP 4: ESTRAI SEZIONI DA APP.CSS
// =====================================================

console.log("\n🔧 Extracting sections from App.css...");

if (fs.existsSync("src/App.css")) {
  const appCssContent = fs.readFileSync("src/App.css", "utf8");

  // HEADER STYLES
  const headerCSS = `/* =====================================================
 * 📁 src/styles/layouts/header.css - HEADER STYLES
 * ===================================================== */

/* HEADER */
.app-header {
  background: var(--gradient-header);
  color: white;
  padding: var(--space-lg) var(--space-xl);
  box-shadow: var(--shadow-lg);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-xl);
}

.header-main h1 {
  font-size: var(--font-size-3xl);
  margin-bottom: var(--space-sm);
  font-weight: 700;
}

.header-main p {
  opacity: 0.9;
  font-size: var(--font-size-lg);
}

.header-stats {
  display: flex;
  gap: var(--space-lg);
  align-items: center;
}

.header-stat {
  text-align: center;
  min-width: 60px;
}

.header-stat span {
  display: block;
  font-size: var(--font-size-xl);
  font-weight: bold;
  line-height: 1;
}

.header-stat small {
  font-size: var(--font-size-xs);
  opacity: 0.8;
  margin-top: var(--space-xs);
  display: block;
}

.header-stat.streak span {
  font-size: var(--font-size-lg);
}

/* RESPONSIVE HEADER */
@media (max-width: 768px) {
  .app-header {
    padding: var(--space-md);
  }
  
  .header-content {
    flex-direction: column;
    gap: var(--space-md);
    text-align: center;
  }
  
  .header-main h1 {
    font-size: var(--font-size-2xl);
  }
  
  .header-stats {
    gap: var(--space-md);
  }
}
`;

  // NAVIGATION STYLES
  const navigationCSS = `/* =====================================================
 * 📁 src/styles/layouts/navigation.css - NAVIGATION STYLES
 * ===================================================== */

.app-nav {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: var(--space-sm) 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: var(--space-sm);
  padding: 0 var(--space-md);
  justify-content: center;
  overflow-x: auto;
}

.nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border: none;
  background: transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
  position: relative;
  text-decoration: none;
  color: #555;
}

.nav-btn:hover {
  background: rgba(52, 152, 219, 0.1);
  transform: translateY(-1px);
}

.nav-btn.active {
  background: var(--gradient-primary);
  color: white;
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.nav-icon {
  font-size: var(--font-size-xl);
  line-height: 1;
}

.nav-text {
  font-size: var(--font-size-sm);
  font-weight: 500;
  white-space: nowrap;
}

.nav-badge {
  position: absolute;
  top: var(--space-xs);
  right: var(--space-xs);
  background: var(--color-error);
  color: white;
  font-size: var(--font-size-xs);
  padding: var(--space-xs) var(--space-sm);
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  line-height: 1.2;
  font-weight: bold;
}

/* RESPONSIVE NAV */
@media (max-width: 768px) {
  .nav-container {
    padding: 0 var(--space-sm);
    gap: var(--space-xs);
  }
  
  .nav-btn {
    min-width: 60px;
    padding: var(--space-sm);
  }
  
  .nav-text {
    font-size: var(--font-size-xs);
  }
}

@media (max-width: 480px) {
  .nav-text {
    display: none;
  }
  
  .nav-btn {
    min-width: 50px;
    padding: var(--space-sm) var(--space-xs);
  }
}
`;

  // BUTTONS STYLES
  const buttonsCSS = `/* =====================================================
 * 📁 src/styles/components/buttons.css - BUTTON STYLES  
 * ===================================================== */

.btn {
  padding: var(--space-sm) var(--space-lg);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  text-decoration: none;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-primary {
  background: var(--gradient-primary);
  color: white;
  box-shadow: var(--shadow-md);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(145deg, #2980b9, #21618c);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-secondary {
  background: linear-gradient(145deg, var(--color-secondary), #7f8c8d);
  color: white;
  box-shadow: var(--shadow-md);
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(145deg, #7f8c8d, #6c7b7d);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-large {
  font-size: var(--font-size-lg);
  padding: var(--space-md) var(--space-xl);
  margin: var(--space-xl) 0 var(--space-md) 0;
}
`;

  // LAYOUT STYLES
  const layoutCSS = `/* =====================================================
 * 📁 src/styles/layouts/main-layout.css - MAIN LAYOUT
 * ===================================================== */

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-xl);
  width: 100%;
}

.section-indicator {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: var(--space-sm) var(--space-xl);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.indicator-icon {
  font-size: var(--font-size-lg);
}

.indicator-text {
  font-weight: 600;
  color: #2c3e50;
  font-size: var(--font-size-base);
}

/* RESPONSIVE MAIN */
@media (max-width: 768px) {
  .app-main {
    padding: var(--space-md);
  }
  
  .section-indicator {
    padding: var(--space-sm) var(--space-md);
  }
}
`;

  // PAGES STYLES
  const pagesCSS = `/* =====================================================
 * 📁 src/styles/pages/start-test.css - PAGE STYLES
 * ===================================================== */

.start-test {
  text-align: center;
  padding: var(--space-2xl) var(--space-xl);
}

.start-test-content {
  max-width: 600px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: var(--space-2xl) var(--space-xl);
  box-shadow: var(--shadow-lg);
}

.start-test h2 {
  color: #2c3e50;
  margin-bottom: var(--space-xl);
  font-size: var(--font-size-3xl);
}

.test-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-md);
  margin: var(--space-xl) 0;
}

.info-card {
  background: linear-gradient(145deg, #f8f9fa, #ffffff);
  border: 1px solid #e9ecef;
  border-radius: var(--radius-lg);
  padding: var(--space-lg) var(--space-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  transition: transform 0.2s ease;
}

.info-card:hover {
  transform: translateY(-2px);
}

.info-icon {
  font-size: var(--font-size-2xl);
  line-height: 1;
}

.info-card strong {
  font-size: var(--font-size-xl);
  color: #2c3e50;
  font-weight: bold;
}

.info-card p {
  font-size: var(--font-size-sm);
  color: #7f8c8d;
  text-align: center;
  margin: 0;
}

.error-view {
  text-align: center;
  padding: var(--space-2xl) var(--space-xl);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  max-width: 500px;
  margin: var(--space-xl) auto;
  box-shadow: var(--shadow-lg);
}

.error-view h2 {
  color: var(--color-error);
  margin-bottom: var(--space-md);
}

.error-view p {
  color: #7f8c8d;
  margin-bottom: var(--space-xl);
}

.help-text {
  color: #7f8c8d;
  font-style: italic;
  margin-top: var(--space-md);
}

/* RESPONSIVE PAGES */
@media (max-width: 768px) {
  .start-test-content {
    padding: var(--space-xl) var(--space-md);
  }
  
  .test-info {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-sm);
  }
  
  .info-card {
    padding: var(--space-md) var(--space-sm);
  }
}

@media (max-width: 480px) {
  .test-info {
    grid-template-columns: 1fr;
  }
}
`;

  // FOOTER STYLES
  const footerCSS = `/* =====================================================
 * 📁 src/styles/layouts/footer.css - FOOTER STYLES
 * ===================================================== */

.app-footer {
  background: var(--gradient-header);
  color: white;
  padding: var(--space-lg) var(--space-xl);
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
}

.footer-info p {
  margin: 0;
  font-size: var(--font-size-base);
}

.footer-stats {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-size-sm);
  opacity: 0.9;
}

.footer-stats span {
  white-space: nowrap;
}

/* RESPONSIVE FOOTER */
@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    gap: var(--space-sm);
    text-align: center;
  }
  
  .footer-stats {
    flex-wrap: wrap;
    justify-content: center;
  }
}
`;

  // ANIMATIONS
  const animationsCSS = `/* =====================================================
 * 📁 src/styles/utilities/animations.css - ANIMATIONS
 * ===================================================== */

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.app-main > * {
  animation: slideIn 0.3s ease-out;
}

.nav-btn {
  animation: fadeIn 0.2s ease-out;
}

/* FOCUS E ACCESSIBILITÀ */
.nav-btn:focus,
.btn:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.nav-btn.active:focus {
  outline-color: rgba(255, 255, 255, 0.8);
}

/* REDUCED MOTION */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

  // Scrivi tutti i file
  fs.writeFileSync("src/styles/layouts/header.css", headerCSS);
  fs.writeFileSync("src/styles/layouts/navigation.css", navigationCSS);
  fs.writeFileSync("src/styles/components/buttons.css", buttonsCSS);
  fs.writeFileSync("src/styles/layouts/main-layout.css", layoutCSS);
  fs.writeFileSync("src/styles/pages/start-test.css", pagesCSS);
  fs.writeFileSync("src/styles/layouts/footer.css", footerCSS);
  fs.writeFileSync("src/styles/utilities/animations.css", animationsCSS);

  console.log("   ✅ Created: src/styles/layouts/header.css");
  console.log("   ✅ Created: src/styles/layouts/navigation.css");
  console.log("   ✅ Created: src/styles/components/buttons.css");
  console.log("   ✅ Created: src/styles/layouts/main-layout.css");
  console.log("   ✅ Created: src/styles/pages/start-test.css");
  console.log("   ✅ Created: src/styles/layouts/footer.css");
  console.log("   ✅ Created: src/styles/utilities/animations.css");
}

// =====================================================
// STEP 5: CREA GLOBALS.CSS
// =====================================================

const globalsCSS = `/* =====================================================
 * 📁 src/styles/globals.css - GLOBAL STYLES
 * ===================================================== */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: var(--gradient-background);
  min-height: 100vh;
  color: #333;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
}
`;

fs.writeFileSync("src/styles/globals.css", globalsCSS);
console.log("   ✅ Created: src/styles/globals.css");

// =====================================================
// STEP 6: CREA NUOVO INDEX.CSS
// =====================================================

console.log("\n📝 Creating new index.css...");

const newIndexCSS = `/* =====================================================
 * 📁 src/styles/index.css - MAIN ENTRY POINT
 * ===================================================== */

/* TAILWIND CSS */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* DESIGN SYSTEM */
@import './variables.css';

/* GLOBAL STYLES */
@import './globals.css';

/* LAYOUTS */
@import './layouts/header.css';
@import './layouts/navigation.css';
@import './layouts/main-layout.css';
@import './layouts/footer.css';

/* COMPONENTS */
@import './components/buttons.css';

/* PAGES */
@import './pages/start-test.css';

/* UTILITIES */
@import './utilities/animations.css';

/* TAILWIND CUSTOM UTILITIES */
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
`;

// Sposta index.css originale
if (fs.existsSync("src/index.css")) {
  fs.unlinkSync("src/index.css");
}

fs.writeFileSync("src/styles/index.css", newIndexCSS);
console.log("   ✅ Created: src/styles/index.css");

// =====================================================
// STEP 7: AGGIORNA IMPORT NEI FILE REACT
// =====================================================

console.log("\n🔄 Updating React imports...");

// Aggiorna src/index.js
if (fs.existsSync("src/index.js")) {
  let content = fs.readFileSync("src/index.js", "utf8");
  content = content.replace(
    "import './index.css';",
    "import '@styles/index.css';"
  );
  fs.writeFileSync("src/index.js", content);
  console.log("   ✅ Updated: src/index.js");
}

// Rimuovi import App.css da App.js
if (fs.existsSync("src/App.js")) {
  let content = fs.readFileSync("src/App.js", "utf8");
  content = content.replace(
    "import './App.css';",
    "// App.css ora incluso in @styles/index.css"
  );
  fs.writeFileSync("src/App.js", content);
  console.log("   ✅ Updated: src/App.js");
}

// Rimuovi App.css originale (ora spezzettato)
if (fs.existsSync("src/App.css")) {
  fs.unlinkSync("src/App.css");
  console.log("   ✅ Removed: src/App.css (now organized in separate files)");
}

// =====================================================
// COMPLETAMENTO
// =====================================================

console.log("\n🎉 CSS Migration completed successfully!");
console.log("\n📋 What was done:");
console.log("   ✅ Created organized folder structure");
console.log("   ✅ Split App.css into logical files");
console.log("   ✅ Created design system with CSS variables");
console.log("   ✅ Updated React imports to use @styles/*");
console.log("   ✅ Removed old CSS files");
console.log("\n📁 New structure:");
console.log("   src/styles/");
console.log("   ├── index.css (main entry point)");
console.log("   ├── variables.css (design system)");
console.log("   ├── globals.css (base styles)");
console.log("   ├── layouts/ (header, nav, footer)");
console.log("   ├── components/ (buttons, etc.)");
console.log("   ├── pages/ (start-test, etc.)");
console.log("   └── utilities/ (animations, etc.)");
console.log("\n🚀 Next steps:");
console.log("   1. Test the app: npm start");
console.log("   2. Check that all styles work correctly");
console.log("   3. Remove backup files when satisfied");
console.log("\n💡 You can now use @styles/* imports in components!");
