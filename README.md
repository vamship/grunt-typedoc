# @vamship/grunt-typedoc

> [:warning:]
> This project is no longer actively maintained. It will remain
> available for use, but no further updates are planned.

_Grunt task to generate documentation from typescript source files._

This is a grunt wrapper for the [typedoc](http://typedoc.org) tool that allows
the generation of documentation from typescript sources files using the grunt
task runner.

## API Documentation

API documentation can be found [here](https://vamship.github.io/grunt-typedoc).

## Motivation

Generating documentation from source code is a good practice to have, and most
programming languages have extensive support for this features
[typedoc](http://typedoc.org) is the generally accepted tool for documentation
generation from typescript.

However, there are no grunt task runners available for typedoc that are
compatible with newer versions of typedoc (>2.7.x). The existing grunt plugin
(grunt-typedoc)[https://github.com/TypeStrong/grunt-typedoc] has not been
updated in many years, and still references typedoc v0.4.1.

This library is an attempt to fill this gap, and uses the typedoc api (does not
invoke binary directly) to generate documentation from typescript sources.

## Installation

This library can be installed using npm:

```
npm install @vamship/grunt-typedoc
```

## Usage

### Using the task

Once installed, the task has to be loaded by using the following line in
`Gruntfile.js`:

```
grunt.loadNpmTasks('@vamship/grunt-typedoc');
```

The task can be configured as follows:

```
grunt.initConfig({
    typedoc: {
        build: {
            options: {
                module: 'commonjs',
                out: './docs',
                name: 'my-project',
                target: 'ES5'
            },
            src: ['./src/**/*']
        }
    }
});
```

All options passed to the task are passed directly to
[typedoc](http://typedoc.org), except for the following properties:

1.  **out**: This property defines the target directory to which all the
    generated documentation will be written.
2.  **json**: This property defines a path to a JSON file that to which
    unformatted (non html) documentation will be written.

The options object must specify at least one of `out` or `json` properties.
