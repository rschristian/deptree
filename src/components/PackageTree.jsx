import { useRef } from 'preact/hooks';

/**
 * @param {Object} props
 * @param {import('../pkg/types.d.ts').ModuleTree} props.pkg
 * @param {number} [props.depth=0]
 * @param {boolean} [props.isLast=false]
 * @param {string} [props.prefix='']
 */
export function PackageTree({ pkg, depth = 0, isLast = false, prefix = '' }) {
    const ref = useRef(null);

    let lineSymbol = prefix,
        childPrefix = prefix;
    if (depth > 0) {
        lineSymbol += (isLast ? '└' : '├').padEnd(6, '-');
        childPrefix += (isLast ? ' ' : '│').padEnd(8, ' ');
    } else {
        childPrefix = ' ';
    }

    const decoration = pkg.replacement
        ? `underline(& offset-4) decoration(2 replacement-${pkg.replacement.type}(& dark:dark))`
        : '';

    const hasChildren = pkg.dependencies?.length > 0;

    // Avoid component rerenders as the tree could be quite large
    const toggleCollapse = () => {
        if (ref.current) {
            ref.current.classList.toggle('collapse-tree');
            ref.current.firstChild.textContent = ref.current.firstChild.textContent === '+' ? '-' : '+';
            ref.current.firstChild.classList.toggle('text-primary');
        }
    };

    return (
        <div class={(depth == 0 && 'mb-4 last:mb-2')}>
            <pre class="w-full text-left" ref={ref}>
                <button
                    class={`inline-flex items-center justify-center h-5 w-5 mr-2 bg-highlight(& dark:dark) font-bold hocus:(outline(1 & primary)) rounded ${hasChildren ? '' : 'invisible'}`}
                    onClick={toggleCollapse}>
                    -
                </button>
                {lineSymbol}
                <a
                    class={`px-1 py-0.5 text-highlightContent(& dark:dark) bg-highlight(& dark:dark) rounded hocus:(opacity-80 outline(1 & primary)) ${decoration}`}
                    href={`https://npm.im/${pkg.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-hint={pkg.replacement ? pkg.replacement.replacementString : ''}
                >
                    {`${pkg.name}@${pkg.version}`}
                </a>
            </pre>
            {hasChildren &&
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
