var jade = require('./jade'),
    underscore = require('underscore'),
    render = require('consolidate'),
    path = require('path'),
    fs = require('fs'),
    sutil = require('util'),
    temp = require('temp').track(),
    async = require('async'),
    _ = require('underscore');
    
module.exports = function(options) {
    var pluginName = "views";
    
    var seneca = this;
    
    options = seneca.util.deepextend({
    },options)

    /**
     * Add a new template to the view engine.
     * Creates a temporary file for each template registered.
     **/
    seneca.add({
        role: pluginName,
        cmd: "add",
        name: {required$: true, type$: 'String'},
        ext: {required$: true, type$: 'String'},
        template: {required$: true},
        plugin: {required$: true, type$: 'String'}
    }, function(args, done) {
        var viewClass = seneca.make('sys','views');
        var view = viewClass.make$();
        view.plugin = args.plugin;
        // remove leading dot, if any.  This can happen if file extension is parsed directly
        // from the path / fs tools.
        view.ext = args.ext;
        view.name = args.name;
        view.template = args.template.toString();
        seneca.log.debug("template in add for name ", args.name, " is ", view.template.toString());
        
        // Should remove the leading ., currently not using it.
        view.engine = view.ext.substring(1);
        view.file = { file: {
            path: "/"
        }};
        seneca.log.debug("Before saving, view ", view.name, " is ", view);
        view.save$(function(err,savedView){
            seneca.log.debug("After saving, ", view.name, "is ", savedView);
            if (err) {
                done(err);
            } else {
                done(null, {view: savedView});
            }
        });
    });
    
    // Render a view and send the result back.
    seneca.add({
        role: pluginName,
        cmd: "render"
    }, function(args, done) {
        var view = seneca.make('sys','views');
        // Get the template for this command.
        view.list$({name: args.name, plugin: args.plugin}, function(err, list) {
            var thisView = list[0];
            seneca.log.debug("Found view with name", args.name, ": ", thisView);
            if (err) {
                done({status: 500, why: err});
            } else if (_.isUndefined(thisView)) {
                var message = "template with name " + args.name + " and plugin " + args.plugin + " not found";
                seneca.log.debug(message)
                done({status: 404, why: message});
            } else {
                seneca.log.debug('Attempting to render', 
                    thisView.name,
                    'with engine', 
                    thisView.engine
                    );
                // Send out the rendering to whichever plugin handles the specified type.
                seneca.act({
                    role: pluginName, 
                    cmd: 'renderWithEngine',
                    engine: thisView.engine,
                    view: thisView,
                    locals: args.locals
                }, function(err, result) {
                    if (err) {
                        done({status: 500, why: err});
                    } else {
                        done(null, result);
                    }
                });
            }
        });
    });
    
    // If you want to add any more routes, or override some route mapping
    // from the routes file, this is the place to do it.
    // routes.<command> = {GET: true};
    seneca.act('role:web',{use:{
          // define some routes that start with /my-api
          prefix: "/api/v1/" + pluginName,
          // use action patterns where the role is web, the type is 'api'
          // and any command is given.
          pin: {role:pluginName,cmd:"*"},
          // Map each command to some HTTP method, and use the
          // query parameters as values for the action
          map: {
              render: {GET: true}
          }
        }
    });

    seneca.use(jade);

    // return the name for this module.
    return {
        name: pluginName
    };
};