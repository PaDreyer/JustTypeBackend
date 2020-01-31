import { Action, Event, ConcatMultiple } from 'moleculer-ts';

// required to specify your service
export const name: 'api' = 'api';

// export list of own service actions
export type OwnActions = [];

// export list of own service events
export type OwnEvents = [];

// concat service's own actions/events with mixins inherited types
export type Actions = ConcatMultiple<[OwnActions]>;
export type Events = ConcatMultiple<[OwnEvents]>;