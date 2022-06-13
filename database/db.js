const mysql = require('mysql');

const conexion = mysql.createConnection({
    host: 'localhost',
    database: 'tesidate',
    user: 'root',
    password: ''
});

conexion.connect((err) => {
    if(err){
        console.warn('\n\n Error en la BD!! Tira el servidor \n\n');
        throw err
    }
    console.log('Conexion perfecta');

});

module.exports = conexion; 