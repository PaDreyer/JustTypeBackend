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
    name : 'group',
    settings : {
        fields: ["_id", "name", "member", "bets", "createdAt"],
        entityValidator: {
			//username: { type: "string", min: 4, pattern: /^[a-zA-Z0-9]+$/ },
			//password: { type: "string", min: 8 },
		}
    },
    dependencies : ["api"],
    mixins : [DbService],
    adapter : new MongooseAdapter('mongodb://localhost/betroom'),
    model: mongoose.model("Group", new mongoose.Schema({
        name: { type: String, required : true },
        member: { type : Array, default : [] },
        bets : { type : Array, default : [] },
        createdAt : { type : Date, required : true }
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
        ctx.params.data = user.groups;
        const patchGroups = await this.getAllGroupsFromUser(ctx);
        let patchedUser = { ...user, groups: patchGroups };
        return patchedUser;
    }

    @Action()
    async getGroups(ctx:Context){
        const groups = await this.getAllGroupsFromUser(ctx);
        return { e : null, data : groups };
    }

    @Method
    async getAllGroupsFromUser(ctx:Context){
        //let allGroups = [];
        const groupsArray = ctx.params.data;
        const allGroups = await new this.Promise(async (res, rej)=>{
            try {
                const groups = [];
                for(let i = 0; i < groupsArray.length ; i++){
                    const groupId = await this.broker.call('group.get', { id : groupsArray[i]._id });
                    groups.push(groupId);
                }
                res(groups);
            } catch(e) {
                rej(e);
            }
        })
        console.log("allGroups: ", allGroups);
        return allGroups;
    }

    @Action()
    async createGroup(ctx:Context){
        const name = ctx.meta.req.body.name;
        const member = ctx.meta.req.body.member;

        const user = ctx.params.data;

        let gMember = [];
        gMember.push({
            username: user.username,
            _id : user._id,
            admin: true
        })

        const addRolesToMember = member.map( item => {
            item.admin = false;
            delete item.accepted;
            return item;
        })

        gMember = [...gMember, ...addRolesToMember];

        let group = await this.broker.call('group.create', {name, member: gMember});
        
        const updateUsersGroups = gMember.map( member => member._id);



        const notification = {
            categorie: 'groups',
            type: 'add',
            friendName: user.username,
            friendId : user._id,
            groupId : group._id,
            time : new Date().toISOString(),
            url : ``
        }
        console.log("die notification: ", notification);

        updateUsersGroups.forEach( async user => {
            let updateUserData = await this.broker.call('user.get', { id : user})
            updateUserData.groups.push({name: group.name, _id: group._id});
            updateUserData.notifications.splice(0, 0, notification);
            const updatedUser = await this.broker.call('user.update', { id: updateUserData._id, groups : updateUserData.groups, notifications: updateUserData.notifications });
        
        })

        return group;
    }

}

export = Api;