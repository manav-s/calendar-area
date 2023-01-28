import { mock, mockClear, MockProxy } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import { CalendarArea, CalendarEvent } from '../types/CoveyTownSocket';
import CalendarAreaController, { CalendarAreaEvents } from './CalendarAreaController';
import TownController from './TownController';

describe('CalendarAreaController', () => {
  // A valid CalendarAreaController to be reused within the tests
  let testArea: CalendarAreaController;
  let testAreaModel: CalendarArea;
  const event1: CalendarEvent = {
    id: 'event1id',
    title: 'event 1 title',
    start: 'original event 1 start time',
    end: 'original event 1 end time',
  };
  const event2: CalendarEvent = {
    id: 'event2id',
    title: 'event 2 title',
    start: 'original event 2 start time',
    end: 'original event 2 end time',
  };
  const event3: CalendarEvent = {
    id: 'event3id',
    title: 'event 3 title',
    start: 'original event 3 start time',
    end: 'original event 3 end time',
  };
  const event4: CalendarEvent = {
    id: 'event4id',
    title: 'event 4 title',
    start: 'original event 4 start time',
    end: 'original event 4 end time',
  };

  const events: CalendarEvent[] = [event1, event2, event3, event4];
  const townController: MockProxy<TownController> = mock<TownController>();
  const mockListeners = mock<CalendarAreaEvents>();
  beforeEach(() => {
    testAreaModel = {
      id: nanoid(),
      calendarName: nanoid(),
      events: events,
    };
    testArea = new CalendarAreaController(testAreaModel);
    mockClear(townController);
    mockClear(mockListeners.eventsChange);
    mockClear(mockListeners.calendarNameChange);
    testArea.addListener('eventsChange', mockListeners.eventsChange);
    testArea.addListener('calendarNameChange', mockListeners.calendarNameChange);
  });

  describe('Setting calendar name property', () => {
    it('updates the property and emits a calendarNameChange event if the property changes', () => {
      const newCalendarName = nanoid();
      testArea.calendarName = newCalendarName;
      expect(mockListeners.calendarNameChange).toBeCalledWith(newCalendarName);
      expect(testArea.calendarName).toEqual(newCalendarName);
    });
    it('does not emit a calendarNameChange event if the calendar name property does not change', () => {
      testArea.calendarName = testAreaModel.calendarName;
      expect(mockListeners.calendarNameChange).not.toBeCalled();
    });
  });

  describe('Setting events property', () => {
    it('updates the events property and emits a eventsChange event if the property changes', () => {
      const newEvents = [event1, event2, event3];
      testArea.events = newEvents;
      expect(mockListeners.eventsChange).toBeCalledWith(newEvents);
      expect(testArea.events).toEqual(newEvents);
    });
    it('does not emit an events change if the events property does not change', () => {
      testArea.events = testAreaModel.events;
      expect(mockListeners.calendarNameChange).not.toBeCalled();
      expect(testArea.events).toEqual(events);
    });
  });

  describe('CalendarArea model verification', () => {
    it('Carries through all of the properties', () => {
      expect(testArea.calendarName).toEqual(testAreaModel.calendarName);
      expect(testArea.events).toEqual(testAreaModel.events);
      expect(testArea.id).toEqual(testAreaModel.id);
    });
  });

  describe('updateFrom', () => {
    it('Updates the events and calendar name properties', () => {
      const newid = 'new id';
      const newcalname = 'new calendar name';
      const newevents = [event1, event2, event3];
      const newModel: CalendarArea = {
        id: newid,
        calendarName: newcalname,
        events: newevents,
      };
      testArea.updateFrom(newModel);
      expect(testArea.events).toEqual(newModel.events);
      expect(testArea.calendarName).toEqual(newModel.calendarName);
      expect(mockListeners.eventsChange).toBeCalledWith(newModel.events);
      expect(mockListeners.calendarNameChange).toBeCalledWith(newModel.calendarName);
    });

    it('Does not update the id property', () => {
      const existingID = testArea.id;
      const newModel: CalendarArea = {
        id: nanoid(),
        calendarName: 'newName',
        events: [event1],
      };
      testArea.updateFrom(newModel);
      expect(testArea.id).toEqual(existingID);
    });
  });
});
