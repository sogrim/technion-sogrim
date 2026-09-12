# Sogrim-App (Students portal) API 

All Types are in sogrim-app-types.ts
*** Use can see examples in sogrim-app-mock.ts. ***
*** In each call, server get user-id and Auth object.*** 

## Auth
TODO: Benny & Nisso - Auth token clinet-server
 1. Google auth Login
 2. Google Callback
 3. Logout

## App
### GET - Get All Catalogs
// @route   GET /users/:id
// @desc    Get User State
Return Catalog[].
This method call for initalaize app each time - show all valid catalog from db.

## Student 

### GET - Get User State
// @route   GET /users/:id
// @desc    Get User State
Return UserCourse object.
This method call for initalaize app after login (each visit)

### PUT - Update User Catalog 
// @route   PUT /users/catalog
// @desc    Update User Catalog 
// req - catalog year, maslul 
Return UserCourse object (updated). 
- if users have couerses in DB, re-run the algorithm and return valid CouresList.
- else, send empty list.

### PUT - Update User All Courses 
// @route   PUT /users/courses
// @desc    Update User All Course - import from Gilion Zionim
// req - string (un-parsed cntl c -> cntl v from Gilion Zionim)
Return UserCourse object (updated). 
- if users have catalog in DB, re-run the algorithm and return valid CouresList.





