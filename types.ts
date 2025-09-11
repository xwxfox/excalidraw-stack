type Build<TArgs extends string = string> = {
  context?: string;
  dockerfile?: string;
  args?: Partial<Record<TArgs, string | number | boolean>>;
};

type Service<TArgs extends string = string> = {
  restart?: string;
  build?: Build<TArgs>;
  stdin_open?: boolean;
  environment?: Partial<Record<TArgs, string | number | boolean>>;
  image?: string;
  depends_on?: string[];
  volumes?: string[];
};

// Enums for app
export enum AppBuildArgs {
  NODE_ENV = "NODE_ENV",
  VITE_APP_BACKEND_V2_GET_URL = "VITE_APP_BACKEND_V2_GET_URL",
  VITE_APP_BACKEND_V2_POST_URL = "VITE_APP_BACKEND_V2_POST_URL",
  VITE_APP_LIBRARY_URL = "VITE_APP_LIBRARY_URL",
  VITE_APP_LIBRARY_BACKEND = "VITE_APP_LIBRARY_BACKEND",
  VITE_APP_PLUS_LP = "VITE_APP_PLUS_LP",
  VITE_APP_HTTP_STORAGE_BACKEND_URL = "VITE_APP_HTTP_STORAGE_BACKEND_URL",
  VITE_APP_PLUS_APP = "VITE_APP_PLUS_APP",
  VITE_APP_AI_BACKEND = "VITE_APP_AI_BACKEND",
  VITE_APP_WS_SERVER_URL = "VITE_APP_WS_SERVER_URL",
  VITE_APP_STORAGE_BACKEND = "VITE_APP_STORAGE_BACKEND",
  VITE_APP_FIREBASE_CONFIG = "VITE_APP_FIREBASE_CONFIG",
  VITE_APP_ENABLE_TRACKING = "VITE_APP_ENABLE_TRACKING",
  PUBLIC_URL = "PUBLIC_URL",
  VITE_APP_DEV_DISABLE_LIVE_RELOAD = "VITE_APP_DEV_DISABLE_LIVE_RELOAD",
  VITE_APP_PLUS_EXPORT_PUBLIC_KEY = "VITE_APP_PLUS_EXPORT_PUBLIC_KEY",
  VITE_APP_DEBUG_ENABLE_TEXT_CONTAINER_BOUNDING_BOX = "VITE_APP_DEBUG_ENABLE_TEXT_CONTAINER_BOUNDING_BOX",
  VITE_APP_COLLAPSE_OVERLAY = "VITE_APP_COLLAPSE_OVERLAY",
  VITE_APP_ENABLE_ESLINT = "VITE_APP_ENABLE_ESLINT",
  FAST_REFRESH = "FAST_REFRESH",
  VITE_APP_ENABLE_PWA = "VITE_APP_ENABLE_PWA",
}

// Storage service env
export enum StorageEnvVars {
  STORAGE_URI = "STORAGE_URI",
}

// MongoDB service env
export enum MongodbEnvVars {
  MONGO_INITDB_ROOT_USERNAME = "MONGO_INITDB_ROOT_USERNAME",
  MONGO_INITDB_ROOT_PASSWORD = "MONGO_INITDB_ROOT_PASSWORD",
}

// MongoExpress service env
export enum MongoExpressEnvVars {
  ME_CONFIG_MONGODB_URL = "ME_CONFIG_MONGODB_URL",
  ME_CONFIG_BASICAUTH = "ME_CONFIG_BASICAUTH",
  ME_CONFIG_BASICAUTH_USERNAME = "ME_CONFIG_BASICAUTH_USERNAME",
  ME_CONFIG_BASICAUTH_PASSWORD = "ME_CONFIG_BASICAUTH_PASSWORD",
}

export enum LibraryEnvVars {
  CORS_ORIGIN = "CORS_ORIGIN",
}

// Generic volume descriptor
export interface Volume {
  name?: string;
}

export interface ComposerStack {
  services: {
    app: Service<AppBuildArgs> & {
      stdin_open?: boolean;
    };
    storage: Service<StorageEnvVars> & {
      build?: Build<string>;
    };
    libraries: Service<LibraryEnvVars>;
    room: Service;
    mongodb: Service<MongodbEnvVars> & {
      image?: string;
      volumes?: string[];
    };
    mongoexpress: Service<MongoExpressEnvVars> & {
      image?: string;
      depends_on?: string[];
    };
  };
  volumes?: Record<string, Volume>;
}
