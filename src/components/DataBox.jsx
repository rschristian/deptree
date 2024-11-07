import { useEffect, useRef, useState } from 'preact/hooks';
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

    const [isNativeActive, setIsNativeActive] = useState(false);
    const [isMicroActive, setIsMicroActive] = useState(false);

    return (
        <>
            {!queryResult.error && (
                <div class="z-10 sticky top-8 bg-card(& dark:dark) max-w-4xl mx-auto px-2 py-0 md:px-6 md:py-4 border(& resultBorder 1) rounded">
                    <div class="grid gap-y-1 gap-x-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 items-end [&>*]:p-1 [&>*]:text-left [&>*]:leading-none">
                        <div class={['grid grid-cols-[1fr_auto] md:grid-cols-1 gap-1 items-baseline rounded', (isNativeActive || isMicroActive) ? 'opacity-50' : 'opacity-100']}>
                            <p class="">Total Nodes</p>
                            <p class="text-xl md:text-4xl font-semibold">{queryResult.stats.nodeCount}</p>
                        </div>
                        <div class={['grid grid-cols-[1fr_auto] md:grid-cols-1 gap-1 items-baseline rounded', (isNativeActive || isMicroActive) ? 'opacity-50' : 'opacity-100']}>
                            <p class="">Total Modules</p>
                            <p class="text-xl md:text-4xl font-semibold">{queryResult.stats.moduleCount}</p>
                        </div>
                        <button class={['grid grid-cols-[1fr_auto] md:grid-cols-1 gap-1 items-baseline rounded hocus:(opacity-80 outline(2 & primary))', (isNativeActive || !(isNativeActive || isMicroActive)) ? 'opacity-100' : 'opacity-50']} onClick={() => setIsNativeActive(!isNativeActive)}>
                            <p class="">Native Replacement</p>
                            <p class="text-xl md:text-4xl font-semibold text-replacement-native(& dark:dark)">{queryResult.stats.nativeCount}</p>
                        </button>
                        <button class={['grid grid-cols-[1fr_auto] md:grid-cols-1 gap-1 items-baseline rounded hocus:(opacity-80 outline(2 & primary))', (isMicroActive || !(isNativeActive || isMicroActive)) ? 'opacity-100' : 'opacity-50']} onClick={() => setIsMicroActive(!isMicroActive)}>
                            <p class="">Micro Utilities</p>
                            <p class="text-xl md:text-4xl font-semibold text-replacement-micro(& dark:dark)">{queryResult.stats.microCount}</p>
                        </button>
                    </div>
                </div>
            )}

            <section
                class={`relative mt-8 p-4 border(& ${
                    queryResult.error ? 'red' : 'resultBorder'
                } 1) rounded`}
            >
                <Hint
                    template={(content) => (
                        <p>
                            Replace with `<span class="font-bold">{content}</span>`
                        </p>
                    )}
                >
                    <div
                        ref={container}
                        class={[
                            'overflow-x-auto p-0.5',
                            (isNativeActive && isMicroActive) ? 'collapse-tree-all'
                                : isNativeActive ? 'collapse-tree-native'
                                : isMicroActive ? 'collapse-tree-micro' : '',
                        ]}
                        {...(!queryResult.error && {
                            onMouseMove: move,
                            onMouseDown: startDragging,
                            onMouseUp: stopDragging,
                            onMouseLeave: stopDragging,
                        })}
                    >
                        {queryResult.error
                            ? <p class="whitespace-pre">{queryResult.error}</p>
                            : queryResult.moduleTrees.map((pkg) => <PackageTree pkg={pkg} />)
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
