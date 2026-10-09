import {
    collection,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import {
    db,
    auth
} from "./firebase.js";


// ========================================
// ELEMENT
// ========================================

const customerTableBody =
    document.getElementById("customerTableBody");

const loadingState =
    document.getElementById("loadingState");

const emptyState =
    document.getElementById("emptyState");

const tableWrapper =
    document.getElementById("tableWrapper");

const totalCustomer =
    document.getElementById("totalCustomer");

const registeredCustomer =
    document.getElementById("registeredCustomer");

const searchCustomer =
    document.getElementById("searchCustomer");

const customerModal =
    document.getElementById("customerModal");

const customerForm =
    document.getElementById("customerForm");

const modalTitle =
    document.getElementById("modalTitle");

const customerName =
    document.getElementById("customerName");

const customerWhatsapp =
    document.getElementById("customerWhatsapp");

const customerAddress =
    document.getElementById("customerAddress");

const addCustomerBtn =
    document.getElementById("addCustomerBtn");

const closeModalBtn =
    document.getElementById("closeModalBtn");

const cancelModalBtn =
    document.getElementById("cancelModalBtn");

const logoutBtn =
    document.getElementById("logoutBtn");


// ========================================
// DATA
// ========================================

let customerData = [];
let editingCustomerId = null;


// ========================================
// USER
// ========================================

const userName =
    localStorage.getItem("dapurNiaUserName") || "User";

const profileName =
    document.getElementById("profileName");

const profileAvatar =
    document.getElementById("profileAvatar");

if (profileName) {
    profileName.textContent = userName;
}

if (profileAvatar) {
    profileAvatar.textContent =
        userName.charAt(0).toUpperCase();
}


// ========================================
// LOAD DATA
// ========================================

async function loadCustomers() {

    try {

        loadingState.style.display = "block";
        emptyState.style.display = "none";
        tableWrapper.style.display = "none";

        console.log(
            "Mengambil data pelanggan..."
        );

        const snapshot =
            await getDocs(
                collection(db, "pelanggan")
            );

        customerData =
            snapshot.docs.map((item) => ({
                id: item.id,
                ...item.data()
            }));

        console.log(
            "PELANGGAN:",
            customerData
        );

        updateSummary();

        renderCustomers(customerData);

    } catch (error) {

        console.error(
            "Gagal mengambil data pelanggan:",
            error
        );

        loadingState.style.display = "none";

        alert(
            "Gagal mengambil data pelanggan dari Firestore."
        );
    }
}


// ========================================
// SUMMARY
// ========================================

function updateSummary() {

    const total =
        customerData.length;

    totalCustomer.textContent =
        total;

    registeredCustomer.textContent =
        total;
}


// ========================================
// RENDER
// ========================================

function renderCustomers(data) {

    loadingState.style.display = "none";

    customerTableBody.innerHTML = "";

    if (data.length === 0) {

        tableWrapper.style.display = "none";
        emptyState.style.display = "block";

        return;
    }

    emptyState.style.display = "none";
    tableWrapper.style.display = "block";


    data.forEach((customer) => {

        const row =
            document.createElement("tr");

        row.innerHTML = `

            <td>

                <span class="customer-name">
                    ${escapeHtml(customer.nama || "-")}
                </span>

                <span class="customer-id">
                    ID: ${escapeHtml(customer.id)}
                </span>

            </td>


            <td>

                <span class="whatsapp">
                    ${escapeHtml(customer.no_whatsapp || "-")}
                </span>

            </td>


            <td>

                <span class="address">
                    ${escapeHtml(customer.alamat || "-")}
                </span>

            </td>


            <td>

                <div class="action-buttons">

                    <button
                        class="action-btn edit-btn"
                        data-id="${escapeHtml(customer.id)}"
                        title="Edit"
                    >
                        <i data-lucide="pencil"></i>
                    </button>


                    <button
                        class="action-btn delete-btn"
                        data-id="${escapeHtml(customer.id)}"
                        title="Hapus"
                    >
                        <i data-lucide="trash-2"></i>
                    </button>

                </div>

            </td>
        `;

        customerTableBody.appendChild(row);

    });


    if (window.lucide) {
        lucide.createIcons();
    }


    // EDIT
    document
        .querySelectorAll(".edit-btn")
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    openEditModal(
                        button.dataset.id
                    );

                }
            );

        });


    // DELETE
    document
        .querySelectorAll(".delete-btn")
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    deleteCustomer(
                        button.dataset.id
                    );

                }
            );

        });
}


