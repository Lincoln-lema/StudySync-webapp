**https://github.com/Lincoln-lema/StudySync-webapp/blob/main**

#### **ENDPOINT_LIST.md — StudySync API**

| Method    | Path                                | Purpose                                        | Maps to Need                                                 |
| --------- | ----------------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| GET       | /users/{userId}/reliability-score   | Return reliability score for a user            | Need 5 — reliability scores for artisans/providers           |
| GET       | /tasks?status=\&groupId=\&assignee= | Return tasks filtered by status/group/assignee | Need 2 — tasks and task status for bookings/service requests |
| GET       | /calendar-events?from=\&to=         | Return deadlines/events in a date range        | Need 3 — deadlines and calendar events for scheduling        |
| GET       | /users/{userId}/activity            | Return activity history for a user             | Need 4 — activity history to track participation             |
| GET<br /> | /flashcard-decks?groupId=           | List flashcard decks available to a group      | Need 6 — training/study materials                            |

###### **Note on the write-endpoint requirement**

- All five confirmed Week 2 needs are read-only. Additionally, per our Week 2 reflection, StudySync is currently a React prototype using local/demo data with no real backend API exposed — so there is currently nothing for an external write endpoint to act on, even setting the needs statements aside.

- Per the lab's own guidance ("if genuinely everything is read-only, flag this to your instructor rather than inventing a fake write endpoint just to hit the minimum"), we are flagging this gap rather than fabricating a write endpoint to hit the numeric minimum. We plan to raise this with the instructor and/or revisit it once a write-capable need is confirmed.
