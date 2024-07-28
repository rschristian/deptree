import { useCallback, useEffect, useState } from 'preact/hooks';
import { Root, Main, Header, Footer } from '@rschristian/intrepid-design';
import { withTwind } from '@rschristian/twind-preact-iso';

import { getPackageData } from './pkg/pkgQuery.js';
import { DataBox } from './components/DataBox.jsx';

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
                <div class="h-fit w-full md:w-10/12 2xl:mt-[5vh] p(4 md:8) text-center bg-card(& dark:dark) rounded-xl">
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
                                class="py-2 px-4 w-full text(xl md:3xl center [#111]) bg-input(& dark:dark) drop-shadow-lg rounded-lg hocus:(outline(2 & primary))"
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

const { hydrate, prerender } = withTwind(
    () => import('./styles/twind.config.js'),
    () => <App />,
    true,
);

hydrate(<App />);

export { prerender };
