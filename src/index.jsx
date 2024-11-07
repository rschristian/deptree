import { useCallback, useEffect, useState } from 'preact/hooks';
import { Root, Main, Header, Footer } from '@rschristian/intrepid-design';
import { withTwind } from '@rschristian/twind-preact-iso';

import { getPackageData } from './pkg/pkgQuery.js';
import { PackageForm } from './components/Form.jsx';
import { DataBox } from './components/DataBox.jsx';

export function App() {
    const [queryResult, setQueryResult] = useState(null);
    const [inProgress, setInProgress] = useState(false);

    // Fetch package data if `?q=package-name` has been provided
    useEffect(() => {
        const queryParamPkg = new URLSearchParams(window.location.search).get('q');
        if (queryParamPkg) fetchPkgTree(queryParamPkg);
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
            <Main widthStyle="flex flex-col gap-4 w-full">
                <div class="w-full max-w-4xl mx-auto p(4 md:8) text-center bg-card(& dark:dark) rounded-xl">
                    <h1 class="text-4xl font-bold">DepTree</h1>
                    <p class="p-2">
                        Visualize the dependency tree of a package or project to see where you might
                        want to optimize
                    </p>
                    <PackageForm setQueryResult={setQueryResult} fetchPkgTree={fetchPkgTree} />
                    <p class="text-xs [text-wrap-style:balance]">
                        Do be warned with package.json upload, this can result in a massive number
                        of network requests and DOM nodes
                    </p>
                </div>
                <div class="w-full max-w-full mx-auto p(4 md:8) text-center bg-card(& dark:dark) rounded-xl">
                    {inProgress && <span class="loader p-4"></span>}
                    {!inProgress && queryResult && <DataBox queryResult={queryResult} />}
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
