# helios-loader

Helios webpack loader

## Usage

```
npm install --save-dev @hyperionbt/helios-loader
```



## Properties

* Rewrite file-path-like imports (modules still need to be named regardless)
* Do a full compilation run of each imported main program (so not for modules)

## Transpilation details

### Transpiling modules

```
import {} from "path-to-dep-module"

...
```

becomes

```
import transpiled-dep-module from "path-to-transpiled-dep-module"

const module = {
    name: <name>,
    src: 'import {} from <dep-module-name>\n...',
    dependencies: {
        <dep-module-name>: transpiled-dep-module
    }
}

export { module as default }
```

### Transpiling main scripts

```
import {} from "path-to-dep-module"

...
```

becomes

```
import * as helios from "@hyperionbt/helios"
import transpiled-dep-module from "path-to-transpiled-dep-module"

export default class Program {
    #program;

    constructor(parameters) {
        const dependencies = <code-that-reduces-dependecies>

        this.#program = helios.Program.new(<this-transpiled-src>, dependencies)
    }

    <wrapper functions for program>
}
```

### Convenience features

* Full helios programs can be compiled during webpack build time, instead of during runtime.
* The loader can throw an error if a helios module is being imported into a js/ts file -> too difficult, but could be a runtime error instead, stretch goal
* Throw an error if a module/script doesn't have a unique name.
* Import using relative paths instead module names.
* Allow import helios modules and validators using npm. This would require non-relative paths.


### Typing

Can be added later through another plugin.