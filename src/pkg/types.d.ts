// index
export interface Module {
    key: string;
    pkg: PackageData;
}

export interface ModuleInfo {
    module: Module;
    dependencies: Module[];
}

type Graph = Map<string, ModuleInfo>;

// registry
export interface PackageData {
    name: string;
    version: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
}

export interface Maintainers {
    name: string;
    email: string;
}

export interface ModuleCacheEntry {
    resolve: Promise<Module>;
    module: Module;
}

export interface PackageMetaData {
    'dist-tags'?: Record<string, string>;
    versions: Record<string, PackageData>;
    error?: string;
}

export type ModuleTreeCache = Map<string, ModuleTree>;

export interface ModuleTree {
    name: string;
    version: string;
    nodeCount: number;
    dependencies?: ModuleTree[];
    replacement?: {
        type: 'native' | 'micro';
        replacementString: string;
    };
}
