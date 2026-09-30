const fs = require('fs');
let code = fs.readFileSync('d:/IARCM/app/page.tsx', 'utf8');

code = code.replace(
  /<div style=\{\{ marginTop: 15, borderTop: "1px solid var\(--line\)", paddingTop: 12, color: "#8199a8", fontSize: 9, lineHeight: 1\.7 \}\}>/g,
  '<div className="text-micro" style={{ marginTop: 15, borderTop: "1px solid var(--line)", paddingTop: 12, color: "#8199a8", lineHeight: 1.7 }}>'
);
code = code.replace(
  /<div style=\{\{ marginTop: 14, border: "1px solid rgba\(237,189,120,\.14\)", borderRadius: 8, background: "rgba\(237,189,120,\.04\)", padding: 11, color: "#b7a17f", fontSize: 9, lineHeight: 1\.7 \}\}>/g,
  '<div className="text-micro" style={{ marginTop: 14, border: "1px solid rgba(237,189,120,.14)", borderRadius: 8, background: "rgba(237,189,120,.04)", padding: 11, color: "#b7a17f", lineHeight: 1.7 }}>'
);
code = code.replace(
  /<footer style=\{\{ display: "flex", justifyContent: "space-between", gap: 15, marginTop: 24, borderTop: "1px solid var\(--line\)", paddingTop: 13, color: "#607b8a", fontSize: 9 \}\}>/g,
  '<footer className="text-micro" style={{ display: "flex", justifyContent: "space-between", gap: 15, marginTop: 24, borderTop: "1px solid var(--line)", paddingTop: 13, color: "#607b8a" }}>'
);

fs.writeFileSync('d:/IARCM/app/page.tsx', code);
