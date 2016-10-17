var seneca = require('seneca')(),
    assert = require('assert'),
    _ = require('underscore'),
    client;
    
describe('views', function() {
     before(function(done) {
         // load up the microservice client.
         this.timeout(5000);
         seneca.ready(function() {
            client = seneca.client({type: 'tcp'});            
         })
         // client.use('seneca-entity');
         // client.act({ "role": "Views", "cmd": "ping"}, function(err, result) {
         //     console.log("ping result was ", result);
         //     done(err);
         // });
     });

     describe("#add()", function() {
        it("should add a view to the views engine", function(done) {
            this.timeout(5000);
            // client = seneca.client({type: 'tcp'});
        });
     });

     describe("#list()", function() {
        it("Should list all of the views available in the views engine", function(done) {
            this.timeout(5000);
            // client = seneca.client({type: "tcp"});
        })
     });

});
