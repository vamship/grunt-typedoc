'use strict';

const _chai = require('chai');
_chai.use(require('sinon-chai'));
_chai.use(require('chai-as-promised'));
const expect = _chai.expect;

const _rewire = require('rewire');
const _testUtils = require('@vamship/test-utils');
const _testValues = _testUtils.testValues;
const ObjectMock = _testUtils.ObjectMock;

const { ArgError } = require('@vamship/error-types').args;

let _typedoc = _rewire('../../tasks/typedoc');

describe('typedoc', function() {
    let _gruntMock = null;
    let _typeDocMock = null;

    beforeEach(() => {
        _gruntMock = new ObjectMock()
            .addMock('registerMultiTask')
            .addMock('options', (defaultOpts) => {
                return Object.assign({}, _gruntMock.__options, defaultOpts);
            });
        _gruntMock.__log = new ObjectMock().addMock('writeln');
        _gruntMock.instance.log = _gruntMock.__log.instance;
        _gruntMock.instance.filesSrc = [
            `${_testValues.getString('foo')}.ts`,
            `${_testValues.getString('bar')}.ts`
        ];

        const application = new ObjectMock()
            .addMock('convert', () => {
                return application.__conversionResult;
            })
            .addMock('generateDocs')
            .addMock('generateJson')
            .addMock('expandInputFiles', () => {
                return application.__expandedFileList;
            });
        application.__conversionResult = {};
        application.__expandedFileList = [];

        _typeDocMock = {
            __Application: application,
            Application: application.ctor
        };

        _typedoc.__set__('_typedoc', _typeDocMock);
    });

    describe('[init]', () => {
        it('should be a function', () => {
            expect(_typedoc).to.be.a('function');
        });

        it('should throw an error if invoked without a valid grunt', () => {
            const message = 'Invalid grunt object (arg #1)';
            const inputs = _testValues.allButObject();

            inputs.forEach((grunt) => {
                const wrapper = () => {
                    return _typedoc(grunt);
                };

                expect(wrapper).to.throw(ArgError, message);
            });
        });

        it('should register a multi task on the grunt runner', () => {
            const registerMultiTaskMethod = _gruntMock.mocks.registerMultiTask;

            expect(registerMultiTaskMethod.stub).to.not.have.been.called;

            _typedoc(_gruntMock.instance);

            expect(registerMultiTaskMethod.stub).to.have.been.calledOnce;
            const [
                taskName,
                taskDescription,
                task
            ] = registerMultiTaskMethod.stub.args[0];

            expect(taskName).to.equal('typedoc');
            expect(taskDescription).to.equal(
                'Generates documentation from typescript source files'
            );
            expect(task).to.be.a('function');
        });
    });

    describe('[task]', () => {
        function _initTask(options) {
            if (!options) {
                options = {
                    out: './outdir'
                };
            }
            const registerMultiTaskMethod = _gruntMock.mocks.registerMultiTask;
            _typedoc(_gruntMock.instance);
            _gruntMock.__options = options;
            return registerMultiTaskMethod.stub.args[0][2].bind(
                _gruntMock.instance
            );
        }

        it('should throw an error if the options does not define both "out" and "json" parameters', () => {
            const message =
                'Options must define "out" or "json" as a valid string';
            const inputs = _testValues.allButString('');

            const task = _initTask({});
            inputs.forEach((value) => {
                const wrapper = () => {
                    _gruntMock.__options = {
                        out: value,
                        json: value
                    };
                    task();
                };
                expect(wrapper).to.throw(ArgError, message);
            });

            inputs.forEach((json) => {
                const wrapper = () => {
                    _gruntMock.__options = {
                        out: './outdir'
                    };
                    task();
                };
                expect(wrapper).to.not.throw();
            });

            inputs.forEach((json) => {
                const wrapper = () => {
                    _gruntMock.__options = {
                        json: './out.json'
                    };
                    task();
                };
                expect(wrapper).to.not.throw();
            });
        });

        it('should throw an error if no input files are specified', () => {
            const message = 'No input files to generates documentation from';
            const task = _initTask();

            const wrapper = () => {
                _gruntMock.instance.filesSrc = [];
                task();
            };
            expect(wrapper).to.throw(ArgError, message);
        });

        it('should initialize an applications object with the specified options', () => {
            const expectedOptions = {
                out: './outdir',
                json: './out.json'
            };
            const task = _initTask(expectedOptions);

            const applicationCtorMock = _typeDocMock.Application;

            expect(applicationCtorMock).to.not.have.been.called;
            task();
            expect(applicationCtorMock).to.have.been.calledOnce;
            expect(applicationCtorMock).to.have.been.calledWithNew;

            const options = applicationCtorMock.args[0][0];
            delete expectedOptions.out;
            delete expectedOptions.json;
            delete options.logger;
            expect(options).to.deep.equal(expectedOptions);
        });

        it('should inject a logger object into the options', () => {
            const task = _initTask();

            const applicationCtorMock = _typeDocMock.Application;

            expect(applicationCtorMock).to.not.have.been.called;
            task();
            expect(applicationCtorMock).to.have.been.calledOnce;
            expect(applicationCtorMock).to.have.been.calledWithNew;

            const { logger } = applicationCtorMock.args[0][0];
            expect(logger).to.be.a('function');
        });

        it('should build a list of input files to generate documentation from', () => {
            const task = _initTask();
            const expectedInputFiles = [
                `${_testValues.getString('foo')}.ts`,
                `${_testValues.getString('bar')}.ts`
            ];
            _gruntMock.instance.filesSrc = expectedInputFiles;

            const applicationMock = _typeDocMock.__Application;
            const expandInputFilesMock = applicationMock.mocks.expandInputFiles;

            expect(expandInputFilesMock.stub).to.not.have.been.called;
            task();
            expect(expandInputFilesMock.stub).to.have.been.calledOnce;

            const inputFiles = expandInputFilesMock.stub.args[0][0];
            expect(inputFiles).to.deep.equal(expectedInputFiles);
        });

        it('should generate declaration reflections for the expanded file list', () => {
            const task = _initTask();
            const expandedFileList = [
                `${_testValues.getString('foo')}.ts`,
                `${_testValues.getString('bar')}.ts`
            ];
            const applicationMock = _typeDocMock.__Application;
            applicationMock.__expandedFileList = expandedFileList;

            const convertMock = applicationMock.mocks.convert;

            expect(convertMock.stub).to.not.have.been.called;
            task();
            expect(convertMock.stub).to.have.been.calledOnce;

            const inputFiles = convertMock.stub.args[0][0];
            expect(inputFiles).to.deep.equal(expandedFileList);
        });

        it('should return false if project reflection generation was not successful', () => {
            const task = _initTask();
            const applicationMock = _typeDocMock.__Application;
            applicationMock.__conversionResult = undefined;

            const result = task();
            expect(result).to.be.false;
        });

        it('should generate docs if the options had a valid "out" option', () => {
            const out = _testValues.getString('out');
            const task = _initTask({
                out,
                json: undefined
            });
            const conversionResult = {};
            const applicationMock = _typeDocMock.__Application;

            applicationMock.__conversionResult = conversionResult;

            const generateDocsMock = applicationMock.mocks.generateDocs;
            const generateJsonMock = applicationMock.mocks.generateJson;

            expect(generateJsonMock.stub).to.not.have.been.called;
            expect(generateDocsMock.stub).to.not.have.been.called;

            const result = task();

            expect(generateJsonMock.stub).to.not.have.been.called;
            expect(generateDocsMock.stub).to.have.been.calledOnce;
            expect(generateDocsMock.stub).to.have.been.calledWithExactly(
                conversionResult,
                out
            );

            expect(result).to.be.true;
        });

        it('should generate json if the options had a valid "json" option', () => {
            const json = _testValues.getString('json');
            const task = _initTask({
                out: undefined,
                json
            });
            const conversionResult = {};
            const applicationMock = _typeDocMock.__Application;

            applicationMock.__conversionResult = conversionResult;

            const generateDocsMock = applicationMock.mocks.generateDocs;
            const generateJsonMock = applicationMock.mocks.generateJson;

            expect(generateDocsMock.stub).to.not.have.been.called;
            expect(generateJsonMock.stub).to.not.have.been.called;

            const result = task();

            expect(generateDocsMock.stub).to.not.have.been.called;
            expect(generateJsonMock.stub).to.have.been.calledOnce;
            expect(generateJsonMock.stub).to.have.been.calledWithExactly(
                conversionResult,
                json
            );

            expect(result).to.be.true;
        });
    });
});
