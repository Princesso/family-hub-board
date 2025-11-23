# Family Hub Board

Family Hub Board is a beautiful, offline-first family organizer, the AI app builder for everyday problems. It helps you run your home with one elegant board that covers chores, a healthy Nigerian meal-prep timetable, birthday reminders, an open discussion board, kids' wishlist, holiday plans, and adults' time off.

## Features
- Onboarding to create your household and add members (mark husband for 5 meals daily)
- Invite flow using a shareable link so family can join and contribute
- Chore board with daily, weekly, monthly, and quarterly cadences, assignment, and progress
- Meal-prep timetable for a month with two-week alternating menus of nutritious Nigerian dishes, batch cook on day 1 and 15, freeze and heat daily
- Birthday reminders with countdowns
- Open Board for grievances, scores to settle, shoutouts, and notes
- Kids' Wishlist with priorities, links, and purchase tracking
- Holiday planning strip with dates, notes, and budget
- Adults' time off table with date ranges
- Archives for every deleted item so nothing important is lost
- LocalStorage persistence for all data so your board survives refreshes

## Stack
- HTML5 + Tailwind CSS (Play CDN)
- jQuery 3.7.x
- Modular JavaScript (helpers.js, ui.js, main.js)

## Develop
Open index.html for the landing page or app.html for the main application. Everything runs locally without a backend.

## Data and Privacy
All data is stored locally in your browser using localStorage. You can clear your data by clearing site storage or editing the code. The invite feature generates a shareable URL token for demonstration and does not sync across devices without a backend.

## Accessibility
Keyboard navigable, high-contrast design, prefers-reduced-motion honored. Tables and wide sections are horizontally scrollable to prevent overflow.

## Notes
- The meal plan generator alternates two healthy Nigerian menus every two weeks, flags batch cook days, and includes additional snack slots for the husband.
- Deleted items move to Archives where you can restore them later.
