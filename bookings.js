import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAFmQUaciIIcNZHGlSXBLu0I3sp4YENdvE",
  authDomain: "housebookingsystem.firebaseapp.com",
  projectId: "housebookingsystem",
  storageBucket: "housebookingsystem.appspot.com",
  messagingSenderId: "819878550596",
  appId: "1:819878550596:web:959c12eb48868928a5f011",
  measurementId: "G-8NNE50F62B"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const bookingsList = document.getElementById("bookingsList");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    bookingsList.innerHTML = "<p>Please <a href='login.html'>login</a> to see your bookings.</p>";
    return;
  }

  const q = query(collection(db, "bookings"), where("userId", "==", user.uid));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    bookingsList.innerHTML = "<p>You have no bookings yet.</p>";
    return;
  }

  querySnapshot.forEach((doc) => {
    const booking = doc.data();
    bookingsList.innerHTML += `
      <div class="house-card">
        <h3>${booking.houseTitle}</h3>
        <p>Status: ${booking.status || "pending"}</p>
      </div>
    `;
  });
});
