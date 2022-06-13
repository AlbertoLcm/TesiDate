const mysql = require('mysql2');

const conexion = mysql.createPool({
    host: 'us-cdbr-east-05.cleardb.net',
    database: 'heroku_e3ce238d1d7757e',
    user: 'bfa774d190b3e6',
    password: 'a429144e',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

conexion.connect((err) => {
    if(err){
        console.warn('\n\n Error en la BD!! Tira el servidor \n\n');
        throw err
    }
    console.log('Conexion perfecta');

});

module.exports = conexion; 