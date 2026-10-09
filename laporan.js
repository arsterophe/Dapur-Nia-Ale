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


/* =========================
   ELEMENT
========================= */

const totalRevenue =
    document.getElementById("totalRevenue");

const totalOrders =
    document.getElementById("totalOrders");

const totalPortions =
    document.getElementById("totalPortions");

const completedOrders =
    document.getElementById("completedOrders");

const reportTable =
    document.getElementById("reportTable");

const reportTableBody =
    document.getElementById("reportTableBody");

const loadingState =
    document.getElementById("loadingState");

const emptyState =
    document.getElementById("emptyState");

const searchInput =
    document.getElementById("searchInput");

const startDate =
    document.getElementById("startDate");

const endDate =
    document.getElementById("endDate");

const filterBtn =
    document.getElementById("filterBtn");

const resetFilterBtn =
    document.getElementById("resetFilterBtn");

const reportDescription =
    document.getElementById("reportDescription");

const logoutBtn =
    document.getElementById("logoutBtn");


/* =========================
   DATA
========================= */

let orders = [];

let filteredOrders = [];


/* =========================
   FORMAT RUPIAH
========================= */

function formatRupiah(value) {

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(value || 0);

}


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================
   STATUS LABEL
========================= */

function getStatusLabel(status) {

    const labels = {

        menunggu_bayar:
            "Menunggu Bayar",

        dibayar:
            "Dibayar",

        diproses:
            "Diproses",

        selesai:
            "Selesai",

        dibatalkan:
            "Dibatalkan"

    };

    return labels[status] || status;

}


/* =========================
   STATUS CLASS
========================= */

function getStatusClass(status) {

    const classes = {

        menunggu_bayar:
            "status-menunggu",

        dibayar:
            "status-dibayar",

        diproses:
            "status-diproses",

        selesai:
            "status-selesai",

        dibatalkan:
            "status-dibatalkan"

    };

    return classes[status] || "";

}


/* =========================
   LOAD FIRESTORE
========================= */

async function loadOrders() {

    try {

        loadingState.style.display =
            "block";

        emptyState.style.display =
            "none";

        reportTable.style.display =
            "table";


        const snapshot =
            await getDocs(
                collection(db, "pesanan")
            );


        orders =
            snapshot.docs.map(doc => ({

                id: doc.id,

                ...doc.data()

            }));


        console.log(
            "DATA LAPORAN:",
            orders
        );


        filteredOrders =
            [...orders];


        updateReport();


    } catch (error) {

        console.error(
            "Gagal mengambil laporan:",
            error
        );


        alert(
            "Gagal mengambil data laporan.\n\n" +
            error.message
        );


    } finally {

        loadingState.style.display =
            "none";

    }

}


/* =========================
   FILTER
========================= */

function applyFilter() {

    const from =
        startDate.value;

    const to =
        endDate.value;


    if (from && to && from > to) {

        alert(
            "Tanggal mulai tidak boleh lebih besar dari tanggal akhir."
        );

        return;

    }


    filteredOrders =
        orders.filter(order => {

            const orderDate =
                order.tanggal || "";


            if (from && orderDate < from) {

                return false;

            }


            if (to && orderDate > to) {

                return false;

            }


            return true;

        });


    updateReport();


    updateDescription();

}


/* =========================
   SEARCH
========================= */

function applySearch() {

    const keyword =
        searchInput.value
            .trim()
            .toLowerCase();


    let result =
        orders.filter(order => {

            const orderDate =
                order.tanggal || "";


            const from =
                startDate.value;

            const to =
                endDate.value;


            if (from && orderDate < from) {
                return false;
            }


            if (to && orderDate > to) {
                return false;
            }


            return true;

        });


    if (keyword) {

        result =
            result.filter(order => {

                return (

                    String(
                        order.nama_pelanggan || ""
                    )
                    .toLowerCase()
                    .includes(keyword)

                    ||

                    String(
                        order.nama_menu || ""
                    )
                    .toLowerCase()
                    .includes(keyword)

                    ||

                    String(
                        order.status || ""
                    )
                    .toLowerCase()
                    .includes(keyword)

                    ||

                    String(
                        order.tanggal || ""
                    )
                    .includes(keyword)

                );

            });

    }


    filteredOrders =
        result;


    updateReport();

}


