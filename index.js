import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAFmQUaciIIcNZHGlSXBLu0I3sp4YENdvE",
  authDomain: "housebookingsystem.firebaseapp.com",
  projectId: "housebookingsystem",
  storageBucket: "housebookingsystem.appspot.com",
  messagingSenderId: "819878550596",
  appId: "1:819878550596:web:959c12eb48868928a5f011",
  measurementId: "G-8NNE50F62B"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const housesList = document.getElementById("housesList");

// ✅ Load Houses
async function loadHouses() {
  housesList.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "houses"));
  querySnapshot.forEach((docSnap) => {
    const house = docSnap.data();
    const houseId = docSnap.id;

    const div = document.createElement("div");
    div.classList.add("house-card");
    div.innerHTML = `
      <h3>${house.title}</h3>
      <p>Location: ${house.location}</p>
      <p>Price: KES ${house.price}</p>
      <button class="book-btn">Book</button>
    `;

    // ✅ Booking button
    div.querySelector(".book-btn").addEventListener("click", async () => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            await addDoc(collection(db, "bookings"), {
              userId: user.uid,
              houseId: houseId,
              houseTitle: house.title || "Untitled",
              houseLocation: house.location || "N/A",
              housePrice: house.price || "N/A",
              status: "pending",
              createdAt: new Date()
            });
            alert("✅ Booking request sent!");
          } catch (error) {
            console.error("Error booking house:", error);
            alert("❌ Error while booking. Try again.");
          }
        } else {
          alert("Please login to book a house.");
        }
      });
    });

    housesList.appendChild(div);
  });
}

// Load houses on page start
loadHouses();
