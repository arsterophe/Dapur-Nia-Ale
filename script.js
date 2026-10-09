import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { auth } from "./firebase.js";

const loginForm = document.getElementById("loginForm");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

const successOverlay = document.getElementById("successOverlay");
const successTitle = document.querySelector(".success-card h2");
const successDescription = document.querySelector(".success-card p");


// ===============================
// SHOW / HIDE PASSWORD
// ===============================

if (togglePassword) {
    togglePassword.addEventListener("click", () => {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            togglePassword.textContent = "Hide";
            togglePassword.setAttribute("aria-label", "Hide password");
        } else {
            passwordInput.type = "password";
            togglePassword.textContent = "Show";
            togglePassword.setAttribute("aria-label", "Show password");
        }
    });
}


// ===============================
// LOGIN
// ===============================

loginForm.addEventListener("submit", async (event) => {

    // Mencegah halaman refresh
    event.preventDefault();

    console.log("Tombol login ditekan");

    const emailInput = document.getElementById("email");

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Cek input
    if (!email || !password) {
        alert("Email dan password wajib diisi.");
        return;
    }

    try {

        console.log("Sedang login...");

        // Login Firebase
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        const user = userCredential.user;

        console.log("LOGIN BERHASIL:", user);


        // ===============================
        // AMBIL NAMA USER
        // ===============================

        const username = user.email.split("@")[0];

        const name = username
            .replace(/[._-]/g, " ")
            .replace(/[0-9]/g, " ")
            .trim()
            .split(" ")
            .filter(Boolean)
            .map((word) => {
                return (
                    word.charAt(0).toUpperCase() +
                    word.slice(1).toLowerCase()
                );
            })
            .join(" ") || "User";


        // Simpan nama untuk dashboard
        localStorage.setItem(
            "dapurNiaUserName",
            name
        );


        // ===============================
        // TAMPILKAN LOGIN BERHASIL
        // ===============================

        if (successOverlay) {

            if (successTitle) {
                successTitle.textContent =
                    `Welcome back, ${name}.`;
            }

            if (successDescription) {
                successDescription.textContent =
                    "Your workspace is ready.";
            }

            successOverlay.classList.add("show");
        }


        // ===============================
        // PINDAH KE DASHBOARD
        // ===============================

        setTimeout(() => {

            console.log("Pindah ke dashboard...");

            window.location.href = "dashboard.html";

        }, 1200);


    } catch (error) {

        console.error("LOGIN ERROR:", error);

        let message = "Login gagal. Silakan coba lagi.";

        if (error.code === "auth/invalid-email") {
            message = "Format email tidak valid.";
        }

        else if (error.code === "auth/invalid-credential") {
            message = "Email atau password salah.";
        }

        else if (error.code === "auth/user-not-found") {
            message = "Akun dengan email tersebut tidak ditemukan.";
        }

        else if (error.code === "auth/wrong-password") {
            message = "Password yang kamu masukkan salah.";
        }

        else if (error.code === "auth/too-many-requests") {
            message = "Terlalu banyak percobaan login. Coba lagi nanti.";
        }

        else if (error.code === "auth/network-request-failed") {
            message = "Koneksi internet bermasalah.";
        }

        else {
            message = "Login gagal: " + error.message;
        }

        alert(message);
    }
});