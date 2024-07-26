import nativeReplacements from 'module-replacements/manifests/native.json';
import microUtilsReplacements from 'module-replacements/manifests/micro-utilities.json';
//import preferredReplacements from 'module-replacements/manifests/preferred.json';

const NATIVE = nativeReplacements.moduleReplacements;
const MICRO = microUtilsReplacements.moduleReplacements;
//const PREFERRED = preferredReplacements.moduleReplacements;

export function PackageTree({ pkg, depth = 0, isLast = false, prefix = '' }) {
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
