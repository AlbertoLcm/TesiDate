document.addEventListener('DOMContentLoaded', () => {

    const socket = io();


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

        console.log('hola desde el boton');

        socket.emit('mensaje-del-cliente', mensaje.value);
        
        mensaje.value = '';

    }

    socket.on("mensaje-servidor", (mensaje) => {
        console.log(mensaje);
        let contReceptor = document.createElement("div");
        contReceptor.id = "contReceptor";
        contReceptor.innerHTML = `
            <div id="mensajeReceptor">
                ${mensaje}
            </div>
        `;

        contenedor.appendChild(contReceptor);
    });

    btnEnviar.onclick = enviar;
});