'use strict';

const { argValidator: _argValidator } = require('@vamship/arg-utils');
const { ArgError } = require('@vamship/error-types').args;
const _typedoc = require('typedoc');

/**
 * Grunt task that uses typedoc to generate documentation from typescript source
 * files.
 *
 * @module tasks
 */

/**
 * Registers a task with the grunt task runner to execute typedoc generation.
 *
 * @param {Object} grunt Reference to the task runner.
 */
const typedocTask = function(grunt) {
    _argValidator.checkObject(grunt, 'Invalid grunt object (arg #1)');

    grunt.registerMultiTask(
        'typedoc',
        'Generates documentation from typescript source files',
        function() {
            const options = this.options({});
            if (
                !_argValidator.checkString(options.out, 1) &&
                !_argValidator.checkString(options.json, 1)
            ) {
                throw new ArgError(
                    'Options must define "out" or "json" as a valid string'
                );
            }

            if (this.filesSrc.length <= 0) {
                throw new ArgError(
                    'No input files to generate documentation from'
                );
            }
            const { out, json } = options;
            delete options.out;
            delete options.json;

            options.logger = (message, level) => {
                grunt.log.writeln(message);
            };

            const app = new _typedoc.Application();
            // Enable TypeDoc option reading from typedoc.json + tsconfig.json
            app.options.addReader(new _typedoc.TSConfigReader());
            app.options.addReader(new _typedoc.TypeDocReader());
            app.bootstrap(options);
            const expandedFileList = app.expandInputFiles(this.filesSrc);
            const result = app.convert(expandedFileList);
            if (!result) {
                return false;
            }

            if (out) {
                app.generateDocs(result, out);
            }

            if (json) {
                app.generateJson(result, json);
            }

            return true;
        }
    );
};

module.exports = typedocTask;
