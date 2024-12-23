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
                <Header.NavItem
                    href="https://bsky.app/profile/rschristian.dev"
                    label="Bluesky Account"
                    iconId="bluesky"
                />
                <Header.ThemeToggle />
            </Header>
            <Main widthStyle="flex justify-center w-full lg:max-w-screen-lg">
                <div class="h-fit w(full md:10/12) 2xl:mt-[5vh] p(4 md:8) text-center bg-card(& dark:dark) rounded-xl">
                    <h1 class="text-4xl font-bold">DepTree</h1>
                    <p class="p-2">
                        Visualize the dependency tree of a package or project to see where you might
                        want to optimize
                    </p>
                    <PackageForm setQueryResult={setQueryResult} fetchPkgTree={fetchPkgTree} />
                    <p class="text-xs">
                        Do be warned with package.json upload, this can result in a massive number
                        of network requests and DOM nodes
                    </p>
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
