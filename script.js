import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// 1. CONFIGURACIÓN INICIAL
// Corregido: zvmcmj... (tenias una 'j' extra antes)
const supabaseUrl = 'https://zvmcmjbedwaftejdduu.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2bWNtanJlZHdhZnRlamRkdXUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxMzU2OTQyNCwiZXhwIjoyMDI5MTQ1NDI0fQ.7Z0S8zY3y-3-y_y4-y8zY3y-3-y_y4-y8zY3y-3-y_y4'; 
const supabase = createClient(supabaseUrl, supabaseKey);

const TIENDA_ID = 'mundo_magico';
const PASS_ADMIN = '1234'; 

let isAdmin = false;

async function cargarProductos() {
    try {
        const { data: productos, error } = await supabase
            .from('productos')
            .select('*')
            .eq('tienda_id', TIENDA_ID)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error de Supabase:", error.message);
            return;
        }

        const contenedor = document.getElementById('catalogo');
        if (!contenedor) return;
        
        contenedor.innerHTML = '';

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
        console.error("Error crítico:", err);
    }
}

async function subirProducto() {
    const nombre = document.getElementById('nombre-nuevo').value;
    const precio = document.getElementById('precio-nuevo').value;
    const desc = document.getElementById('desc-nuevo').value;
    const fileInput = document.getElementById('foto-nueva');
    const file = fileInput.files[0];

    if (!nombre || !precio || !file) {
        return alert("Completa los campos y selecciona imagen.");
    }

    const btn = document.getElementById('btn-subir');
    btn.innerText = "Subiendo...";
    btn.disabled = true;

    try {
        const nombreArchivo = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
        const path = `${TIENDA_ID}/${nombreArchivo}`;

        const { data, error: storageError } = await supabase.storage
            .from('imagenes_tiendas')
            .upload(path, file);

        if (storageError) throw storageError;

        const { data: urlData } = supabase.storage
            .from('imagenes_tiendas')
            .getPublicUrl(path);

        const { error: dbError } = await supabase
            .from('productos')
            .insert([{
                nombre,
                precio: parseFloat(precio),
                descripcion: desc,
                imagen_url: urlData.publicUrl,
                tienda_id: TIENDA_ID
            }]);

        if (dbError) throw dbError;

        alert("¡Producto añadido!");
        document.getElementById('nombre-nuevo').value = '';
        document.getElementById('precio-nuevo').value = '';
        document.getElementById('desc-nuevo').value = '';
        fileInput.value = '';
        cargarProductos();

    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        btn.innerText = "Guardar en Catálogo";
        btn.disabled = false;
    }
}

window.borrarProd = async (id) => {
    if (confirm("¿Eliminar?")) {
        await supabase.from('productos').delete().eq('id', id);
        cargarProductos();
    }
};

window.editarProd = async (id, nombreActual, precioActual) => {
    const n = prompt("Nuevo nombre:", nombreActual);
    const p = prompt("Nuevo precio:", precioActual);
    if (n && p) {
        await supabase.from('productos').update({ nombre: n, precio: parseFloat(p) }).eq('id', id);
        cargarProductos();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    
    const loginBtn = document.getElementById('btn-entrar');
    if (loginBtn) {
        loginBtn.onclick = () => {
            const inputPass = document.getElementById('pass-input').value;
            if (inputPass === PASS_ADMIN) {
                isAdmin = true;
                document.getElementById('panel-admin').style.display = 'block';
                document.getElementById('modal-login').style.display = 'none';
                cargarProductos();
            } else {
                alert("Incorrecto");
            }
        };
    }

    const openBtn = document.getElementById('open-login');
    if (openBtn) openBtn.onclick = () => document.getElementById('modal-login').style.display = 'flex';
    
    const closeBtn = document.getElementById('btn-cerrar');
    if (closeBtn) closeBtn.onclick = () => document.getElementById('modal-login').style.display = 'none';

    const subirBtn = document.getElementById('btn-subir');
    if (subirBtn) subirBtn.onclick = subirProducto;
});
