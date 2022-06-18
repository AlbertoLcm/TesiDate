document.addEventListener('DOMContentLoaded', () => {

    const socket = io();

    const contenedor = document.getElementById('contChat1');
    const matricula = document.getElementById('ChatMatricula');
    const matriculaUser = document.getElementById('ChatMatriculaUser');
    const btnEnviar = document.getElementById('btnEnviar');
    
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


        socket.emit(`send-message`, {
            "mensaje": mensaje.value,
            "emisor": matriculaUser.value,
            "receptor": matricula.value
        });
        
        console.log(matricula.value)
        mensaje.value = '';
    }

    socket.on(`new-message-${matriculaUser.value}-${matricula.value}`, (mensaje) => {
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