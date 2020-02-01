import { Action, Event, ConcatMultiple } from 'moleculer-ts';
import auth from './auth.service';
import { string } from 'moleculer-service-decorators';
auth.prototype.register

// required to specify your service
export const name: 'api' = 'api';

const test: Action<string,{},object> = { 
    name : "register",
    in : {}, 
    out : {}
} 
// export list of own service actions
export type OwnActions = [Action];

// export list of own service events
export type OwnEvents = [];

// concat service's own actions/events with mixins inherited types
export type Actions = ConcatMultiple<[OwnActions]>;
export type Events = ConcatMultiple<[OwnEvents]>;