import moleculer, { ServiceSchema } from "moleculer";
import ApiGateway = require("moleculer-web");
import { Service, Action , Event, Method } from 'moleculer-decorators';
import {
    action,
    event,
    param,
    service,
    string
} from "moleculer-service-decorators";
//import jwt from 'jsonwebtoken'
import jwt from 'express-jwt'
import bodyparser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser'
import helmet from 'helmet';


const whitelist = ['http://localhost:3000']
var corsOptions = {
    origin: function (origin, callback) {
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    }
  }

@Service({
	name: "api",
	mixins: [ApiGateway],
	settings: {
        path: "/",
		port: 3001,
		// Global middlewares. Applied to all routes.
		use: [
            helmet(),
            //cors(), // call with corsOptions!
            cookieParser(),
			bodyparser.json(),
			bodyparser.urlencoded({ extended: false }),
		],
		routes: [
            {
                whitelist: [
                    '**'
                ],
                cors: {
                    origin: ["http://localhost:3000"],
                    methods: ["POST"],
                    credentials: true
                },
                mappingPolicy: "restrict",
                bodyParsers: {
                    json: true
                },
                aliases: {
                    "POST authenticated" : "auth.authenticated",
                    "POST login" : "auth.login",
                    "POST register" : "auth.register"
                },
                onBeforeCall(ctx, route, req, res){
                    console.log("cookies: ", req.cookies)
                    console.log("req.body: ", req.body);
                    ctx.meta.route = route;
                    ctx.meta.req = req;
                    ctx.meta.res = res;
                },
                onAfterCall(ctx, route, req, res){
                    if(ctx.meta.token) {
                        ctx.meta.$responseHeaders = {
                            "Set-Cookie" : `betroom=${ctx.meta.token};`,
                            "Content-Type" : "application/json"
                        };
                    } else {
                        ctx.meta.$responseHeaders = {
                            "Content-Type" : "application/json"
                        }
                    }
                    return JSON.stringify(ctx.meta.result);
                    //res.end(JSON.stringify(ctx.meta.result))
                }
            },
            /*
            {
                whitelist: [
                    '**'
                ],
                cors: {
                    origin: "*", // [Domain, Domain, Domain]
                    methods: "*",
                    credentials: true
                },
                mappingPolicy: "restrict",
                bodyParsers: {
                    json: true
                },
                aliases: {
                    "POST login" : "auth.login",
                    "POST register" : "auth.register"
                },
                onBeforeCall(ctx, route, req, res){
                    ctx.meta.route = route;
                    ctx.meta.req = req;
                    ctx.meta.res = res;
                },
                onAfterCall(ctx, route, req, res){
                    if(ctx.meta.token) {
                        ctx.meta.$responseHeaders = {
                            "Set-Cookie" : `betroom=${ctx.meta.token}; HttpOnly`,
                            "Content-Type" : "application/json"
                        };
                    } else {
                        ctx.meta.$responseHeaders = {
                            "Content-Type" : "application/json"
                        }
                    }
                    res.end(JSON.stringify(ctx.meta.result))
                }
            }
            */
    ],
    onError(req, res, err) {
        res.setHeader("Content-Type", "application/json");
        res.writeHead(200);
        console.log(JSON.stringify(err, null, 2));
        res.end({e: err, user : null, token: null, authenticated : false});
    }		
	},
})
class Api extends moleculer.Service {
}

export = Api;

