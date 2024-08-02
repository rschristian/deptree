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
            <section class={`relative mt-8 p-4 border(& ${queryResult.error ? 'red' : 'resultBorder'} 1) rounded`}>
                {!queryResult.error && (
                    <>
                        <Hint template={() => (
                            <div class="text-left">
                                Module Count: {queryResult.stats.moduleCount}<br />
                                Modules with Native Replacement: {queryResult.stats.nativeCount}<br />
                                Micro Utility Modules: {queryResult.stats.microCount}<br />
                                Total Number of Nodes: {queryResult.stats.nodeCount}
                            </div>
                        )}>
                            <svg tabindex={0} data-hint=" " class="absolute right-0 z-50">
                                <use href="/assets/icons.svg#info" />
                            </svg>
                        </Hint>
                        <Key />
                    </>
                )}
                <Hint template={(content) => (
                    <p>Replace with `<span class="font-bold">{content}</span>`</p>
                )}>
                    <div class="overflow-x-auto p-0.5">
                        {queryResult.error
                            ? <p class="whitespace-pre">{queryResult.error}</p>
                            : <div
                                ref={container}
                                onMouseMove={move}
                                onMouseDown={startDragging}
                                onMouseUp={stopDragging}
                                onMouseLeave={stopDragging}
                            >
                                {queryResult.moduleTrees.map(pkg => <PackageTree pkg={pkg} />)}
                            </div>
                        }
                    </div>
                </Hint>
            </section>
            {!queryResult.error && (
                <p class="mt-4">
                    Module data is provided by the lovely contributors at{' '}
                    <a
                        class="underline dark:text-primary) hocus:opacity-80"
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

function Key() {
    return (
        <div class="fixed w-10/12 md:w-auto left-2/4 -translate-x-2/4 bottom-12 py-1 px-2 bg-card(& dark:dark) border(& resultBorder 1) rounded z-50">
            <div class="flex(& col md:row) items-start">
                Key:
                <div class="flex items-center ml-4">
                    <span class="inline-block w-4 h-4 mr-2 bg-replacement-native(& dark:dark)"></span>
                    - Has native replacement
                </div>
                <div class="flex items-center ml-4">
                    <span class="inline-block w-4 h-4 mr-2 bg-replacement-micro(& dark:dark)"></span>
                    - Is micro utility
                </div>
            </div>
        </div>
    );
}
