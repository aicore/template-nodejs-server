import {execSync} from "child_process";

// Get git commit hash at startup - will crash if not a git repository
let GIT_COMMIT_HASH_SHORT_VAL;
try {
    GIT_COMMIT_HASH_SHORT_VAL = execSync('git rev-parse --short HEAD', {encoding: 'utf8'}).trim();
} catch (error) {
    console.error('FATAL ERROR: This application must be run from a git repository for static file cache consistency across load-balanced backends.');
    console.error('Git command failed:', error.message);
    throw new Error('Application must be in a git repository for static file cache consistency');
}

export const GIT_COMMIT_HASH_SHORT = GIT_COMMIT_HASH_SHORT_VAL;

// Immutable Static file serving paths. These path will be cached permanently by our nginx reverse proxy by convention.
// The static files are served from the cache at nginx itself leading to less traffic at this api server.
// GIT_COMMIT_HASH ensures strong consistency across load-balanced backends for the file content.
export const STATIC_WWW_IMMUTABLE_PATH_ON_DISC = 'www-immutable';
export const STATIC_WWW_IMMUTABLE_PREFIX = `/www-immutable/${GIT_COMMIT_HASH_SHORT}/`;

// the below paths are just for static file serving and not cached at nginx. Using the cached path is
// strongly recommended for scalability and performance.
export const STATIC_WWW_PATH_ON_DISC = 'www';
export const STATIC_WWW_PREFIX = `/www/`;
