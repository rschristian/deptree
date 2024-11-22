import nativeReplacements from 'module-replacements/manifests/native.json';
import microUtilsReplacements from 'module-replacements/manifests/micro-utilities.json';

import { getModuleData } from './registry.js';

// TODO: Can probably patch the module instead of sorting per-request
const NATIVE = nativeReplacements.moduleReplacements.sort((a, b) =>
    a.moduleName.localeCompare(b.moduleName),
);
const MICRO = microUtilsReplacements.moduleReplacements.sort((a, b) =>
    a.moduleName.localeCompare(b.moduleName),
);

/**
 * @param {string} message
 */
function errorResponse(message) {
    // Normalize error messages, as NPM isn't consistent with its responses
    if (!message.startsWith('Error: ')) message = `Error: ${message}`;
    throw new Error(message);
}

export async function getPackageData(pkgQuery) {
    const pkgQueries = pkgQuery.toLowerCase().split(',');

    const moduleTrees = [];
    let uniqueModules = new Set();
    let nativeReplacements = new Set();
    let microReplacements = new Set();
    const stats = {
        moduleCount: 0,
        nodeCount: 0,
        nativeCount: 0,
        microCount: 0,
    };

    const buildModuleTree = async (iter) => {
        for (const query of iter) {
            try {
                if (!query) errorResponse('Missing package query');
                if (!/^(?:@.+\/[a-z]|[a-z])/.test(query))
                    errorResponse(
                        'Invalid package query, see: https://docs.npmjs.com/cli/v10/configuring-npm/package-json#name',
                    );

                const { moduleTree, moduleCache, replacements } = await walkModuleGraph(query);

                moduleTrees.push(moduleTree);
                stats.nodeCount += moduleTree.nodeCount;

                uniqueModules = new Set([...uniqueModules, ...moduleCache.keys()]);
                nativeReplacements = new Set([...nativeReplacements, ...replacements.native]);
                microReplacements = new Set([...microReplacements, ...replacements.micro]);
            } catch (e) {
                errorResponse(e.message);
            }
        }
    };

    await Promise.all(Array(5).fill(pkgQueries.values()).map(buildModuleTree));
    moduleTrees.sort((a, b) => a.name.localeCompare(b.name));

    stats.moduleCount = uniqueModules.size;
    stats.nativeCount = nativeReplacements.size;
    stats.microCount = microReplacements.size;
    return { moduleTrees, stats };
}

/**
 * @typedef {import('./types.d.ts').Module} Module
 * @typedef {import('./types.d.ts').ModuleInfo} ModuleInfo
 * @typedef {import('./types.d.ts').Graph} Graph
 * @typedef {import('./types.d.ts').ModuleTree} ModuleTree
 * @typedef {import('./types.d.ts').ModuleTreeCache} ModuleTreeCache
 * @typedef {import('./types.d.ts').ModuleGraph} ModuleGraph
 */

/**
 * @param {string} query
 * @returns {Promise<ModuleGraph>}
 */
async function walkModuleGraph(query) {
    /** @type {ModuleTreeCache} */
    const moduleCache = new Map();

    const replacements = {
        native: new Set(),
        micro: new Set(),
    };

    // Used to prevent circular deps
    const parentNodes = new Set();

    /**
     * @param {Module} module
     * @returns {Promise<ModuleTree>}
     */
    const _walk = async (module) => {
        if (!module) return Promise.reject(new Error('Module not found'));

        let deps = [];
        for (const [name, version] of Object.entries(module.pkg.dependencies || {})) {
            deps.push({ name, version });
        }

        const shouldWalk = !parentNodes.has(module.pkg.name);

        const replacement = checkForReplacements(module.pkg.name);
        const info = {
            name: module.pkg.name,
            version: module.pkg.version,
            nodeCount: 1,
            ...(shouldWalk && deps.length && { dependencies: [] }),
            replacement,
        };
        if (replacement?.type == 'native') replacements.native.add(info.name);
        if (replacement?.type == 'micro') replacements.micro.add(info.name);

        if (shouldWalk) {
            parentNodes.add(info.name);
            // Trying to be a respectful user; increasing this speeds
            // up the process considerably but we might already be
            // encroaching on the rate limits.
            await Promise.all(
                Array(2)
                    .fill(deps.values())
                    .map(async (deps) => {
                        for (const dep of deps) {
                            const module = await getModuleData(dep.name, dep.version);
                            const moduleTree = await _walk(module);
                            info.nodeCount += moduleTree.nodeCount;
                            info.dependencies.push(moduleTree);
                        }
                    }),
            );
            info.dependencies?.sort((a, b) => a.name.localeCompare(b.name));
            parentNodes.delete(info.name);
        }
        moduleCache.set(module.key, info);

        return info;
    };

    const module = await getModuleData(query);
    const moduleTree = await _walk(module);
    return { moduleTree, moduleCache, replacements };
}

/**
 * Probably overkill, but if the list keeps growin'...
 *
 * @param {NATIVE | MICRO} sortedReplacements
 * @param {string} moduleName
 */
function binarySearch(sortedReplacements, moduleName) {
    let start = 0;
    let end = sortedReplacements.length - 1;

    while (start <= end) {
        let middle = Math.floor((start + end) / 2);

        if (sortedReplacements[middle].moduleName === moduleName) {
            return sortedReplacements[middle];
        } else if (sortedReplacements[middle].moduleName < moduleName) {
            start = middle + 1;
        } else {
            end = middle - 1;
        }
    }
    return null;
}

/**
 * @param {string} module
 * @returns {{ type: 'native' | 'micro', replacementString: string } | null}
 */
function checkForReplacements(module) {
    for (const [type, replacementList] of [NATIVE, MICRO].entries()) {
        const replacement = binarySearch(replacementList, module);
        if (replacement) {
            return {
                type: type === 0 ? 'native' : 'micro',
                replacementString: replacement.replacement,
            };
        }
    }
    return null;
}
