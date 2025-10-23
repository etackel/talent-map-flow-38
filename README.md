# Atlas - Strategic Workforce & Mobility Platform

Atlas is a comprehensive workforce management platform that helps companies map employee skills and manage talent movement through automated processes.

## Features

### Core Features
- **Dashboard**: Overview of key metrics (employees, requisitions, transfers, skills)
- **My Skills**: Employees can view, add, and manage their skills with proficiency levels
- **Team View** (Manager+): Managers can view their team members and their skills
- **Hiring** (Manager+): Multi-step workflow to create hiring requisitions
- **Mobility** (All roles): Browse and apply for internal job opportunities

### Role-Based Access Control
The platform has 4 user roles with different permissions:

1. **Employee**: 
   - View and manage personal skills
   - Browse internal mobility opportunities
   - View personal dashboard

2. **Manager**: 
   - All employee features
   - View team members and their skills
   - Create hiring requisitions
   - Manage team transfers

3. **HR**: 
   - All manager features
   - View all employees across the organization
   - View all requisitions and transfers
   - System-wide workforce analytics

4. **Executive**: 
   - Same as HR role
   - Strategic workforce overview

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **UI Framework**: Material-UI (MUI)
- **Backend**: Supabase (PostgreSQL) via Lovable Cloud
- **Authentication**: Supabase Auth (email/password)
- **Routing**: React Router v6
- **State Management**: React Query (TanStack Query)

## Database Schema

### Core Tables
- `profiles`: User profile information
- `user_roles`: Role assignments (secure, separate table to prevent privilege escalation)
- `employees`: Employee details and organizational structure
- `skills`: Master list of skills by category
- `employee_skills`: Junction table linking employees to skills with proficiency levels
- `process_requisitions`: Hiring requisition workflow
- `process_transfers`: Internal transfer requests

## How to Use

### For Testing/Development

1. **Sign Up**: Create an account on the login page (email auto-confirmed for development)
2. **Default Role**: New users start as "Employee"
3. **Switch Roles**: Use the **Role Switcher** on the Dashboard to test different features
4. **Add Skills**: Go to "My Skills" and add your skills from the dropdown (26 skills available)
5. **Manager Features**: Switch to Manager role to see team management features
6. **HR Features**: Switch to HR/Executive to see organization-wide views

### Role Switcher (Testing Mode)
The Role Switcher is displayed at the top of the Dashboard:
- Select your desired role from the dropdown
- The page will refresh automatically
- Navigation menu updates based on your role permissions

### As an Employee
1. **Dashboard**: View your personal metrics
2. **My Skills**: 
   - Click "Add Skill" button
   - Select a skill from the autocomplete dropdown
   - Adjust proficiency slider (1-5)
   - Submit to save
   - Delete skills by clicking the delete icon
3. **Mobility**: Browse open internal positions and express interest

### As a Manager
All employee features PLUS:
1. **My Team**: View team members, their roles, and skills
2. **Hiring**: Create hiring requisitions
   - **Step 1**: Enter role title and department
   - **Step 2**: Select required skills (multiple selection)
   - **Step 3**: Review and submit
3. The requisition enters "PENDING_SCAN" status

### As HR/Executive
All manager features PLUS:
- View all employees across the organization
- Access all requisitions and transfers system-wide
- System-wide workforce analytics on dashboard

## Security Features

- ✅ Roles stored in separate `user_roles` table (prevents privilege escalation attacks)
- ✅ Row-Level Security (RLS) policies on all tables
- ✅ Security definer functions to prevent RLS recursion
- ✅ Server-side role validation
- ✅ Proper auth state management
- ✅ Email auto-confirm enabled for development

## Available Skills (26 Total)

**Programming**: JavaScript, TypeScript, Python, Java  
**Frontend**: React, Angular, Vue.js  
**Backend**: Node.js, Django, Spring Boot  
**Database**: SQL, PostgreSQL, MongoDB  
**Cloud**: AWS, Azure  
**DevOps**: Docker, Kubernetes  
**Tools**: Git  
**Methodology**: Agile, Scrum  
**Management**: Project Management, Team Leadership  
**Design**: UI/UX Design, Figma  
**Soft Skills**: Communication, Problem Solving

## Project Structure

```
src/
├── components/
│   ├── AppLayout.tsx          # Main layout with navigation
│   ├── RoleSwitcher.tsx       # Role switching for testing
│   └── ui/                     # shadcn/ui components
├── hooks/
│   └── useUserRole.ts         # Custom hook for role management
├── pages/
│   ├── Login.tsx              # Authentication page
│   ├── Dashboard.tsx          # Main dashboard with stats
│   ├── MySkills.tsx           # Skills management
│   ├── Team.tsx               # Team view (Manager+)
│   ├── Hiring.tsx             # Hiring requisitions (Manager+)
│   └── Mobility.tsx           # Internal mobility
├── integrations/
│   └── supabase/              # Supabase client & types
└── App.tsx                    # Main app with routing
```

## Development

### Environment Variables
All Supabase configuration is handled automatically via Lovable Cloud integration.

### Local Development
```sh
# Install dependencies
npm install

# Start development server
npm run dev
```

### Key Implementation Notes
- Role-based navigation filters menu items based on user permissions
- All Supabase queries respect RLS policies
- Skills are pre-populated for immediate testing
- Material-UI theme configured with custom colors

## Deployment

Deploy directly from Lovable by clicking Share → Publish.

Read more: [Lovable Deployment Docs](https://docs.lovable.dev)

## Project Info

**URL**: https://lovable.dev/projects/6c666c7a-a78b-45f7-991a-a196269c4c2c

## Technologies

This project is built with:
- Vite
- TypeScript
- React
- Material-UI (MUI)
- Tailwind CSS
- Supabase (via Lovable Cloud)

## License

MIT
