import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// 1. CONFIGURACIÓN INICIAL
// Asegúrate de que estos datos coincidan exactamente con tu panel de Supabase
const supabaseUrl = 'https://zvmcjmjbedwaftejdduu.supabase.co'; // Tu URL real
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2bWNqbWpiZWR3YWZ0ZWpkZHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMTI4NDksImV4cCI6MjA5MTc4ODg0OX0.Hm4zcGTr04pY13yOXQx26wR_D6GW-Ry5yiSrWTy556k'; // Tu Key real
const supabase = createClient(supabaseUrl, supabaseKey);

// Identificador para separar esta tienda de otros futuros clientes
const TIENDA_ID = 'mundo_magico';
const PASS_ADMIN = '1234'; 

let isAdmin = false;

/**
 * CARGAR PRODUCTOS: Trae los datos de la tabla y los dibuja en el HTML
 */
async function cargarProductos() {
    try {
        const { data: productos, error } = await supabase
            .from('productos')
            .select('*')
            .eq('tienda_id', TIENDA_ID)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error de conexión con Supabase:", error.message);
            return;
        }

        const contenedor = document.getElementById('catalogo');
        if (!contenedor) return;
        
        contenedor.innerHTML = '';

        // Verificamos que 'productos' no sea null antes de usar forEach
        if (productos && productos.length > 0) {
            productos.forEach(p => {
                contenedor.innerHTML += `
                    <div class="card">
                        <img src="${p.imagen_url}" alt="${p.nombre}" onerror="this.src='https://via.placeholder.com/300x200?text=Sin+Imagen'">
                        <div class="card-info">
                            <h3>${p.nombre}</h3>
                            <p class="desc">${p.descripcion || 'Sin descripción'}</p>
                            <p class="precio">$${p.precio}</p>
                            
                            ${isAdmin ? `
                                <div style="border-top: 1px solid #334155; padding-top: 10px; margin-top: 10px; display: flex; gap: 10px;">
                                    <button onclick="window.editarProd('${p.id}', '${p.nombre}', ${p.precio})" style="background:#f59e0b; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">Editar</button>
                                    <button onclick="window.borrarProd('${p.id}')" style="background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">Borrar</button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            });
        } else {
            contenedor.innerHTML = '<p style="text-align:center; color:#94a3b8;">No hay productos publicados.</p>';
        }
    } catch (err) {
        console.error("Error inesperado:", err);
    }
}

/**
 * SUBIR PRODUCTO: Lógica para subir foto al Storage e insertar en la tabla
 */
async function subirProducto() {
    const nombre = document.getElementById('nombre-nuevo').value;
    const precio = document.getElementById('precio-nuevo').value;
    const desc = document.getElementById('desc-nuevo').value;
    const fileInput = document.getElementById('foto-nueva');
    const file = fileInput.files[0];

    if (!nombre || !precio || !file) {
        return alert("Por favor, completa nombre, precio y selecciona una imagen.");
    }

    const btn = document.getElementById('btn-subir');
    btn.innerText = "Subiendo...";
    btn.disabled = true;

    try {
        // 1. Subir al Storage (Bucket: imagenes_tiendas)
        const nombreArchivo = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
        const path = `${TIENDA_ID}/${nombreArchivo}`;

        const { data: storageData, error: storageError } = await supabase.storage
            .from('imagenes_tiendas')
            .upload(path, file);

        if (storageError) throw storageError;

        // 2. Obtener URL pública
        const { data: urlData } = supabase.storage
            .from('imagenes_tiendas')
            .getPublicUrl(path);

        // 3. Insertar en la tabla productos
        const { error: dbError } = await supabase
            .from('productos')
            .insert([{
                nombre: nombre,
                precio: parseFloat(precio),
                descripcion: desc,
                imagen_url: urlData.publicUrl,
                tienda_id: TIENDA_ID
            }]);

        if (dbError) throw dbError;

        alert("¡Producto añadido con éxito!");
        
        // Limpiar campos
        document.getElementById('nombre-nuevo').value = '';
        document.getElementById('precio-nuevo').value = '';
        document.getElementById('desc-nuevo').value = '';
        fileInput.value = '';
        cargarProductos();

    } catch (err) {
        alert("Error al subir: " + err.message);
    } finally {
        btn.innerText = "Guardar en Catálogo";
        btn.disabled = false;
    }
}

// --- FUNCIONES GLOBALES PARA EL MODO ADMIN ---
window.borrarProd = async (id) => {
    if (confirm("¿Seguro que quieres eliminar este producto?")) {
        const { error } = await supabase.from('productos').delete().eq('id', id);
        if (!error) cargarProductos();
        else alert("Error al eliminar.");
    }
};

window.editarProd = async (id, nombreActual, precioActual) => {
    const n = prompt("Nuevo nombre:", nombreActual);
    const p = prompt("Nuevo precio:", precioActual);
    
    if (n && p) {
        const { error } = await supabase
            .from('productos')
            .update({ nombre: n, precio: parseFloat(p) })
            .eq('id', id);
        
        if (!error) cargarProductos();
        else alert("Error al editar.");
    }
};

// --- LÓGICA DE INTERFAZ (BOTONES Y MODAL) ---
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();

    const openBtn = document.getElementById('open-login');
    const closeBtn = document.getElementById('btn-cerrar');
    const loginBtn = document.getElementById('btn-entrar');
    const subirBtn = document.getElementById('btn-subir');

    if (openBtn) openBtn.onclick = () => document.getElementById('modal-login').style.display = 'flex';
    if (closeBtn) closeBtn.onclick = () => document.getElementById('modal-login').style.display = 'none';
    
    if (loginBtn) {
        loginBtn.onclick = () => {
            const inputPass = document.getElementById('pass-input').value;
            if (inputPass === PASS_ADMIN) {
                isAdmin = true;
                document.getElementById('panel-admin').style.display = 'block';
                document.getElementById('modal-login').style.display = 'none';
                cargarProductos();
            } else {
                alert("Contraseña incorrecta");
            }
        };
    }

    if (subirBtn) subirBtn.onclick = subirProducto;
});
