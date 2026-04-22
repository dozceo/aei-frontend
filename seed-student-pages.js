/**
 * Seed Student Pages Script
 * Seeds student dashboard pages to Firestore
 * 
 * Usage: node seed-student-pages.js
 * 
 * Requires:
 * - Firebase service account JSON file (or GOOGLE_APPLICATION_CREDENTIALS env var)
 * - FIREBASE_PROJECT_ID env var
 */

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// Initialize Firebase Admin SDK
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';

try {
  const serviceAccount = require(path.resolve(serviceAccountPath));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
} catch (error) {
  console.error('❌ Error loading service account file:', error.message);
  console.error('Make sure FIREBASE_SERVICE_ACCOUNT_PATH is set or serviceAccountKey.json exists in the project root');
  process.exit(1);
}

const db = admin.firestore();

// Student ID to seed
const STUDENT_ID = 'WqK756dhYcePuhTg9SxM2heVP8W2';

// Page data to seed
const pageData = {
  hero: {
    title: 'Student dashboard',
    subtitle: 'Database-backed student overview',
    eyebrow: 'Database Content',
  },
  mission: {
    title: 'Your Mission',
    subtitle: 'Learning Goals',
    badges: ['Math', 'Science'],
    description: 'Focus on mastering your subjects.',
    progress: {
      label: 'Overall Progress',
      value: 65,
      hint: 'Keep going!',
    },
    actions: {
      primary: 'Continue',
      secondary: 'Review',
    },
  },
  sections: {
    signalsTitle: 'Signals',
    signalsSubtitle: 'Recent activity',
    masteryTitle: 'Subject Mastery',
    masterySubtitle: 'Your performance',
  },
  signals: [{ title: 'Attendance', value: '95%' }],
  subjectMastery: [{ subject: 'Math', mastery: 80 }],
  nextSteps: {
    title: 'Next Steps',
    subtitle: 'What to do next',
    items: ['Finish homework'],
    actions: {
      primary: 'Plan',
      secondary: 'Skip',
    },
  },
  brandLabel: 'SANKALP AEI',
  navItems: [{ label: 'Dashboard', href: '/student/dashboard' }],
};

async function seedStudentDashboard() {
  try {
    console.log(`\n📝 Seeding student dashboard for user: ${STUDENT_ID}\n`);

    // Get the pages collection ref for the student
    const docRef = db.collection('students').doc(STUDENT_ID).collection('pages').doc('dashboard');

    // Set the document data
    await docRef.set(pageData, { merge: true });

    console.log('✅ Successfully seeded student dashboard pages!');
    console.log(`\nDocument path: students/${STUDENT_ID}/pages/dashboard`);
    console.log('\nData added:');
    console.log(JSON.stringify(pageData, null, 2));

    await admin.app().delete();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding student dashboard:', error.message);
    console.error(error);
    await admin.app().delete();
    process.exit(1);
  }
}

// Run the seeding
seedStudentDashboard();
