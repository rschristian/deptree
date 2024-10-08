/**
 * @param {Object} props
 * @param {import('../pkg/types.d.ts').ModuleTree} props.pkg
 * @param {number} [props.depth=0]
 * @param {boolean} [props.isLast=false]
 * @param {string} [props.prefix='']
 */
export function PackageTree({ pkg, depth = 0, isLast = false, prefix = '' }) {
    let lineSymbol = prefix;
    let childPrefix = prefix;
    if (depth > 0) {
        lineSymbol += (isLast ? '└' : '├').padEnd(6, '-');
        childPrefix += (isLast ? ' ' : '│').padEnd(8, ' ');
    }

    const decoration = pkg.replacement
        ? `underline(& offset-4) decoration(2 replacement-${pkg.replacement.type}(& dark:dark))`
        : '';

    return (
        <div class={(depth == 0 && 'mb-4 last:mb-2') || (depth == 1 && 'ml-4')}>
            <pre class="w-max">
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
