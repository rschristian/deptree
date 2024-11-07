import { useState } from 'preact/hooks';

/**
 * @param {Object} props
 * @param {import('../pkg/types.d.ts').ModuleTree} props.pkg
 * @param {number} [props.depth=0]
 * @param {boolean} [props.isLast=false]
 * @param {string} [props.prefix='  ']
 */
export function PackageTree({ pkg, depth = 0, isLast = false, prefix = '  ' }) {
    const [isVisible, setIsVisible] = useState(true);

    let lineSymbol = prefix;
    let childPrefix = prefix;
    if (depth > 0) {
        lineSymbol += (isLast ? '└' : '├').padEnd(6, '-');
        childPrefix += (isLast ? ' ' : '│').padEnd(8, ' ');
    }

    const decoration = pkg.replacement
        ? `underline(& offset-4) decoration(2 replacement-${pkg.replacement.type}(& dark:dark))`
        : '';

    function handleTreeVisibility() {
        setIsVisible(!isVisible);
    }

    return (
        <div class={[depth == 0 ? 'mb-4 last:mb-2' : '', 'grid _gap-0.5 text-sm']}>
            <pre
                class={[
                    'flex items-center w-full',
                    !isVisible ? 'collapse-tree' : '',
                    'p-px hover:bg-highlightContent/20 dark:hover:bg-highlightContent-dark/20) rounded',
                ]}
            >
                <button
                    class={[
                        'flex justify-center items-center w-6 h-6',
                        'bg-highlight(& dark:dark) rounded hocus:(opacity-80 outline(1 & primary))',
                        'mr-1 text-xs leading-none',
                        pkg.dependencies?.length ? '' : 'invisible',
                    ]}
                    onClick={handleTreeVisibility}
                >
                    {isVisible ? '-' : '+'}
                </button>
                {lineSymbol}
                <a
                    class={`px-1 py-1 leading-none text-highlightContent(& dark:dark) bg-highlight(& dark:dark) rounded hocus:(opacity-80 outline(1 & primary)) ${decoration}`}
                    href={`https://npm.im/${pkg.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-hint={pkg.replacement ? pkg.replacement.replacementString : ''}
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
