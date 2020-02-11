"use strict";

import { ServiceSchema, Context } from "moleculer";
import DbService from 'moleculer-db';
import MongooseAdapter from 'moleculer-db-adapter-mongoose';
import mongoose from 'mongoose';
import MoleculerClientError from 'moleculer';
import jwtMiddleware from "./middleware/jwt";
import jwt from 'jsonwebtoken';
import config from './../../config';
import shortid from 'shortid';

const UserService : ServiceSchema = {
    name : 'user',
    settings : {
        fields: ["_id", "username", "password", "credit", "inBet", "groups", "notifications", "friends"],
        entityValidator: {
			username: { type: "string", min: 4, pattern: /^[a-zA-Z0-9]+$/ },
			password: { type: "string", min: 8 },
		}
    },
    dependencies : ["api"],
    mixins : [DbService],
    adapter : new MongooseAdapter('mongodb://localhost/betroom'),
    model: mongoose.model("User", new mongoose.Schema({
        username : { type : String, required : true },
        password : { type : String, required : true },
        friends : { type : Array, default : [] },
        createdAt : { type : Date, required : true },
        credit : { type : Number , default : 0 },
        notifications: { type : Array, default: [] },
        groups : { type : Array , default : [] },
        inBet : { type : Number, default : 0 }
    })),
    hooks: {
        before: {
            create: [
                function addTimestamp(ctx : Context) {
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
    events : {

    },
    actions : {
        register(ctx : any) {
        },
        async userNotifications(ctx:Context){
            const cookie = ctx.meta.req.cookies.betroom;
            if(!cookie) return ctx.meta.result = { e: 'There is no cookie', data: []}

            try {
                const user = <{_id}>jwt.verify(cookie, config.jwt.secret);
                const userData = await this.broker.call('user.get',{id: user._id})
                return ctx.meta.result = { e: null, data : userData.notifications }
            } catch(e) {
                return ctx.meta.result = { e: 'Token is invalid', data: []}
            }
        },
        //need to add params for validation
        async userFriends(ctx:Context){
            try {
                const data = await this.getPropertyFromUser(ctx, "friends");
                return ctx.meta.result = { e : null, data };
            } catch(e) {
                return ctx.meta.result = { e, data: []};
            }
        },
        async userGroups(ctx:Context){
            try {
                const data = await this.getPropertyFromUser(ctx, 'groups');
                return ctx.meta.result = { e : null, data };
            } catch(e) {
                return ctx.meta.result = { e , data : [] };
            }
        },
        async userCredit(ctx:Context){
            try {
                const data = await this.getPropertyFromUser(ctx, 'credit');
                return ctx.meta.result = { e : null, data };
            } catch(e) {
                return ctx.meta.result = { e : e.toString(), data : 0 }
            }
        },
        async userInBet(ctx:Context){
            try {
                const data = await this.getPropertyFromUser(ctx, 'inBet');
                return ctx.meta.result = { e : null, data };
            } catch(e) {
                return ctx.meta.result = { e : e.toString() , data : [] };
            }
        },
        async userGetFriend(ctx:Context){
            try {
                const user = await this.getUserFromToken(ctx);
                if(user.username == ctx.meta.req.query.username) throw new Error('you cannot add yourself')
                const check = await this.checkFriend(ctx, ctx.meta.req.query.username);
                if(check){
                    const data = await this.getFriend(ctx, ctx.meta.req.query.username);
                    return ctx.meta.result = { e : null, data : data };
                } else {
                    throw new Error('user is allready in friendlist');
                }
            } catch(e) {
                console.log("gecatcht")
                return ctx.meta.result = { e : e.toString(), data : { _id : null, username: null } };
            }
        },
        async userAddFriend(ctx:Context){
            try {
                const data = await this.addFriend(ctx);
                return ctx.meta.result = { e : null, data : data };
            } catch(e) {
                return ctx.meta.result = { e: e.toString(), data : null };
            }
        },
        async userAcceptFriend(ctx:Context){
            try {
                const data = await this.acceptFriend(ctx);
                return ctx.meta.result = { e : null, data : data };
            } catch(e) {
                return ctx.meta.result = { e : e.toString(), data : null };
            }
        },
        async userDenyFriend(ctx:Context){
            try {
                const data = await this.denyFriend(ctx);
                return ctx.meta.result = { e : null, data : data };
            } catch(e) {
                return ctx.meta.result = { e : e.toString(), data : null };
            }
        },
        async userDeleteFriend(ctx:Context){
            try {
                const data = await this.deleteFriend(ctx);
                return ctx.meta.result = { e : null, data  : data };
            } catch(e) {
                return ctx.meta.result = { e: e.toString(), data : null }
            }
        }
    },
    methods : {
        async getPropertyFromUser(ctx : Context, property : string) {
            try {
                const user = await this.getUserFromToken(ctx);
                const data = user[property];
                return data;
            } catch(e){
                throw new Error('The property does not exists');
            }
        },
        async getUserFromToken(ctx: Context){
            try {
                const userFromToken = this.verifyToken(ctx);
                const userFromDatabase = await this.broker.call('user.get', {id: userFromToken._id});
                return userFromDatabase;
            } catch(e) {
                console.log("error: ", e);
                throw new Error('The token data is broken or manipulated');
            }
        },
        //not done yet
        async userAddNotification(ctx:Context){
            let user = await this.getUserFromToken(ctx);
            user.notifications.push(ctx.meta.req.body.notification);
            const result = await ctx.broker.call('user.update', {})
            return result;
        },
        async getFriend(ctx:Context, username){
            let user = await this.broker.call('user.find', { query: { username } } )
            if(user.length != 0){
                user = user[0];
                delete user.password;
                delete user.friends;
                delete user.groups;
                delete user.notifications;
                delete user.credit;
                delete user.inBet;
                return user;
            } else {
                return { _id : null, username: null };
            }
        },
        async checkFriend(ctx, username){
            let user = await this.getUserFromToken(ctx);
            for(let i = 0; i < user.friends.length;i++){
                if(user.friends[i].username == username ) return false;
            }
            return true;
        },
        async addFriend(ctx:Context){
            let userObject = await this.getUserFromToken(ctx);
            let friendObject = await this.broker.call('user.find', { query : { username : ctx.meta.req.body.username }});
            friendObject = friendObject[0];
            friendObject.notifications.push({
                categorie: 'friends',
                type: 'add',
                friendName: userObject.username,
                friendId : userObject._id,
                time : new Date().toISOString(),
                url : ``
            })
            userObject.friends.push({username: friendObject.username, _id: friendObject._id, accepted : false });
            const result = await this.broker.call('user.update', { _id : friendObject._id , notifications : friendObject.notifications });
            await this.broker.call('user.update', { _id : userObject._id, friends : userObject.friends });
            
            //unknown which to return
            return result;
        },
        async acceptFriend(ctx:Context){
            let userObject = await this.getUserFromToken(ctx);
            let friendObject = await this.broker.call('user.get', { id : ctx.meta.req.body.id } );

            let uNotifications : any[] = userObject.notifications;

            uNotifications = uNotifications.reduce( (acumm, currVal, currIndex) => {
                if(currVal.categorie == "friends" && currVal.type == "add"){
                    if(currVal.friendId == friendObject._id){
                        return acumm;
                    }
                }
                acumm.push(currVal);
                return acumm;
            }, []);

            userObject.friends.push({username: friendObject.username, _id: friendObject._id, accepted: true })

            const userData = await this.broker.call('user.update', { _id : userObject._id, notifications : uNotifications, friends: userObject.friends });



            let fFriends = friendObject.friends;
            // freund auf accepted setzen, anschließend response mit success data, update friends ?
            fFriends = fFriends.reduce( (acumm, currVal, currIndex) => {
                if(currVal.username == userObject.username){
                    currVal.accepted = true;
                    acumm.push(currVal);
                    return acumm;
                }
                acumm.push(currVal);
                return acumm;
            }, []);

            const friendData = await this.broker.call('user.update', { _id : friendObject._id, friends : fFriends })
            return { user : userData, friend: friendData };
        
        },
        async denyFriend(ctx:Context){
            const userObject = await this.getUserFromToken(ctx);
            const friendObject = await this.broker.call('user.get', { id : ctx.meta.req.body.id } );

            //delete notification from userobejct
            //delete user from friendobject

            let uNotifications : any[] = userObject.notifications;

            uNotifications = uNotifications.reduce( (acumm, currVal, currIndex) => {
                if(currVal.categorie == "friends" && currVal.type == "add"){
                    if(currVal.friendId == friendObject._id){
                        return acumm;
                    }
                }
                acumm.push(currVal);
                return acumm;
            }, []);

            const userData = await this.broker.call('user.update', { id : userObject._id, notifications: uNotifications });


            let fFriends = friendObject.friends;
            // freund auf accepted setzen, anschließend response mit success data, update friends ?
            fFriends = fFriends.reduce( (acumm, currVal, currIndex) => {
                if(currVal.username == userObject.username){
                    return acumm;
                }
                acumm.push(currVal);
                return acumm;
            }, []);

            const friendData = await this.broker.call('user.update', { id: friendObject._id, friends: fFriends });

            return { user: userData , friend: friendData };
        
        },
        async deleteFriend(ctx:Context){
            let deleteUserId = ctx.meta.req.body.id;
            console.log("delete userid : ", deleteUserId);
            let userObject = await this.getUserFromToken(ctx);
            let friendObect = await this.broker.call('user.get', { id : deleteUserId });



            let uFriends = userObject.friends;
            // freund auf accepted setzen, anschließend response mit success data, update friends ?
            uFriends = uFriends.reduce( (acumm, currVal, currIndex) => {
                if(currVal._id == deleteUserId){
                    return acumm;
                }
                acumm.push(currVal);
                return acumm;
            }, []);

            const userData = await this.broker.call('user.update', { id: userObject._id, friends: uFriends });



            let fNotifications : any[] = friendObect.notifications;

            fNotifications = fNotifications.reduce( (acumm, currVal, currIndex) => {
                if(currVal.categorie == "friends" && currVal.type == "add"){
                    if(currVal.friendId == userObject._id){
                        return acumm;
                    }
                }
                acumm.push(currVal);
                return acumm;
            }, []);

            const friendData = await this.broker.call('user.update', { id : friendObect._id, notifications: fNotifications });

            return { user: userData, friend: friendData };
        },
        verifyToken(ctx:Context){
            const cookie = ctx.meta.req.cookies.betroom;
            if(!cookie) throw new Error('There is no cookie');

            try {
                const user = <{_id}>jwt.verify(cookie, config.jwt.secret);
                return user;
            } catch(e) {
                throw new Error('The token is invalid');
            }
        }
    }
};

export = UserService;