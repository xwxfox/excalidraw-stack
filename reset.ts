import fs from "fs/promises";

console.log("Copying original files to ./app");
try {
  fs.copyFile(
    "./patches/original/env.cjs",
    "./app/packages/excalidraw/env.cjs"
  );
  fs.copyFile("./patches/original/Dockerfile", "./app/Dockerfile");
  fs.copyFile(
    "./patches/original/library.ts",
    "./app/packages/excalidraw/data/library.ts"
  );

  const backupExists = await fs.exists(
    "./app/packages/excalidraw/data/library.ts.bak.txt"
  );

  const patchFileExists = await fs.exists("./app/patch.ts");

  if (backupExists) {
    await fs.unlink("./app/packages/excalidraw/data/library.ts.bak.txt");
    console.log(
      "Removed backup file ./app/packages/excalidraw/data/library.ts.bak.txt"
    );
  }

  if (patchFileExists) {
    await fs.unlink("./app/patch.ts");
    console.log("Removed patch file ./app/patch.ts");
  }

  console.log("Successfully copied original files to ./app");
} catch (e) {
  console.error("Failed to copy original files:", e);
  throw e;
}
