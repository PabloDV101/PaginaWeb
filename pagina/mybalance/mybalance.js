/* CONTROLADOR PRINCIPAL MYBALANCE */

// Objeto Usuario extendido con calorías
let usuario = {
    nombre: "", edad: "", sexo: "", peso: 0, altura: 0,
    aguaConsumida: 0, metaAgua: 0,
    caloriasConsumidas: 0, metaCalorias: 0, // NUEVOS CAMPOS
    alertas: { agua: false }
};

let intervaloAgua = null;
let chartAgua = null;
let chartCalorias = null; // NUEVA GRÁFICA
let chartSemanal = null;

const consejos = [
    "Prioriza las proteínas en tu desayuno.",
    "Bebe agua 30 min antes de comer.",
    "Come verduras a diario.",
    "Evita el azúcar refinada en exceso.",
    "Realiza actividad física al menos 3 veces por semana.",
    "Duerme entre 7 y 9 horas cada noche.",
    "Incorpora grasas saludables como aguacate y nueces.",
    "Limita el consumo de alimentos procesados.",
    "Practica técnicas de relajación para reducir el estrés."
    
];

// INICIALIZACIÓN
document.addEventListener("DOMContentLoaded", () => {
    verificarSesion();
    const toggleBtn = document.getElementById("menu-toggle");
    if(toggleBtn) toggleBtn.onclick = () => document.getElementById("wrapper").classList.toggle("toggled");
});

// 1. SISTEMA DE SESIÓN
function verificarSesion() {
    const data = localStorage.getItem("myBalanceUser");
    const setupScreen = document.getElementById("setup-overlay");
    const appWrapper = document.getElementById("wrapper");

    if (!data) {
        setupScreen.style.display = "flex";
        setupScreen.classList.remove("d-none");
        appWrapper.classList.add("d-none");
        appWrapper.classList.remove("d-flex");
    } else {
        usuario = JSON.parse(data);
        // Migración simple por si el usuario ya existía sin campos de calorías
        if(!usuario.caloriasConsumidas) usuario.caloriasConsumidas = 0;
        if(!usuario.metaCalorias) usuario.metaCalorias = 2000;
        
        setupScreen.classList.add("d-none");
        setupScreen.classList.remove("d-flex");
        appWrapper.classList.remove("d-none");
        appWrapper.classList.add("d-flex");
        
        cargarInterfaz();
    }
}

// 2. GUARDAR DATOS Y CÁLCULOS
function guardarPerfilInicial(e) {
    e.preventDefault();
    const nombre = document.getElementById("initNombre").value;
    const peso = parseFloat(document.getElementById("initPeso").value);
    const altura = parseFloat(document.getElementById("initAltura").value);
    const edad = parseInt(document.getElementById("initEdad").value);
    const sexo = document.getElementById("initSexo").value;

    guardarYEntrar(nombre, peso, altura, edad, sexo);
}

function actualizarPerfilDesdeApp(e) {
    e.preventDefault();
    const nombre = document.getElementById("nombreUser").value;
    const peso = parseFloat(document.getElementById("pesoUser").value);
    const altura = parseFloat(document.getElementById("alturaUser").value);
    const edad = parseInt(document.getElementById("edadUser").value);
    
    guardarYEntrar(nombre, peso, altura, edad, usuario.sexo);
    mostrarNotificacion("Perfil actualizado");
}

function guardarYEntrar(nombre, peso, altura, edad, sexo) {
    usuario.nombre = nombre;
    usuario.peso = peso;
    usuario.altura = altura;
    usuario.edad = edad;
    usuario.sexo = sexo;

    // CÁLCULO DE METAS
    // 1. Agua: 35ml por kg
    usuario.metaAgua = peso * 35;

    // 2. Calorías (Fórmula Mifflin-St Jeor)
    // Hombres: (10 x peso) + (6.25 x altura_cm) - (5 x edad) + 5
    // Mujeres: (10 x peso) + (6.25 x altura_cm) - (5 x edad) - 161
    let tmb = (10 * peso) + (6.25 * (altura * 100)) - (5 * edad);
    
    if (sexo === 'M') {
        tmb += 5;
    } else {
        tmb -= 161;
    }

    // Multiplicador Sedentario/Ligero por defecto (1.2) para mantenerlo simple
    usuario.metaCalorias = Math.round(tmb*1.2);

    localStorage.setItem("myBalanceUser", JSON.stringify(usuario));
    verificarSesion();
}

function cerrarSesion() {
    if(confirm("¿Deseas cerrar sesión?")) {
        localStorage.removeItem("myBalanceUser");
        location.reload();
    }
}

// 3. CARGA DE UI
function cargarInterfaz() {
    document.getElementById("saludoUsuario").innerText = usuario.nombre;
    
    // Llenar forms
    document.getElementById("nombreUser").value = usuario.nombre;
    document.getElementById("pesoUser").value = usuario.peso;
    document.getElementById("alturaUser").value = usuario.altura;
    document.getElementById("edadUser").value = usuario.edad;

    // IMC
    const imc = usuario.peso / (usuario.altura * usuario.altura);
    document.getElementById("displayIMC").innerText = imc.toFixed(1);
    const badgeIMC = document.getElementById("categoriaIMC");
    if (imc < 18.5) { badgeIMC.innerText = "Bajo Peso"; badgeIMC.className = "badge bg-warning text-dark"; }
    else if (imc < 25) { badgeIMC.innerText = "Normal"; badgeIMC.className = "badge bg-success"; }
    else { badgeIMC.innerText = "Sobrepeso"; badgeIMC.className = "badge bg-danger"; }

    // Consejo
    document.getElementById("consejoTexto").innerText = consejos[Math.floor(Math.random() * consejos.length)];

    // Actualizar Textos
    actualizarTextosAgua();
    actualizarTextosCalorias();
    
    // Gráficas
    renderizarGraficas();
}

