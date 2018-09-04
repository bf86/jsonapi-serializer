var _ = require('lodash');
var {singularize, pluralize} = require('./inflector');

const invalidAttributes = [
  'id',
];

const nonRelationshipKeys = [
  'attributes',
  'dataLinks',
  'keyForAttribute',
  'typeForAttribute',
  'transform'
];

module.exports = function(collectionName, opts, req) {
  let {fields} = req.query;
  if (!fields) {
    return opts;
  }

  return pruneFields(opts, collectionName);

  function pruneFields(opts, primaryType) {
    for (let type in fields) {
      if (isSameType(type, primaryType)) {
        opts.attributes = fields[type].split(',');
        opts.attributes = removeInvalidAttributes(opts.attributes);
        opts = pruneRelationships(opts, fields[type], type);
      }
      let includedOpts = findOptsForType(opts, type);
      if (includedOpts) {
        includedOpts.forEach(function(includedOpt) {
          pruneFields(includedOpt, type);
        });
      }
    }
    return opts;
  }

  function removeInvalidAttributes(attributes) {
    return _.without(attributes, ...invalidAttributes);
  }

  function isSameType(typeA, typeB) {
    return typeA === typeB
      || typeA === pluralize(typeB)
      || typeA === singularize(typeB);
  }

  function findOptsForType(opts, type) {
    let optsOfType = [];
    findOptsForTypeHelper(opts);
    return optsOfType;

    function findOptsForTypeHelper(opts) {
      Object.keys(opts).map(function(opt) {
        if (isSameType(opt, type)
          || isSameType(opts[opt].type, type)) {
            optsOfType.push(opts[opt]);
        }
        if (isRelationship(opt, opts)) {
          let found = findOptsForTypeHelper(opts[opt]);
          if (found) {
            optsOfType.push(found);
          }
        }
      });
    }
  }

  function pruneRelationships(optsToPrune, fields, type) {
    for (let opt in optsToPrune) {
      if (isRelationship(opt, optsToPrune)
        && !fields.includes(opt)
        && !fields.includes(optsToPrune[opt].type)) {
        delete optsToPrune[opt];
      }
    }
    return optsToPrune;
  }

  function isRelationship(opt, optsToPrune) {
    return _.isObject(optsToPrune[opt])
      && !nonRelationshipKeys.includes(opt)
      && optsToPrune[opt].hasOwnProperty('ref');
  }
};
