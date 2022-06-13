document.addEventListener('DOMContentLoaded', () => {

    // const socket = io();


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

        // socket.emit('mensaje-del-cliente', mensaje.value);
        
        mensaje.value = '';

    }

    socket.on('mensaje-del-servidor', (data) => {
        let contReceptor = document.createElement("div");
        contReceptor.id = "contReceptor";
        contReceptor.innerHTML = `
            <div id="mensajeReceptor">
                ${data}
            </div>
            `;

            contenedor.appendChild(contReceptor);
    });

    btnEnviar.onclick = enviar;
});