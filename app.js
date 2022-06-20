const express = require('express');
const http = require('http');
const multer = require('multer');
const cors = require('cors');
const math = require('mathjs');

// Modulos para la autenticacion de usuario
const { json, render } = require('express/lib/response');
const hbs = require('hbs');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const PassportLocal = require('passport-local').Strategy;

require('dotenv').config();

const app = express();
const server = http.createServer(app)
const socketio = require('socket.io')(server);



app.use(cors());
const port = process.env.PORT;

const conexion = require('./database/db.js');

//handlebars
app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/partials');

// Middlewers
// Lectura y parseo del body 
app.use(express.urlencoded({extended:true}));
app.use(express(json))

app.use(express.static('public'));

// Todo es de la configuracion para la sesion
app.use(cookieParser('secreto12'));
// app.set('trust proxy', 1);
app.use(session({
    // cookie:{
    //     secure: true
    //        },
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
    app.locals.user = req.user;
    next();
  });


passport.use(new PassportLocal((username, password, done) => {
    conexion.query('SELECT * FROM usuarios WHERE correo = ? AND password = ?',[username, password], (error, usuario) => {
        try {
            if(username === usuario[0].correo && password === usuario[0].password){
                console.log("Sesion Iniciada", {id:usuario[0].matricula, name:usuario[0].nombre});
                return done(null, {id:usuario[0].matricula, name:usuario[0].nombre, foto:usuario[0].foto});
            }
        } catch (error) {
            console.log('Usuario o contraseña inconrrecto');
            done(null, false);
        }
    });
    
}));

passport.serializeUser((usuario, done) => {
    done(null, usuario.id);
})

//deserializacion 
passport.deserializeUser((id, done) => {
    conexion.query('SELECT * FROM usuarios WHERE matricula = ?', [id], (error, usuario) => {
        if(error) throw error;
        done(null, {id:usuario[0].matricula, name:usuario[0].nombre, foto:usuario[0].foto});
    });
})

app.get('/', (req, res, next)=>{
    if(!req.isAuthenticated()) return next();

    res.redirect('/principal');
}, (req, res) => {
    res.render('login');
}); 


app.post('/', passport.authenticate('local',{
    successRedirect: '/principal',
    failureRedirect: '/',
    passReqToCallback: true
}));

// fin de la configuracion de la session

// aqui comienzan los routers 

// peticiones GET
app.get('/principal', (req, res, next)=>{
    if(req.isAuthenticated()) return next();

    res.redirect('/');
}, (req, res) => {

    const id = req.user.id;
    let usuariosMatchs = [];

    conexion.query('SELECT * FROM usuarios RIGHT JOIN matchs ON matchs.matricula_match = usuarios.matricula where matchs.matricula_user = ?', [req.user.id], (error, usuarios) => {
        const usuariosArray = Object.keys(usuarios).map((key) => {
            return [Number(key), usuarios[key]];
        });
        usuariosArray.forEach((user, iterable) => {
            usuariosMatchs.push(usuarios[iterable].matricula_match);
        });
        console.log(usuariosMatchs)
    });
    
    conexion.query("SELECT * FROM usuarios WHERE matricula != ?", [id], (error, usuarios) => {
        const usuariosArray = Object.keys(usuarios).map((key) => {
            return [Number(key), usuarios[key]];
        })
        const numeroMax = usuariosArray.length;
        const numRamdom = parseInt(math.random(numeroMax));
        
        if(usuariosMatchs.includes(usuarios[numRamdom].matricula)){
            res.redirect('/principal');
        }else{
            res.render('principal', usuarios[numRamdom]);
        }
        
    });
});

app.get('/chat/:id', (req, res, next)=>{
    if(req.isAuthenticated()) return next();

    res.redirect('/');
}, (req, res) => {

    const matricula = req.params.id;

    conexion.query('SELECT * FROM usuarios JOIN chats ON usuarios.matricula = chats.matricula_receptor where chats.matricula_receptor = ?', [matricula], (error, chats) => {

        console.log(chats)

        if(chats.length <= 0){
            console.log('no hay datos');

            conexion.query('INSERT INTO chats SET ?', {
                matricula_propietario: req.user.id, 
                matricula_receptor: matricula
            },(error, usuario) => {
                console.log('chat insertado');
                res.redirect(`/chat/${matricula}`);
            });

            
        }else{
            conexion.query('SELECT * FROM mensajes WHERE matricula_emisor = ? AND matricula_receptor = ?', [req.user.id, matricula], (error, mensajes) => {
                console.log({mensajes, chats})
                res.render('chat', {mensajes, chats});
            });
        }
        
    });
    
});

app.get('/registrar', (req, res) => {
    res.render('registrar');
});

app.get('/interes', (req, res, next)=>{
    if(req.isAuthenticated()) return next();

    res.redirect('/');
}, (req, res) => {
    conexion.query('SELECT * FROM usuarios RIGHT JOIN matchs ON matchs.matricula_match = usuarios.matricula where matchs.matricula_user = ?', [req.user.id], (error, usuarios) => {
        res.render('interes', {usuarios});
    });
});

app.get('/mensajes', (req, res, next)=>{
    if(req.isAuthenticated()) return next();

    res.redirect('/');
}, (req, res) => {

    conexion.query('SELECT * FROM mensajes WHERE matricula_emisor = ?', [req.user.id], (error, chatsMensajes) => {

        let allchatsReceptores = [];
        
        const allchats = Object.keys(chatsMensajes).map((key) => {
            return [Number(key), chatsMensajes[key]];
        });

        allchats.forEach((chat, i) => {
            allchatsReceptores.push(chatsMensajes[i].matricula_receptor);
        });

        const chatsReceptores = allchatsReceptores.filter((valor, indice) => {
            return allchatsReceptores.indexOf(valor) === indice;
          }
        );
        
        let chatsIncludes = [];

        console.log(chatsMensajes.length);
        
        if(chatsMensajes.length > 0){

            conexion.query('SELECT * FROM usuarios JOIN chats ON usuarios.matricula = chats.matricula_receptor WHERE matricula_propietario = ?', [req.user.id], (error, chats) => {

                const chatsArray = Object.keys(chats).map((key) => {
                    return [Number(key), chats[key]];
                });

                chatsArray.forEach((chat, i) => {
                    chatsIncludes.push(chats[i].matricula_receptor);
                });

                const chatsEnBD = chatsIncludes.filter((valor, indice) => {
                    return chatsIncludes.indexOf(valor) === indice;
                  }
                );

                console.log("estos son los chats que estan guardados",chatsEnBD)
                console.log('estos son los chats que tiene la bd',chatsReceptores);
                
                if(chatsEnBD.length === chatsReceptores.length){
                    res.render('mensajes', {chats});
                }else{

                    console.log(chatsEnBD.includes(chatsReceptores))
                    let contador = 0;

                    do {

                        if(chatsEnBD.includes(chatsReceptores[contador]) == false){
                            chatsEnBD.push(chatsReceptores[contador]);
                            console.log('no esta, agrendando...')
                            console.log(chatsReceptores[contador]);
                            conexion.query('INSERT INTO chats SET ?', {
                                matricula_propietario: req.user.id, 
                                matricula_receptor: chatsReceptores[contador]
                            },(error, usuario) => {
                                if(error){
    
                                    console.log(error);
                                    return;
                                }
                                console.log('chat guardado')
                            });
                        }

                        contador ++;

                        
                    } while (chatsEnBD.length != chatsReceptores.length );

                    // este es el codigo que tambien funciona
                    
                    // chatsReceptores.forEach((chat, i) => {
                    //     console.log(chatsEnBD.includes(chatsReceptores[i]));
                    //     if(chatsEnBD.includes(chatsReceptores[i]) == false){
                    //         chatsEnBD.push(chatsReceptores[i]);
                    //         console.log('no esta, agrendando...')
                    //         console.log(chatsReceptores[i]);
                    //         conexion.query('INSERT INTO chats SET ?', {
                    //             matricula_propietario: req.user.id, 
                    //             matricula_receptor: chatsReceptores[i]
                    //         },(error, usuario) => {
                    //             if(error){
    
                    //                 console.log(error);
                    //                 return;
                    //             }
                    //             console.log('chat guardado')
                    //         });
                    //     }
                        
                    // });
                    res.redirect('/mensajes');
                }

            });
        }else{
            console.log('no tiene mensajes');
            res.render('mensajes', {chatsMensajes});
        }

    });

});

app.get('/perfil', (req, res, next)=>{
    if(req.isAuthenticated()) return next();

    res.redirect('/');
}, (req, res)=>{
    conexion.query("SELECT * FROM usuarios WHERE matricula = ?", [req.user.id], (error, usuario) => {
        res.render('perfil', usuario[0]);
    });
});

app.get('/add/:id', (req, res, next)=>{
    if(req.isAuthenticated()) return next();

    res.redirect('/');
}, (req, res) => {
    const id = req.params.id;

    conexion.query('INSERT INTO matchs SET ?', {
        matricula_user: req.user.id,
        matricula_match: id}, (error, usuario) => {
        if (error) throw error;
        console.log(`Match añadido ${usuario}`);
        res.redirect('/principal');
    });
});

app.get('/logout', (req, res, next) => {
    console.log('Sesion Cerrada', req.user)
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

app.get('/usuario/:id', (req, res, next)=>{
    if(req.isAuthenticated()) return next();

    res.redirect('/');
},(req, res) => {
    const id = req.params.id;

    conexion.query('SELECT * FROM usuarios WHERE matricula = ?', [id], (error, usuario) => {
        res.render('usuario', usuario[0]);
    } );
});

// peticiones POST

app.post('/editar', (req, res) => {
    const {correo, password} = req.body;

    conexion.query('update usuarios set ? where correo = ?', [{
        password: password},
        correo], (error, results) => {
        if (error) throw error;
        res.redirect('/');
    });
});

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, './public/img');
    },
    filename: (req, file, callback) => {
        const ext = file.originalname.split('.').pop();
        const nomImg = `${Date.now()}.${ext}`;
        
        conexion.query('UPDATE usuarios SET ? WHERE matricula = ?', [{
            foto: `./img/${nomImg}`},
            req.user.id], (error, results) => {
        });
        
        callback(null, nomImg);
    }
});

