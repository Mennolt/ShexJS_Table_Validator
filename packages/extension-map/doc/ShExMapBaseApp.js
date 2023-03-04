/**
 * supplement ShExSimpleApp with:
 * - bindings (JSONCache)
 * - statics (JSONCache)
 * - ouputSchema (SchemaCache)
 */

class JSONCache extends InterfaceCache {
  constructor (selection) {
    super(selection);
  }

  async parse (text) {
    return Promise.resolve(JSON.parse(text));
  }
}

class ShExMapBaseApp extends ShExSimpleApp {
  constructor (base) {
    super(base);
    Object.assign(this.Caches, {
      bindings:     new JSONCache($("#bindings1 textarea")),
      statics:      new JSONCache($("#staticVars textarea")),
      outputSchema: new SchemaCache($("#outputSchema textarea"), this.shexcParser, this.turtleParser),
    });
    Object.assign(this.Getables, {
      queryStringParm: "bindings",     location: this.Caches.bindings.selection,    cache: this.Caches.bindings    ,
      queryStringParm: "statics",      location: this.Caches.statics.selection,     cache: this.Caches.statics     ,
      queryStringParm: "outSchema",    location: this.Caches.outputSchema.selection,cache: this.Caches.outputSchema,
    });
  }
}

