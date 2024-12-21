import { initializeApp } from "firebase/app";
import {
  setPersistence,
  browserLocalPersistence,
  getAuth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD3BfH9pIzpgCFlIksQLkX04QwHaVkxhR8",
  authDomain: "client-student-discount.firebaseapp.com",
  projectId: "client-student-discount",
  storageBucket: "client-student-discount.firebasestorage.app",
  messagingSenderId: "452613033819",
  appId: "1:452613033819:web:190cf54367bb8c12c3947e",
  measurementId: "G-DKEPRRZG4N"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

export {
  auth,
};
