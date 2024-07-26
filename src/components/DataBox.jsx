import { useEffect, useRef } from 'preact/hooks';
import Hint from 'preact-hint';

import { PackageTree } from './PackageTree.jsx';

export function DataBox({ queryResult }) {
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
