import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";

import { getFirestore } from "firebase/firestore";

import { getAnalytics } from "firebase/analytics";
const firebaseConfig = {

  apiKey: "AIzaSyBeE2L7xdDFCq5Q7nFkmxQdEBS0PWacja8",
  authDomain: "expense-tracker-app-88417.firebaseapp.com",
  projectId: "expense-tracker-app-88417",
  storageBucket: "expense-tracker-app-88417.firebasestorage.app",
  messagingSenderId: "642932746389",
  appId: "1:642932746389:web:e77dc46387b14e7229d39c",
  measurementId: "G-5NEFE25H5M"

};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);

export const db = getFirestore(app);

export default app;