/**
 * A render engine for the 'views' engine that allows for rendering with the 
 * pug template engine.  It uses a custom parser that modifies the 'include'
 * and 'extends' methods to use other stored views rather than the file system.
 **/

var underscore = require('underscore'),
    path = require('path'),
    fs = require('fs'),
    async = require('async'),
    temp = require('temp'),
    sutil  = require('util'),
    pug = require('pug'),
    sync = require('synchronize'),
    pugParserPatch = require('./lib/pugAdapter'),
    markdown = require('marked');
    
module.exports = function(options) {
    var pluginName = "views";
    
    var seneca = this;
    
    options = seneca.util.deepextend({
    },options)

    var pugRender = function(args, done) {
        seneca.log.debug("Rendering with pug");
        var locals = args.locals || {};
        // Add markdown support.  $ at the end is meant to prevent accidental namespace overloading by other
        // locals.
        var markdownWrapper = function(string) {
            return markdown(string);
        }
        locals.markdown$ = markdownWrapper;
        locals.md$ = markdownWrapper;
        sync.fiber(function() {
            try {
                options.parser = pugParserPatch;
                options.seneca = seneca;
                var fn = pug.compile(args.view.template, options);
                console.log("fn = ", fn);
                console.log("locals = ", locals);
                var html = fn(locals);
                console.log("Html = ", sutil.inspect(html));
                done(null, {html: html});
            } catch (e) {
                done(null, {error: "Render Error", html: "<h1>Error Encountered</h1><p>Unable to render view: </p><p>" + e + "</p>"});
            }
        });
    }

    /**
     * Render the specified view with the specified render engine.
     **/
    seneca.add({
        role: pluginName, 
        cmd: 'renderWithEngine', 
        engine: 'jade',
        view: {required$: true}
    }, 
    pugRender 
    });

    /**
     * Render the specified view with the specified render engine.
     **/
    seneca.add({
        role: pluginName, 
        cmd: 'renderWithEngine', 
        engine: 'pug',
        view: {required$: true}
    }, 
    pugRender 
    })

    
    return pluginName;
}