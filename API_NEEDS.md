https://github.com/Lincoln-lema/StudySync-webapp/blob/main

Week 2 API Needs — Team 2 (StudySync)
API Needs Statements

1. Jua Kali Connect needs to read StudySync group member information in order to display team and member information for collaborative artisan projects and groups.

   * Freshness: Once per page load or when the relevant information is requested.
   * Volume: Occasional requests when group/member information is viewed.
   * Auth: Likely authenticated access because the information relates to student/group data; exact authentication requirements are to be confirmed in later planning.

2. Jua Kali Connect needs to read StudySync tasks and task status in order to track tasks assigned to artisans or administrators, such as managing bookings or service requests.

   * Freshness: On page load and when the user refreshes or views task information.
   * Volume: Periodic requests when tasks are viewed or refreshed.
   * Auth: Likely authenticated access because tasks and statuses may relate to specific users or groups; exact requirements are to be confirmed later.

3. Jua Kali Connect needs to read StudySync deadlines and calendar events in order to schedule bookings, training sessions, and service appointments.

   * Freshness: On page load and when the user checks their schedule.
   * Volume: Occasional requests when the schedule/calendar is accessed.
   * Auth: Likely authenticated access; exact requirements are to be confirmed later.

4. Jua Kali Connect needs to read StudySync activity history in order to track participation and user activity within collaborative projects.

   * Freshness: Periodically or when the relevant activity information is viewed.
   * Volume: Occasional requests when activity information is needed.
   * Auth: Likely authenticated access because activity information may be associated with individual users; exact requirements are to be confirmed later.

5. Jua Kali Connect needs to read StudySync reliability scores in order to assess the reliability of artisans or service providers involved in collaborative work.

   * Freshness: Periodically or when the relevant reliability information is viewed.
   * Volume: Occasional requests when a reliability assessment is required.
   * Auth: Likely authenticated access because reliability scores are associated with users; exact requirements are to be confirmed later.

6. Jua Kali Connect needs to read StudySync flashcards and study materials in order to provide learning and training materials to artisans through its Training section.

   * Freshness: When a user opens the training or study-material section.
   * Volume: On user access to the relevant training material.
   * Auth: Likely authenticated access where study materials are associated with groups or users; exact requirements are to be confirmed later.

Week 1 Audit Sanity Check

The requested resources map to resources or actions identified in the Week 1 audit:

* Group members → Groups, Members
* Tasks and task status → Tasks, task status
* Deadlines and calendar events → Merged calendar of deadlines
* Activity history → Heatmap activity data
* Reliability scores → Reliability scores
* Flashcards and study materials → Flashcard Decks, Flashcards

However, Team 3 identified an important implementation gap: StudySync is currently a React prototype using demo/local data and does not yet expose a real backend API. Therefore, although these resources exist in the Week 1 audit, they are not currently externally accessible to Jua Kali Connect. This should be flagged as an API/backend gap before Week 3 endpoint design.

Team 3 also mentioned that nudges could potentially be created through StudySync. This was not included as one of the six core needs above because Team 3 described it as conditional ("if Jua Kali needs to send reminders"), whereas the six statements above represent the clearest confirmed read needs.

Reflection

What surprised us most was that Jua Kali Connect could find value in several resources that already exist in StudySync, particularly flashcards, calendar information, tasks, member information, activity history, and reliability scores. We initially viewed many of these features mainly from the perspective of StudySync's own student users, but the interview showed that the same information could support another application's training, scheduling, collaboration, and reliability workflows. The biggest practical gap we discovered was that StudySync is currently only a React prototype using local/demo data and does not yet expose a real backend API, meaning that although the required resources exist conceptually in our Week 1 audit, another team cannot currently consume them externally. This gives us a clear issue to address as we move toward API design.
