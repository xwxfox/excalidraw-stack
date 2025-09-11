const pkg = require("./package.json");

const parseEnvVariables = () => {
  const envVars = Object.entries(process.env).reduce((acc, [key, value]) => {
    if (key.startsWith("VITE_") || key === "PUBLIC_URL" || key === "NODE_ENV") {
      acc[key] = value;
    }
    return acc;
  }, {});

  envVars.PKG_NAME = pkg.name;
  envVars.PKG_VERSION = pkg.version;

  return envVars;
};

module.exports = { parseEnvVariables };
