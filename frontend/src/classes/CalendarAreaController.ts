import EventEmitter from 'events';
import _ from 'lodash';
import TypedEmitter from 'typed-emitter';
import { CalendarArea as CalendarAreaModel, CalendarEvent } from '../types/CoveyTownSocket';

/**
 * The events that the CalendarAreaController emits to subscribers. These events
 * are only ever emitted to local components (not to the townService).
 */
export type CalendarAreaEvents = {
  /**
   * A calendarNameChange event indicates that the calendarName state has changed.
   * Listeners are passed the new state in the parameter `calendarName`
   */
  calendarNameChange: (calendarName: string | undefined) => void;
  /**
   * An events event indicates that the events on the calendar state has changed.
   * Listeners are passed the new state in the parameter `events`
   */
  eventsChange: (newCalendarEvents: CalendarEvent[]) => void;
};

/**
 * A CalendarAreaController manages the state for a CalendarArea in the frontend app, serving as a bridge between the calendar
 * that is in the browser and the backend TownService, ensuring that all players viewing the same calendar
 * are have the same events.
 *
 * The CalendarAreaController implements callbacks that handle events from the video player in this browser window, and
 * emits updates when the state is updated, @see CalendarAreaEvents
 */
export default class CalendarAreaController extends (EventEmitter as new () => TypedEmitter<CalendarAreaEvents>) {
  private _id: string;

  private _calendarAreaName?: string;

  private _calendarEvents: CalendarEvent[];

  /**
   * Create a new CalendarAreaController
   * @param calendarAreaModel
   */
  constructor(calendarAreaModel: CalendarAreaModel) {
    super();
    this._id = calendarAreaModel.id;
    this._calendarAreaName = calendarAreaModel.calendarName;
    this._calendarEvents = calendarAreaModel.events;
  }

  /**
   * The ID of this calendar area (read only)
   */
  get id() {
    return this._id;
  }

  get calendarName(): string | undefined {
    return this._calendarAreaName;
  }

  set calendarName(calendarName: string | undefined) {
    if (this._calendarAreaName !== calendarName) {
      this.emit('calendarNameChange', calendarName);
      this._calendarAreaName = calendarName;
    }
  }

  get events() {
    return this._calendarEvents;
  }

  set events(newEvents: CalendarEvent[]) {
    if (
      newEvents.length !== this._calendarEvents.length ||
      _.xor(newEvents, this._calendarEvents).length > 0
    ) {
      this.emit('eventsChange', newEvents);
      this._calendarEvents = newEvents;
    }
  }

  /**
   * Return the model object of the CalendarAreaController
   *
   */
  public toModel(): CalendarAreaModel {
    return {
      id: this._id,
      calendarName: this._calendarAreaName,
      events: this._calendarEvents,
    };
  }

  /**
   * Applies updates to this calendar area controller's model, setting the fields
   * calendarName and events from the updatedModel
   *
   * @param updatedModel
   */
  public updateFrom(updatedModel: CalendarAreaModel): void {
    this.calendarName = updatedModel.calendarName;
    this.events = updatedModel.events;
  }
}
