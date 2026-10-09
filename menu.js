import {
    collection,
    getDocs,
    addDoc,
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

const menuTableBody =
    document.getElementById("menuTableBody");

const loadingState =
    document.getElementById("loadingState");

const emptyState =
    document.getElementById("emptyState");

const tableWrapper =
    document.getElementById("tableWrapper");

const totalMenu =
    document.getElementById("totalMenu");

const availableMenu =
    document.getElementById("availableMenu");

const totalStock =
    document.getElementById("totalStock");

const searchMenu =
    document.getElementById("searchMenu");

const menuModal =
    document.getElementById("menuModal");

const menuForm =
    document.getElementById("menuForm");

const modalTitle =
    document.getElementById("modalTitle");

const menuName =
    document.getElementById("menuName");

const menuPrice =
    document.getElementById("menuPrice");

const menuStock =
    document.getElementById("menuStock");

const menuAvailable =
    document.getElementById("menuAvailable");

const addMenuBtn =
    document.getElementById("addMenuBtn");

const closeModalBtn =
    document.getElementById("closeModalBtn");

const cancelModalBtn =
    document.getElementById("cancelModalBtn");

const logoutBtn =
    document.getElementById("logoutBtn");


// ========================================
// DATA
// ========================================

let menuData = [];
let editingMenuId = null;


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
// LOAD MENU
// ========================================

async function loadMenu() {

    try {

        loadingState.style.display = "block";
        emptyState.style.display = "none";
        tableWrapper.style.display = "none";

        console.log("Mengambil data menu...");

        const snapshot =
            await getDocs(
                collection(db, "menu")
            );

        menuData =
            snapshot.docs.map((item) => ({
                id: item.id,
                ...item.data()
            }));

        console.log("MENU:", menuData);

        updateSummary();

        renderMenu(menuData);

    } catch (error) {

        console.error(
            "Gagal mengambil data menu:",
            error
        );

        loadingState.style.display = "none";

        alert(
            "Gagal mengambil data menu dari Firestore."
        );
    }
}


// ========================================
// SUMMARY
// ========================================

function updateSummary() {

    const total =
        menuData.length;

    const available =
        menuData.filter(
            (menu) =>
                menu.tersedia === true &&
                Number(menu.sisa_porsi) > 0
        ).length;

    const stock =
        menuData.reduce(
            (total, menu) =>
                total + Number(menu.sisa_porsi || 0),
            0
        );

    totalMenu.textContent = total;
    availableMenu.textContent = available;
    totalStock.textContent = stock;
}


// ========================================
// RENDER MENU
// ========================================

function renderMenu(data) {

    loadingState.style.display = "none";

    menuTableBody.innerHTML = "";

    if (data.length === 0) {

        tableWrapper.style.display = "none";
        emptyState.style.display = "block";

        return;
    }

    emptyState.style.display = "none";
    tableWrapper.style.display = "block";


    data.forEach((menu) => {

        const row =
            document.createElement("tr");

        const statusActive =
            menu.tersedia === true &&
            Number(menu.sisa_porsi) > 0;

        row.innerHTML = `

            <td>
                <span class="menu-name">
                    ${escapeHtml(menu.nama || "-")}
                </span>

                <span class="menu-id">
                    ID: ${menu.id}
                </span>
            </td>

            <td>
                <span class="price">
                    ${formatRupiah(menu.harga)}
                </span>
            </td>

            <td>
                <span class="stock">
                    ${Number(menu.sisa_porsi || 0)} porsi
                </span>
            </td>

            <td>

                ${
                    statusActive
                    ?
                    `
                    <span class="status-badge status-active">
                        <i data-lucide="circle-check"></i>
                        Tersedia
                    </span>
                    `
                    :
                    `
                    <span class="status-badge status-empty">
                        <i data-lucide="circle-x"></i>
                        Tidak tersedia
                    </span>
                    `
                }

            </td>

            <td>

                <div class="action-buttons">

                    <button
                        class="action-btn edit-btn"
                        data-id="${menu.id}"
                        title="Edit"
                    >
                        <i data-lucide="pencil"></i>
                    </button>

                    <button
                        class="action-btn delete-btn"
                        data-id="${menu.id}"
                        title="Hapus"
                    >
                        <i data-lucide="trash-2"></i>
                    </button>

                </div>

            </td>
        `;

        menuTableBody.appendChild(row);

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

                    const id =
                        button.dataset.id;

                    openEditModal(id);
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

                    const id =
                        button.dataset.id;

                    deleteMenu(id);
                }
            );

        });
}


// ========================================
// FORMAT RUPIAH
// ========================================

function formatRupiah(value) {

    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }
    ).format(Number(value || 0));

}


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
// OPEN ADD MODAL
// ========================================