/*
Example for molecular-service-decorators
@service()
class Example extends Service {
    @action()
    public help(@param({ type: "string" }) text: string,
                @param({ type: "number", optional: true }) page: number) {}
    @action()
    public test(@string({ optional: true }) test: string) {}

    @event()
    public "test.started"(payload: any, sender: string, eventName: string) {}

    @event({ name: "test.ended", group: "test" })
    public testEnded(payload: any, sender: string, eventName: string) {}
}



middleware
broker.createService({
    mixins: [ApiService],
    settings: {
        // Global middlewares. Applied to all routes.
        use: [
            cookieParser(),
            helmet()
        ],

        routes: [
            {
                path: "/",

                // Route-level middlewares.
                use: [
                    compression(),
                    
                    passport.initialize(),
                    passport.session(),

                    serveStatic(path.join(__dirname, "public"))
                ],
                
                aliases: {
                    "GET /secret": [
                        // Alias-level middlewares.
                        auth.isAuthenticated(),
                        auth.hasRole("admin"),
                        "top.secret" // Call the `top.secret` action
                    ]
                }
            }
        ]
    }
});


authentication
broker.createService({
    mixins: ApiGatewayService,

    settings: {
        routes: [{
            // Enable authentication
            authentication: true
        }]
    },

    methods: {
        authenticate(ctx, route, req, res) {
            let accessToken = req.query["access_token"];
            if (accessToken) {
                if (accessToken === "12345") {
                    // valid credentials
                    return Promise.resolve({ id: 1, username: "john.doe", name: "John Doe" });
                } else {
                    // invalid credentials
                    return Promise.reject();
                }
            } else {
                // anonymous user
                return Promise.resolve(null);
            }
        }
    }
});

cors headers
const svc = broker.createService({
    mixins: [ApiService],

    settings: {

        // Global CORS settings for all routes
        cors: {
            // Configures the Access-Control-Allow-Origin CORS header.
            origin: "*",
            // Configures the Access-Control-Allow-Methods CORS header. 
            methods: ["GET", "OPTIONS", "POST", "PUT", "DELETE"],
            // Configures the Access-Control-Allow-Headers CORS header.
            allowedHeaders: [],
            // Configures the Access-Control-Expose-Headers CORS header.
            exposedHeaders: [],
            // Configures the Access-Control-Allow-Credentials CORS header.
            credentials: false,
            // Configures the Access-Control-Max-Age CORS header.
            maxAge: 3600
        },

        routes: [{
            path: "/api",

            // Route CORS settings (overwrite global settings)
            cors: {
                origin: ["http://localhost:3000", "https://localhost:4000"],
                methods: ["GET", "OPTIONS", "POST"],
                credentials: true
            },
        }]
    }
});
*/

const ApiService: ServiceSchema = {
	name: "api",

	mixins: [ApiGateway],

	// More info about settings: https://moleculer.services/docs/0.13/moleculer-web.html
	settings: {
		port: process.env.PORT || 3001,

		routes: [{
			path: "/api",
			//authentication : true,
			whitelist: [
				// Access to any actions in all services under "/api" URL
				"**",
			],
			bodyParsers: {
				json: true
			}
		},
	],

		// Serve assets from "public" folder
		assets: {
			folder: "public",
		},
	},
	methods: {
		authenticate(ctx, route, req, res) {
            let accessToken = req.query["access_token"];
            if (accessToken) {
                if (accessToken === "12345") {
                    // valid credentials
                    return Promise.resolve({ id: 1, username: "john.doe", name: "John Doe" });
                } else {
                    // invalid credentials
                    return Promise.reject();
                }
            } else {
                // anonymous user
                return Promise.resolve(null);
            }
        }
	}
}

//export = ApiService;



