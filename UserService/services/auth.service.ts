import moleculer, { ServiceSchema, ActionHandler } from 'moleculer'
import { Service, Event, Action, Method } from 'moleculer-decorators';
import moleculerDb from 'moleculer-db';
import mongoose from 'mongoose';
import moleculerDbAdapter from 'moleculer-db-adapter-mongoose';
import config from '../../config';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';



@Service({
	name: "auth",
	/*
	mixins: [moleculerDb],
	settings: {
		fields: ["_id", "username", "userid", "tokenid"],
        entityValidator: {
			username: { type: "string", min: 4, pattern: /^[a-zA-Z0-9]+$/ },
			userid: { type: "string" },
			token: { type: "string" },
		},
		adapter : new moleculerDbAdapter('mongodb://localhost/betroom'),
    	model: mongoose.model("Auth", new mongoose.Schema({
				username : { type : String, required : true },
				userid : { type : String, required : true },
				//tokens : { type : [], required : true },
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
	*/
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
		const {username, password} = ctx.params.user;
		if (await this.userExists(ctx)) {
			ctx.meta.result = {authenticated : false, user : null, token : null, e : new moleculer.Errors.MoleculerError('username is already taken', 609, 'shit', 'user exists hehe')}
			return;
		} 
		
		const hashedPass = bcrypt.hashSync(password, config.bcrypt.salt);
		const user = await this.broker.call('user.create', {username, password: hashedPass});
		if (user.password) {
			delete user.password;
		}
		const token = jwt.sign(user, config.jwt.secret);
		ctx.meta.token = token;


		//patch user
		const patchedUser = await ctx.call('user.patchUser', { user });
		console.log("patchedUser: ", patchedUser);
		ctx.meta.result = { token, user, e : null, authenticated : true }
	}

	@Action({
		params: {
			user : { type: "object", props: {
				username : { type : "string" },
				password : { type : "string" },
			}}
		}
	})
	async login(ctx : any) {
		const user = await this.broker.call('user.find', { query : { username : ctx.params.user.username } });
		console.log(`Login with user: ${ctx.params.user.username} and password: ${ctx.params.user.password}`)
		if(user.length != 0){
			if(bcrypt.compareSync(ctx.params.user.password, user[0].password)) {
				const token = jwt.sign(user[0], config.jwt.secret);
				ctx.meta.token = token;
				
				const patchedUser = await ctx.call('user.patchUser', { user : user[0] });
				if(patchedUser.e != null){
					throw new Error('the user was not able to be patched');
				}

				ctx.meta.result = { authenticated : true, user : patchedUser.data, token, e : null}
			} else {
				ctx.meta.result = { authenticated : false, user : null, token : null, e : 'password or user is wrong' };
			}
		} else {
			ctx.meta.result = { authenticated : false, user : null, token : null, e : 'password or user is wrong' };
		}
	}
	

	@Action()
	async authenticated(ctx : moleculer.Context){
		const cookie = ctx.meta.req.cookies.betroom;
		
		if(!cookie) return ctx.meta.result = { authenticated : false, user : null, token : null, e : 'there is no cookie'}
		try {
			const authorized = <{_id}>jwt.verify(cookie, config.jwt.secret)
			const userExists = await this.broker.call('user.get', { id: authorized!._id });
			if(!userExists) return ctx.meta.result = { authenticated : false, user : null, token : null, e : 'user doesnt exists anymore'}
			const patchedUser = await ctx.call('user.patchUser', { user : userExists });
			if(patchedUser.e != null){
				throw new Error('the user was not able to be patched')
			}
			ctx.meta.result =  { authenticated : true, user : patchedUser.data  , token : ctx.params.token }
			return;
		} catch(e) {
			ctx.meta.result =  { authenticated : false, user : null , token : null, e };
			return;
		}
	}

	@Action()
	async updateToken(ctx: moleculer.Context){
		const cookie = ctx.meta.req.cookies.betroom;
		if(!cookie) ctx.meta.result = { user : null, token : null, e : 'there is no cookie'}
		try {
			const userDocOld = <{_id:"string"}>jwt.verify(cookie, config.jwt.secret);
			const userDocNew = await this.broker.call('user.find', { query : { "_id" : userDocOld._id }})
			const token = jwt.sign(userDocNew[0], config.jwt.secret);
			ctx.meta.token = token;
			ctx.meta.result = { user : userDocNew[0], token, e: null};
		} catch(e) {
			ctx.meta.result = { use : null, token : null, e}
		}
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