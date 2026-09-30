# End-of-Module Backend Project

## Project Overview

- Design, build, secure, test, document, and deploy a production-ready REST API.
- Choose a meaningful problem and domain for your API.
- Your project should demonstrate the backend skills covered throughout the module, including API design, persistent data storage, related data models, authentication and authorization, validation, testing, and deployment.

### Group or Individual Work?

You may complete the project individually or in a group. If you work in a group, every member is expected to contribute meaningfully and to understand the project well enough to explain its design and implementation in a technical interview.

### Technologies?

- You may use the technologies covered in the course.
- You may also choose different or additional technologies, but you must be prepared to explain and defend those choices in a technical interview. Be ready to discuss why the technologies fit the project, what alternatives you considered, and what trade-offs your choices involve.

### Learning Resources & AI (Artificial Intelligence) Tools?

- You may use available learning resources, including AI tools.
- You are responsible for understanding, testing, and being able to explain all submitted work.

## Project Requirements

### 1. Plan the API before implementation

- Before building the API, document its purpose and design.
- Include:
  - The problem your API solves and its intended users.
  - At least two related entities and how they relate to one another.
  - An entity-relationship diagram (ERD) or an equivalent data-model diagram.
  - The planned endpoints, HTTP methods, and the purpose of each endpoint.
  - Example request and response formats, including error responses.
  - The authentication and authorization approach, where applicable.
  - Your chosen technology stack and a short rationale for each major choice.

### 2. Build a complete REST API

- Implement a coherent API for your chosen domain.
- It must:
  - Use a persistent database to store and retrieve data.
  - Model at least two related entities and implement the relationships in the database and API.
  - Provide a useful set of REST endpoints for the core use cases, including create, read, update, and delete operations where those operations make sense for your domain.
  - Use appropriate HTTP methods and status codes, and return consistent JSON responses.
  - Support filtering, searching, or pagination if it is useful for your API.
  - Be organized into clear modules with responsibilities that are easy to understand and maintain.

### 3. Secure the API

- Apply security practices covered in the module and appropriate to your API.
- At a minimum:
  - Validate and, where appropriate, sanitize untrusted input.
  - Protect routes and data that should not be publicly accessible.
  - Configure CORS deliberately for the clients that need access.
  - Apply rate limiting to protect sensitive or abuse-prone endpoints.
  - Handle errors without exposing stack traces, secrets, or other internal details to API clients.
  - Use secure deployment settings and HTTPS for the deployed API.

- Explain any security controls that are not relevant to your design and justify that decision.

### 4. Test and document the API

- Write automated tests for important behavior, including successful requests, invalid input, and relevant authorization or error cases.
- Document how to install, configure, test, and run the project locally.
- Document the API endpoints with example requests and responses, including expected error cases.
- Include the project plan and data-model diagram in the repository or link to them from its README.
- Make sure another developer can follow the documentation and try the API.

### 5. Deploy the backend

- Deploy the API so that the instructor can access it.
- Verify that the deployed service starts correctly and that its documented endpoints work.
- Include the live backend URL in your submission and README.
- Do not publish credentials or sensitive environment values in the repository or documentation.

## Definition of Done

The project is complete when:

- The API addresses a clearly described use case and has at least two related entities.
- Core data is stored persistently, and the API supports the relevant create, read, update, and delete operations.
- The API has been tested and its important security measures are implemented and explained.
- The project is documented well enough for another developer to set it up and use its API.
- The backend is deployed, the live URL works, and the URL is shared with the instructor.
- Each participant can explain the architecture, data model, endpoints, security decisions, tests, deployment, and their own contribution.

## Daily Project Updates

- Starting **Wednesday, September 30, 2026**, each participant or project group must send the following updates to the instructor by Slack DM EVERYDAY throughout the project timeline.

- Each participant must send their own update, even if they are part of a group.
- Group members may coordinate their update, but it must clearly identify the participant(s) it covers.

### TLP Between 9am and 10am: plan and risk assessment (Proactive)

Send:

1. Your top three tasks planned for the day.
2. The most obvious obstacle or risk to that plan.
3. How you plan to avoid, reduce, or resolve that risk.

### After ILP (Latest 11:59pm): progress and next step

Send this update:

1. Three or more tasks you actually completed that day.
2. Your biggest lesson learned for the day.
3. Your top priority for tomorrow.

Keep the updates specific and honest. If a planned task was blocked or unfinished, say so and describe the next action you will take.

## FINAL Submission Deadline

- Submit the complete project by **Monday, October 19, 2026, at 11:59 PM (23:59)**.

## Items to Submit

- A link to the GitHub repository containing the project code. If you work in a group, every group member should have the same project code in their own private repository.
- A README in the repository containing:
  - A brief description of the API and its purpose.
  - Documentation of the API endpoints, including request and response examples.
  - The names of all team members involved in the project.
  - The project setup and run instructions, relevant configuration guidance, and links to the project plan and data-model diagram.
  - The deployed backend URL.
- The link to the deployed backend, shared with the instructor.
- The daily project updates sent by Slack DM throughout the project timeline.

## Instructor Support

- Rule No. 1: There is no such thing as a stupid question. If you are unsure about something, ask for clarification.
- The instructor will be available for questions and guidance during the project timeline.
- In case of urgent issues, you may also reach out to the instructor via Slack DM or On Google Meet. Please do not dwell on a problem for too long without seeking help. The instructor is happy to help you troubleshoot and unblock your progress.
