// Manejo del Loader
window.addEventListener("load", () => {
    const loader = document.getElementById("loader");
    setTimeout(() => {
        loader.classList.add("loader-hidden");
    }, 1500);
});

// Manejo del Carrusel
const carousel = document.getElementById('carousel');
const slides = document.querySelectorAll('.slide');
let index = 0;

function moveCarousel() {
    index = (index + 1) % slides.length;
    carousel.style.transform = `translateX(-${index * 100}%)`;
}
setInterval(moveCarousel, 4000);

// Lógica del Carrito
let cart = JSON.parse(localStorage.getItem('urban_cart')) || [];

function updateUI() {
    // Actualizar contador de la barra inferior
    document.getElementById('cart-count').innerText = cart.length;
    
    // Actualizar lista en el modal
    const cartItems = document.getElementById('cart-items');
    const totalPrice = document.getElementById('total-price');
    cartItems.innerHTML = '';
    
    let total = 0;
    cart.forEach((item, i) => {
        total += item.price;
        cartItems.innerHTML += `
            <div class="cart-item">
                <div>
                    <strong>${item.name}</strong><br>
                    <small>$${item.price.toFixed(2)}</small>
                </div>
                <button onclick="removeItem(${i})" style="background:none; border:none; color:red; cursor:pointer;">X</button>
            </div>
        `;
    });
    totalPrice.innerText = `$${total.toFixed(2)}`;
    localStorage.setItem('urban_cart', JSON.stringify(cart));
}

// Botones Agregar
document.querySelectorAll('.add-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const card = e.target.closest('.card');
        const product = {
            name: card.dataset.name,
            price: parseFloat(card.dataset.price)
        };
        cart.push(product);
        updateUI();
        
        // Efecto visual rápido
        e.target.innerText = "¡AÑADIDO!";
        setTimeout(() => e.target.innerText = "AGREGAR", 800);
    });
});

function removeItem(i) {
    cart.splice(i, 1);
    updateUI();
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    modal.style.display = (modal.style.display === 'block') ? 'none' : 'block';
}

function sendWhatsApp() {
    if (cart.length === 0) return alert("Tu carrito está vacío.");
    
    let message = "¡Hola URBAN SOCIETY! 🔥\nQuisiera realizar este pedido:\n\n";
    cart.forEach((item, i) => {
        message += `${i+1}. ${item.name} ($${item.price})\n`;
    });
    
    const total = cart.reduce((s, item) => s + item.price, 0);
    message += `\n*TOTAL: $${total.toFixed(2)}*`;
    
    const phoneNumber = "543751246552";
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
}

// Iniciar UI
updateUI();