/**
 * The JadeAdapter is a set of filters that allows a JADE template to extend
 * and include from a view stored in the ghiraldi views engine and plugin 
 * registry.  See the blog post at http://tjholowaychuk.com/post/1180958201/jade-templates-introspection
 * for more information on how this works.
 **/
var _ = require('underscore'),
    util = require('util'),
    jade = require('jade'),
    Parser = jade.Parser,
    nodes = jade.nodes,
    utils = jade.utils,
    filters = jade.filters,
    sync = require('synchronize'),
    constantinople = require('constantinople');
    
/**
 * The JadePARSER is an alternative parser for the jade templating system
 * that allows us to modify the standard include and extends to point to the
 * absolute paths pointed to by the Ghiraldi views engine.
 * 
 * We'll do this by creating our own parser that overwrites the resolvePath
 * function to read the template and plugin names.  The parser
 * then uses the ghiraldi views engine to resolve the plugin and template names 
 * into absolute paths to templates, and then delegates the rest to the standard
 * JADE parser.
 **/

/**
 * Constructor just calls the base class.
 * @param str the string to be parsed.
 * @param filename the filename param.
 * @param options the options map.
 **/
function ghParser(str, filename, options) {
    this.seneca = options.seneca;
    Parser.call(this, str, filename, options);
}

// Extends the jade parser.
ghParser.prototype.__proto__ = Parser.prototype;

// override the resolvePath method.
// Replaces the extends and includes paths in a jade template with the
// plugin/template_name syntax.
ghParser.prototype.resolvePath = function(path, purpose) {
    var _super = Parser.prototype.resolvePath;
    var pluginName;
    var templateName;
    // var plugins = require('ghiraldi-plugin-registry').registry;
    // Absolulte and relative paths will start with '/' or '.'
    // Parse the path.  Should be plugin/viewname
    var viewArray = path.split('/');
    var view = this.seneca.make('sys','views');
    pluginName = viewArray[0];
    templateName = viewArray[1];
    var list = sync.await(view.list$({name: templateName, plugin: pluginName}, sync.defer()));
    // var list = view.list$({plugin: pluginName, name: templateName});
    if (list.length <= 0) {
        throw "Unable to find view with plugin " + pluginName + " and name " + templateName;
    }
    // var pluginPath = list[0].file.path;
    
    // Change this to return a view rather than the plugin path.
    return list[0];
    // view.list$({plugin: pluginName, name: templateName}, function(err, list) {
    //     if (err) {
    //         console.error(err);
    //         throw err;
    //     }
    //     var pluginPath = list[0].file.path;
    //     return pluginPath;
    // });
};

ghParser.prototype.parseExtends =  function(){

    var view = this.resolvePath(this.expect('extends').val.trim(), 'extends');

    this.dependencies.push(view.id);
    var str = view.template.toString();
    var parser = new this.constructor(str, view.file.path, this.options);
    parser.dependencies = this.dependencies;

    parser.blocks = this.blocks;
    parser.included = this.included;
    parser.contexts = this.contexts;
    this.extending = parser;

    // TODO: null node
    return new nodes.Literal('');
  };
  
ghParser.prototype.parseInclude =  function(){
    // var fs = require('fs');
    var tok = this.expect('include');

    var view = this.resolvePath(tok.val.trim(), 'include');
    this.dependencies.push(view.id);
    // has-filter
    if (tok.filter) {
    //   var str = fs.readFileSync(path, 'utf8').replace(/\r/g, '');
    var str = view.template.toString();
      var options = {filename: view.file.path};
      if (tok.attrs) {
        tok.attrs.attrs.forEach(function (attribute) {
          options[attribute.name] = constantinople.toConstant(attribute.val);
        });
      }
      str = filters(tok.filter, str, options);
      return new nodes.Literal(str);
    }

    // // non-jade
    if (view.engine !== 'jade') {
      var str = view.template.toString();
      return new nodes.Literal(str);
    }

    // var str = fs.readFileSync(path, 'utf8');
    var str = view.template.toString();
    var parser = new this.constructor(str, view.file.path, this.options);
    parser.dependencies = this.dependencies;

    parser.blocks = utils.merge({}, this.blocks);
    parser.included = true;

    parser.mixins = this.mixins;

    this.context(parser);
    var ast = parser.parse();
    this.context();
    ast.filename = view.file.path;

    if ('indent' == this.peek().type) {
      ast.includeBlock().push(this.block());
    }

    return ast;
  },

  

module.exports = ghParser;