import { Action, Event, ConcatMultiple } from 'moleculer-ts';
import auth from './auth.service';
import { string } from 'moleculer-service-decorators';


// required to specify your service
export const name: 'auth' = 'auth';

interface register extends Action<"register", {}, {}> { 
} 
// export list of own service actions
export type OwnActions = [register];

// export list of own service events
export type OwnEvents = [];

// concat service's own actions/events with mixins inherited types
export type Actions = ConcatMultiple<[OwnActions]>;
export type Events = ConcatMultiple<[OwnEvents]>;