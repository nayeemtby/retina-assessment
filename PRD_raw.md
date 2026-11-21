# Components

## Administrator access
*  Administrator Login: A secure login for the admin
* Only authenticated administrator may CRUD students, examinations, and results

## Student Management
* Student CRUD: The admin CRUDs
* Student model: unique registration number int64; name, email, batch, course department, created and updated timestamps

## Exam Management
* CRUD: The admin CRUDs
* Exam Model: title, exam date, total marks, status, created and updated stamps.

## Result Management
* CRUD: Admin CRUDs
* Relationship: A result record is unique for a student and exam.
* Validation and Integrity: Prevent duplicates for (student, exam), validate mark ranges

## Leaderboard
Provide a leaderboard for a selected examination. Basically aggregation pipeline
* Leaderboard projection: Rank, Student Registration number, Student Name, Obtained Marks, Total Marks and percentage (Obtained/Total).

