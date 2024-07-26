<h1 align="center">DepTree</h1>

<p align="center">
  <picture width="100">
    <img src="./src/assets/favicon.svg?raw=true">
  </picture>
</p>

<p align="center">Visualize the dependency tree of a package or project to see where you might want to optimize</p>

---

## Basic Usage

Navigate to [deptree.rschristian.dev](https://deptree.rschristian.dev), input a package query (can be a bare package name or name@version) or upload your `package.json`, and view the resulting data tree(s). With this, you can see which modules are included and why they're included.

## Acknowledgements

Much of the registry/module graph code was adopted from [`npmgraph`](https://github.com/npmgraph/npmgraph), the license of which can be found [here](https://github.com/npmgraph/npmgraph/blob/main/LICENSE).

I'm awful with color, and so largely reused the [vesper](https://github.com/raunofreiberg/vesper) VSCode theme's colors for the color scheme. The license for it can be found [here](https://github.com/raunofreiberg/vesper/blob/main/LICENSE.md).

## License

[MIT](https://github.com/rschristian/deptree/blob/master/LICENSE)
