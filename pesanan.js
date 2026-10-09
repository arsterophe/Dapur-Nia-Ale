import {
    collection,
    getDocs,
    addDoc,
    doc,
    updateDoc,
    serverTimestamp,
    runTransaction
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

const orderModal = document.getElementById("orderModal");
const openOrderBtn = document.getElementById("openOrderBtn");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");

const orderForm = document.getElementById("orderForm");

const customerSelect = document.getElementById("customerSelect");
const customerWhatsapp = document.getElementById("customerWhatsapp");
const customerAddress = document.getElementById("customerAddress");

const menuSelect = document.getElementById("menuSelect");
const menuPrice = document.getElementById("menuPrice");
const menuStock = document.getElementById("menuStock");

const quantity = document.getElementById("quantity");
const minusBtn = document.getElementById("minusBtn");
const plusBtn = document.getElementById("plusBtn");

const shipping = document.getElementById("shipping");

const subtotal = document.getElementById("subtotal");
const shippingDisplay = document.getElementById("shippingDisplay");
const grandTotal = document.getElementById("grandTotal");

const stockWarning = document.getElementById("stockWarning");

const orderTableBody = document.getElementById("orderTableBody");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");

const saveOrderBtn = document.getElementById("saveOrderBtn");

const totalOrders = document.getElementById("totalOrders");
const pendingOrders = document.getElementById("pendingOrders");
const completedOrders = document.getElementById("completedOrders");
const totalRevenue = document.getElementById("totalRevenue");

const logoutBtn = document.getElementById("logoutBtn");


/* =========================
   DATA
========================= */

let customers = [];
let menus = [];
let orders = [];


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
   STATUS
========================= */

function getStatusLabel(status) {

    const labels = {
        menunggu_bayar: "Menunggu Bayar",
        dibayar: "Dibayar",
        diproses: "Diproses",
        selesai: "Selesai",
        dibatalkan: "Dibatalkan"
    };

    return labels[status] || status;

}


function getStatusClass(status) {

    const classes = {
        menunggu_bayar: "status-menunggu",
        dibayar: "status-dibayar",
        diproses: "status-diproses",
        selesai: "status-selesai",
        dibatalkan: "status-dibatalkan"
    };

    return classes[status] || "";

}


/* =========================
   LOAD DATA
========================= */

async function loadData() {

    try {

        loadingState.style.display = "block";
        emptyState.style.display = "none";

        const [
            customerSnapshot,
            menuSnapshot,
            orderSnapshot
        ] = await Promise.all([

            getDocs(collection(db, "pelanggan")),

            getDocs(collection(db, "menu")),

            getDocs(collection(db, "pesanan"))

        ]);


        customers = customerSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));


        menus = menuSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));


        orders = orderSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));


        console.log("PELANGGAN:", customers);
        console.log("MENU:", menus);
        console.log("PESANAN:", orders);


        populateCustomers();

        populateMenus();

        renderOrders();

        updateSummary();


    } catch (error) {

        console.error("Gagal mengambil data:", error);

        alert(
            "Gagal mengambil data dari Firestore.\n\n" +
            error.message
        );

    } finally {

        loadingState.style.display = "none";

    }

}


/* =========================
   CUSTOMER DROPDOWN
========================= */

function populateCustomers() {

    customerSelect.innerHTML = `
        <option value="">Pilih pelanggan</option>
    `;


    customers
        .sort((a, b) =>
            (a.nama || "").localeCompare(b.nama || "")
        )
        .forEach(customer => {

            const option = document.createElement("option");

            option.value = customer.id;

            option.textContent =
                `${customer.nama} - ${customer.no_whatsapp}`;

            customerSelect.appendChild(option);

        });

}


/* =========================
   MENU DROPDOWN
========================= */

function populateMenus() {

    menuSelect.innerHTML = `
        <option value="">Pilih menu</option>
    `;


    menus
        .filter(menu =>
            menu.tersedia === true &&
            Number(menu.sisa_porsi) > 0
        )
        .sort((a, b) =>
            (a.nama || "").localeCompare(b.nama || "")
        )
        .forEach(menu => {

            const option = document.createElement("option");

            option.value = menu.id;

            option.textContent =
                `${menu.nama} — ${formatRupiah(menu.harga)} (${menu.sisa_porsi} porsi)`;

            menuSelect.appendChild(option);

        });

}


/* =========================
   CUSTOMER SELECT
========================= */

customerSelect.addEventListener("change", () => {

    const customerId = customerSelect.value;

    const customer = customers.find(
        item => item.id === customerId
    );


    if (!customer) {

        customerWhatsapp.textContent = "-";
        customerAddress.textContent = "-";

        return;
    }


    customerWhatsapp.textContent =
        customer.no_whatsapp || "-";

    customerAddress.textContent =
        customer.alamat || "-";

});


/* =========================
   MENU SELECT
========================= */

menuSelect.addEventListener("change", () => {

    updateMenuInfo();

    calculateTotal();

});


