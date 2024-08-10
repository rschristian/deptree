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
        for (const [_i, query] of iter) {
            try {
                if (!query) errorResponse('Missing package query');
                if (!/^(?:@.+\/[a-z]|[a-z])/.test(query))
                    errorResponse(
                        'Invalid package query, see: https://docs.npmjs.com/cli/v10/configuring-npm/package-json#name',
                    );

                const [entryModule, graph] = await walkModuleGraph(query);
                const {
                    moduleTree,
                    nodeCount,
                    nativeReplacements: nReplacements,
                    microReplacements: mReplacements,
                } = formTreeFromGraph(graph.get(entryModule.key), graph);

                moduleTrees.push(moduleTree);
                stats.nodeCount += nodeCount;

                uniqueModules = new Set([...uniqueModules, ...graph.keys()]);
                nativeReplacements = new Set([...nativeReplacements, ...nReplacements]);
                microReplacements = new Set([...microReplacements, ...mReplacements]);
            } catch (e) {
                errorResponse(e.message);
            }
        }
    }

    await Promise.all(
        Array(5).fill(pkgQueries.entries()).map(buildModuleTree)
    );
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
 */

/**
 * @param {string} query
 * @returns {Promise<[Module, Graph]>}
 */
async function walkModuleGraph(query) {
    /** @type {Graph} */
    const graph = new Map();

    /**
     * @param {Module} module
     */
    const _walk = async (module) => {
        if (!module) return Promise.reject(new Error('Module not found'));

        if (graph.has(module.key)) return;

        let deps = [];
        for (const [name, version] of Object.entries(module.pkg.dependencies || {})) {
            deps.push({ name, version });
        }

        /** @type {ModuleInfo} */
        const info = {
            module,
            dependencies: [],
        };
        graph.set(module.key, info);

        info.dependencies = await Promise.all(
            deps.map(async (dep) => {
                const module = await getModuleData(dep.name, dep.version);
                await _walk(module);

                return module;
            }),
        );
    };

    const module = await getModuleData(query);
    await _walk(module);
    return [module, graph];
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

/**
 * @param {ModuleInfo} entryModule
 * @param {Graph} graph
 * @returns {{
     * moduleTree: ModuleTree,
     * nodeCount: number,
     * nativeReplacements: Set<string>,
     * microReplacements: Set<string>
 * }}
 */
function formTreeFromGraph(entryModule, graph) {
    let moduleTree = /** @type {ModuleTree} */ ({});
    const parentNodes = new Set();

    const nativeReplacements = new Set();
    const microReplacements = new Set();
    let nodeCount = 0;

    /**
     * @param {ModuleInfo} module
     * @param {ModuleTree} [parent]
     */
    const _walk = (module, parent) => {
        const shouldWalk = !parentNodes.has(module.module.pkg.name);

        const replacement = checkForReplacements(module.module.pkg.name);
        const m = {
            name: module.module.pkg.name,
            version: module.module.pkg.version,
            ...(shouldWalk && module.dependencies.length && { dependencies: [] }),
            replacement,
        };
        if (replacement?.type == 'native') nativeReplacements.add(m.name);
        if (replacement?.type == 'micro') microReplacements.add(m.name);

        if (shouldWalk) {
            parentNodes.add(m.name);
            for (const dep of module.dependencies) {
                _walk(graph.get(dep.key), m);
            }
            parentNodes.delete(m.name);
        }

        parent ? parent.dependencies.push(m) : (moduleTree = m);
        nodeCount++;
    };

    if (entryModule) _walk(entryModule);
    return { moduleTree, nodeCount, nativeReplacements, microReplacements };
}
