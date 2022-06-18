const mysql = require('mysql2');

const conexion = mysql.createPool({
    host: 'us-cdbr-east-05.cleardb.net',
    database: 'heroku_83a5d96056c4a61',
    user: 'b390481fa1c86d',
    password: 'ac1969df',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// conexion.connect((err) => {
//     if(err){
//         console.warn('\n\n Error en la BD!! Tira el servidor \n\n');
//         throw err
//     }
//     console.log('Conexion perfecta');

// });

module.exports = conexion; 