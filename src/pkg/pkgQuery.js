import nativeReplacements from 'module-replacements/manifests/native.json';
import microUtilsReplacements from 'module-replacements/manifests/micro-utilities.json';
//import preferredReplacements from 'module-replacements/manifests/preferred.json';

// TODO: Can probably patch the module instead of sorting per-request
const NATIVE = nativeReplacements.moduleReplacements.sort((a, b) => a.moduleName.localeCompare(b.moduleName));
const MICRO = microUtilsReplacements.moduleReplacements.sort((a, b) => a.moduleName.localeCompare(b.moduleName));
// TODO: Some of the preferred "replacements" are the same module, not sure what's going on there
//const PREFERRED = preferredReplacements.moduleReplacements;

import { getModule } from './registry.js';

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
    //let preferredReplacements = new Set();
    const stats = {
        moduleCount: 0,
        nodeCount: 0,
        nativeCount: 0,
        microCount: 0,
        //preferredCount: 0,
    }

    for (const query of pkgQueries) {
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
                uniqueModules: uModules,
                nativeReplacements: nReplacements,
                microReplacements: mReplacements
            } = formTreeFromGraph(graph.get(entryModule.key), graph);

            moduleTrees.push(moduleTree);
            stats.nodeCount += nodeCount;

            uniqueModules = new Set([...uniqueModules, ...uModules]);
            nativeReplacements = new Set([...nativeReplacements, ...nReplacements]);
            microReplacements = new Set([...microReplacements, ...mReplacements]);
        } catch (e) {
            errorResponse(e.message);
        }
    }

    stats.moduleCount = uniqueModules.size;
    stats.nativeCount = nativeReplacements.size;
    stats.microCount = microReplacements.size;
    return { moduleTrees, stats };
}

/**
 * @typedef {import('./types.d.ts').Module} Module
 * @typedef {import('./types.d.ts').ModuleInfo} ModuleInfo
 * @typedef {import('./types.d.ts').Graph} Graph
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
     * @param {number} [level=0]
     */
    const _walk = async (module, level = 0) => {
        if (!module) return Promise.reject(new Error('Module not found'));

        if (graph.has(module.key)) return;

        let deps = [];
        for (const [name, version] of Object.entries(module.pkg.dependencies || {})) {
            deps.push({ name, version });
        }

        /** @type {ModuleInfo} */
        const info = {
            module,
            level,
            dependencies: [],
        };
        graph.set(module.key, info);

        const resolvedDeps = await Promise.all(
            deps.map(async (dep) => {
                const module = await getModule(dep.name, dep.version);
                await _walk(module, level + 1);

                return module;
            }),
        );

        info.dependencies = resolvedDeps;
    };

    const module = await getModule(query);
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
 * @returns {{ type: 'native' | 'micro' | 'preferred', replacementString: string } | null}
 */
function checkForReplacements(module) {
    for (const [type, replacementList] of [NATIVE, MICRO].entries()) {
        const replacement = binarySearch(replacementList, module);
        if (replacement) {
            return {
                type: type === 0 ? 'native' : 'micro',
                replacementString: replacement.replacement
            };
        }
    }
    return null;
}

/**
 * @param {ModuleInfo} entryModule
 * @param {Graph} graph
 * @returns {{
     * moduleTree: Object,
     * nodeCount: number,
     * uniqueModules: Set<string>,
     * nativeReplacements: Set<string>,
     * microReplacements: Set<string>
 * }}
 */
function formTreeFromGraph(entryModule, graph) {
    let moduleTree = {};
    const parentNodes = new Set();

    const uniqueModules = new Set();
    const nativeReplacements = new Set();
    const microReplacements = new Set();
    let nodeCount = 0;

    /**
     * @param {ModuleInfo} module
     * @param {{ dependencies: unknown[] }} [parent]
     */
    const _walk = (module, parent) => {
        const shouldWalk = !parentNodes.has(module.module.pkg.name);

        const replacement = checkForReplacements(module.module.pkg.name);
        const m = {
            name: module.module.pkg.name,
            version: module.module.pkg.version,
            ...(replacement && { type: replacement.type, replacement: replacement.replacementString }),
            ...(shouldWalk && module.dependencies.length && { dependencies: [] }),
        };
        uniqueModules.add(m.name);
        if (m.type == 'native') nativeReplacements.add(m.name);
        if (m.type == 'micro') microReplacements.add(m.name);

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
    return { moduleTree, uniqueModules, nodeCount, nativeReplacements, microReplacements };
}
