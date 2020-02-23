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
                    "POST register" : "auth.register",
                    "POST user/notifications" : "user.userNotifications",
                    "GET  user/groups" : "user.userGroups",
                    "POST user/groups/create" : "user.userCreateGroup",
                    "GET  user/bets" : "user.userBets",
                    "POST user/bets/create" : "user.userCreateBet",
                    "POST user/credit" : "user.userCredit",
                    "POST user/inBet" : "user.userInBet",
                    "GET user/friends" : "user.userFriends",
                    "GET  user/friends/add" : "user.userGetFriend",
                    "POST user/friends/add" : "user.userAddFriend",
                    "POST user/friends/accept" : "user.userAcceptFriend",
                    "POST user/friends/deny" : "user.userDenyFriend",
                    "POST user/friends/delete" : "user.userDeleteFriend",
                    "GET user/bets" : "user.userBets"
                },
                onBeforeCall(ctx, route, req, res){
                    //console.log("cookies: ", req.cookies)
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
                            "Content-Type" : "application/json",
                            "Accept" : "application/json"
                        }
                    }
                    //console.log("")
                    //return ctx.meta.result
                    let result = { ...ctx.meta.result };
                    if(result.e){
                        delete result.e.ctx;
                    }
                    console.log("result: ", result);
                    return JSON.stringify(result);
                    //return (JSON.stringify(ctx.meta.result))
                }
            },
    ],
    onError(req, res, err) {
        //res.setHeader("Content-Type", "application/json");
        //res.writeHead(200);
        res.end(JSON.stringify({e: err.toString(), user : null, token: null, authenticated : false}));
    }		
	},
})
class Api extends moleculer.Service {
}

export = Api;