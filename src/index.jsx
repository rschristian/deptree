import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { Root, Main, Header, Footer } from '@rschristian/intrepid-design';
import { withTwind } from '@rschristian/twind-preact-iso';
import Hint from 'preact-hint';
import nativeReplacements from 'module-replacements/manifests/native.json';
import microUtilsReplacements from 'module-replacements/manifests/micro-utilities.json';
//import preferredReplacements from 'module-replacements/manifests/preferred.json';

import { getPackageData } from './pkg/pkgQuery.js';

const NATIVE = nativeReplacements.moduleReplacements;
const MICRO = microUtilsReplacements.moduleReplacements;
//const PREFERRED = preferredReplacements.moduleReplacements;

export function App() {
    const [pkgQuery, setPkgQuery] = useState('');
    const [queryResult, setQueryResult] = useState(null);
    const [inProgress, setInProgress] = useState(false);

    // Fetch package data if `?q=package-name` has been provided
    useEffect(() => {
        const queryParamPkg = new URLSearchParams(window.location.search).get('q');
        if (queryParamPkg) {
            fetchPkgTree(queryParamPkg);
            setPkgQuery(queryParamPkg);
        }
    }, []);

    const fetchPkgTree = useCallback(async (pkgQuery) => {
        setQueryResult(null);
        setInProgress(true);
        try {
            const result = await getPackageData(pkgQuery);

            setQueryResult(result);
            window.history.pushState({}, '', `?q=${pkgQuery}`);
        } catch (e) {
            setQueryResult({ error: e.message });
        }
        setInProgress(false);
    }, []);

    const onFileSubmit = async (e) => {
        e.preventDefault();
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = () => {
            const { dependencies, devDependencies, peerDependencies } = JSON.parse(/** @type {string} */ (reader.result));
            if (!dependencies && !devDependencies && !peerDependencies) {
                setQueryResult({ error: 'No dependencies found in uploaded file' });
            } else {
                const deps = Array.from(Object.entries({ ...dependencies, ...devDependencies, ...peerDependencies })
                    .map(([key, value]) => `${key}@${value}`))
                    .join(',');
                setPkgQuery(deps);
                fetchPkgTree(deps);
            }
        };
        reader.onerror = () => setQueryResult({ error: `Error when attempting to read file: ${file.name}` })
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (pkgQuery) fetchPkgTree(pkgQuery);
    };

    return (
        <Root>
            <Header>
                <Header.NavItem
                    href="https://github.com/rschristian/deptree"
                    label="GitHub Source"
                    iconId="github"
                />
                <Header.NavItem
                    href="https://twitter.com/_rschristian"
                    label="Twitter Account"
                    iconId="twitter"
                />
                <Header.ThemeToggle />
            </Header>
            <Main widthStyle="flex justify-center w-full lg:max-w-screen-lg">
                <div class="h-fit w-10/12 2xl:mt-[5vh] p(4 md:8) text-center bg-card(& dark:dark) rounded-xl">
                    <h1 class="text-4xl font-bold">DepTree</h1>
                    <p class="p-2">
                        Visualize the dependency tree of a package or project to see where you might want to optimize
                    </p>
                    <form onSubmit={onSubmit}>
                        <div class="flex(& col md:row) my-8 items-center">
                            <input
                                autocorrect="off"
                                autocapitalize="none"
                                enterkeyhint="search"
                                class="py-2 px-4 w-full text(3xl center [#111]) bg-input(& dark:dark) drop-shadow-lg rounded-lg hocus:(outline(2 & primary))"
                                placeholder="Provide a package name"
                                value={pkgQuery}
                                onInput={(e) =>
                                    setPkgQuery(/** @type {HTMLInputElement} */ (e.target).value)
                                }
                            />
                            <span class="mx-4 my(4 md:0)">Or...</span>
                            <input
                                id="file-upload"
                                onChange={onFileSubmit}
                                type="file"
                                accept="application/json"
                            />
                            <label
                                for="file-upload"
                                class="py-2 px-4 bg-highlight(& dark:dark) drop-shadow-lg rounded-lg"
                            >
                                Upload package.json
                            </label>
                        </div>
                    </form>
                    {inProgress && <span class="loader mt-8 p-4"></span>}
                    {queryResult && <DataBox queryResult={queryResult} />}
                </div>
            </Main>
            <Footer year={2024} />
        </Root>
    );
}

