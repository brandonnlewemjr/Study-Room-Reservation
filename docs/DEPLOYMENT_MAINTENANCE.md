# Deployment and Maintenance Plan

## Deployment Steps
1. Push final code to the main branch.
2. Confirm `npm install` works.
3. Run `npm test`.
4. Add environment variables if needed.
5. Add a release tag in GitHub.
6. Deploy to a selected platform such as Render, Railway, or a university server.
7. Confirm `/health` returns a successful response.

## Git Version Control Setup
- Main branch stores production-ready code.
- Feature branches are used for new work.
- Pull requests are reviewed before merging.
- Commit messages describe the purpose of each change.

## Maintenance Schedule
- Weekly: Review reported bugs and logs.
- Biweekly: Run regression tests.
- Monthly: Review dependencies and security updates.
- End of semester: Review future features and backlog.

## Future Improvements
- Add persistent database.
- Add real user authentication.
- Build React frontend.
- Add email reminders.
- Add calendar integration.
- Add admin reporting dashboard.
