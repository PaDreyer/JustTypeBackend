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

@Service({
	name: "api",
	mixins: [ApiGateway],
	settings: {
		port: 3001,
		// Global middlewares. Applied to all routes.
		use: [
			//cookieParser(),
			//helmet()
			bodyparser.json(),
			bodyparser.urlencoded({ extended: false }),
            /*
            jwt({
				secret: 'shhhhhhared-secret',
				getToken: (req) => {
					console.log("der req: ", req);
					console.log("body: ", req.body);
					return req.body;
				}
            })
            */
		],
		routes: [{
			path: "/",
			authentication : false,
			whitelist: [
				// Access to any actions in all services under "/api" URL
				"**",
			],
			bodyParsers: {
				json: true
			},
			aliases: {
				"GET login" : "api.login",
				"GET register" : "api.register",
				"GET user" : "user.find"
			}
		}]
	},
})
class Api extends moleculer.Service {

@Action({
	cache: true,
	params: {
		user: { 
			type: "object", 
			props: {
				username: { type: "string", min: 5 },
				password: { type: "string", min: 8 }
			}
		}
	}	
})
login(ctx){
	this.verifyToken(ctx);
}

@Action({
	cache: true,
	params : {
		user: { type: "object", props: {
			username: { type: "string" },
			password: { type: "string", min: 2 }
		}}
	}
})
register(){}

@Method
verifyToken(ctx){
	console.log("all data: ", ctx);
}

@Event()
tokenVerified(){}
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
		/*
		{
            aliases: {
                // Call `auth.login` action with `GET /login` or `POST /login`
                "login": "auth.login",

                // Restrict the request method
                "POST users": "users.create",

                // The `name` comes from named param. 
                // You can access it with `ctx.params.name` in action
                "GET greeter/:name": "test.greeter",
			},
			bodyParsers: {
				json: true
			}
		},
		{
            aliases: {
                "GET users": "users.list",
                "GET users/:id": "users.get",
                "POST users": "users.create",
                "PUT users/:id": "users.update",
                "DELETE users/:id": "users.remove"
			},
			bodyParsers: {
				json: true
			}
        },
		{
            aliases: {
                "REST users": "users"
			},
			bodyParsers: {
				json: true
			}
		},
		{
            aliases: {
                "POST upload"(req, res) {
                    this.parseUploadedFile(req, res);
                },
                "GET custom"(req, res) {
                    res.end('hello from custom handler')
                }
			},
			bodyParsers: {
				json: true
			}
		},
		{
            mappingPolicy: "restrict",
            aliases: {
                "POST add": "math.add"
			},
			bodyParsers: {
				json: true
			}
		},
		{
			path: "",

			// You should disable body parsers
			bodyParsers: {
				json: false,
				urlencoded: false
			},

			aliases: {
				// File upload from HTML multipart form
				"POST /": "multipart:file.save",
				
				// File upload from AJAX or cURL
				"PUT /": "stream:file.save",

				// File upload from HTML form and overwrite busboy config
				"POST /multi": {
					type: "multipart",
					// Action level busboy config
					busboyConfig: {
						limits: { files: 3 }
					},
					action: "file.save"
				}
			},

			// Route level busboy config.
			// More info: https://github.com/mscdex/busboy#busboy-methods
			busboyConfig: {
				limits: { files: 1 }
				// Can be defined limit event handlers
				// `onPartsLimit`, `onFilesLimit` or `onFieldsLimit`
			},
			

			mappingPolicy: "restrict"
		}
		*/
	],

		// Serve assets from "public" folder
		assets: {
			folder: "public",
		},
	},
	actions: {
				/**
		 * Login with username & password
		 * 
		 * @actions
		 * @param {Object} user - User credentials
		 * 
		 * @returns {Object} Logged in user with token
		 */
		login: {
			params: {
				user: { type: "object", props: {
					username: { type: "string" },
					password: { type: "string", min: 2 }
				}}
			},
			handler(ctx) {
				const { username, password } = ctx.params.user;

				return this.Promise.resolve()
					.then( ()=>{
						console.log("db functions: ", this)
					})
			}
		},
		/**
		 * Get user by JWT token (for API GW authentication)
		 * 
		 * @actions
		 * @param {String} token - JWT token
		 * 
		 * @returns {Object} Resolved user
		 */
		resolveToken: {
			cache: {
				keys: ["token"],
				ttl: 60 * 60 // 1 hour
			},			
			params: {
				token: "string"
			},
			handler(ctx) {
				return new this.Promise((resolve, reject) => {
					jwt.verify(ctx.params.token, this.settings.JWT_SECRET, (err, decoded) => {
						if (err)
							return reject(err);

						resolve(decoded);
					});

				})
					.then(decoded => {
						if (decoded.id)
							return this.getById(decoded.id);
					});
			}
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