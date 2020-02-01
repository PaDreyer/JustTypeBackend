import moleculer, { ServiceSchema, ServiceSettingSchema } from 'moleculer';
import { object } from 'moleculer-service-decorators';
import ApiGateway from 'moleculer-web';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import helmet from 'helmet'
import jwtParser from 'express-jwt';
import config from './../../../../config';
import express from 'express';

interface ischeme {
    namespace : "betroom";
    name : "gateway";
    mixins : [typeof ApiGateway];
    settings : {
        port : 3001;
        use : (req : Request,  res : Response , next : express.NextFunction) => any[];
        routes: [{
            path : "/";
        }]
    }
}

//ServiceScheme
const scheme = {
    namespace : "betroom",
    name : "gateway",
    mixins : [ApiGateway],
    settings : {
        //port server
        port : 3001,

        //middleware
        use : [
            //bodyParser(),
            cookieParser(),
            helmet(),
            jwtParser({
                secret : config.jwt.secret,
                getToken: (req: Request) => {
                    console.log("Request body: ", req.body);
                    if(req.body) return req.body;
                    else return { token : "0" };
                }
            })
        ],
        routes: [
            {
                path: "/",
                //authentication: false,

                // calls this.authorize method before call the action 
                authorization : true,
                whitelist: [
                    "auth.*",
                    "gateway.*"
                ],
                bodyParser: {
                    json: true
                },
                aliases: {
                    "login" : "auth.login",
                    "logout" : "auth.logout",
                    "register" : "auth.register",
                },
                // Route error handler
                onError( req : any, res : any, err : any ) {
                res.setHeader("Content-Type", "text/plain");
                res.writeHead(err.code || 500);
                res.end("Route error: " + err.message);
            }
            },
        ],
        
    }
}

export = scheme;