/*

ALL OPTIONS
settings: {

    // Exposed port
    port: 3000,

    // Exposed IP
    ip: "0.0.0.0",

    // HTTPS server with certificate
    https: {
        key: fs.readFileSync("ssl/key.pem"),
        cert: fs.readFileSync("ssl/cert.pem")
    },

    // Used server instance. If null, it will create a new HTTP(s)(2) server
	// If false, it will start without server in middleware mode
	server: true,
    		
    // Exposed global path prefix
    path: "/api",
    
    // Global-level middlewares
    use: [
        compression(),
        cookieParser()
    ],
    
    // Logging request parameters with 'info' level
    logRequestParams: "info",
    
    // Logging response data with 'debug' level
    logResponseData: "debug",

    // Use HTTP2 server (experimental)
    http2: false,

    // Override HTTP server default timeout
	httpServerTimeout: null,

    // Optimize route & alias paths (deeper first).
    optimizeOrder: true,

    // Routes
    routes: [
        {
            // Path prefix to this route  (full path: /api/admin )
            path: "/admin",

            // Whitelist of actions (array of string mask or regex)
            whitelist: [
                "users.get",
                "$node.*"
            ],

            // Call the `this.authorize` method before call the action
            authorization: true,

            // Merge parameters from querystring, request params & body 
            mergeParams: true,
            
            // Route-level middlewares
            uses: [
                helmet(),
                passport.initialize()
            ],

            // Action aliases
            aliases: {
                "POST users": "users.create",
                "health": "$node.health"
            },

            mappingPolicy: "all",

            // Use bodyparser module
            bodyParsers: {
                json: true,
                urlencoded: { extended: true }
            }
        },
        {
            // Path prefix to this route  (full path: /api )
            path: "",

            // Whitelist of actions (array of string mask or regex)
            whitelist: [
                "posts.*",
                "file.*",
                /^math\.\w+$/
            ],

            // No authorization
            authorization: false,
            
            // Action aliases
            aliases: {
                "add": "math.add",
                "GET sub": "math.sub",
                "POST divide": "math.div",
                "GET greeter/:name": "test.greeter",
                "GET /": "test.hello",
                "POST upload"(req, res) {
                    this.parseUploadedFile(req, res);
                }
            },

            mappingPolicy: "restrict",
            
            // Use bodyparser module
            bodyParsers: {
                json: false,
                urlencoded: { extended: true }
            },

            // Calling options
            callOptions: {
                timeout: 3000,
                retries: 3,
                fallbackResponse: "Static fallback response"
            },

            // Call before `broker.call`
            onBeforeCall(ctx, route, req, res) {
                ctx.meta.userAgent = req.headers["user-agent"];
            },

            // Call after `broker.call` and before send back the response
            onAfterCall(ctx, route, req, res, data) {
                res.setHeader("X-Custom-Header", "123456");
            },
            
            // Route error handler
            onError(req, res, err) {
                res.setHeader("Content-Type", "text/plain");
                res.writeHead(err.code || 500);
                res.end("Route error: " + err.message);
            }
        }
    ],

    // Folder to server assets (static files)
    assets: {
        // Root folder of assets
        folder: "./examples/www/assets",
        
        // Options to `server-static` module
        options: {}
    },

    // Global error handler
    onError(req, res, err) {
        res.setHeader("Content-Type", "text/plain");
        res.writeHead(err.code || 500);
        res.end("Global error: " + err.message);
    }    
}





authentication example with bearer
"use strict";

/**
 * This example shows how to use authorization with API Gateway
 *
 * Example:
 *
 *  - Try to call /test/hello. It will throw Forbidden
 *
 * 		http://localhost:3000/test/hello
 *
 *  - Set "Authorization: Bearer 123456" to header" and try again. Authorization will be success and receive the response
 *
 

let path 				= require("path");
let { ServiceBroker } 	= require("moleculer");
let ApiGatewayService 	= require("../../index");

const { UnAuthorizedError, ERR_NO_TOKEN, ERR_INVALID_TOKEN } = require("../../src/errors");

// Create broker
let broker = new ServiceBroker({
	logger: console
});

// Load other services
broker.loadService(path.join(__dirname, "..", "test.service"));

// Load API Gateway
broker.createService({
	mixins: ApiGatewayService,

	settings: {

		routes: [
			{
				// Enable authorization
				authorization: true
			}
		]
	},

	methods: {
		/**
		 * Authorize the user from request
		 *
		 * @param {Context} ctx
		 * @param {Object} route
		 * @param {IncomingMessage} req
		 * @param {ServerResponse} res
		 * @returns
		 
		authorize(ctx, route, req, res) {
			let auth = req.headers["authorization"];
			if (auth && auth.startsWith("Bearer ")) {
				let token = auth.slice(7);
				if (token == "123456") {
					// Set the authorized user entity to `ctx.meta`
					ctx.meta.user = { id: 1, name: "John Doe" };
					return Promise.resolve(ctx);

				} else
					return Promise.reject(new UnAuthorizedError(ERR_INVALID_TOKEN));

			} else
				return Promise.reject(new UnAuthorizedError(ERR_NO_TOKEN));
		}
	}
});

// Start server
broker.start();

*/