function openAddModal() {

    editingMenuId = null;

    modalTitle.textContent =
        "Tambah Menu";

    menuForm.reset();

    menuAvailable.checked = true;

    menuModal.classList.add("show");

    setTimeout(() => {
        menuName.focus();
    }, 100);

}


// ========================================
// OPEN EDIT MODAL
// ========================================

function openEditModal(id) {

    const menu =
        menuData.find(
            (item) => item.id === id
        );

    if (!menu) {
        return;
    }

    editingMenuId = id;

    modalTitle.textContent =
        "Edit Menu";

    menuName.value =
        menu.nama || "";

    menuPrice.value =
        menu.harga || 0;

    menuStock.value =
        menu.sisa_porsi || 0;

    menuAvailable.checked =
        menu.tersedia === true;

    menuModal.classList.add("show");

}


// ========================================
// CLOSE MODAL
// ========================================

function closeModal() {

    menuModal.classList.remove("show");

    editingMenuId = null;

    menuForm.reset();

    menuAvailable.checked = true;
}


// ========================================
// SAVE MENU
// ========================================

menuForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const nama =
            menuName.value.trim();

        const harga =
            Number(menuPrice.value);

        const sisaPorsi =
            Number(menuStock.value);

        const tersedia =
            menuAvailable.checked;


        if (!nama) {

            alert(
                "Nama menu wajib diisi."
            );

            return;
        }


        if (nama.length > 60) {

            alert(
                "Nama menu maksimal 60 karakter."
            );

            return;
        }


        if (
            !Number.isInteger(harga) ||
            harga < 0
        ) {

            alert(
                "Harga harus berupa angka 0 atau lebih."
            );

            return;
        }


        if (
            !Number.isInteger(sisaPorsi) ||
            sisaPorsi < 0
        ) {

            alert(
                "Sisa porsi harus berupa angka 0 atau lebih."
            );

            return;
        }


        try {

            const submitButton =
                menuForm.querySelector(
                    'button[type="submit"]'
                );

            submitButton.disabled = true;
            submitButton.textContent =
                "Menyimpan...";


            if (editingMenuId) {

                // EDIT
                await updateDoc(
                    doc(
                        db,
                        "menu",
                        editingMenuId
                    ),
                    {
                        nama: nama,
                        harga: harga,
                        sisa_porsi: sisaPorsi,
                        tersedia: tersedia
                    }
                );

                alert(
                    "Menu berhasil diperbarui."
                );

            } else {

                // TAMBAH
                await addDoc(
                    collection(db, "menu"),
                    {
                        nama: nama,
                        harga: harga,
                        sisa_porsi: sisaPorsi,
                        tersedia: tersedia,
                        dibuat_pada: serverTimestamp()
                    }
                );

                alert(
                    "Menu berhasil ditambahkan."
                );
            }


            closeModal();

            await loadMenu();


        } catch (error) {

            console.error(
                "Gagal menyimpan menu:",
                error
            );

            alert(
                "Gagal menyimpan menu."
            );

        } finally {

            const submitButton =
                menuForm.querySelector(
                    'button[type="submit"]'
                );

            submitButton.disabled = false;

            submitButton.innerHTML = `
                <i data-lucide="save"></i>
                Simpan Menu
            `;

            if (window.lucide) {
                lucide.createIcons();
            }
        }

    }
);


// ========================================
// DELETE MENU
// ========================================

async function deleteMenu(id) {

    const menu =
        menuData.find(
            (item) => item.id === id
        );

    if (!menu) {
        return;
    }


    const confirmDelete =
        confirm(
            `Hapus menu "${menu.nama}"?`
        );


    if (!confirmDelete) {
        return;
    }


    try {

        await deleteDoc(
            doc(
                db,
                "menu",
                id
            )
        );

        alert(
            "Menu berhasil dihapus."
        );

        await loadMenu();

    } catch (error) {

        console.error(
            "Gagal menghapus menu:",
            error
        );

        alert(
            "Gagal menghapus menu."
        );
    }
}


// ========================================
// SEARCH
// ========================================

searchMenu.addEventListener(
    "input",
    () => {

        const keyword =
            searchMenu.value
                .toLowerCase()
                .trim();


        const filtered =
            menuData.filter(
                (menu) =>
                    String(menu.nama || "")
                        .toLowerCase()
                        .includes(keyword)
            );


        renderMenu(filtered);
    }
);


// ========================================
// BUTTON EVENTS
// ========================================

addMenuBtn.addEventListener(
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


// klik luar modal
menuModal.addEventListener(
    "click",
    (event) => {

        if (
            event.target === menuModal
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

loadMenu();