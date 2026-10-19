// Regenerates src/lib/registrar-artifact.ts from the forge build output.
import { readFileSync, writeFileSync } from "node:fs";
const a = JSON.parse(readFileSync("contracts/out/IsWorkingRegistrar.sol/IsWorkingRegistrar.json", "utf8"));
writeFileSync(
  "src/lib/registrar-artifact.ts",
  "// Generated from contracts/out/IsWorkingRegistrar.sol (forge build). Do not edit by hand.\n" +
    `export const REGISTRAR_ABI = ${JSON.stringify(a.abi, null, 2)} as const;\n\n` +
    `export const REGISTRAR_BYTECODE = "${a.bytecode.object}" as const;\n`,
);
console.log("Wrote src/lib/registrar-artifact.ts");
