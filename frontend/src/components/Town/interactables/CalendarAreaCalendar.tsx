import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { nanoid } from 'nanoid';
import React, { useEffect, useState } from 'react';
import { CalendarEvent } from '../../../../../shared/types/CoveyTownSocket';
import {
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from '@chakra-ui/react';
import CalendarAreaController from '../../../classes/CalendarAreaController';
import { useCalendarAreaController, useInteractable } from '../../../classes/TownController';
import CalendarAreaInteractable from './CalendarArea';
import useTownController from '../../../hooks/useTownController';
import SelectCalendarModal from './SelectCalendarModal';

/**
 * The CalendarAreaVideo component renders a CalendarArea's video, using the ReactPlayer component.
 * The onSelect Property pops up a modal to create an event in the Calendar Area.
 *
 * The CalendarAreaVideo subscribes to the CalendarAreaControllers's events, and responds to
 * events change by adding events and deleting events when selected.
 *
 * The CalendarAreaVideo also subscribes to the the events in the controller. This will update
 * event in the controller when an event is created in the component.
 *
 * @param props: A single property 'controller', which is the CalendarAreaController corresponding to the
 *               current calendar area.
 */
export function CalendarAreaCalendar({
  controller,
}: {
  controller: CalendarAreaController;
}): JSX.Element {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const townController = useTownController();
  const [events, setEvents] = useState<CalendarEvent[]>(controller.events);
  const [newEvent, setNewEvent] = useState<CalendarEvent>();

  useEffect(() => {
    const eventsChange = (newCalendarEvents: CalendarEvent[]) => {
      setEvents(newCalendarEvents);
      console.log('settingEvents!');
    };
    controller.on('eventsChange', eventsChange);
    return () => {
      controller.removeListener('eventsChange', eventsChange);
    };
  }, [controller, controller.events]);

  function EventModal(): JSX.Element {
    const [title, setTitle] = useState('');

    return (
      <Modal isCentered isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Create Event</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Title</FormLabel>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={() => {
                if (newEvent) {
                  const allEvents = [...events, { ...newEvent, title }];
                  controller.events = allEvents;
                  townController.emitCalendarAreaUpdate(controller);
                  setNewEvent(undefined);
                }
                onClose();
              }}>
              Create Event
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  function DeleteModal(): JSX.Element {
    return (
      <Modal isCentered isOpen={isRemoveOpen} onClose={() => setIsRemoveOpen(!isRemoveOpen)}>
        <ModalContent>
          <ModalHeader>Are you sure you want to delete event: {newEvent?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalFooter>
            <Button
              onClick={() => {
                if (newEvent) {
                  const filterEvents = events.filter(
                    eventToDelete => eventToDelete.id !== newEvent.id,
                  );
                  controller.events = filterEvents;
                  townController.emitCalendarAreaUpdate(controller);
                  setNewEvent(undefined);
                }
                setIsRemoveOpen(false);
              }}>
              Delete Event
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <>
      <Container className='participant-wrapper' backgroundColor='white' minHeight={'50ch'}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          initialView='dayGridMonth'
          selectable
          selectMirror
          dayMaxEvents
          events={events}
          select={event => {
            const { start, end } = JSON.parse(JSON.stringify(event));
            setNewEvent({ start, end, title: '', id: nanoid() });
            onOpen();
          }}
          eventClick={eventInfo => {
            setNewEvent({
              id: eventInfo.event.id,
              title: eventInfo.event.title,
              start: eventInfo.event.startStr,
              end: eventInfo.event.endStr,
            });
            setIsRemoveOpen(true);
          }}
        />
      </Container>
      <EventModal />
      <DeleteModal />
    </>
  );
}

/**
 * The Calendar Area monitors the player's interaction with a ViewingArea on the map: displaying either
 * a popup to set the video for a viewing area, or if the video is set, a video player.
 *
 * @param props: the viewing area interactable that is being interacted with
 */
export function CalendarArea({
  calendarArea,
}: {
  calendarArea: CalendarAreaInteractable;
}): JSX.Element {
  const townController = useTownController();
  const calendarAreaController = useCalendarAreaController(calendarArea.id);
  const [selectIsOpen, setSelectIsOpen] = useState(
    calendarAreaController.calendarName === undefined,
  );
  const [calendarName, setCalendarName] = useState(calendarAreaController.calendarName);
  useEffect(() => {
    const setName = (newName: string | undefined) => {
      if (!newName) {
        townController.interactableEmitter.emit('endIteraction', calendarAreaController);
      } else {
        setCalendarName(newName);
      }
    };
    calendarAreaController.addListener('calendarNameChange', setName);
    return () => {
      calendarAreaController.removeListener('calendarNameChange', setName);
    };
  }, [calendarAreaController, townController]);

  if (!calendarName) {
    return (
      <SelectCalendarModal
        isOpen={selectIsOpen}
        close={() => setSelectIsOpen(false)}
        calendarArea={calendarArea}
      />
    );
  }
  return (
    <>
      <CalendarAreaCalendar controller={calendarAreaController} />
    </>
  );
}

/**
 * The CalendarAreaWrapper will only be rendered when the user begins interacting with the town
 */
export default function CalendarAreaWrapper(): JSX.Element {
  const calendarArea = useInteractable<CalendarAreaInteractable>('calendarArea');
  if (calendarArea) {
    return <CalendarArea calendarArea={calendarArea} />;
  }
  return <></>;
}