function updateMenuInfo() {

    const menuId = menuSelect.value;

    const menu = menus.find(
        item => item.id === menuId
    );


    if (!menu) {

        menuPrice.textContent = "Rp0";
        menuStock.textContent = "0";

        quantity.max = 1;

        stockWarning.textContent = "";

        return;
    }


    const stock = Number(menu.sisa_porsi) || 0;

    const price = Number(menu.harga) || 0;


    menuPrice.textContent =
        formatRupiah(price);

    menuStock.textContent =
        `${stock} porsi`;

    quantity.max = stock;


    if (Number(quantity.value) > stock) {

        quantity.value = stock;

    }


    stockWarning.textContent =
        `Maksimal ${stock} porsi tersedia.`;

}


/* =========================
   QUANTITY
========================= */

minusBtn.addEventListener("click", () => {

    let value = Number(quantity.value) || 1;

    if (value > 1) {
        value--;
    }

    quantity.value = value;

    calculateTotal();

});


plusBtn.addEventListener("click", () => {

    const menu = menus.find(
        item => item.id === menuSelect.value
    );

    const stock = menu
        ? Number(menu.sisa_porsi)
        : 0;

    let value = Number(quantity.value) || 1;


    if (value < stock) {

        value++;

        quantity.value = value;

    }


    calculateTotal();

});


quantity.addEventListener("input", () => {

    const menu = menus.find(
        item => item.id === menuSelect.value
    );

    const stock = menu
        ? Number(menu.sisa_porsi)
        : 0;


    let value = Number(quantity.value) || 1;


    if (value < 1) {
        value = 1;
    }


    if (stock > 0 && value > stock) {

        value = stock;

        stockWarning.textContent =
            `Jumlah tidak boleh lebih dari ${stock} porsi.`;

    } else {

        stockWarning.textContent =
            stock > 0
                ? `Maksimal ${stock} porsi tersedia.`
                : "";

    }


    quantity.value = value;

    calculateTotal();

});


/* =========================
   SHIPPING
========================= */

shipping.addEventListener("input", calculateTotal);


/* =========================
   CALCULATE TOTAL
========================= */

function calculateTotal() {

    const menu = menus.find(
        item => item.id === menuSelect.value
    );


    const price = menu
        ? Number(menu.harga) || 0
        : 0;


    const qty =
        Number(quantity.value) || 0;


    const ongkir =
        Number(shipping.value) || 0;


    const subtotalValue =
        price * qty;


    const totalValue =
        subtotalValue + ongkir;


    subtotal.textContent =
        formatRupiah(subtotalValue);

    shippingDisplay.textContent =
        formatRupiah(ongkir);

    grandTotal.textContent =
        formatRupiah(totalValue);

}


/* =========================
   MODAL
========================= */

openOrderBtn.addEventListener("click", () => {

    resetForm();

    orderModal.classList.add("show");

});


function closeOrderModal() {

    orderModal.classList.remove("show");

}


closeModal.addEventListener("click", closeOrderModal);

cancelBtn.addEventListener("click", closeOrderModal);


orderModal.addEventListener("click", event => {

    if (event.target === orderModal) {

        closeOrderModal();

    }

});


/* =========================
   RESET FORM
========================= */

function resetForm() {

    orderForm.reset();

    quantity.value = 1;

    shipping.value = 0;

    customerWhatsapp.textContent = "-";

    customerAddress.textContent = "-";

    menuPrice.textContent = "Rp0";

    menuStock.textContent = "0";

    stockWarning.textContent = "";

    subtotal.textContent = "Rp0";

    shippingDisplay.textContent = "Rp0";

    grandTotal.textContent = "Rp0";

}


/* =========================
   SAVE ORDER
========================= */