// 4. LÓGICA DE GRÁFICAS
function renderizarGraficas() {
    // --- GRÁFICA AGUA ---
    const ctxAgua = document.getElementById('graficaAgua').getContext('2d');
    if (chartAgua) chartAgua.destroy();

    const aguaRestante = Math.max(0, usuario.metaAgua - usuario.aguaConsumida);
    chartAgua = new Chart(ctxAgua, {
        type: 'doughnut',
        data: {
            labels: ['Consumido', 'Falta'],
            datasets: [{
                data: [usuario.aguaConsumida, aguaRestante],
                backgroundColor: ['#0dcaf0', '#e9ecef'], // Cyan Bootstrap y Gris
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

    // --- GRÁFICA CALORÍAS ---
    const ctxCalorias = document.getElementById('graficaCalorias').getContext('2d');
    if (chartCalorias) chartCalorias.destroy();

    const calRestante = Math.max(0, usuario.metaCalorias - usuario.caloriasConsumidas);
    // Color cambia si te pasas
    const colorCaloria = usuario.caloriasConsumidas > usuario.metaCalorias ? '#dc3545' : '#ffc107'; // Rojo o Amarillo

    chartCalorias = new Chart(ctxCalorias, {
        type: 'doughnut',
        data: {
            labels: ['Consumido', 'Restante'],
            datasets: [{
                data: [usuario.caloriasConsumidas, calRestante],
                backgroundColor: [colorCaloria, '#e9ecef'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

    // --- GRÁFICA SEMANAL ---
    const ctxSemanal = document.getElementById('graficaSemanal').getContext('2d');
    if (chartSemanal) chartSemanal.destroy();
    chartSemanal = new Chart(ctxSemanal, {
        type: 'bar',
        data: {
            labels: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
            datasets: [{
                label: 'Horas de Sueño',
                data: [5, 4, 7, 6, 7, 9, 8],
                backgroundColor: '#e85d3f',
                borderRadius: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 10 } } }
    });
}

// 5. LÓGICA AGUA
function registrarAguaManual() {
    const cant = parseFloat(document.getElementById("inputAguaManual").value);
    if (!cant || cant <= 0) return;
    usuario.aguaConsumida += cant;
    guardarYActualizar();
    document.getElementById("inputAguaManual").value = "";
    mostrarNotificacion(`+ ${cant} ml de agua`);
}

function resetAgua() {
    usuario.aguaConsumida = 0;
    guardarYActualizar();
}

function actualizarTextosAgua() {
    document.getElementById("metaAguaResumen").innerText = (usuario.metaAgua/1000).toFixed(1) + "L";
    document.getElementById("metaAguaDisplay").innerText = (usuario.metaAgua/1000).toFixed(2);
    document.getElementById("totalAguaConsumido").innerText = usuario.aguaConsumida;
    document.getElementById("resumenAguaTexto").innerText = usuario.aguaConsumida;
}

// 6. LÓGICA CALORÍAS (NUEVA)
function registrarCalorias() {
    const cant = parseInt(document.getElementById("inputCalorias").value);
    if (!cant || cant <= 0) return;
    usuario.caloriasConsumidas += cant;
    guardarYActualizar();
    document.getElementById("inputCalorias").value = "";
    mostrarNotificacion(`+ ${cant} kcal registradas`);
}

function resetCalorias() {
    usuario.caloriasConsumidas = 0;
    guardarYActualizar();
}

function actualizarTextosCalorias() {
    document.getElementById("metaCaloriasResumen").innerText = usuario.metaCalorias;
    document.getElementById("metaCaloriasDisplay").innerText = usuario.metaCalorias;
    document.getElementById("totalCaloriasConsumido").innerText = usuario.caloriasConsumidas;
    document.getElementById("resumenCaloriasTexto").innerText = usuario.caloriasConsumidas;
}

// HELPER GLOBAL
function guardarYActualizar() {
    localStorage.setItem("myBalanceUser", JSON.stringify(usuario));
    actualizarTextosAgua();
    actualizarTextosCalorias();
    renderizarGraficas();
}

// 7. LÓGICA SUEÑO
function analizarSueno() {
    const d = document.getElementById("horaDormir").value;
    const l = document.getElementById("horaDespertar").value;
    if(!d || !l) return;
    let f1 = new Date(`2000-01-01T${d}`), f2 = new Date(`2000-01-01T${l}`);
    if (f2 < f1) f2.setDate(f2.getDate() + 1);
    const h = (f2 - f1) / 3600000;
    document.getElementById("resultadoHoras").innerText = h.toFixed(1) + " h";
    document.getElementById("mensajeSueno").innerText = h >= 7 && h <= 9 ? "Descanso óptimo" : "Intenta dormir entre 7 y 9h";
}

// UTILIDADES
function mostrarNotificacion(txt) {
    const toastEl = document.getElementById('notificacionToast');
    document.getElementById('toastMensaje').innerText = txt;
    new bootstrap.Toast(toastEl).show();
}

function mostrarSeccion(id, link) {
    document.querySelectorAll(".seccion-content").forEach(s => s.classList.add("d-none"));
    document.getElementById(id).classList.remove("d-none");
    if(link) {
        document.querySelectorAll(".list-group-item").forEach(i => {
            i.classList.remove("active");
            i.classList.add("bg-transparent");
        });
        link.classList.add("active");
        link.classList.remove("bg-transparent");
    }
}