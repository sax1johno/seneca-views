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
    jade = require('jade'),
    sync = require('synchronize'),
    jadeParserPatch = require('./lib/JadeAdapter'),
    markdown = require('marked');
    
module.exports = function(options) {
    var pluginName = "views";
    
    var seneca = this;
    
    options = seneca.util.deepextend({
    },options)

    /**
     * Render the specified view with the specified render engine.
     **/
    seneca.add({
        role: pluginName, 
        cmd: 'renderWithEngine', 
        engine: 'jade',
        view: {required$: true}
    }, function(args, done) {
        seneca.log.debug("Rendering with jade");
        var locals = args.locals;
        // Add markdown support.  $ at the end is meant to prevent accidental namespace overloading by other
        // locals.
        locals.markdown$ = markdown;
        locals.md$ = markdown;
        sync.fiber(function() {
            try {
                options.parser = jadeParserPatch;
                options.seneca = seneca;
                var fn = jade.compile(args.view.template, options);
                var html = fn(args.locals);
                console.log("Html = ", sutil.inspect(html));
                done(null, {html: html});
            } catch (e) {
                done(null, {error: "Render Error", html: "<h1>Error Encountered</h1><p>Unable to render view: </p><p>" + e + "</p>"});
            }
        });
    });
    
    return pluginName;
}