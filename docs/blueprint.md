# **App Name**: NEU Library Check-in

## Core Features:

- Institutional Authentication: Secure login using Firebase Authentication with Google Auth Provider, strictly restricted to emails ending in @neu.edu.ph, and validates the user's 'isBlocked' status.
- Student Check-in Form: A user-friendly form allowing students to log their visit details, including 'Purpose of Visit' (dropdown) and 'College' (dropdown), with submission to Firestore.
- Welcome Confirmation Display: Upon successful check-in, a prominent 'Welcome to NEU Library!' success card is displayed to the student.
- Admin Visit Analytics: Admins can fetch visit logs, filter them by predefined date ranges (Today, This Week, This Month), and view aggregated statistics grouped by 'College'.
- Admin User Management: An administrative interface for searching users by name and toggling their 'isBlocked' status in Firestore.
- Core Data Management: Establishes and manages 'users', 'visits', and 'colleges' collections in Firestore, including user roles and visit log details.

## Style Guidelines:

- Primary interactive color: A professional and trustworthy blue (#336BCC), symbolizing academia and reliability.
- Background color: A subtle and clean light blue-grey (#ECF1F9), providing a calming and expansive canvas.
- Accent color: A vibrant, clear greenish-blue (#29C4E0) for highlights and calls to action, maintaining a cohesive yet dynamic feel.
- Font for all text: 'Inter' (sans-serif), chosen for its modern, neutral, and highly readable characteristics, suitable for institutional content and clear forms.
- Utilize a consistent set of clean, modern, outline-style icons to ensure clarity and enhance the professional aesthetic of the application.
- Implement a clean, spacious, and mobile-responsive layout, prioritizing readability and ease of interaction on various device sizes.
- Incorporate subtle animations for state changes and form submissions, providing immediate and non-distracting visual feedback to the user.