// ========================================
// OPEN ADD
// ========================================

function openAddModal() {

    editingCustomerId = null;

    modalTitle.textContent =
        "Tambah Pelanggan";

    customerForm.reset();

    customerModal.classList.add("show");

    setTimeout(() => {
        customerName.focus();
    }, 100);
}


// ========================================
// OPEN EDIT
// ========================================

function openEditModal(id) {

    const customer =
        customerData.find(
            (item) => item.id === id
        );

    if (!customer) {
        return;
    }

    editingCustomerId = id;

    modalTitle.textContent =
        "Edit Pelanggan";

    customerName.value =
        customer.nama || "";

    customerWhatsapp.value =
        customer.no_whatsapp || "";

    customerAddress.value =
        customer.alamat || "";

    customerModal.classList.add("show");
}


// ========================================
// CLOSE
// ========================================

function closeModal() {

    customerModal.classList.remove("show");

    editingCustomerId = null;

    customerForm.reset();
}


// ========================================
// VALIDASI WHATSAPP
// ========================================

function isValidWhatsApp(value) {

    return /^08\d{8,11}$/.test(value);

}


// ========================================
// SAVE
// ========================================

customerForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const nama =
            customerName.value.trim();

        const noWhatsapp =
            customerWhatsapp.value.trim();

        const alamat =
            customerAddress.value.trim();


        if (!nama) {

            alert(
                "Nama pelanggan wajib diisi."
            );

            return;
        }


        if (!isValidWhatsApp(noWhatsapp)) {

            alert(
                "Nomor WhatsApp harus diawali 08 dan terdiri dari 10–13 digit."
            );

            return;
        }


        if (!alamat) {

            alert(
                "Alamat pelanggan wajib diisi."
            );

            return;
        }


        if (alamat.length > 200) {

            alert(
                "Alamat maksimal 200 karakter."
            );

            return;
        }


        try {

            const submitButton =
                customerForm.querySelector(
                    'button[type="submit"]'
                );

            submitButton.disabled = true;
            submitButton.textContent =
                "Menyimpan...";


            // ==============================
            // TAMBAH
            // ==============================

            if (!editingCustomerId) {

                const existingCustomer =
                    customerData.find(
                        (item) =>
                            item.id === noWhatsapp
                    );


                if (existingCustomer) {

                    alert(
                        "Nomor WhatsApp tersebut sudah terdaftar."
                    );

                    return;
                }


                await setDoc(
                    doc(
                        db,
                        "pelanggan",
                        noWhatsapp
                    ),
                    {
                        nama: nama,
                        no_whatsapp: noWhatsapp,
                        alamat: alamat,
                        dibuat_pada:
                            serverTimestamp()
                    }
                );


                alert(
                    "Pelanggan berhasil ditambahkan."
                );

            }


            // ==============================
            // EDIT
            // ==============================

            else {

                const oldId =
                    editingCustomerId;


                // Kalau nomor WhatsApp tidak berubah
                if (oldId === noWhatsapp) {

                    await updateDoc(
                        doc(
                            db,
                            "pelanggan",
                            oldId
                        ),
                        {
                            nama: nama,
                            no_whatsapp: noWhatsapp,
                            alamat: alamat
                        }
                    );

                }


                // Kalau nomor WhatsApp berubah
                else {

                    const existingCustomer =
                        customerData.find(
                            (item) =>
                                item.id === noWhatsapp
                        );


                    if (existingCustomer) {

                        alert(
                            "Nomor WhatsApp baru sudah digunakan pelanggan lain."
                        );

                        return;
                    }


                    await setDoc(
                        doc(
                            db,
                            "pelanggan",
                            noWhatsapp
                        ),
                        {
                            nama: nama,
                            no_whatsapp: noWhatsapp,
                            alamat: alamat,
                            dibuat_pada:
                                serverTimestamp()
                        }
                    );


                    await deleteDoc(
                        doc(
                            db,
                            "pelanggan",
                            oldId
                        )
                    );

                }


                alert(
                    "Data pelanggan berhasil diperbarui."
                );
            }


            closeModal();

            await loadCustomers();


        } catch (error) {

            console.error(
                "Gagal menyimpan pelanggan:",
                error
            );

            alert(
                "Gagal menyimpan data pelanggan."
            );

        } finally {

            const submitButton =
                customerForm.querySelector(
                    'button[type="submit"]'
                );

            submitButton.disabled = false;

            submitButton.innerHTML = `
                <i data-lucide="save"></i>
                Simpan Pelanggan
            `;

            if (window.lucide) {
                lucide.createIcons();
            }
        }

    }
);


