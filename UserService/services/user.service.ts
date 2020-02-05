"use strict";

import { ServiceSchema } from "moleculer";
import DbService from 'moleculer-db';
import MongooseAdapter from 'moleculer-db-adapter-mongoose';
import mongoose from 'mongoose';
import MoleculerClientError from 'moleculer';

const UserService : ServiceSchema = {
    name : 'user',
    settings : {
        fields: ["_id", "username", "password", "credit", "inBet", "groups"],
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
        createdAt : { type : Date, required : true },
        credit : { type : Number , default : 0 },
        groups : { type : Array , default : [] },
        inBet : { type : Number, default : 0 }
    })),
    hooks: {
        before: {
            create: [
                function addTimestamp(ctx : any) {
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
        }
    },
    methods : {

    }
};

export = UserService;