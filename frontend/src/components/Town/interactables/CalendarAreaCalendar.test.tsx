import { ChakraProvider } from '@chakra-ui/react';
import { EventNames } from '@socket.io/component-emitter';
import { cleanup, render, RenderResult } from '@testing-library/react';
import { mock, MockProxy } from 'jest-mock-extended';
import React from 'react';
import { act } from 'react-dom/test-utils';
import * as FullCalendar from '@fullcalendar/react';
import TownController from '../../../classes/TownController';
import CalendarAreaController, {
  CalendarAreaEvents,
} from '../../../classes/CalendarAreaController';
import { CalendarEvent } from '../../../../../shared/types/CoveyTownSocket';
import TownControllerContext from '../../../contexts/TownControllerContext';
import { CalendarAreaCalendar } from './CalendarAreaCalendar';
import { nanoid } from 'nanoid';

// A sentinel value that we will render in the mock react full calendar component to help find it in the DOM tree
const MOCK_REACT_CALENDAR_PLACEHOLDER = 'MOCK_REACT_CALENDAR_PLACEHOLDER';
class MockCalendar extends React.Component {
  private _componentDidUpdateSpy: jest.Mock<never, [FullCalendar.CalendarOptions]>;

  private _seekEvents: jest.Mock<never, [CalendarEvent[]]>;

  public calendarEvents: CalendarEvent[] = [];

  constructor(
    props: FullCalendar.CalendarOptions,
    componentDidUpdateSpy: jest.Mock<never, [FullCalendar.CalendarOptions]>,
    seekEvents: jest.Mock<never, [CalendarEvent[]]>,
  ) {
    super(props);
    this._componentDidUpdateSpy = componentDidUpdateSpy;
    this._seekEvents = seekEvents;
  }

  getCurrentEvents() {
    return this.calendarEvents;
  }

  setEvents(newEvents: CalendarEvent[]) {
    this.calendarEvents = newEvents;
    this._seekEvents(newEvents);
  }

  //   componentDidUpdate(): void {
  //     this._componentDidUpdateSpy(this.props);
  //   }

  render(): React.ReactNode {
    return <>{MOCK_REACT_CALENDAR_PLACEHOLDER}</>;
  }
}

const fullCalendarSpy = jest.spyOn(FullCalendar, 'default');

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
fullCalendarSpy.prototype = React.Component.prototype;

function renderCalendarArea(calendarArea: CalendarAreaController, controller: TownController) {
  return (
    <ChakraProvider>
      <TownControllerContext.Provider value={controller}>
        <CalendarAreaCalendar controller={calendarArea} />
      </TownControllerContext.Provider>
    </ChakraProvider>
  );
}

