Seneca Views Engine
======

A microservice plugin for Senecajs that can be used to render views.  Currently
uses the JADE rendering engine but new engines are trivial to add.

Installation
=======
``` npm install seneca-views ```

Usage
=======
To use this plugin add the following line to your seneca.js program.
``` seneca.use('views'); ```

You can add a view to the views engine by calling the following command:

``` seneca.act({ role: "views", cmd: "add", name: view.name, plugin: view.plugin, ext: view.ext, template: view.template}, ...)```

In this command, ext means "file extension" which can be used to deduce the rendering engine.  You can
also pass in an "engine" signature to override the default deduced engine (ie: using html with swig).

Plugin refers to the namespace of the views for your application.  Using something like "home"
for frontend views and "admin" for backend views as your "plugin" allows you to create multiple
base views that can be rendered from anywhere.

The "template" value is a buffer or string that contains the template itself.  Using seneca entities this
can be stored in-memory (using mem-store) or in a persistence engine (ie: database or file system).

= JADE considerations
The JADE rendering engine is the only one currently pre-packaged into the system.  Jade extends
and includes work by specifying the layout in the form of "pluginName/templateName".  For example,
if you're extending a common "admin" layout.jade file for all of your backend pages, you can extend
that layout by using the following line:
``` extends admin/layout ```

The same works for includes:

``` include home/_footer ```

NOTE: the underscore here is just a convention for partials and is not required - any plugin / template
value can be placed here.

The views in jade are not tied to the filesystem so views can be added and rendered across microservices.

Example Adding Views to the Views Engine
=====
It's recommended that you add views in the  "init" method of your seneca plugin.

To add all of view from a specified folder, you can use the following snippet.

This example uses the async npm module and the "path" npm module.
```javascript
    seneca.add({init:pluginName}, function(args, done) {
        fs.readdir(path.join(__dirname, "/views"), function(err, files) {
            if (err) {
                done(err);
            } else {
                async.each(files, function(file, cb) {
                    if (err) {
                        cb(err);
                    } else {
                        var view = {};
                        view.plugin = pluginName;
                        view.ext = require('path').extname(file);
                        view.name = require('path').basename(file, view.ext);
                        view.path = path.join(__dirname, "/views", file);
                        view.template = fs.readFileSync(view.path);
                        seneca.act({
                            role: "views",
                            cmd: "add", 
                            name: view.name,
                            plugin: view.plugin,
                            ext: view.ext,
                            template: view.template
                        }, function(err, result) {
                            console.log(result);
                            if (err) {
                                cb(err);
                            } else {
                                cb();
                            }
                        });
                    }
                }, function(err) {
                    if (err) {
                        done(err);
                    } else {
                        done();
                    }
                });
            }
        }); 
    });
```
Example with Express
=====
You can use the views engine to render express views from senecajs by using the standard
seneca.act method:

```javascript
router.get('/dashboard', routeMiddleware.restrictToLoggedIn, function(req, res){
    req.seneca.act({
        "role": "views",
        "cmd": "render",
        "plugin": "admin",
        "name": "dashboard",
        "locals": {
            user: req.seneca.user
        }
    }, function(err, result) {
        if (err) {
            console.log(err);
            res.status(err.status).send(err.why);
        } else {
            res.send(result.html);
        }
    });
    //   res.render('dashboard.jade',{locals:{user:req.seneca.user}});
});
```