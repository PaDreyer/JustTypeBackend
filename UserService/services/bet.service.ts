import moleculer, { ServiceSchema, Context } from "moleculer";
import ApiGateway = require("moleculer-web");
import { Service, Action , Event, Method } from 'moleculer-decorators';
import {
    action,
    event,
    param,
    service,
    string
} from "moleculer-service-decorators";
import DbService from 'moleculer-db';
import MongooseAdapter from 'moleculer-db-adapter-mongoose';
import mongoose from 'mongoose';
import { rejects } from "assert";

@Service({
    name : 'bet',
    settings : {
        fieldss: ["_id", ],
        fields: ["_id", "name", "typ", "group", "description", "inset", "insets", "creator", "member", "payout", "createdAt", "finishedAt"],
        entityValidator: {
			//username: { type: "string", min: 4, pattern: /^[a-zA-Z0-9]+$/ },
			//password: { type: "string", min: 8 },
		}
    },
    dependencies : ["api"],
    mixins : [DbService],
    adapter : new MongooseAdapter('mongodb://localhost/betroom'),
    model: mongoose.model("Bet", new mongoose.Schema({
        name: { type: String, required : true },
        type: { type: String, required : true },
        group : { type : String, required : true },
        description: { type: String, required : true },
        inset: { type: Number, required : true },
        creator: { type: String, required : true }, 
        createdAt : { type : Date, required : true },
        finishedAt : { type : Date, required : false },
        insets : { type: Array, default: [] },
        member: { type : Array, default : [] },
        payout : { type : Boolean, default : false },
    })),
    hooks: {
        before: {
            create: [
                function addTimestamp(ctx :Context) {
                    // Add timestamp
                    ctx.params.createdAt = new Date();
                    return ctx;
                }
            ]
        },
        after: {
            /*
            get: [
                // Arrow function as a Hook
                (ctx : any, res : any) => {
                    // Remove sensitive data
                    //delete res.password;
    
                    return res;
                }
            ]
            */
        },
    },
})
class Api extends moleculer.Service {
    @Action()
    async patchUser(ctx:Context){
        const user = ctx.params.user;
        const patchedUser = await this.userPatch(ctx, user);
        return patchedUser;
    }

    @Method
    async userPatch(ctx:Context, user){
        const patchBets = await this.getAllBetsFromUser(ctx);
        let patchedUser = { ...user, bets: patchBets };
        return patchedUser;
    }

    @Action()
    async getBets(ctx:Context){
        const bets = await this.getAllBetsFromUser(ctx);
        return { e : null, data : bets };
    }

    @Method
    async getAllBetsFromUser(ctx:Context){
        try {
            //let allGroups = [];
            const betsArray = ctx.params.data;
            const allBets = await new this.Promise(async (res, rej)=>{
                try {
                    const bets = [];
                    for(let i = 0; i < betsArray.length ; i++){
                        const betId = await this.broker.call('bet.get', { id : betsArray[i]._id });
                        bets.push(betId);
                    }
                    res(bets);
                } catch(e) {
                    rej(e);
                }
            })
            console.log("allBets: ", allBets);
            return allBets;
        } catch(e) {
            console.log("e: ", e);
        }
    }

    @Action()
    async createBet(ctx:Context){
        const name = ctx.meta.req.body.name;
        const type = ctx.meta.req.body.type;
        const group = ctx.meta.req.body.group;
        const description = ctx.meta.req.body.description;
        const inset = ctx.meta.req.body.inset;
        const creator = ctx.params.data._id;


        let bet = await this.broker.call('bet.create', {name, type, group, description, inset, creator });
        let groupData = await this.broker.call('group.get', { id : group });
        groupData.bets.push(bet._id);
        let groupUpdated = await this.broker.call('group.update', { id : group, bets: groupData.bets });
        //let updateUserData = await this.broker.call('user.get', { id : user})

        //update user bets after he has made a bet
        //updateUserData.bets.push(bet._id);
        //const updatedUser = await this.broker.call('user.update', { id: updateUserData._id, bets : updateUserData.bets });
        
        return bet;
    }

}

export = Api;