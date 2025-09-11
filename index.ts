import { parse, stringify } from "yaml";
import fs from "fs/promises";
import type { AppBuildArgs, ComposerStack } from "./types";
import Bun from "bun";
import { Project, ts } from "ts-morph";

const FIREBASE_CONFIG =
  '{"apiKey":"AIzaSyAd15pYlMci_xIp9ko6wkEsDzAAA0Dn0RU","authDomain":"excalidraw-room-persistence.firebaseapp.com","databaseURL":"https://excalidraw-room-persistence.firebaseio.com","projectId":"excalidraw-room-persistence","storageBucket":"excalidraw-room-persistence.appspot.com","messagingSenderId":"654800341332","appId":"1:654800341332:web:4a692de832b55bd57ce0c1"}';

function genRandomString(length = 12): string {
  const bytes = Bun.randomUUIDv7().replace(/-/g, "");
  const hash = new Bun.SHA256().update(bytes).digest("hex");
  return hash.slice(0, length);
}

const yml = await fs.readFile("./compose.template", "utf8");
const doc = parse(yml) as ComposerStack;

console.log(doc.services.app.build!.args?.NODE_ENV);

function main() {
  console.log("hiii :3");

  const rootDomain = ask("Enter root domain (e.g. domain.gay)");
  if (!rootDomain) {
    console.log("Root domain is required. Exiting.");
    return;
  }

  const customizeSubsRaw = ask(
    "Customize subdomains individually for services? (y/N)",
    "N"
  ).toLowerCase();
  const doCustomizeSubs =
    customizeSubsRaw === "y" || customizeSubsRaw === "yes";

  const autoGenCredsRaw = ask(
    "Auto-generate usernames and passwords for MongoDB & MongoExpress? (Y/n)",
    "Y"
  ).toLowerCase();
  const doAutoGenCreds =
    autoGenCredsRaw === "y" ||
    autoGenCredsRaw === "yes" ||
    autoGenCredsRaw === "";

  let appHost = "";
  let roomHost = "";
  let storageHost = "";

  if (doCustomizeSubs) {
    appHost =
      ask(`Enter APP_HOST subdomain (e.g. excalidraw)`, `excalidraw`) +
      `.${rootDomain}`;
    roomHost =
      ask(
        `Enter ROOM_HOST subdomain (e.g. excalidraw-room)`,
        `excalidraw-room`
      ) + `.${rootDomain}`;
    storageHost =
      ask(
        `Enter STORAGE_BACKEND_HOST subdomain (e.g. excalidraw-storage)`,
        `excalidraw-storage`
      ) + `.${rootDomain}`;
  } else {
    appHost = `excalidraw.${rootDomain}`;
    roomHost = `excalidraw-room.${rootDomain}`;
    storageHost = `excalidraw-storage.${rootDomain}`;
  }

  let dbUser = "mongodb_user";
  let dbPass = "mongodb_password";
  let meUser = "mongoexpress_user";
  let mePass = "mongoexpress_pass";

  if (doAutoGenCreds) {
    dbUser = "mongodb_" + genRandomString(6);
    dbPass = genRandomString(12);
    meUser = "mongoexpress_" + genRandomString(6);
    mePass = genRandomString(12);
  } else {
    dbUser = ask("Enter MongoDB username", dbUser);
    dbPass = ask("Enter MongoDB password", dbPass);
    meUser = ask("Enter MongoExpress username", meUser);
    mePass = ask("Enter MongoExpress password", mePass);
  }

  const AppEnv = {
    NODE_ENV: "development",
    VITE_APP_BACKEND_V2_GET_URL: `https://${storageHost}/api/v2/scenes/`,
    VITE_APP_BACKEND_V2_POST_URL: `https://${storageHost}/api/v2/scenes/`,
    VITE_APP_LIBRARY_URL: `https://${storageHost}`,
    VITE_APP_LIBRARY_BACKEND: `https://${storageHost}/libraries`,
    VITE_APP_PLUS_LP: `https://${appHost}`,
    VITE_APP_PLUS_APP: `https://${appHost}`,
    VITE_APP_AI_BACKEND: "https://oss-ai.excalidraw.com",
    VITE_APP_WS_SERVER_URL: `https://${roomHost}/`,
    VITE_APP_FIREBASE_CONFIG: FIREBASE_CONFIG,
    VITE_APP_HTTP_STORAGE_BACKEND_URL: `https://${storageHost}/api/v2`,
    VITE_APP_STORAGE_BACKEND: "http",
    VITE_APP_ENABLE_TRACKING: "false",
    PUBLIC_URL: `https://${appHost}`,
    VITE_APP_DEV_DISABLE_LIVE_RELOAD: "true",
    VITE_APP_PLUS_EXPORT_PUBLIC_KEY: `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApQ0jM9Qz8TdFLzcuAZZX
/WvuKSOJxiw6AR/ZcE3eFQWM/mbFdhQgyK8eHGkKQifKzH1xUZjCxyXcxW6ZO02t
kPOPxhz+nxUrIoWCD/V4NGmUA1lxwHuO21HN1gzKrN3xHg5EGjyouR9vibT9VDGF
gq6+4Ic/kJX+AD2MM7Yre2+FsOdysrmuW2Fu3ahuC1uQE7pOe1j0k7auNP0y1q53
PrB8Ts2LUpepWC1l7zIXFm4ViDULuyWXTEpUcHSsEH8vpd1tckjypxCwkipfZsXx
iPszy0o0Dx2iArPfWMXlFAI9mvyFCyFC3+nSvfyAUb2C4uZgCwAuyFh/ydPF4DEE
PQIDAQAB`,
    VITE_APP_DEBUG_ENABLE_TEXT_CONTAINER_BOUNDING_BOX: "false",
    VITE_APP_COLLAPSE_OVERLAY: "false",
    VITE_APP_ENABLE_ESLINT: "false",
    FAST_REFRESH: "false",
    VITE_APP_ENABLE_PWA: "true",
  } as Record<AppBuildArgs, string>;

  const StorageEnv = {
    STORAGE_URI: `mongodb://${dbUser}:${dbPass}@mongodb:27017`,
  } as Record<string, string>;

  const MongodbEnv = {
    MONGO_INITDB_ROOT_USERNAME: dbUser,
    MONGO_INITDB_ROOT_PASSWORD: dbPass,
  } as Record<string, string>;

  const MongoExpressEnv = {
    ME_CONFIG_MONGODB_URL: `mongodb://${dbUser}:${dbPass}@mongodb:27017`,
    ME_CONFIG_BASICAUTH: "true",
    ME_CONFIG_BASICAUTH_USERNAME: meUser,
    ME_CONFIG_BASICAUTH_PASSWORD: mePass,
  } as Record<string, string>;

  const appURL = new URL(`https://${appHost}`);
  const hostname = appURL.hostname;
  const parts = hostname.split(".");
  const domain = parts.slice(-2).join(".");

  const LibraryEnv = {
    CORS_ORIGIN: `https://*.${domain}`,
  } as Record<string, string>;

  doc.services.app.build = doc.services.app.build || {};
  doc.services.app.build.args = AppEnv;
  doc.services.app.environment = doc.services.app.environment || {};
  doc.services.app.environment = AppEnv;

  doc.services.storage.environment = StorageEnv;
  doc.services.mongodb.environment = MongodbEnv;
  doc.services.mongoexpress.environment = MongoExpressEnv;
  doc.services.libraries.environment = LibraryEnv;

  const output = stringify(doc);
  fs.writeFile("./docker-compose.yml", output);
  console.log("Generated docker-compose.yml");

  console.log("Patching library allow list...");

  patchLibraryURLAllowList(domain);
  console.log("Patched library allow list.");
  copyPatchFiles();

  printInstructions(AppEnv);
}

