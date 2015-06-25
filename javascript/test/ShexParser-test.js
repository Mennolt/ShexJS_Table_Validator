var ShexParser = require('../shex').Parser;

var fs = require('fs'),
    expect = require('chai').expect;

var schemasPath = __dirname + '/../schemas/';
var parsedSchemasPath = __dirname + '/../test/parsedSchemas/';

describe('A SHEX parser', function () {
  // var b = function () {  };
  // it('is a toy', function () {
  //   expect({a:1, b: b}).to.deep.equal({a:1, b: b});
  // });

  var parser = new ShexParser();

  // Ensure the same blank node identifiers are used in every test
  beforeEach(function () { parser._resetBlanks(); });

  var schemas = fs.readdirSync(schemasPath);
  schemas = schemas.map(function (q) { return q.replace(/\.shex$/, ''); });
  schemas.sort();

  schemas.forEach(function (schema) {

    var parsedSchemaFile = parsedSchemasPath + schema + '.json';
    if (!fs.existsSync(parsedSchemaFile)) return;

    it('should correctly parse schema "' + schema + '"', function () {
      var parsedSchema = parseJSON(fs.readFileSync(parsedSchemaFile, 'utf8'));

      console.log(schema);
      schema = fs.readFileSync(schemasPath + schema + '.shex', 'utf8');
      console.log("parsed   :"+  JSON.stringify(parser.parse(schema)));
      console.log("expected :"+JSON.stringify(parsedSchema));
      expect(parser.parse(schema)).to.deep.equal(parsedSchema);
    });
  });

  it('should throw an error on an invalid schema', function () {
    var schema = 'invalid', error = null;
    try { parser.parse(schema); }
    catch (e) { error = e; }

    expect(error).to.exist;
    expect(error).to.be.an.instanceof(Error);
    expect(error.message).to.include('Parse error on line 1');
  });

  describe('with pre-defined prefixes', function () {
    var prefixes = { a: 'abc#', b: 'def#' };
    var parser = new ShexParser(prefixes);

    it('should use those prefixes', function () {
      var schema = 'a:a { b:b .+ }';
      expect(parser.parse(schema).shapes['abc#a'].predicate)
        .to.deep.equal('def#b');
    });

    it('should allow temporarily overriding prefixes', function () {
      var schema = 'PREFIX a: <xyz#> a:a { b:b .+ }';
      expect(parser.parse(schema).shapes['xyz#a'].predicate)
        .to.deep.equal('def#b');
      expect(parser.parse('a:a { b:b .+ }').shapes['abc#a'].predicate)
        .to.deep.equal('def#b');
    });

    it('should not change the original prefixes', function () {
      expect(prefixes).to.deep.equal({ a: 'abc#', b: 'def#' });
    });

    it('should not take over changes to the original prefixes', function () {
      prefixes.a = 'xyz#';
      expect(parser.parse('a:a { b:b .+ }').shapes['abc#a'].predicate)
        .to.deep.equal('def#b');
    });
  });
});

// Parses a JSON object, restoring `undefined` values
function parseJSON(string) {
  var object = JSON.parse(string);
  return /"\{undefined\}"/.test(string) ? restoreUndefined(object) : object;
}

// Recursively replace values of "{undefined}" by `undefined`
function restoreUndefined(object) {
  for (var key in object) {
    var item = object[key];
    if (typeof item === 'object')
      object[key] = restoreUndefined(item);
    else if (item === '{undefined}')
      object[key] = undefined;
  }
  return object;
}
