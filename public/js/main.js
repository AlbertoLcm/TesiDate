document.addEventListener('DOMContentLoaded', () => {

    const btnEnviar = document.getElementById('btnEnviar');
    const contenedor = document.getElementById('contChat1')
    
    const enviar = () => {
        let mensaje = document.getElementById('mensajeChat1');
        let contEmisor = document.createElement("div");
        contEmisor.id = "contEmisor";
        contEmisor.innerHTML = `
            <div id="mensajeEmisor">
                ${mensaje.value}
            </div>
            `;

        contenedor.appendChild(contEmisor);

        mensaje.value = '';

    }

    btnEnviar.onclick = enviar;
});