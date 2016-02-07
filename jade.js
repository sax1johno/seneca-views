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
    jadeParserPatch = require('./lib/JadeAdapter');
    
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
        sync.fiber(function() {
            options.parser = jadeParserPatch;
            options.seneca = seneca;
            var fn = jade.compile(args.view.template, options);
            var html = fn(args.locals);
            done(null, {html: html});
        });
    });
    
    return pluginName;
}