describe('[T4] Calendar Area Video', () => {
  const mockCalendarAreaConstructor = jest.fn<never, [FullCalendar.CalendarOptions]>();
  const componentDidUpdateSpy = jest.fn<never, [FullCalendar.CalendarOptions]>();
  const eventsSpy = jest.fn<never, [CalendarEvent[]]>();
  let mockCalendar: MockCalendar;
  let calendarArea: CalendarAreaController;
  type CalendarAreaEventName = keyof CalendarAreaEvents;
  let addListenerSpy: jest.SpyInstance<
    CalendarAreaController,
    [event: CalendarAreaEventName, listener: CalendarAreaEvents[CalendarAreaEventName]]
  >;

  let removeListenerSpy: jest.SpyInstance<
    CalendarAreaController,
    [event: CalendarAreaEventName, listener: CalendarAreaEvents[CalendarAreaEventName]]
  >;

  let townController: MockProxy<TownController>;

  let renderData: RenderResult;
  beforeAll(() => {
    fullCalendarSpy.mockImplementation(function (props) {
      mockCalendarAreaConstructor(props);
      const ret = new MockCalendar(props, componentDidUpdateSpy, eventsSpy);
      mockCalendar = ret;
      return mockCalendar as any;
    });
  });
  beforeEach(() => {
    mockCalendarAreaConstructor.mockClear();
    componentDidUpdateSpy.mockClear();
    eventsSpy.mockClear();
    townController = mock<TownController>();
    calendarArea = new CalendarAreaController({
      id: 'test',
      calendarName: 'John!',
      events: [],
    });

    addListenerSpy = jest.spyOn(calendarArea, 'addListener');
    removeListenerSpy = jest.spyOn(calendarArea, 'removeListener');

    renderData = render(renderCalendarArea(calendarArea, townController));
  });
  /**
   * Retrieve the properties passed to the Calendar the first time it was rendered
   */
  function firstCalendarConstructorProps() {
    return mockCalendarAreaConstructor.mock.calls[0][0];
  }
  /**
   * Retrieve the properties passed to the Calendar the last time it was rendered
   */
  //   function lastUpdate() {
  //     return componentDidUpdateSpy.mock.calls[componentDidUpdateSpy.mock.calls.length - 1][0];
  //   }
  /**
   * Retrieve the listener passed to "addListener" for a given eventName
   * @throws Error if the addListener method was not invoked exactly once for the given eventName
   */
  function getSingleListenerAdded<Ev extends EventNames<CalendarAreaEvents>>(
    eventName: Ev,
    spy = addListenerSpy,
  ): boolean {
    const addedListeners = spy.mock.calls.filter(eachCall => eachCall[0] === eventName);
    if (addedListeners.length !== 0) {
      throw new Error(
        `Expected to find exactly one addListener call for ${eventName} but found ${addedListeners.length}`,
      );
    }
    return true;
  }
  /**
   * Retrieve the listener pased to "removeListener" for a given eventName
   * @throws Error if the removeListener method was not invoked exactly once for the given eventName
   */
  function getSingleListenerRemoved<Ev extends EventNames<CalendarAreaEvents>>(
    eventName: Ev,
  ): boolean {
    const removedListeners = removeListenerSpy.mock.calls.filter(
      eachCall => eachCall[0] === eventName,
    );
    if (removedListeners.length !== 1) {
      throw new Error(
        `Expected to find exactly one removeListeners call for ${eventName} but found ${removedListeners.length}`,
      );
    }
    return true;
  }
  describe('CalendarArea rendering', () => {
    it('Sets the events property', () => {
      const props = firstCalendarConstructorProps();
      expect(props.events).toEqual(calendarArea.events);
    });
  });
  describe('Bridging events from the CalendarAreaController to the CalendarArea', () => {
    describe('Registering CalendarArea listeners', () => {
      describe('When rendered', () => {
        const newEvents: CalendarEvent[] = [
          {
            id: nanoid(),
            start: nanoid(),
            end: nanoid(),
            title: nanoid(),
          },
        ];
        it('Registers exactly one eventsCahgne listener', () => {
          act(() => {
            calendarArea.emit('eventsChange', newEvents);
          });
          act(() => {
            calendarArea.emit('eventsChange', newEvents);
          });
          act(() => {
            calendarArea.emit('eventsChange', newEvents);
          });
          getSingleListenerAdded('eventsChange');
        });
        it('Removes the enventsChange listener at unmount', () => {
          act(() => {
            calendarArea.emit('eventsChange', []);
          });
          const listenerAdded = getSingleListenerAdded('eventsChange');
          cleanup();
          expect(getSingleListenerRemoved('eventsChange')).toBe(listenerAdded);
        });
      });
    });
    describe('When re-rendered with a different viewing area controller', () => {
      it('Removes the listeners on the old calendar area controller and adds listeners to the new controller', () => {
        const newCalendarArea = new CalendarAreaController({
          id: 'test',
          calendarName: 'shaan!!',
          events: [],
        });
        const newAddListenerSpy = jest.spyOn(newCalendarArea, 'addListener');
        renderData.rerender(renderCalendarArea(newCalendarArea, townController));

        expect(getSingleListenerRemoved('eventsChange')).toBe(true);
        expect(getSingleListenerRemoved('eventsChange')).toBe(true);

        getSingleListenerAdded('eventsChange', newAddListenerSpy);
        getSingleListenerAdded('eventsChange', newAddListenerSpy);
      });
    });
  });

  describe('Bridging events from the CalendarArea to the CalendarAreaController', () => {
    it('Registers listeners', () => {
      const props = firstCalendarConstructorProps();
      expect(props.events).toBeDefined();
      expect(props.select).toBeDefined();
      expect(props.eventClick).toBeDefined();
    });
  });
});
