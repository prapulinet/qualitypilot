import { readFile, writeFile } from "node:fs/promises";
import { parseJSON, checkContract, contractJUnit } from "../web/sdet-model.js";
const args = process.argv.slice(2);
try {
  if (args.length !== 2 && !(args.length === 4 && args[2] === "--junit"))
    throw Error(
      "Usage: node tools/check-contract.js suite.json response.json [--junit results.xml]",
    );
  const read = async (path, label) => {
    const raw = await readFile(path);
    if (raw.length > 1024 * 1024) throw Error(`${label} exceeds 1 MB.`);
    return parseJSON(raw.toString("utf8"), label);
  };
  const report = checkContract(
    await read(args[0], "Suite"),
    await read(args[1], "Response"),
  );
  if (args[3]) await writeFile(args[3], contractJUnit(report), "utf8");
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.passed ? 0 : 1;
} catch (error) {
  if (args.length === 4 && args[2] === "--junit") {
    try {
      await writeFile(
        args[3],
        contractJUnit({
          suite: "Contract input validation",
          results: [
            {
              name: "Input validation failed",
              path: "",
              op: "exists",
              passed: false,
              actual: error.message,
            },
          ],
        }),
        "utf8",
      );
    } catch (writeError) {
      console.error(`JUnit could not be written: ${writeError.message}`);
    }
  }
  console.error(error.message);
  process.exitCode = 2;
}
