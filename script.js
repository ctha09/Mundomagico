import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. CONFIGURACIÓN DE TU FIREBASE (Basada en tu imagen)
const firebaseConfig = {
    apiKey: "AIzaSyAnxydDNTP15DqDKBfM8CEU1j42kwxrjjc",
    authDomain: "mundo-magico-c2476.firebaseapp.com",
    projectId: "mundo-magico-c2476",
    storageBucket: "mundo-magico-c2476.firebasestorage.app",
    messagingSenderId: "659897627792",
    appId: "1:659897627792:web:602377c729525164d1f56b"
};

// 2. INICIALIZACIÓN
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const colRef = collection(db, "productos");

// 3. LÓGICA DEL PANEL DE ADMINISTRACIÓN (MODAL)
const modal = document.getElementById('admin-modal');
const openBtn = document.getElementById('open-admin');
const closeBtn = document.getElementById('close-admin');

// Abrir modal al tocar la tuerca
openBtn.onclick = () => {
    modal.style.display = 'flex';
};

// Cerrar modal al tocar la X
closeBtn.onclick = () => {
    modal.style.display = 'none';
};

// Cerrar modal si se toca fuera de la caja blanca
window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
};

// 4. FUNCIÓN PARA PUBLICAR UNA PRENDA NUEVA
const btnAdd = document.getElementById('btn-add');
btnAdd.onclick = async () => {
    const nombre = document.getElementById('p-nombre').value;
    const precio = document.getElementById('p-precio').value;
    const imagen = document.getElementById('p-img').value;

    // Validación simple
    if (nombre && precio && imagen) {
        try {
            await addDoc(colRef, {
                nombre: nombre,
                precio: precio,
                imagen: imagen,
                fecha: Date.now() // Guardamos la fecha para ordenar los más nuevos primero
            });
            
            // Limpiar formulario y cerrar
            document.getElementById('p-nombre').value = "";
            document.getElementById('p-precio').value = "";
            document.getElementById('p-img').value = "";
            modal.style.display = 'none';
            
            alert("¡Prenda publicada con éxito en Mundo Mágico!");
        } catch (error) {
            console.error("Error al subir:", error);
            alert("Error al conectar con la base de datos.");
        }
    } else {
        alert("Por favor, rellena todos los campos.");
    }
};

// 5. CARGAR PRODUCTOS DESDE FIREBASE EN TIEMPO REAL
// Usamos onSnapshot para que si agregas algo desde otro celular, se vea al instante
const q = query(colRef, orderBy("fecha", "desc"));
onSnapshot(q, (snapshot) => {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = ""; // Limpiamos la cuadrícula antes de recargar
    
    snapshot.forEach((doc) => {
        const p = doc.data();
        // Creamos la tarjeta del producto (diseño de 2 columnas en móvil)
        grid.innerHTML += `
            <div class="card animate__animated animate__fadeInUp">
                <img src="${p.imagen}" alt="${p.nombre}">
                <div class="card-info">
                    <h3>${p.nombre}</h3>
                    <span class="price">$${p.precio}</span>
                </div>
            </div>
        `;
    });
});

// 6. ANIMACIÓN DEL CARRUSEL (3 Imágenes)
let currentIdx = 0;
const totalSlides = 3;
const carouselInner = document.getElementById('carousel');

function moverCarrusel() {
    currentIdx = (currentIdx + 1) % totalSlides;
    // Multiplicamos por 100 para desplazar el contenedor
    carouselInner.style.transform = `translateX(-${currentIdx * 100}%)`;
}

// Cambiar de foto cada 5 segundos
setInterval(moverCarrusel, 5000);

// 7. OCULTAR EL LOADER AL CARGAR LA WEB
window.addEventListener("load", () => {
    const loader = document.getElementById("loader");
    setTimeout(() => {
        loader.classList.add("loader-hidden");
    }, 1500); // Se oculta tras 1.5 segundos
});
