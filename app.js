// ===============================
// Firebase (CDN v10+) Setup
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
// (Storage not required for URL uploads; import later if you switch to file uploads)

const firebaseConfig = {
  apiKey: "AIzaSyAFmQUaciIIcNZHGlSXBLu0I3sp4YENdvE",
  authDomain: "housebookingsystem.firebaseapp.com",
  projectId: "housebookingsystem",
  storageBucket: "housebookingsystem.appspot.com",
  messagingSenderId: "819878550596",
  appId: "1:819878550596:web:959c12eb48868928a5f011",
  measurementId: "G-8NNE50F62B",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===============================
// Small utilities
// ===============================
const $ = (id) => document.getElementById(id);
const hasEl = (id) => Boolean($(id));
const currencyKES = (n) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

function ensureAuthOrRedirect() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (!user) {
        alert("Please log in first.");
        window.location.href = "login.html";
      } else {
        resolve(user);
      }
    });
  });
}

// ===============================
// Auth: signup / login / logout
// ===============================
window.signup = async function () {
  const email = $("signupEmail")?.value?.trim();
  const password = $("signupPassword")?.value;
  if (!email || !password) return alert("Email and password are required.");
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Signup successful!");
    window.location.href = "index.html";
  } catch (err) {
    alert(err.message);
  }
};

window.login = async function () {
  const email = $("loginEmail")?.value?.trim();
  const password = $("loginPassword")?.value;
  if (!email || !password) return alert("Email and password are required.");
  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login successful!");
    window.location.href = "index.html";
  } catch (err) {
    alert(err.message);
  }
};

window.logout = async function () {
  try {
    await signOut(auth);
    alert("Logged out.");
    window.location.href = "login.html";
  } catch (err) {
    alert(err.message);
  }
};

// ===============================
// Houses: list & add
// ===============================
async function loadHouses() {
  const container = $("houses");
  if (!container) return;
  container.innerHTML = `<div class="card">Loading houses...</div>`;

  try {
    const q = query(collection(db, "houses"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      container.innerHTML = `<div class="card">No houses yet. Be the first to add one!</div>`;
      return;
    }

    container.innerHTML = "";
    snap.forEach((docSnap) => {
      const h = docSnap.data();
      const img = h.image || h.images?.[0] || "https://via.placeholder.com/600x400?text=House";
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${img}" alt="${h.title || "House"}" />
        <h3>${h.title || "Untitled House"}</h3>
        <p>${h.location || "—"}</p>
        <p><strong>${currencyKES(h.price)}</strong></p>
        <button data-id="${docSnap.id}" class="btn-book">Book Now</button>
      `;
      container.appendChild(card);
    });

    // Attach handlers to Book buttons
    container.querySelectorAll(".btn-book").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const houseId = btn.getAttribute("data-id");
        await bookHouse(houseId);
      });
    });
  } catch (err) {
    container.innerHTML = `<div class="card">Failed to load houses: ${err.message}</div>`;
  }
}

window.addHouse = async function () {
  // Protect
  const user = await ensureAuthOrRedirect();

  const title = $("title")?.value?.trim();
  const location = $("location")?.value?.trim();
  const price = $("price")?.value;
  const image = $("image")?.value?.trim();

  if (!title || !location || !price || !image) {
    return alert("Please fill in all fields (including Image URL).");
  }

  try {
    await addDoc(collection(db, "houses"), {
      ownerId: user.uid,
      title,
      location,
      price: Number(price),
      image,
      availability: true,
      createdAt: serverTimestamp(),
    });
    alert("House added!");
    window.location.href = "index.html";
  } catch (err) {
    alert(err.message);
  }
};

// ===============================
// Bookings: create & list
// ===============================
async function bookHouse(houseId) {
  const user = await ensureAuthOrRedirect();

  try {
    await addDoc(collection(db, "bookings"), {
      houseId,
      userId: user.uid,
      status: "pending", // owner can later confirm/cancel
      dateBooked: serverTimestamp(),
    });
    alert("Booking request sent!");
  } catch (err) {
    alert(err.message);
  }
}
window.bookHouse = bookHouse; // just in case you still call it inline

async function loadMyBookings() {
  const container = $("bookings");
  if (!container) return;

  const user = await ensureAuthOrRedirect();

  container.innerHTML = `<div class="card">Loading your bookings...</div>`;
  try {
    const q = query(
      collection(db, "bookings"),
      where("userId", "==", user.uid),
      orderBy("dateBooked", "desc")
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      container.innerHTML = `<div class="card">You have no bookings yet.</div>`;
      return;
    }

    container.innerHTML = "";
    snap.forEach((docSnap) => {
      const b = docSnap.data();
      const card = document.createElement("div");
      card.className = "card";
      const placed =
        b.dateBooked?.toDate?.() ? b.dateBooked.toDate().toLocaleString() : "—";
      card.innerHTML = `
        <h3>Booking #${docSnap.id.slice(0, 6)}</h3>
        <p>Status: <strong>${b.status}</strong></p>
        <p>House ID: ${b.houseId}</p>
        <p>Placed: ${placed}</p>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = `<div class="card">Failed to load bookings: ${err.message}</div>`;
  }
}

// ===============================
// Page bootstrapping
// ===============================
function initNavAuthState() {
  // Optional: If you add a logout button with id="logoutBtn" in your nav
  const logoutBtn = $("logoutBtn");
  if (!logoutBtn) return;
  onAuthStateChanged(auth, (user) => {
    logoutBtn.style.display = user ? "inline-block" : "none";
  });
}

(async function boot() {
  // Initialize features per page by checking for specific containers
  initNavAuthState();

  if (hasEl("houses")) await loadHouses();
  if (hasEl("bookings")) await loadMyBookings();

  // No extra init needed on login.html or add-house.html beyond the global functions
})();