orderForm.addEventListener("submit", async event => {

    event.preventDefault();


    const customerId =
        customerSelect.value;

    const menuId =
        menuSelect.value;

    const qty =
        Number(quantity.value);

    const ongkir =
        Number(shipping.value) || 0;

    const status =
        document.getElementById("status").value;


    if (!customerId) {

        alert("Silakan pilih pelanggan.");

        return;
    }


    if (!menuId) {

        alert("Silakan pilih menu.");

        return;
    }


    if (!Number.isInteger(qty) || qty < 1) {

        alert("Jumlah porsi minimal 1.");

        return;
    }


    if (!Number.isInteger(ongkir) || ongkir < 0) {

        alert("Ongkir tidak valid.");

        return;
    }


    const customer =
        customers.find(
            item => item.id === customerId
        );


    if (!customer) {

        alert("Data pelanggan tidak ditemukan.");

        return;
    }


    saveOrderBtn.disabled = true;

    saveOrderBtn.innerHTML =
        "Menyimpan...";


    try {

        /*
         * TRANSACTION
         *
         * Stok menu dibaca lagi langsung
         * dari Firestore supaya stok tidak
         * salah kalau ada perubahan data.
         */

        const menuRef =
            doc(db, "menu", menuId);


        const orderResult =
            await runTransaction(
                db,
                async transaction => {

                    const menuSnapshot =
                        await transaction.get(menuRef);


                    if (!menuSnapshot.exists()) {

                        throw new Error(
                            "Menu tidak ditemukan."
                        );

                    }


                    const menuData =
                        menuSnapshot.data();


                    const currentStock =
                        Number(menuData.sisa_porsi) || 0;


                    const currentPrice =
                        Number(menuData.harga) || 0;


                    const isAvailable =
                        menuData.tersedia === true;


                    if (!isAvailable) {

                        throw new Error(
                            "Menu ini sedang tidak tersedia."
                        );

                    }


                    if (currentStock <= 0) {

                        throw new Error(
                            "Stok menu sudah habis."
                        );

                    }


                    if (qty > currentStock) {

                        throw new Error(
                            `Stok tidak cukup. Sisa hanya ${currentStock} porsi.`
                        );

                    }


                    const subtotalValue =
                        currentPrice * qty;


                    const totalValue =
                        subtotalValue + ongkir;


                    const today =
                        new Date()
                            .toISOString()
                            .split("T")[0];


                    /*
                     * DATA PESANAN
                     */

                    const orderRef =
                        doc(collection(db, "pesanan"));


                    const orderData = {

                        pelanggan_id: customer.id,

                        nama_pelanggan:
                            customer.nama,

                        alamat_kirim:
                            customer.alamat,

                        menu_id: menuId,

                        nama_menu:
                            menuData.nama,

                        harga_satuan:
                            currentPrice,

                        jumlah_porsi:
                            qty,

                        ongkir:
                            ongkir,

                        total:
                            totalValue,

                        status:
                            status,

                        bukti_bayar:
                            "",

                        tanggal:
                            today,

                        dibuat_pada:
                            serverTimestamp()

                    };


                    transaction.set(
                        orderRef,
                        orderData
                    );


                    /*
                     * KURANGI STOK
                     */

                    const newStock =
                        currentStock - qty;


                    transaction.update(
                        menuRef,
                        {

                            sisa_porsi:
                                newStock,

                            tersedia:
                                newStock > 0

                        }
                    );


                    return {
                        total: totalValue,
                        newStock
                    };

                }
            );


        console.log(
            "Pesanan berhasil:",
            orderResult
        );


        alert(
            `Pesanan berhasil disimpan!\n\n` +
            `Total: ${formatRupiah(orderResult.total)}\n` +
            `Sisa stok: ${orderResult.newStock} porsi`
        );


        closeOrderModal();

        await loadData();


    } catch (error) {

        console.error(
            "Gagal menyimpan pesanan:",
            error
        );


        alert(
            "Gagal menyimpan pesanan.\n\n" +
            error.message
        );


    } finally {

        saveOrderBtn.disabled = false;

        saveOrderBtn.innerHTML = `
            <i data-lucide="save"></i>
            Simpan Pesanan
        `;

        lucide.createIcons();

    }

});


/* =========================
   RENDER ORDERS
========================= */

function renderOrders(searchTerm = "") {

    orderTableBody.innerHTML = "";


    let filteredOrders =
        [...orders];


    if (searchTerm.trim()) {

        const keyword =
            searchTerm
                .toLowerCase()
                .trim();


        filteredOrders =
            filteredOrders.filter(order => {

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

                );

            });

    }


    filteredOrders.sort((a, b) => {

        const dateA =
            a.tanggal || "";

        const dateB =
            b.tanggal || "";

        return dateB.localeCompare(dateA);

    });


    if (filteredOrders.length === 0) {

        document.getElementById(
            "orderTable"
        ).style.display = "none";

        emptyState.style.display = "block";

        return;

    }


    document.getElementById(
        "orderTable"
    ).style.display = "table";

    emptyState.style.display = "none";


    filteredOrders.forEach(order => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                <strong>
                    ${escapeHtml(order.nama_pelanggan)}
                </strong>
            </td>

            <td>
                ${escapeHtml(order.nama_menu)}
            </td>

            <td>
                ${Number(order.jumlah_porsi) || 0} porsi
            </td>

            <td>
                <strong>
                    ${formatRupiah(order.total)}
                </strong>
            </td>

            <td>
                ${escapeHtml(order.tanggal || "-")}
            </td>

            <td>
                <span class="status ${getStatusClass(order.status)}">
                    ${escapeHtml(getStatusLabel(order.status))}
                </span>
            </td>

        `;


        orderTableBody.appendChild(row);

    });


    lucide.createIcons();

}


/* =========================
   SUMMARY
========================= */

function updateSummary() {

    const activeOrders =
        orders.filter(
            order =>
                order.status !== "dibatalkan"
        );


    const pending =
        orders.filter(
            order =>
                order.status === "menunggu_bayar"
        );


    const completed =
        orders.filter(
            order =>
                order.status === "selesai"
        );


    const revenue =
        activeOrders.reduce(
            (sum, order) =>
                sum + (Number(order.total) || 0),
            0
        );


    totalOrders.textContent =
        orders.length;


    pendingOrders.textContent =
        pending.length;


    completedOrders.textContent =
        completed.length;


    totalRevenue.textContent =
        formatRupiah(revenue);

}


/* =========================
   SEARCH
========================= */

searchInput.addEventListener(
    "input",
    () => {

        renderOrders(
            searchInput.value
        );

    }
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

loadData();

lucide.createIcons();