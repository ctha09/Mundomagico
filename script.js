/**
 * ARCHIVO: tienda-logic.js
 * Este archivo maneja la conexión con Supabase, la subida de imágenes
 * y la visualización de productos filtrados por tienda.
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// 1. CONFIGURACIÓN
// Reemplaza con los datos de tu proyecto en: Settings > API
const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';
const SUPABASE_KEY = 'TU_ANON_KEY';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. IDENTIFICADOR ÚNICO DE ESTA TIENDA
// Cambia este valor cuando crees una web para un cliente nuevo
const TIENDA_ID = 'mundo_magico';

/**
 * Función para obtener y mostrar los productos en el HTML
 */
async function mostrarCatalogo() {
    const contenedor = document.getElementById('contenedor-productos');
    if (!contenedor) return;

    // Consultamos la tabla 'productos' filtrando por el ID de esta tienda
    const { data: productos, error } = await supabase
        .from('productos')
        .select('*')
        .eq('tienda_id', TIENDA_ID)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error al obtener productos:", error.message);
        return;
    }

    // Limpiamos el contenedor
    contenedor.innerHTML = '';

    // Si no hay productos, mostramos un mensaje
    if (productos.length === 0) {
        contenedor.innerHTML = '<p style="color: #94a3b8;">No hay productos disponibles por ahora.</p>';
        return;
    }

    // Dibujamos cada producto en la pantalla
    productos.forEach(prod => {
        contenedor.innerHTML += `
            <div class="producto-card">
                <img src="${prod.imagen_url}" alt="${prod.nombre}" onerror="this.src='https://via.placeholder.com/200?text=Sin+Imagen'">
                <div class="info">
                    <h3>${prod.nombre}</h3>
                    <p class="precio">$${prod.precio}</p>
                    <small style="color: #64748b;">ID: ${TIENDA_ID}</small>
                </div>
            </div>
        `;
    });
}

/**
 * Función para subir una imagen al Storage y registrar el producto
 */
async function crearProducto() {
    const inputNombre = document.getElementById('nombre');
    const inputPrecio = document.getElementById('precio');
    const inputFoto = document.getElementById('foto');
    const btnSubir = document.getElementById('btn-subir');

    // Validaciones básicas
    if (!inputNombre.value || !inputPrecio.value || !inputFoto.files[0]) {
        alert("¡Faltan datos! Asegúrate de poner nombre, precio y elegir una foto.");
        return;
    }

    const file = inputFoto.files[0];
    btnSubir.innerText = "Procesando...";
    btnSubir.disabled = true;

    try {
        // A. Subir la imagen al Storage (Bucket: imagenes_tiendas)
        // Creamos un nombre de archivo único para evitar conflictos
        const nombreLimpio = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const pathArchivo = `${TIENDA_ID}/${Date.now()}_${nombreLimpio}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('imagenes_tiendas')
            .upload(pathArchivo, file);

        if (uploadError) throw uploadError;

        // B. Obtener la URL pública de la imagen recién subida
        const { data: urlData } = supabase.storage
            .from('imagenes_tiendas')
            .getPublicUrl(pathArchivo);

        const publicUrl = urlData.publicUrl;

        // C. Insertar los datos en la tabla 'productos'
        const { error: dbError } = await supabase
            .from('productos')
            .insert([{
                nombre: inputNombre.value,
                precio: parseFloat(inputPrecio.value),
                imagen_url: publicUrl,
                tienda_id: TIENDA_ID
            }]);

        if (dbError) throw dbError;

        // D. Éxito: Limpiar formulario y recargar lista
        alert("¡Producto agregado correctamente!");
        inputNombre.value = '';
        inputPrecio.value = '';
        inputFoto.value = '';
        mostrarCatalogo();

    } catch (err) {
        console.error("Error completo:", err);
        alert("Error: " + err.message);
    } finally {
        btnSubir.innerText = "Subir Producto";
        btnSubir.disabled = false;
    }
}

// 3. INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    // Cargamos los productos apenas abre la página
    mostrarCatalogo();

    // Vinculamos el botón de subir con la función
    const btnSubir = document.getElementById('btn-subir');
    if (btnSubir) {
        btnSubir.addEventListener('click', crearProducto);
    }
});