const upload = multer({storage});

app.post('/upload', upload.single('imagen'), (req, res) => {
    res.redirect('/perfil');
});

app.post('/perfil/update', (req, res, next)=>{
    if(req.isAuthenticated()) return next();

    res.redirect('/');
}, (req, res) => {
    const {edad, telefono, facebook, descripcion, carrera, genero, nombre, apellidos} = req.body;

    conexion.query('UPDATE usuarios SET ? WHERE matricula = ?', [{
        edad: edad,
        telefono: telefono,
        facebook: facebook,
        descripcion: descripcion,
        carrera: carrera,
        genero: genero,
        nombre: nombre,
        apellidos: apellidos},
        req.user.id], (error, results) => {
        if (error) throw error;
        res.redirect('/perfil');
    });
});

app.post('/registrar', (req, res) => {
    const {matricula, nombre, apellidos, correo, password} = req.body;

    conexion.query('INSERT INTO usuarios SET ?', {
        matricula, matricula,
        nombre: nombre, 
        apellidos: apellidos, 
        correo: correo, 
        foto: './img/user.jpg',
        password: password}, (error, results) => {
        if (error) throw error;
        console.log("Usuario Registrado", {id:matricula, name:nombre});
        res.redirect('/');
    });
});

server.listen(port, () => {
    console.log(`Escuchando en http://localhost:${port}`);
});

