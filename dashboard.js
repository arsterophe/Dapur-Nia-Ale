import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import {
    db,
    auth
} from "./firebase.js";


// ========================================
// FORMAT RUPIAH
// ========================================
function formatRupiah(number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(number);
}


// ========================================
// NAVIGASI SIDEBAR
// ========================================
function setupSidebarNavigation() {
    const navItems = document.querySelectorAll(".sidebar-nav .nav-item");

    navItems.forEach((link) => {
        link.addEventListener("click", function () {
            const target = this.getAttribute("href");

            if (target) {
                window.location.href = target;
            }
        });
    });
}


// ========================================
// LOAD DATA DASHBOARD
// ========================================
async function loadDashboard() {
    try {
        console.log("Mengambil data dari Firestore...");

        const [
            menuSnapshot,
            pelangganSnapshot,
            pesananSnapshot
        ] = await Promise.all([
            getDocs(collection(db, "menu")),
            getDocs(collection(db, "pelanggan")),
            getDocs(collection(db, "pesanan"))
        ]);

        const menus = menuSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));

        const pelanggan = pelangganSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));

        const pesanan = pesananSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log("MENU:", menus);
        console.log("PELANGGAN:", pelanggan);
        console.log("PESANAN:", pesanan);


        // ========================================
        // TANGGAL HARI INI
        // ========================================
        const now = new Date();

        const today =
            now.getFullYear() +
            "-" +
            String(now.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(now.getDate()).padStart(2, "0");


        // ========================================
        // HITUNG STATISTIK
        // ========================================

        // Pesanan hari ini
        const todayOrders = pesanan.filter(
            (pesanan) => pesanan.tanggal === today
        ).length;


        // Menu yang masih tersedia
        const availableMenus = menus.filter(
            (menu) =>
                menu.tersedia === true &&
                Number(menu.sisa_porsi || 0) > 0
        ).length;


        // Pesanan menunggu pembayaran
        const pendingOrders = pesanan.filter(
            (pesanan) =>
                pesanan.status === "menunggu_bayar"
        ).length;


        // Total pendapatan
        // Pesanan dibatalkan tidak dihitung
        const totalRevenue = pesanan
            .filter(
                (pesanan) =>
                    pesanan.status !== "dibatalkan"
            )
            .reduce(
                (total, pesanan) =>
                    total + Number(pesanan.total || 0),
                0
            );


        // ========================================
        // TAMPILKAN KE DASHBOARD
        // ========================================

        const todayOrdersElement =
            document.getElementById("todayOrders");

        const availableMenusElement =
            document.getElementById("availableMenus");

        const pendingOrdersElement =
            document.getElementById("pendingOrders");

        const totalRevenueElement =
            document.getElementById("totalRevenue");


        if (todayOrdersElement) {
            todayOrdersElement.textContent = todayOrders;
        }

        if (availableMenusElement) {
            availableMenusElement.textContent = availableMenus;
        }

        if (pendingOrdersElement) {
            pendingOrdersElement.textContent = pendingOrders;
        }

        if (totalRevenueElement) {
            totalRevenueElement.textContent =
                formatRupiah(totalRevenue);
        }


        // ========================================
        // CONSOLE
        // ========================================

        console.log("===============================");
        console.log("Pesanan Hari Ini:", todayOrders);
        console.log("Menu Tersedia:", availableMenus);
        console.log("Menunggu Bayar:", pendingOrders);
        console.log("Total Pendapatan:", totalRevenue);
        console.log("===============================");

    } catch (error) {

        console.error(
            "Gagal memuat dashboard:",
            error
        );

    }
}


// ========================================
// TOMBOL BUAT PESANAN
// ========================================
function setupCreateOrderButton() {
    const button =
        document.getElementById("createOrderBtn");

    if (!button) return;

    button.addEventListener("click", () => {
        window.location.href = "./pesanan.html";
    });
}


// ========================================
// LOGOUT
// ========================================
function setupLogout() {
    const logoutButton =
        document.getElementById("logoutBtn");

    if (!logoutButton) return;

    logoutButton.addEventListener("click", async () => {

        try {

            await signOut(auth);

            window.location.href = "./index.html";

        } catch (error) {

            console.error(
                "Logout gagal:",
                error
            );

        }

    });
}


// ========================================
// JALANKAN SAAT HALAMAN SIAP
// ========================================
document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupSidebarNavigation();

        setupCreateOrderButton();

        setupLogout();

        loadDashboard();

    }
);