main();

function ask(question: string, defaultVal?: string): string {
  const answer = prompt(
    question + (defaultVal ? ` (${defaultVal})` : "") + ": "
  )?.trim();
  return answer === "" || answer === undefined ? defaultVal ?? "" : answer;
}

async function parseEnvFIle(filePath: string): Promise<Record<string, string>> {
  const content = await Bun.file(filePath).text();
  const lines = content.split("\n");
  const env: Record<string, string> = {};
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (
      trimmedLine === "" ||
      trimmedLine.startsWith("#") ||
      !trimmedLine.includes("=")
    ) {
      continue;
    }
    const [key, ...rest] = trimmedLine.split("=");
    if (!key || rest.length === 0) continue;
    env[key.trim()] = rest.join("=").trim();
  }
  return env;
}

function patchLibraryURLAllowList(domain: string) {
  const project = new Project();
  const filePath = "./app/packages/excalidraw/data/library.ts";

  console.log(
    "Patching",
    filePath,
    "to add domain:",
    domain,
    "to the libraries allow_list"
  );

  // make a backup of the file as txt
  fs.copyFile(filePath, filePath + ".bak.txt");
  console.log("Backup created at", filePath + ".bak.txt");

  const sourceFile = project.addSourceFileAtPath(filePath);

  // Get the variable declaration
  const variable = sourceFile.getVariableDeclaration("ALLOWED_LIBRARY_URLS");

  const initter = variable?.getInitializer();
  const allowed_urls_arr = initter?.asKindOrThrow(
    ts.SyntaxKind.ArrayLiteralExpression
  );

  allowed_urls_arr!.addElement(`"https://${domain}"`);
  project.saveSync();
}

function copyPatchFiles() {
  console.log("Copying patch files to ./app");
  try {
    fs.copyFile("./patches/patch.ts", "./app/patch.ts");
    fs.copyFile("./patches/Dockerfile", "./app/Dockerfile");
    fs.copyFile("./patches/env.cjs", "./app/packages/excalidraw/env.cjs");
    console.log("Successfully copied patch files to ./app");
  } catch (e) {
    console.error("Failed to copy patch files:", e);
    return;
  }
}

function printInstructions(AppEnv: Record<AppBuildArgs, string>) {
  console.log("\n\n");
  console.log("-".repeat(20));
  console.log("Coolify deployment instructions:");
  console.log(
    "This is not ONLY for deploying to coolify, the same principles should apply elsewhere as well."
  );
  console.log(
    "For more info look at your provider - or if you're doing it yourself, look at your proxys docs, and adapt as necessary."
  );
  console.log(
    "Push this repo to a PRIVATE github repo, then in Coolify do the following:"
  );
  console.log(
    "- Make sure youve added your git src to Sources in coolify so you can deploy private repos"
  );
  console.log(
    "- Add a new resource, select 'Git Repository', then select your repo"
  );
  console.log("- Set the domains in coolify like so:");
  console.log(`+ Domains for App:`);
  console.log(`- ${AppEnv.PUBLIC_URL}:80`);
  console.log(`+ Domains for Storage:`);
  console.log(
    `- ${AppEnv.VITE_APP_HTTP_STORAGE_BACKEND_URL.replace("/api/v2", "")}:8080`
  );
  console.log(`+ Domains for Libraries:`);
  console.log(`- ${AppEnv.VITE_APP_LIBRARY_URL}:8080`);
  console.log(`+ Domains for Room:`);
  console.log(
    `- ${AppEnv.VITE_APP_WS_SERVER_URL.slice(
      0,
      AppEnv.VITE_APP_WS_SERVER_URL.length - 1
    )}:80`
  );
  console.log("-".repeat(20));
}