function DataBox({ queryResult }) {
    const container = useRef(null);
    let mouseDown = false;
    let startX, scrollLeft;

    useEffect(() => {
        if (container.current && !queryResult.error) {
            if (container.current.scrollWidth > container.current.clientWidth) {
                container.current.classList.add('cursor-grab');
            }
        }
    }, [container]);

    const startDragging = (e) => {
        e.preventDefault();
        mouseDown = true;
        startX = e.pageX - container.current.offsetLeft;
        scrollLeft = container.current.scrollLeft;
        container.current.style.cursor = 'grabbing';
    };

    const stopDragging = () => {
        mouseDown = false;
        container.current.style.removeProperty('cursor');
    };

    const move = (e) => {
        e.preventDefault();
        if (!mouseDown) return;
        const scroll = e.pageX - container.current.offsetLeft - startX;
        container.current.scrollLeft = scrollLeft - scroll;
    };

    return (
        <>
            {!queryResult.error && (
                <>
                    <h2 class="mb-4 text(left 2xl) font-semibold">Coming Soon: Replacement hints & tips</h2>
                    <div class="flex(& col md:row) items-start">
                        Key:
                        <div class="flex items-center ml-4">
                            <span class="inline-block w-4 h-4 mr-2 bg-replacement-native"></span>
                            - Has native replacement
                        </div>
                        <div class="flex items-center ml-4">
                            <span class="inline-block w-4 h-4 mr-2 bg-replacement-micro"></span>
                            - Is micro utility
                        </div>
                        {/*<div class="flex items-center ml-4">
                            <span class="inline-block w-4 h-4 mr-2 bg-replacement-preferred"></span>
                            - Has preferred replacement
                        </div>*/}
                    </div>
                </>
            )}
            <section class={`relative mt-8 p-4 border(& ${queryResult.error ? 'red' : 'resultBorder'} 1) rounded`}>
                {!queryResult.error && (
                    <Hint template={() => (
                        <div class="text-left">
                            Module Count: {queryResult.stats.moduleCount}<br />
                            Total Number of Nodes: {queryResult.stats.nodeCount}
                        </div>
                    )}>
                        <svg data-hint=" " class="absolute right-0">
                            <use href="/assets/icons.svg#info" />
                        </svg>
                    </Hint>
                )}
                <div
                    ref={container}
                    class="overflow-x-auto p-0.5"
                    onMouseMove={move}
                    onMouseDown={startDragging}
                    onMouseUp={stopDragging}
                    onMouseLeave={stopDragging}
                >
                    {queryResult.error
                        ? queryResult.error
                        : queryResult.moduleTrees.map(pkg => <PackageTree pkg={pkg} />)
                    }
                </div>
            </section>
            {!queryResult.error && (
                <p class="mt-4">
                    Module data is provided by the lovely contributors at{' '}
                    <a
                        class="underline text-primary hocus:opacity-80"
                        href="https://github.com/es-tooling/module-replacements"
                        target="_blank"
                    >
                        es-tooling/module-replacements
                    </a>
                </p>
            )}
        </>
    );
}

function PackageTree({ pkg, depth = 0, isLast = false, prefix = '' }) {
    let lineSymbol = prefix;
    let childPrefix = prefix;
    if (depth > 0) {
        lineSymbol += (isLast ? '└' : '├').padEnd(6, '-');
        childPrefix += (isLast ? ' ' : '│').padEnd(8, ' ');
    }

    const check = list => list.some(({ moduleName }) => moduleName === pkg.name);
    let decoration = '';
    if (check(NATIVE)) decoration = 'underline(& offset-4) decoration-replacement-native';
    if (check(MICRO)) decoration = 'underline(& offset-4) decoration-replacement-micro';
    //if (check(PREFERRED)) decoration = 'underline(& offset-4) decoration-replacement-preferred';

    return (
        <div class={depth == 0 && 'mb-4 last:mb-2' || depth == 1 && 'ml-4'}>
            <pre class="w-max">
                {lineSymbol}
                <a
                    class={`px-1 py-0.5 text-highlightContent(& dark:dark) bg-highlight(& dark:dark) rounded hocus:(opacity-80 outline(1 & primary)) ${decoration}`}
                    href={`https://npm.im/${pkg.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {`${pkg.name}@${pkg.version}`}
                </a>
            </pre>
            {pkg.dependencies?.length &&
                pkg.dependencies.map((dep, i) => (
                    <PackageTree
                        pkg={dep}
                        depth={depth + 1}
                        isLast={pkg.dependencies.length - 1 == i}
                        prefix={childPrefix}
                    />
                ))}
        </div>
    );
}

const { hydrate, prerender } = withTwind(
    () => import('./styles/twind.config.js'),
    () => <App />,
    true,
);

hydrate(<App />);

export { prerender };
