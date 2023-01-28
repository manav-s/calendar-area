import { ITiledMapObject } from '@jonbell/tiled-map-type-guard';
import InteractableArea from './InteractableArea';
import {
  BoundingBox,
  TownEmitter,
  CalendarArea as CalendarAreaModel,
  CalendarEvent,
} from '../types/CoveyTownSocket';
import Player from '../lib/Player';

export default class CalendarArea extends InteractableArea {
  /* The Calendar name in this CalendarArea */
  private _calendarName?: string;

  /* The events in this CalendarArea */
  private _events: CalendarEvent[];

  public get events() {
    return this._events;
  }

  public get calendarName() {
    return this._calendarName;
  }

  /**
   * Creates a new CalendarArea
   *
   * @param events model containing this area's current topic and its ID
   * @param coordinates  the bounding box that defines this conversation area
   * @param townEmitter a broadcast emitter that can be used to emit updates to players
   */
  public constructor(
    calendarAreaModel: CalendarAreaModel,
    coordinates: BoundingBox,
    townEmitter: TownEmitter,
  ) {
    super(calendarAreaModel.id, coordinates, townEmitter);
    this._events = calendarAreaModel.events;
  }

  /**
   * Removes a player from this calendar area.
   *
   * Extends the base behavior of InteractableArea.
   *
   * @param player
   */
  public remove(player: Player) {
    super.remove(player);
    if (this._occupants.length === 0) {
      this._emitAreaChanged();
    }
    // TODO: Possibly add more functionality to remove
  }

  /**
   * Updates the state of this CalendarArea, setting the calendarName and events properties
   *
   * @param viewingArea updated model
   */
  public updateModel({ calendarName, events }: CalendarAreaModel) {
    this._calendarName = calendarName;
    this._events = events;
  }

  /**
   * Convert this CalendarArea instance to a simple CalendarAreaModel suitable for
   * transporting over a socket to a client.
   */
  public toModel(): CalendarAreaModel {
    return {
      id: this.id,
      events: this._events,
      calendarName: this._calendarName,
    };
  }

  /**
   * Creates a new calendarArea object that will represent a calendar Area object in the town map.
   * @param mapObject An ITiledMapObject that represents a rectangle in which this calendar area exists
   * @param broadcastEmitter An emitter that can be used by this calendar area to broadcast updates
   * @returns
   */
  public static fromMapObject(
    mapObject: ITiledMapObject,
    broadcastEmitter: TownEmitter,
  ): CalendarArea {
    const { name, width, height } = mapObject;
    if (!width || !height) {
      throw new Error(`Malformed viewing area ${name}`);
    }
    const rect: BoundingBox = { x: mapObject.x, y: mapObject.y, width, height };
    return new CalendarArea({ id: name, events: [] }, rect, broadcastEmitter);
  }
}
