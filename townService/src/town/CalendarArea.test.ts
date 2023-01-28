import { mock, mockClear } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import Player from '../lib/Player';
import { getLastEmittedEvent } from '../TestUtils';
import { CalendarEvent, TownEmitter } from '../types/CoveyTownSocket';
import CalendarArea from './CalendarArea';

describe('CalendarArea', () => {
  const testAreaBox = { x: 100, y: 100, width: 100, height: 100 };
  let testArea: CalendarArea;
  const townEmitter = mock<TownEmitter>();
  let newPlayer: Player;
  const id = nanoid();
  const calendarName = nanoid();
  const event1: CalendarEvent = { id: nanoid(), title: 'group 408', start: 's', end: 'e' };
  const events = [event1];

  beforeEach(() => {
    mockClear(townEmitter);
    testArea = new CalendarArea({ id, calendarName, events }, testAreaBox, townEmitter);
    testArea.updateModel({ id, calendarName, events });
    newPlayer = new Player(nanoid(), mock<TownEmitter>());
    testArea.add(newPlayer);
  });
  describe('add', () => {
    it('Adds the player to the occupants list', () => {
      expect(testArea.occupantsByID).toEqual([newPlayer.id]);
    });
    it("Sets the player's conversationLabel and emits an update for their location", () => {
      expect(newPlayer.location.interactableID).toEqual(id);

      const lastEmittedMovement = getLastEmittedEvent(townEmitter, 'playerMoved');
      expect(lastEmittedMovement.location.interactableID).toEqual(id);
    });
  });
  describe('remove', () => {
    it('Removes the player from the list of occupants and emits an interactableUpdate event', () => {
      const extraPlayer = new Player(nanoid(), mock<TownEmitter>());
      testArea.add(extraPlayer);
      testArea.remove(newPlayer);
      expect(testArea.occupantsByID).toEqual([extraPlayer.id]);
      const lastEmittedUpdate = getLastEmittedEvent(townEmitter, 'interactableUpdate');
      expect(lastEmittedUpdate).toEqual({ id, calendarName, events });
    });
    it("Clears the player's conversationLabel and emits an update for their location", () => {
      testArea.remove(newPlayer);
      expect(newPlayer.location.interactableID).toBeUndefined();
      const lastEmittedMovement = getLastEmittedEvent(townEmitter, 'playerMoved');
      expect(lastEmittedMovement.location.interactableID).toBeUndefined();
    });
  });
  test('updateModel sets calendarName and events', () => {
    const event2: CalendarEvent = { id: nanoid(), title: 'help us!', start: 'st', end: 'en' };
    const events2 = [event1, event2];
    testArea.updateModel({ id: 'ignore', calendarName: 'group_408_calendar', events: events2 });
    expect(testArea.calendarName).toBe('group_408_calendar');
    expect(testArea.id).toBe(id);
    expect(testArea.events).toStrictEqual([event1, event2]);
  });
  test('toModel sets the ID, calendarName and events and sets no other properties', () => {
    const model = testArea.toModel();
    expect(model).toEqual({
      id,
      calendarName,
      events,
    });
  });
  describe('fromMapObject', () => {
    it('Throws an error if the width or height are missing', () => {
      expect(() =>
        CalendarArea.fromMapObject(
          { id: 1, name: nanoid(), visible: true, x: 0, y: 0 },
          townEmitter,
        ),
      ).toThrowError();
    });
    it('Creates a new CalendarArea using the provided boundingBox and id', () => {
      const x = 30;
      const y = 20;
      const width = 10;
      const height = 20;
      const name = 'name';
      const val = CalendarArea.fromMapObject(
        { x, y, width, height, name, id: 10, visible: true },
        townEmitter,
      );
      expect(val.boundingBox).toEqual({ x, y, width, height });
      expect(val.id).toEqual(name);
      expect(val.calendarName).toBeUndefined();
      expect(val.events).toEqual([]);
    });
  });
});
