// Inisialisasi peta menggunakan Leaflet
var map = L.map('map').setView([-6.200000, 106.816666], 13);  // Jakarta sebagai default

// Tambahkan tile dari OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Array untuk menyimpan koordinat, alamat, dan referensi marker
let locations = [];

// Fungsi untuk mendapatkan alamat dari koordinat
function getAddress(lat, lon, callback) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.display_name) {
                callback(data.display_name);
            } else {
                callback('Address not found');
            }
        })
        .catch(() => callback('Error retrieving address'));
}

// Fungsi untuk menambah event listener ke setiap sel alamat
function enableAddressExpansion() {
    const addressCells = document.querySelectorAll('td.address');
    addressCells.forEach(cell => {
        cell.addEventListener('click', function () {
            // Toggle kelas 'expanded' untuk memperlihatkan/mempersempit teks
            this.classList.toggle('expanded');
        });
    });
}

// Modifikasi fungsi updateTable untuk mengaktifkan klik ekspansi pada alamat
function updateTable() {
    const tableBody = document.getElementById("locations-table").getElementsByTagName('tbody')[0];
    tableBody.innerHTML = ''; // Bersihkan tabel sebelum menambahkan data

    locations.forEach((loc, index) => {
        const newRow = tableBody.insertRow();
        newRow.insertCell(0).innerText = index + 1;  // Penomoran
        newRow.insertCell(1).innerText = loc.lat;
        newRow.insertCell(2).innerText = loc.lon;

        // Tambahkan sel untuk alamat, dengan class 'address'
        const addressCell = newRow.insertCell(3);
        addressCell.innerText = loc.address;
        addressCell.classList.add('address');

        // Tambahkan tombol hapus di tiap baris
        const deleteCell = newRow.insertCell(4);
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete');
        deleteButton.innerText = 'Hapus';
        deleteButton.onclick = function () {
            removeLocation(index);
        };
        deleteCell.appendChild(deleteButton);
    });

    // Scroll otomatis ke bawah setelah data diinput
    tableBody.parentElement.scrollTop = tableBody.scrollHeight;

    // Aktifkan kemampuan ekspansi untuk setiap sel alamat
    enableAddressExpansion();
}


// Fungsi untuk menambahkan marker dan menyimpan datanya
function addMarker(lat, lon) {
    const marker = L.marker([lat, lon]).addTo(map)
        .bindPopup(`Lat: ${lat}, Lon: ${lon}`)
        .openPopup();

    // Fungsi untuk menghapus marker dari peta melalui klik marker
    marker.on('click', function () {
        if (confirm("Apakah Anda yakin ingin menghapus pinpoint ini?")) {
            const index = locations.findIndex(loc => loc.marker === marker);
            if (index !== -1) {
                removeLocation(index);  // Hapus lokasi dari array dan tabel
            }
        }
    });

    // Ambil alamat dan update tabel setelah alamat ditemukan
    getAddress(lat, lon, function (address) {
        locations.push({ lat, lon, address, marker });
        updateTable();  // Update tabel setelah alamat ditemukan
    });
}

// Fungsi untuk menghapus lokasi dari tabel dan peta
function removeLocation(index) {
    const location = locations[index];
    if (location && location.marker) {
        map.removeLayer(location.marker);  // Hapus marker dari peta
    }
    locations.splice(index, 1);  // Hapus data dari array
    updateTable();  // Perbarui tampilan tabel
}

// Event listener untuk menambahkan marker ketika peta diklik
map.on('click', function (e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;
    addMarker(lat, lon);  // Tambahkan marker dan mulai proses alamat
});

// Fungsi untuk mengekspor data menjadi CSV
function exportToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "No,Latitude,Longitude,Address\n";

    locations.forEach(function (loc, index) {
        csvContent += `${index + 1},${loc.lat},${loc.lon},"${loc.address}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "locations.csv");
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
}

// Event listener untuk tombol export CSV
document.getElementById('export').addEventListener('click', exportToCSV);
