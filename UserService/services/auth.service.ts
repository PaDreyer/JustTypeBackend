import moleculer, { ServiceSchema, ActionHandler } from 'moleculer'
import { Service, Event, Action, Method } from 'moleculer-decorators';
import moleculerDb from 'moleculer-db';
import mongoose from 'mongoose';
import moleculerDbAdapter from 'moleculer-db-adapter-mongoose';
import config from '../../config';
import jwt from 'jsonwebtoken';




@Service({
	name: "auth",
	mixins: [moleculerDb],
	settings: {
		fields: ["_id", "username", "userid", "tokenid"],
        entityValidator: {
			username: { type: "string", min: 4, pattern: /^[a-zA-Z0-9]+$/ },
			password: { type: "string" , min: 8 },
			userid: { type: "string" },
			tokenid: { type: "string" },
		},
		adapter : new moleculerDbAdapter('mongodb://localhost/betroom'),
    	model: mongoose.model("Auth", new mongoose.Schema({
				username : { type : String, required : true },
				userid : { type : String, required : true },
				tokenid : { type : String, required : true },
				secret : { type: String , required : true },
				createdAt : { type : Date, required : true },
    })),
    hooks: {
        before: {
            create: [
                function addSecret(ctx : any) {
                    // Add secret
					ctx.params.secret = config.jwt.secret;
                    return ctx;
				},
				function addTimestamp(ctx : any) {
					ctx.params.createdAt = new Date();
					return ctx;
				}
            ]
        },
        after: {
            get: [
                // Arrow function as a Hook
                (ctx : any, res : any) => {
                    // Remove sensitive data
					delete res.secret;
					delete res.tokenid;
                    return res;
                }
            ]
        },
	}
	}
})
class AuthService extends moleculer.Service {
	@Action({
		params: {
			user : { type: "object", props: {
				username : { type : "string" },
				password : { type : "string" },
			}}
		}
	})
	async register(ctx){
		console.log("context: ", ctx.params)
		const {username, password} = ctx.params.user;
		console.log("username: ", username);
		console.log("password: ", password);
		if (await this.userExists(ctx)) return new moleculer.Errors.MoleculerError('username is already taken', 609)
		const user = await this.broker.call('user.create', {username, password});
		console.log("user: ", user);
		//const token = jwt.sign()
		// call user.create
		// call this.generateToken
		// call this.saveToken with username, userid, etc.
		// return object with token and user
		//this.broker.call("user.create", {username: ctx.})
	}

	@Event()
	'auth.register'(payload, sender, eventName) {
		console.log("Be prepared, event is comming !");
		console.log("payload: ", payload);
		console.log("sender: ", sender);
		console.log("eventName: ", eventName);
	}

	@Method
	async userExists(ctx : any) : Promise<boolean> {
		const user = await this.broker.call('user.find', { query: {username : ctx.params.user.username }});
		console.log("user length : ", user);
		if(user.length == 0) return false;
		return true;
	}

	@Method
	authorize(ctx, route, req, res) {
	  
	}

	created() {
        // Fired when the service instance created. (broker.loadService or broker.createService)
    }

    async started() {
        // Fired when `broker.start()` called.
    }

    async stopped() {
        // Fired when `broker.stop()` called.
    }
}

export = AuthService;