// ========================================
// DELETE
// ========================================

async function deleteCustomer(id) {

    const customer =
        customerData.find(
            (item) => item.id === id
        );

    if (!customer) {
        return;
    }


    const confirmDelete =
        confirm(
            `Hapus pelanggan "${customer.nama}"?`
        );


    if (!confirmDelete) {
        return;
    }


    try {

        await deleteDoc(
            doc(
                db,
                "pelanggan",
                id
            )
        );


        alert(
            "Pelanggan berhasil dihapus."
        );


        await loadCustomers();


    } catch (error) {

        console.error(
            "Gagal menghapus pelanggan:",
            error
        );

        alert(
            "Gagal menghapus pelanggan."
        );
    }
}


// ========================================
// SEARCH
// ========================================

searchCustomer.addEventListener(
    "input",
    () => {

        const keyword =
            searchCustomer.value
                .toLowerCase()
                .trim();


        const filtered =
            customerData.filter(
                (customer) => {

                    const nama =
                        String(
                            customer.nama || ""
                        ).toLowerCase();

                    const whatsapp =
                        String(
                            customer.no_whatsapp || ""
                        ).toLowerCase();


                    return (
                        nama.includes(keyword) ||
                        whatsapp.includes(keyword)
                    );

                }
            );


        renderCustomers(filtered);

    }
);


// ========================================
// BUTTON
// ========================================

addCustomerBtn.addEventListener(
    "click",
    openAddModal
);

closeModalBtn.addEventListener(
    "click",
    closeModal
);

cancelModalBtn.addEventListener(
    "click",
    closeModal
);


// Klik luar modal
customerModal.addEventListener(
    "click",
    (event) => {

        if (
            event.target === customerModal
        ) {
            closeModal();
        }

    }
);


// ========================================
// LOGOUT
// ========================================

logoutBtn.addEventListener(
    "click",
    async () => {

        const confirmLogout =
            confirm(
                "Apakah kamu yakin ingin keluar dari Dapur Nia?"
            );

        if (!confirmLogout) {
            return;
        }

        try {

            await signOut(auth);

            localStorage.removeItem(
                "dapurNiaUserName"
            );

            window.location.href =
                "index.html";

        } catch (error) {

            console.error(
                "Logout gagal:",
                error
            );

            alert(
                "Terjadi kesalahan saat keluar."
            );
        }

    }
);


// ========================================
// ESCAPE HTML
// ========================================

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ========================================
// LUCIDE
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (window.lucide) {
            lucide.createIcons();
        }

    }
);


// ========================================
// START
// ========================================

loadCustomers();