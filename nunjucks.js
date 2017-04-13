/**
 * A render engine for the 'views' engine that allows for rendering with the 
 * jade template engine.  It uses a custom parser that modifies the 'include'
 * and 'extends' methods to use other stored views rather than the file system.
 **/

var underscore = require('underscore'),
    path = require('path'),
    fs = require('fs'),
    async = require('async'),
    temp = require('temp'),
    sutil  = require('util'),
    nunjucks = require('nunjucks'),
    sync = require('synchronize'),
    markdown = require('marked');
    
module.exports = function(options) {
    var pluginName = "views";
    
    var seneca = this;
    
    options = seneca.util.deepextend({
    },options)

    var renderEnv;

    console.log("options in nunjucks view are ", options);

    if (options && options.nunjucks) {
        renderEnv = nunjucks.configure('/path/to/templates', options.nunjucks);
    } else {
        renderEnv = nunjucks;
    }
    /**
     * Render the specified view with the specified render engine.
     **/
    seneca.add({
        role: pluginName, 
        cmd: 'renderWithEngine', 
        engine: 'njk',
        view: {required$: true}
    }, function(args, done) {
        seneca.log.debug("Rendering with njk");
        var locals = args.locals || {};
        // Add markdown support.  $ at the end is meant to prevent accidental namespace overloading by other
        // locals.
        var markdownWrapper = function(string) {
            var returnVal = markdown(string || '');
            returnVal = returnVal.replace(/\\_/g, "_");
            return returnVal;
        }
        locals.markdown$ = markdownWrapper;
        locals.md$ = markdownWrapper;
        sync.fiber(function() {
            try {
                options.seneca = seneca;
                locals.template = function(pluginName, templateName) {
                    var view = seneca.make('sys','views');
                    var list = sync.await(view.list$({name: templateName, plugin: pluginName}, sync.defer()));
                    // var list = view.list$({plugin: pluginName, name: templateName});
                    if (list.length <= 0) {
                        throw "Unable to find view with plugin " + pluginName + " and name " + templateName;
                    }
                    // var renderedTemplate = sync.await(nunjucks.renderString(list[0], {}, sync.defer()));
                    // return renderedTemplate;
                    var tmpl = new nunjucks.Template(list[0].template, renderEnv);
                    return tmpl;
                }
                renderEnv.renderString(args.view.template, locals, function(err, html) {
                    console.log("Html = ", sutil.inspect(html));
                    done(err, {html: html});
                });
            } catch (e) {
                done(null, {error: "Render Error", html: "<h1>Error Encountered</h1><p>Unable to render view: </p><p>" + e + "</p>"});
            }
        });
    });
    
    return pluginName;
}