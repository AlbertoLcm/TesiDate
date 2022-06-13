const mysql = require('mysql2');

const conexion = mysql.createConnection({
    host: 'us-cdbr-east-05.cleardb.net',
    database: 'heroku_e3ce238d1d7757e',
    user: 'bfa774d190b3e6',
    password: 'a429144e'
});

conexion.connect((err) => {
    if(err){
        console.warn('\n\n Error en la BD!! Tira el servidor \n\n');
        throw err
    }
    console.log('Conexion perfecta');

});

module.exports = conexion; 