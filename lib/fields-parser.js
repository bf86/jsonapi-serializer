var {singularize, pluralize} = require('./inflector');

module.exports = function(collectionName, opts, req) {
  if (!req.query.fields) {
    return;
  }
  for (let type in req.query.fields) {
    if (type === pluralize(collectionName)) {
      opts.attributes = req.query.fields[type].split(',');
      continue;
    }
    let includedOpts = opts[singularize(type)] || opts[pluralize(type)];
    includedOpts.attributes = req.query.fields[type].split(',');
  }
  return opts;
};