// Sockets
const io = socketio.listen(server)

io.on('connection', socket => {
    console.log('usuario conectado');

    socket.on('send-message', mensaje => {

        conexion.query('INSERT INTO mensajes SET ?', {
            mensaje: mensaje.mensaje,
            receptor: false,
            matricula_receptor: mensaje.emisor,
            matricula_emisor: mensaje.receptor
        }, (error, results) => {
            if(error){
                console.log(error);
                return;
            }
            console.log('mensaje guardado')
        });

        io.sockets.emit(`new-message-${mensaje.receptor}-${mensaje.emisor}`, mensaje.mensaje);
        
        console.log({mensaje})
        
        conexion.query('INSERT INTO mensajes SET ?', {
            mensaje: mensaje.mensaje,
            receptor: true,
            matricula_receptor: mensaje.receptor,
            matricula_emisor: mensaje.emisor}, (error, results) => {
            console.log('mensaje guardado')
        });
        
    });
});


// ___________█
// _________█444█
// ________█44444█
// _______█44█_█44█
// ______█44█___█44█
// _____█44█__█████████████████████████
// ____█44█____█4444444444444444444█
// ___█44█______█44██████████████44█  
// __█44██████████████44█______█44█     
// _█4444444444444444444█____█44█
// █████████████████████████___█44█
// _________________█44█___█44█
// __________________█44█_█44█
// ___________________█44444█
// ____________________█444█
// ______________________█