/* =========================
   UPDATE REPORT
========================= */

function updateReport() {

    updateSummary();

    renderTable();

}


/* =========================
   SUMMARY
========================= */

function updateSummary() {

    /*
     * Pesanan dibatalkan tetap terlihat
     * di tabel, tetapi tidak masuk
     * perhitungan pendapatan/porsi.
     */

    const validOrders =
        filteredOrders.filter(
            order =>
                order.status !== "dibatalkan"
        );


    const revenue =
        validOrders.reduce(
            (sum, order) => {

                return (
                    sum +
                    (Number(order.total) || 0)
                );

            },
            0
        );


    const portions =
        validOrders.reduce(
            (sum, order) => {

                return (
                    sum +
                    (Number(order.jumlah_porsi) || 0)
                );

            },
            0
        );


    const completed =
        filteredOrders.filter(
            order =>
                order.status === "selesai"
        ).length;


    totalRevenue.textContent =
        formatRupiah(revenue);


    totalOrders.textContent =
        filteredOrders.length;


    totalPortions.textContent =
        portions;


    completedOrders.textContent =
        completed;

}


/* =========================
   TABLE
========================= */

function renderTable() {

    reportTableBody.innerHTML = "";


    if (filteredOrders.length === 0) {

        reportTable.style.display =
            "none";

        emptyState.style.display =
            "block";

        return;

    }


    reportTable.style.display =
        "table";

    emptyState.style.display =
        "none";


    const sortedOrders =
        [...filteredOrders].sort(
            (a, b) =>
                String(b.tanggal || "")
                    .localeCompare(
                        String(a.tanggal || "")
                    )
        );


    sortedOrders.forEach(order => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHtml(order.tanggal || "-")}
            </td>

            <td>
                <strong>
                    ${escapeHtml(order.nama_pelanggan || "-")}
                </strong>
            </td>

            <td>
                ${escapeHtml(order.nama_menu || "-")}
            </td>

            <td>
                ${Number(order.jumlah_porsi) || 0}
            </td>

            <td>
                ${formatRupiah(order.ongkir)}
            </td>

            <td>
                <strong>
                    ${formatRupiah(order.total)}
                </strong>
            </td>

            <td>
                <span class="status ${getStatusClass(order.status)}">
                    ${escapeHtml(
                        getStatusLabel(order.status)
                    )}
                </span>
            </td>

        `;


        reportTableBody.appendChild(row);

    });

}


/* =========================
   DESCRIPTION
========================= */

function updateDescription() {

    const from =
        startDate.value;

    const to =
        endDate.value;


    if (!from && !to) {

        reportDescription.textContent =
            "Menampilkan seluruh transaksi";

        return;

    }


    if (from && to) {

        reportDescription.textContent =
            `Periode ${from} sampai ${to}`;

        return;

    }


    if (from) {

        reportDescription.textContent =
            `Mulai dari ${from}`;

        return;

    }


    if (to) {

        reportDescription.textContent =
            `Sampai dengan ${to}`;

    }

}


/* =========================
   RESET FILTER
========================= */

function resetFilter() {

    startDate.value = "";

    endDate.value = "";

    searchInput.value = "";

    filteredOrders =
        [...orders];


    updateReport();

    updateDescription();

}


/* =========================
   EVENTS
========================= */

filterBtn.addEventListener(
    "click",
    applyFilter
);


resetFilterBtn.addEventListener(
    "click",
    resetFilter
);


searchInput.addEventListener(
    "input",
    applySearch
);


/* =========================
   LOGOUT
========================= */

logoutBtn.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

            window.location.href =
                "index.html";

        } catch (error) {

            console.error(
                "Logout gagal:",
                error
            );

            alert(
                "Logout gagal."
            );

        }

    }
);


/* =========================
   START
========================= */

loadOrders();

lucide.createIcons();