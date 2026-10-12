const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const source = ts.createSourceFile('app.js', fs.readFileSync(path.join(root, 'design-lab/app.js'), 'utf8'), ts.ScriptTarget.Latest, true);
let icons = {};
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'iconPaths') icons = new Function('return (' + node.initializer.getText(source) + ')')();
  if (ts.isCallExpression(node) && node.expression.getText(source) === 'Object.assign' && node.arguments[0]?.getText(source) === 'iconPaths') Object.assign(icons, new Function('return (' + node.arguments[1].getText(source) + ')')());
  ts.forEachChild(node, visit);
}
visit(source);
fs.mkdirSync(path.join(root, 'components/clarity'), { recursive: true });
fs.writeFileSync(path.join(root, 'components/clarity/icon-paths.ts'), '// Generated from the approved prototype by scripts/sync-native-design.cjs.\nexport const iconPaths: Record<string, string> = ' + JSON.stringify(icons, null, 2) + ';\n');
console.log(`Copied ${Object.keys(icons).length} approved SVG paths.`);
